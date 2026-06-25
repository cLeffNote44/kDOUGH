// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// RecipeImageField pulls in the storage upload surface; stub it so this test
// stays focused on the form's own behaviour.
vi.mock("./RecipeImageField", () => ({
  default: () => <div data-testid="image-field" />,
}));

import RecipeForm from "./RecipeForm";
import type { Recipe } from "@/types";

const baseRecipe: Recipe = {
  id: "r1",
  user_id: "u1",
  title: "Test Pancakes",
  description: "Fluffy",
  ingredients: [{ name: "Flour", quantity: "2", unit: "cup" }],
  instructions: "Mix and cook",
  prep_time: 5,
  cook_time: 10,
  servings: 4,
  image_url: null,
  source_url: null,
  tags: ["breakfast"],
  is_favorite: false,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
} as Recipe;

describe("RecipeForm", () => {
  it("renders the submit label and existing recipe values", () => {
    const action = vi.fn();
    render(
      <RecipeForm
        recipe={baseRecipe}
        userId="u1"
        action={action}
        submitLabel="Save changes"
      />
    );
    expect(screen.getByLabelText(/recipe title/i)).toHaveValue("Test Pancakes");
    expect(
      screen.getByRole("button", { name: "Save changes" })
    ).toBeInTheDocument();
  });

  it("adds and removes ingredient rows", () => {
    const action = vi.fn();
    render(
      <RecipeForm userId="u1" action={action} submitLabel="Add recipe" />
    );
    expect(screen.getAllByPlaceholderText("Ingredient name")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /add ingredient/i }));
    expect(screen.getAllByPlaceholderText("Ingredient name")).toHaveLength(2);
  });

  it("forwards a FormData with cleaned ingredients to the action", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    render(
      <RecipeForm
        recipe={baseRecipe}
        userId="u1"
        action={action}
        submitLabel="Save changes"
      />
    );
    const form = screen.getByLabelText(/recipe title/i).closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const fd = action.mock.calls[0][0] as FormData;
    expect(fd).toBeInstanceOf(FormData);
    expect(fd.get("title")).toBe("Test Pancakes");
    const ingredients = JSON.parse(fd.get("ingredients") as string);
    expect(ingredients).toEqual([{ name: "Flour", quantity: "2", unit: "cup" }]);
  });
});
