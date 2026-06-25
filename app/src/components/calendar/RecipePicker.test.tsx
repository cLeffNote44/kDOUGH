// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// The picker loads recipes through the browser client and assigns via a server
// action. Mock both; the client returns a chainable query that resolves at .order().
const order = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({ select: () => ({ order }) }),
  }),
}));
const assignRecipeToDay = vi.hoisted(() => vi.fn());
vi.mock("@/lib/actions", () => ({ assignRecipeToDay }));
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

import RecipePicker from "./RecipePicker";

const recipes = [
  { id: "r1", title: "Pancakes", description: "Fluffy", is_favorite: false },
  { id: "r2", title: "Tacos", description: null, is_favorite: true },
];

function renderPicker(onClose = vi.fn()) {
  render(
    <RecipePicker
      date="2026-01-05"
      dayLabel="Mon"
      mealType="dinner"
      onClose={onClose}
    />
  );
  return onClose;
}

describe("RecipePicker", () => {
  beforeEach(() => {
    order.mockReset().mockResolvedValue({ data: recipes, error: null });
    assignRecipeToDay.mockReset().mockResolvedValue({ success: true });
    toast.error.mockReset();
    toast.success.mockReset();
  });

  it("loads and lists the user's recipes", async () => {
    renderPicker();
    expect(await screen.findByText("Pancakes")).toBeInTheDocument();
    expect(screen.getByText("Tacos")).toBeInTheDocument();
  });

  it("filters the list by the search query", async () => {
    renderPicker();
    await screen.findByText("Pancakes");
    fireEvent.change(screen.getByPlaceholderText(/search recipes/i), {
      target: { value: "taco" },
    });
    expect(screen.queryByText("Pancakes")).not.toBeInTheDocument();
    expect(screen.getByText("Tacos")).toBeInTheDocument();
  });

  it("assigns the clicked recipe to the day and closes", async () => {
    const onClose = renderPicker();
    fireEvent.click(await screen.findByText("Pancakes"));

    await waitFor(() =>
      expect(assignRecipeToDay).toHaveBeenCalledWith("r1", "2026-01-05", "dinner")
    );
    expect(toast.success).toHaveBeenCalledWith("Added to plan");
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("shows the empty state when the recipe query errors", async () => {
    order.mockResolvedValue({ data: null, error: new Error("boom") });
    renderPicker();
    expect(
      await screen.findByText(/no recipes yet\. add some first/i)
    ).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("Failed to load recipes");
  });
});
