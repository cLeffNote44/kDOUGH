/**
 * AI-assisted recipe extraction using Anthropic Claude API.
 *
 * Two use cases:
 * 1. URL fallback: when basic scraping fails, send the page HTML to Claude
 *    for intelligent extraction.
 * 2. Photo OCR: send a photo of a recipe card/cookbook page to Claude
 *    for vision-based extraction.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { Ingredient } from "@/types";
import type { ScrapedRecipe } from "./scraper";

/**
 * Extract and parse JSON from AI response. Handles markdown code blocks and
 * extra text that Claude may return.
 */
function parseAiRecipeJson(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  // Strip markdown code blocks (```json ... ``` or ``` ... ```)
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : trimmed;
  // Also try to find raw JSON object
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  const toParse = objectMatch ? objectMatch[0] : jsonStr;
  try {
    return JSON.parse(toParse) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

const RECIPE_EXTRACTION_PROMPT = `You are a recipe extraction assistant. Extract the recipe from the provided content into a structured JSON object.

Return ONLY valid JSON with this exact structure (no markdown, no backticks, no explanation):
{
  "title": "Recipe Title",
  "description": "Brief description",
  "ingredients": [
    { "quantity": "2", "unit": "cups", "name": "flour" },
    { "quantity": "1", "unit": "tsp", "name": "salt" }
  ],
  "instructions": "Step 1. Do this.\\n\\nStep 2. Do that.",
  "servings": 4,
  "prep_time": 15,
  "cook_time": 30
}

Rules:
- quantity should be a string (e.g., "2", "1/2", "1 1/2")
- unit should be lowercase (e.g., "cups", "tbsp", "tsp", "oz", "lb")
- If no unit, use empty string ""
- prep_time and cook_time are in minutes; use null if not mentioned
- servings is an integer; default to 4 if not mentioned
- instructions should be numbered steps separated by double newlines
- Combine related items (don't list salt and pepper as separate items unless the recipe specifies amounts for each)`;

/**
 * AI-assisted URL import: extract recipe from raw HTML when basic scraping fails.
 */
export async function aiExtractFromHtml(
  html: string,
  url: string
): Promise<ScrapedRecipe | null> {
  const client = getClient();
  if (!client) return null;

  // Truncate HTML to ~60k chars to stay within context limits
  const truncated = html.length > 60000 ? html.slice(0, 60000) : html;

  // Strip scripts, styles, and excessive whitespace for cleaner input
  const cleaned = truncated
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/\s{3,}/g, " ")
    .trim();

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `${RECIPE_EXTRACTION_PROMPT}\n\nExtract the recipe from this HTML page:\n\n${cleaned}`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = parseAiRecipeJson(text);
    if (!parsed) return null;

    const title = String(parsed.title ?? "Imported Recipe");
    const description = String(parsed.description ?? "");
    const instructions = String(parsed.instructions ?? "");
    const rawIngredients = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];
    const ingredients = rawIngredients.map((i: unknown) => {
      const ing = typeof i === "object" && i !== null ? (i as Record<string, unknown>) : {};
      return {
        quantity: String(ing.quantity ?? ""),
        unit: String(ing.unit ?? ""),
        name: String(ing.name ?? ""),
      };
    });
    const servings = typeof parsed.servings === "number" ? parsed.servings : 4;
    const prep_time = typeof parsed.prep_time === "number" ? parsed.prep_time : null;
    const cook_time = typeof parsed.cook_time === "number" ? parsed.cook_time : null;

    return {
      title,
      description,
      ingredients,
      instructions,
      image_url: "",
      source_url: url,
      servings,
      prep_time,
      cook_time,
    };
  } catch {
    return null;
  }
}

/**
 * Photo OCR: extract a recipe from an image using Claude's vision capability.
 */
export async function aiExtractFromImage(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"
): Promise<ScrapedRecipe | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `${RECIPE_EXTRACTION_PROMPT}\n\nExtract the recipe from this image. It may be a recipe card, cookbook page, screenshot, or handwritten recipe. Do your best to read all text accurately.`,
            },
          ],
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = parseAiRecipeJson(text);
    if (!parsed) return null;

    const title = String(parsed.title ?? "Imported Recipe");
    const description = String(parsed.description ?? "");
    const instructions = String(parsed.instructions ?? "");
    const rawIngredients = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];
    const ingredients = rawIngredients.map((i: unknown) => {
      const ing = typeof i === "object" && i !== null ? (i as Record<string, unknown>) : {};
      return {
        quantity: String(ing.quantity ?? ""),
        unit: String(ing.unit ?? ""),
        name: String(ing.name ?? ""),
      };
    });
    const servings = typeof parsed.servings === "number" ? parsed.servings : 4;
    const prep_time = typeof parsed.prep_time === "number" ? parsed.prep_time : null;
    const cook_time = typeof parsed.cook_time === "number" ? parsed.cook_time : null;

    return {
      title,
      description,
      ingredients,
      instructions,
      image_url: "",
      source_url: "",
      servings,
      prep_time,
      cook_time,
    };
  } catch {
    return null;
  }
}

/**
 * Check if the AI features are available (API key is configured).
 */
export function isAiAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
