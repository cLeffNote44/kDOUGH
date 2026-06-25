/**
 * AI week-planner: given the user's recipe library, ask Claude (via a forced
 * tool call) to assign one dinner recipe to each requested day. Pure of any
 * Supabase dependency so it can be unit-tested with a mocked client.
 */

import type Anthropic from "@anthropic-ai/sdk";
import { RECIPE_MODEL } from "@/lib/import/ai-assist";

export interface PlanRecipe {
  id: string;
  title: string;
  tags: string[];
  favorite: boolean;
}

export interface PlanEntry {
  dayIndex: number; // 0 = Monday … 6 = Sunday
  recipeId: string;
}

const PLAN_TOOL: Anthropic.Tool = {
  name: "set_week_plan",
  description: "Assign one recipe to each requested dinner day.",
  input_schema: {
    type: "object",
    properties: {
      plan: {
        type: "array",
        description: "One entry per requested day.",
        items: {
          type: "object",
          properties: {
            dayIndex: {
              type: "integer",
              description: "0=Monday, 1=Tuesday … 6=Sunday",
            },
            recipeId: {
              type: "string",
              description: "id of a recipe from the provided library",
            },
          },
          required: ["dayIndex", "recipeId"],
        },
      },
    },
    required: ["plan"],
  },
};

const SYSTEM_PROMPT = `You are a meal-planning assistant. From the user's recipe library, choose one DINNER recipe for each requested day. Rules:
- Only use recipe ids that appear in the provided library.
- Do NOT repeat a recipe within the week.
- Favor recipes marked (favorite), but keep variety across the week.
- Prefer recipes the user hasn't been served recently when you can't tell, spread cuisines/protein types out.
- Answer ONLY by calling set_week_plan, one entry per requested day index.`;

/** Parse/validate the tool output into clean PlanEntry[]. Exported for testing. */
export function parsePlanEntries(input: unknown): PlanEntry[] {
  const plan =
    input && typeof input === "object" && Array.isArray((input as { plan?: unknown }).plan)
      ? ((input as { plan: unknown[] }).plan)
      : [];
  return plan
    .map((e) => {
      const o = e && typeof e === "object" ? (e as Record<string, unknown>) : {};
      return {
        dayIndex: typeof o.dayIndex === "number" ? o.dayIndex : -1,
        recipeId: typeof o.recipeId === "string" ? o.recipeId : "",
      };
    })
    .filter((e) => e.dayIndex >= 0 && e.dayIndex <= 6 && e.recipeId !== "");
}

/**
 * Ask the model to fill the given day indices with distinct recipes from the
 * library. Returns validated entries, or null on failure.
 */
export async function generateWeekPlan(
  client: Anthropic,
  recipes: PlanRecipe[],
  dayIndices: number[]
): Promise<PlanEntry[] | null> {
  const library = recipes
    .map(
      (r) =>
        `- id:${r.id} | ${r.title}${r.favorite ? " (favorite)" : ""}${
          r.tags.length ? ` | tags: ${r.tags.join(", ")}` : ""
        }`
    )
    .join("\n");

  const userText = `Recipe library:\n${library}\n\nFill dinner for these day indices (0=Mon … 6=Sun): ${dayIndices.join(
    ", "
  )}. Pick a distinct recipe for each.`;

  try {
    const message = await client.messages.create(
      {
        model: RECIPE_MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: [PLAN_TOOL],
        tool_choice: { type: "tool", name: "set_week_plan" },
        messages: [{ role: "user", content: userText }],
      },
      { timeout: 60_000 }
    );

    for (const block of message.content) {
      if (block.type === "tool_use" && block.name === "set_week_plan") {
        return parsePlanEntries(block.input);
      }
    }
    return null;
  } catch (err) {
    console.error("generateWeekPlan failed:", err);
    return null;
  }
}
