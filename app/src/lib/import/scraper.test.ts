import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the SSRF-safe fetch and the AI fallback so scrapeRecipe can be tested
// offline and deterministically.
vi.mock("./ssrf", () => ({ safeFetch: vi.fn() }));
vi.mock("./ai-assist", () => ({ aiExtractFromHtml: vi.fn() }));

import { safeFetch } from "./ssrf";
import { aiExtractFromHtml } from "./ai-assist";
import {
  parseDuration,
  sanitizeImageUrl,
  stripHtml,
  extractFromJsonLd,
  extractFromHtml,
  scrapeRecipe,
} from "./scraper";
import * as cheerio from "cheerio";

const mockSafeFetch = safeFetch as unknown as ReturnType<typeof vi.fn>;
const mockAi = aiExtractFromHtml as unknown as ReturnType<typeof vi.fn>;

function htmlResponse(html: string) {
  return { ok: true, status: 200, statusText: "OK", text: async () => html };
}

// ──────────────────────────────────────────────
// parseDuration (real, exported)
// ──────────────────────────────────────────────

describe("parseDuration", () => {
  it.each([
    ["PT30M", 30],
    ["PT1H", 60],
    ["PT1H30M", 90],
    ["PT2H15M", 135],
  ])("parses %s -> %i", (iso, expected) => {
    expect(parseDuration(iso)).toBe(expected);
  });

  it.each(["PT0M", undefined, null, "not a duration", ""])(
    "returns null for %s",
    (iso) => {
      expect(parseDuration(iso as string | null | undefined)).toBeNull();
    }
  );
});

// ──────────────────────────────────────────────
// sanitizeImageUrl (real, exported — security-relevant)
// ──────────────────────────────────────────────

describe("sanitizeImageUrl", () => {
  it.each([
    ["https://example.com/img.jpg", "https://example.com/img.jpg"],
    ["http://example.com/img.jpg", "http://example.com/img.jpg"],
    ["/images/photo.jpg", "/images/photo.jpg"],
    ["  https://example.com/img.jpg  ", "https://example.com/img.jpg"],
  ])("allows %s", (input, expected) => {
    expect(sanitizeImageUrl(input)).toBe(expected);
  });

  it.each([
    "javascript:alert(1)",
    "data:image/png;base64,abc",
    "ftp://example.com/img.jpg",
    "",
  ])("blocks %s", (input) => {
    expect(sanitizeImageUrl(input)).toBe("");
  });
});

// ──────────────────────────────────────────────
// stripHtml (real, exported)
// ──────────────────────────────────────────────

describe("stripHtml", () => {
  it("removes simple HTML tags", () => {
    expect(stripHtml("<b>bold</b>")).toBe("bold");
  });
  it("converts <br> and <br /> to newlines", () => {
    expect(stripHtml("line1<br>line2")).toBe("line1\nline2");
    expect(stripHtml("line1<br />line2")).toBe("line1\nline2");
  });
  it("decodes HTML entities", () => {
    expect(stripHtml("salt &amp; pepper")).toBe("salt & pepper");
    expect(stripHtml("&lt;tag&gt;")).toBe("<tag>");
    expect(stripHtml("it&#39;s")).toBe("it's");
  });
  it("collapses excessive newlines", () => {
    expect(stripHtml("<p>a</p><p>b</p><p>c</p>")).toBe("a\n\nb\n\nc");
  });
});

// ──────────────────────────────────────────────
// extractFromJsonLd (real, exported)
// ──────────────────────────────────────────────

describe("extractFromJsonLd", () => {
  it("extracts a standard JSON-LD Recipe block", () => {
    const $ = cheerio.load(`<html><head>
      <script type="application/ld+json">
      {"@type":"Recipe","name":"Classic Pancakes","description":"Fluffy",
       "recipeIngredient":["2 cups flour","1 cup milk","2 eggs"],
       "recipeInstructions":[{"@type":"HowToStep","text":"Mix"},{"@type":"HowToStep","text":"Cook"}],
       "image":"https://example.com/pancakes.jpg","recipeYield":"4 servings",
       "prepTime":"PT10M","cookTime":"PT15M"}
      </script></head><body></body></html>`);
    const recipe = extractFromJsonLd($, "https://src.test");
    expect(recipe).not.toBeNull();
    expect(recipe!.title).toBe("Classic Pancakes");
    expect(recipe!.ingredients).toHaveLength(3);
    expect(recipe!.image_url).toBe("https://example.com/pancakes.jpg");
    expect(recipe!.prep_time).toBe(10);
    expect(recipe!.cook_time).toBe(15);
    expect(recipe!.servings).toBe(4);
  });

  it("finds a Recipe inside an @graph array", () => {
    const $ = cheerio.load(`<html><head>
      <script type="application/ld+json">
      {"@graph":[{"@type":"WebPage","name":"Blog"},
       {"@type":"Recipe","name":"Carbonara","recipeIngredient":["pasta","eggs","bacon"]}]}
      </script></head><body></body></html>`);
    const recipe = extractFromJsonLd($, "https://src.test");
    expect(recipe!.title).toBe("Carbonara");
    expect(recipe!.ingredients).toHaveLength(3);
  });

  it("sanitizes a javascript: image URL out of JSON-LD", () => {
    const $ = cheerio.load(`<html><head>
      <script type="application/ld+json">
      {"@type":"Recipe","name":"X","recipeIngredient":["a"],"image":"javascript:alert(1)"}
      </script></head><body></body></html>`);
    const recipe = extractFromJsonLd($, "https://src.test");
    expect(recipe!.image_url).toBe("");
  });
});

// ──────────────────────────────────────────────
// extractFromHtml (real, exported)
// ──────────────────────────────────────────────

describe("extractFromHtml", () => {
  it("extracts WPRM-style markup", () => {
    const $ = cheerio.load(`<html><body>
      <h1 class="wprm-recipe-name">Test Recipe</h1>
      <ul><li class="wprm-recipe-ingredient">2 cups flour</li>
      <li class="wprm-recipe-ingredient">1 tsp salt</li></ul></body></html>`);
    const recipe = extractFromHtml($, "https://src.test");
    expect(recipe!.title).toBe("Test Recipe");
    expect(recipe!.ingredients).toHaveLength(2);
    expect(recipe!.ingredients[0].name).toBe("flour");
  });
});

// ──────────────────────────────────────────────
// scrapeRecipe (end-to-end; safeFetch + AI mocked)
// ──────────────────────────────────────────────

describe("scrapeRecipe", () => {
  beforeEach(() => {
    mockSafeFetch.mockReset();
    mockAi.mockReset();
  });

  it("uses JSON-LD when present (no AI fallback)", async () => {
    mockSafeFetch.mockResolvedValue(
      htmlResponse(`<html><head>
        <script type="application/ld+json">
        {"@type":"Recipe","name":"JSONLD Cake","recipeIngredient":["1 cup sugar","2 eggs"]}
        </script></head><body></body></html>`)
    );
    const recipe = await scrapeRecipe("https://src.test/cake");
    expect(recipe.title).toBe("JSONLD Cake");
    expect(recipe.ingredients).toHaveLength(2);
    expect(mockAi).not.toHaveBeenCalled();
  });

  it("falls back to HTML heuristics when JSON-LD is absent", async () => {
    mockSafeFetch.mockResolvedValue(
      htmlResponse(`<html><body>
        <h1 class="wprm-recipe-name">Heuristic Stew</h1>
        <ul><li class="wprm-recipe-ingredient">3 carrots</li></ul></body></html>`)
    );
    const recipe = await scrapeRecipe("https://src.test/stew");
    expect(recipe.title).toBe("Heuristic Stew");
    expect(mockAi).not.toHaveBeenCalled();
  });

  it("falls back to AI when deterministic parsers find nothing", async () => {
    mockSafeFetch.mockResolvedValue(
      htmlResponse(`<html><body><p>just an article, no recipe markup</p></body></html>`)
    );
    mockAi.mockResolvedValue({
      title: "AI Recipe",
      description: "",
      ingredients: [{ quantity: "1", unit: "", name: "thing" }],
      instructions: "Do it.",
      image_url: "",
      source_url: "https://src.test/article",
      servings: 4,
      prep_time: null,
      cook_time: null,
    });
    const recipe = await scrapeRecipe("https://src.test/article");
    expect(mockAi).toHaveBeenCalledOnce();
    expect(recipe.title).toBe("AI Recipe");
  });

  it("throws when the fetch is not ok", async () => {
    mockSafeFetch.mockResolvedValue({ ok: false, status: 404, statusText: "Not Found" });
    await expect(scrapeRecipe("https://src.test/missing")).rejects.toThrow();
  });

  it("throws when nothing can extract a recipe", async () => {
    mockSafeFetch.mockResolvedValue(htmlResponse(`<html><body>nothing</body></html>`));
    mockAi.mockResolvedValue(null);
    await expect(scrapeRecipe("https://src.test/empty")).rejects.toThrow();
  });
});
