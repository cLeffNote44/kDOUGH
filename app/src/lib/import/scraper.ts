/**
 * Recipe scraper — extracts structured recipe data from a URL.
 *
 * Strategy:
 * 1. Fetch the page HTML
 * 2. Try JSON-LD (schema.org/Recipe) — most reliable
 * 3. Try heuristic HTML parsing
 * 4. Fall back to AI-assisted extraction (Anthropic API)
 */

import * as cheerio from "cheerio";
import { parseIngredientLine } from "./parser";
import { aiExtractFromHtml } from "./ai-assist";
import { safeFetch } from "./ssrf";
import type { Ingredient } from "@/types";

export interface ScrapedRecipe {
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string;
  image_url: string;
  source_url: string;
  servings: number;
  prep_time: number | null;
  cook_time: number | null;
}

/**
 * Parse an ISO 8601 duration (PT30M, PT1H30M, P1DT2H, PT45S, …) to minutes.
 * Handles day and second components (e.g. long marinades use P..D); seconds are
 * rounded to the nearest minute. Returns null when nothing parsed or the total
 * is zero (treated as "unspecified").
 */
export function parseDuration(iso: string | undefined | null): number | null {
  if (!iso || typeof iso !== "string") return null;
  const m = iso
    .trim()
    .match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i);
  if (!m || (!m[1] && !m[2] && !m[3] && !m[4])) return null;
  const days = parseInt(m[1] || "0", 10);
  const hours = parseInt(m[2] || "0", 10);
  const minutes = parseInt(m[3] || "0", 10);
  const seconds = parseInt(m[4] || "0", 10);
  const total = days * 1440 + hours * 60 + minutes + Math.round(seconds / 60);
  return total > 0 ? total : null;
}

/**
 * Validate and sanitize an image URL. Allows only http/https protocols
 * and strips anything that could be an injection vector.
 */
export function sanitizeImageUrl(url: string): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  // Only allow http/https URLs — block javascript:, data:, and other schemes
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Relative URLs starting with / are safe (resolved against source domain)
  if (trimmed.startsWith("/")) return trimmed;
  return "";
}

/**
 * Clean HTML tags from a string.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|li|div|h\d)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extract recipe from JSON-LD structured data.
 */
export function extractFromJsonLd($: cheerio.CheerioAPI, url: string): ScrapedRecipe | null {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const text = $(scripts[i]).html();
      if (!text) continue;

      let data = JSON.parse(text);

      // Handle @graph arrays
      if (data["@graph"]) {
        data = data["@graph"];
      }

      // Find the Recipe object
      const recipes = Array.isArray(data) ? data : [data];
      const recipe = recipes.find(
        (item: Record<string, unknown>) =>
          item["@type"] === "Recipe" ||
          (Array.isArray(item["@type"]) && item["@type"].includes("Recipe"))
      );

      if (!recipe) continue;

      // Extract ingredients
      const rawIngredients: string[] = recipe.recipeIngredient || [];
      const ingredients = rawIngredients.map((raw: string) =>
        parseIngredientLine(stripHtml(raw))
      );

      // Extract instructions. Flatten HowToSection groups (whose steps live in
      // `itemListElement`) so sectioned recipes don't lose their steps.
      let instructions = "";
      if (typeof recipe.recipeInstructions === "string") {
        instructions = stripHtml(recipe.recipeInstructions);
      } else if (Array.isArray(recipe.recipeInstructions)) {
        const flatSteps: string[] = [];
        const collect = (items: unknown[]) => {
          for (const step of items) {
            if (typeof step === "string") {
              const t = stripHtml(step);
              if (t) flatSteps.push(t);
              continue;
            }
            if (step && typeof step === "object") {
              const s = step as Record<string, unknown>;
              if (Array.isArray(s.itemListElement)) {
                collect(s.itemListElement);
                continue;
              }
              const raw =
                typeof s.text === "string"
                  ? s.text
                  : typeof s.name === "string"
                    ? s.name
                    : "";
              const t = stripHtml(raw);
              if (t) flatSteps.push(t);
            }
          }
        };
        collect(recipe.recipeInstructions);
        instructions = flatSteps.map((t, i) => `${i + 1}. ${t}`).join("\n\n");
      }

      // Extract image (sanitize to prevent javascript:/data: injection)
      let image_url = "";
      if (typeof recipe.image === "string") {
        image_url = sanitizeImageUrl(recipe.image);
      } else if (Array.isArray(recipe.image)) {
        const raw = typeof recipe.image[0] === "string"
          ? recipe.image[0]
          : recipe.image[0]?.url || "";
        image_url = sanitizeImageUrl(raw);
      } else if (recipe.image?.url) {
        image_url = sanitizeImageUrl(recipe.image.url);
      }

      // Extract servings
      let servings = 4;
      if (recipe.recipeYield) {
        const yieldStr = Array.isArray(recipe.recipeYield)
          ? recipe.recipeYield[0]
          : recipe.recipeYield;
        const parsed = parseInt(String(yieldStr));
        if (!isNaN(parsed) && parsed > 0) servings = parsed;
      }

      return {
        title: stripHtml(recipe.name || ""),
        description: stripHtml(recipe.description || ""),
        ingredients,
        instructions,
        image_url,
        source_url: url,
        servings,
        prep_time: parseDuration(recipe.prepTime),
        cook_time: parseDuration(recipe.cookTime),
      };
    } catch {
      // JSON parse failed, try next script tag
      continue;
    }
  }
  return null;
}

/**
 * Heuristic fallback: extract recipe data from page HTML structure.
 */
export function extractFromHtml($: cheerio.CheerioAPI, url: string): ScrapedRecipe | null {
  // Title: try common recipe title selectors
  const titleSelectors = [
    "h1.recipe-title",
    "h1.wprm-recipe-name",
    "h1[itemprop='name']",
    ".recipe-header h1",
    "h2.wprm-recipe-name",
    "h1",
  ];
  let title = "";
  for (const sel of titleSelectors) {
    const el = $(sel).first();
    if (el.length) {
      title = el.text().trim();
      if (title) break;
    }
  }

  if (!title) {
    // Use the page title as a last resort
    title = $("title").text().trim().split("|")[0].split("-")[0].trim();
  }

  // Ingredients: look for common ingredient list selectors
  const ingredientSelectors = [
    ".wprm-recipe-ingredient",
    "[itemprop='recipeIngredient']",
    ".recipe-ingredients li",
    ".ingredient-list li",
    ".ingredients li",
    ".recipe__ingredients li",
  ];
  const rawIngredients: string[] = [];
  for (const sel of ingredientSelectors) {
    $(sel).each((_, el) => {
      const text = $(el).text().trim();
      if (text) rawIngredients.push(text);
    });
    if (rawIngredients.length > 0) break;
  }

  const ingredients = rawIngredients.map(parseIngredientLine);

  // Instructions: look for common instruction selectors
  const instructionSelectors = [
    ".wprm-recipe-instruction",
    "[itemprop='recipeInstructions']",
    ".recipe-instructions li",
    ".instruction-list li",
    ".instructions li",
    ".recipe__instructions li",
    ".recipe-directions li",
    ".directions li",
  ];
  const steps: string[] = [];
  for (const sel of instructionSelectors) {
    $(sel).each((_, el) => {
      const text = $(el).text().trim();
      if (text) steps.push(text);
    });
    if (steps.length > 0) break;
  }

  const instructions = steps
    .map((step, i) => `${i + 1}. ${step}`)
    .join("\n\n");

  // Image (sanitize to prevent javascript:/data: injection)
  const imgSelectors = [
    ".wprm-recipe-image img",
    "[itemprop='image']",
    ".recipe-image img",
    ".recipe__image img",
    'meta[property="og:image"]',
  ];
  let image_url = "";
  for (const sel of imgSelectors) {
    const el = $(sel).first();
    if (el.length) {
      image_url = sanitizeImageUrl(el.attr("src") || el.attr("content") || "");
      if (image_url) break;
    }
  }

  // Description
  const description =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    "";

  if (!title && ingredients.length === 0) {
    return null;
  }

  return {
    title: title || "Imported Recipe",
    description: description.slice(0, 300),
    ingredients,
    instructions,
    image_url,
    source_url: url,
    servings: 4,
    prep_time: null,
    cook_time: null,
  };
}

/**
 * Main entry point: scrape a recipe from a URL.
 */
export async function scrapeRecipe(url: string): Promise<ScrapedRecipe> {
  // Fetch the page through the SSRF-safe wrapper, which re-validates the
  // private-IP guard on every redirect hop (a plain fetch would follow a
  // redirect to an internal address without re-checking).
  const response = await safeFetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Strategy 1: JSON-LD (most reliable)
  const jsonLdResult = extractFromJsonLd($, url);
  if (jsonLdResult && jsonLdResult.title && jsonLdResult.ingredients.length > 0) {
    return jsonLdResult;
  }

  // Strategy 2: HTML heuristics
  const htmlResult = extractFromHtml($, url);
  if (htmlResult && htmlResult.ingredients.length > 0) {
    return htmlResult;
  }

  // Strategy 3: AI-assisted extraction (Anthropic API)
  const aiResult = await aiExtractFromHtml(html, url);
  if (aiResult && aiResult.title && aiResult.ingredients.length > 0) {
    return aiResult;
  }

  // Nothing worked
  throw new Error(
    "Could not extract recipe data from this page. Try adding the recipe manually or uploading a photo."
  );
}
