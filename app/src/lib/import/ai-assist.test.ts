import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the Anthropic SDK so the extraction functions can be tested offline.
const mockCreate = vi.hoisted(() => vi.fn());
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: mockCreate };
  },
}));

import {
  parseAiRecipeJson,
  mapToScrapedRecipe,
  aiExtractFromHtml,
  aiExtractFromImage,
  isAiAvailable,
} from "./ai-assist";

// ──────────────────────────────────────────────
// parseAiRecipeJson (fallback text parser)
// ──────────────────────────────────────────────

describe("parseAiRecipeJson", () => {
  it("parses a ```json fenced block", () => {
    const text = '```json\n{"title":"Soup","servings":2}\n```';
    expect(parseAiRecipeJson(text)).toEqual({ title: "Soup", servings: 2 });
  });

  it("parses a bare ``` fenced block", () => {
    expect(parseAiRecipeJson('```\n{"title":"Stew"}\n```')).toEqual({
      title: "Stew",
    });
  });

  it("parses an unfenced bare object", () => {
    expect(parseAiRecipeJson('{"title":"Salad"}')).toEqual({ title: "Salad" });
  });

  it("extracts JSON from prose-wrapped text", () => {
    const text = 'Here is the recipe:\n{"title":"Toast"}\nHope that helps!';
    expect(parseAiRecipeJson(text)).toEqual({ title: "Toast" });
  });

  it("returns null for malformed JSON", () => {
    expect(parseAiRecipeJson("{ not valid json")).toBeNull();
  });

  it("returns null for empty/non-JSON text", () => {
    expect(parseAiRecipeJson("")).toBeNull();
    expect(parseAiRecipeJson("no json here")).toBeNull();
  });
});

// ──────────────────────────────────────────────
// mapToScrapedRecipe (shared coercion)
// ──────────────────────────────────────────────

describe("mapToScrapedRecipe", () => {
  it("maps a full structured object and passes through the source url", () => {
    const result = mapToScrapedRecipe(
      {
        title: "Pancakes",
        description: "Fluffy",
        ingredients: [
          { quantity: "2", unit: "cups", name: "flour" },
          { quantity: "1", unit: "tsp", name: "salt" },
        ],
        instructions: "1. Mix.\n\n2. Cook.",
        servings: 4,
        prep_time: 10,
        cook_time: 15,
      },
      "https://example.com/pancakes"
    );
    expect(result).toEqual({
      title: "Pancakes",
      description: "Fluffy",
      ingredients: [
        { quantity: "2", unit: "cups", name: "flour" },
        { quantity: "1", unit: "tsp", name: "salt" },
      ],
      instructions: "1. Mix.\n\n2. Cook.",
      image_url: "",
      source_url: "https://example.com/pancakes",
      servings: 4,
      prep_time: 10,
      cook_time: 15,
    });
  });

  it("applies safe defaults for missing fields", () => {
    const result = mapToScrapedRecipe({}, "");
    expect(result.title).toBe("Imported Recipe");
    expect(result.description).toBe("");
    expect(result.ingredients).toEqual([]);
    expect(result.servings).toBe(4);
    expect(result.prep_time).toBeNull();
    expect(result.cook_time).toBeNull();
  });

  it("coerces non-string ingredient fields and drops empty names", () => {
    const result = mapToScrapedRecipe(
      {
        ingredients: [
          { quantity: 2, unit: null, name: "eggs" },
          { quantity: "", unit: "", name: "" }, // dropped (no name)
          "not an object", // dropped
        ],
      },
      ""
    );
    expect(result.ingredients).toEqual([
      { quantity: "2", unit: "", name: "eggs" },
    ]);
  });
});

// ──────────────────────────────────────────────
// aiExtractFromHtml / aiExtractFromImage (mocked SDK)
// ──────────────────────────────────────────────

describe("AI extraction (mocked SDK)", () => {
  const ORIGINAL_KEY = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    mockCreate.mockReset();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  afterEach(() => {
    if (ORIGINAL_KEY === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = ORIGINAL_KEY;
  });

  it("maps a forced tool_use response into a ScrapedRecipe", async () => {
    mockCreate.mockResolvedValue({
      stop_reason: "tool_use",
      content: [
        {
          type: "tool_use",
          name: "extract_recipe",
          input: {
            title: "Chili",
            ingredients: [{ quantity: "1", unit: "lb", name: "beef" }],
            instructions: "Cook it.",
            servings: 6,
          },
        },
      ],
    });
    const result = await aiExtractFromHtml("<html>...</html>", "https://x.test");
    expect(result?.title).toBe("Chili");
    expect(result?.source_url).toBe("https://x.test");
    expect(result?.ingredients).toHaveLength(1);
    expect(result?.servings).toBe(6);
  });

  it("falls back to text-JSON when no tool block is present", async () => {
    mockCreate.mockResolvedValue({
      stop_reason: "end_turn",
      content: [
        { type: "text", text: '{"title":"Tea","ingredients":[],"instructions":""}' },
      ],
    });
    const result = await aiExtractFromImage("base64data", "image/png");
    expect(result?.title).toBe("Tea");
    expect(result?.source_url).toBe("");
  });

  it("returns null when the SDK call throws", async () => {
    mockCreate.mockRejectedValue(new Error("overloaded"));
    expect(await aiExtractFromHtml("<html>", "https://x.test")).toBeNull();
  });

  it("returns null with no API key configured", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(isAiAvailable()).toBe(false);
    expect(await aiExtractFromHtml("<html>", "https://x.test")).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
