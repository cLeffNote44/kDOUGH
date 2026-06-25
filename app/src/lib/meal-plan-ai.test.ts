import { describe, it, expect, vi } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { parsePlanEntries, generateWeekPlan } from "./meal-plan-ai";

describe("parsePlanEntries", () => {
  it("keeps valid entries and drops invalid ones", () => {
    const out = parsePlanEntries({
      plan: [
        { dayIndex: 0, recipeId: "r1" },
        { dayIndex: 6, recipeId: "r2" },
        { dayIndex: 7, recipeId: "r3" }, // out of range
        { dayIndex: 1, recipeId: "" }, // empty id
        "garbage",
      ],
    });
    expect(out).toEqual([
      { dayIndex: 0, recipeId: "r1" },
      { dayIndex: 6, recipeId: "r2" },
    ]);
  });

  it("returns [] for non-array / garbage input", () => {
    expect(parsePlanEntries(null)).toEqual([]);
    expect(parsePlanEntries({})).toEqual([]);
    expect(parsePlanEntries({ plan: "x" })).toEqual([]);
  });
});

function fakeClient(create: ReturnType<typeof vi.fn>): Anthropic {
  return { messages: { create } } as unknown as Anthropic;
}

describe("generateWeekPlan", () => {
  it("returns parsed entries from the forced tool call", async () => {
    const create = vi.fn().mockResolvedValue({
      content: [
        {
          type: "tool_use",
          name: "set_week_plan",
          input: { plan: [{ dayIndex: 0, recipeId: "r1" }] },
        },
      ],
    });
    const out = await generateWeekPlan(
      fakeClient(create),
      [{ id: "r1", title: "X", tags: [], favorite: true }],
      [0]
    );
    expect(out).toEqual([{ dayIndex: 0, recipeId: "r1" }]);
    expect(create).toHaveBeenCalledOnce();
  });

  it("returns null when no tool block is present", async () => {
    const create = vi.fn().mockResolvedValue({
      content: [{ type: "text", text: "nope" }],
    });
    expect(await generateWeekPlan(fakeClient(create), [], [0])).toBeNull();
  });

  it("returns null when the request throws", async () => {
    const create = vi.fn().mockRejectedValue(new Error("boom"));
    expect(await generateWeekPlan(fakeClient(create), [], [0])).toBeNull();
  });
});
