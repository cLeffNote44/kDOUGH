// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Server actions and toast are mocked so the client component renders in isolation.
const toggleGroceryItem = vi.hoisted(() => vi.fn());
const removeGroceryItem = vi.hoisted(() => vi.fn());
const addManualGroceryItem = vi.hoisted(() => vi.fn());
vi.mock("@/lib/actions", () => ({
  toggleGroceryItem,
  removeGroceryItem,
  addManualGroceryItem,
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import GroceryListView from "./GroceryListView";
import type { GroceryItem } from "@/types";

function item(over: Partial<GroceryItem>): GroceryItem {
  return {
    id: "1",
    list_id: "l1",
    name: "Flour",
    quantity: 2,
    unit: "cup",
    category: "pantry",
    checked: false,
    recipe_ids: [],
    is_manual: false,
    is_pantry: false,
    created_at: "2026-01-01",
    ...over,
  };
}

describe("GroceryListView", () => {
  beforeEach(() => {
    toggleGroceryItem.mockReset();
    toggleGroceryItem.mockResolvedValue({ success: true });
  });

  it("renders items grouped by store category", () => {
    render(
      <GroceryListView
        listId="l1"
        items={[
          item({ id: "a", name: "Flour", category: "pantry" }),
          item({ id: "b", name: "Spinach", category: "produce", quantity: null, unit: null }),
        ]}
      />
    );
    expect(screen.getByText("Pantry")).toBeInTheDocument();
    expect(screen.getByText("Produce")).toBeInTheDocument();
    expect(screen.getByText(/Flour/)).toBeInTheDocument();
    expect(screen.getByText("Spinach")).toBeInTheDocument();
  });

  it("toggles an item via its server action on click (optimistic)", async () => {
    render(<GroceryListView listId="l1" items={[item({ id: "a", name: "Flour" })]} />);
    fireEvent.click(screen.getByText(/Flour/));
    await waitFor(() =>
      expect(toggleGroceryItem).toHaveBeenCalledWith("a", true)
    );
  });

  it("shows the progress summary for the list", () => {
    render(
      <GroceryListView
        listId="l1"
        items={[
          item({ id: "a", checked: true }),
          item({ id: "b", name: "Eggs", checked: false }),
        ]}
      />
    );
    expect(screen.getByText("1 of 2 items")).toBeInTheDocument();
  });

  it("hides pantry staples in a collapsed section (out of the buy list)", () => {
    render(
      <GroceryListView
        listId="l1"
        items={[
          item({ id: "a", name: "Chicken", category: "meat" }),
          item({ id: "b", name: "Salt", is_pantry: true }),
        ]}
      />
    );
    expect(screen.getByText(/you likely have these/i)).toBeInTheDocument();
    // Pantry item is excluded from the progress count.
    expect(screen.getByText("0 of 1 items")).toBeInTheDocument();
  });

  it("copies the list as text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(
      <GroceryListView
        listId="l1"
        items={[item({ id: "a", name: "Flour", category: "pantry" })]}
      />
    );
    fireEvent.click(screen.getByText("Copy"));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(writeText.mock.calls[0][0]).toContain("Flour");
  });
});
