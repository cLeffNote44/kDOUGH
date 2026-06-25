// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const addManualGroceryItem = vi.hoisted(() => vi.fn());
vi.mock("@/lib/actions", () => ({ addManualGroceryItem }));
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

import AddItemForm from "./AddItemForm";
import type { GroceryItem } from "@/types";

const realItem: GroceryItem = {
  id: "real-1",
  list_id: "l1",
  name: "Paper towels",
  quantity: 1,
  unit: null,
  category: "household",
  checked: false,
  recipe_ids: [],
  is_manual: true,
  is_pantry: false,
  created_at: "2026-01-01",
};

describe("AddItemForm", () => {
  beforeEach(() => {
    addManualGroceryItem.mockReset().mockResolvedValue({ item: realItem });
    toast.error.mockReset();
  });

  it("calls the server action with the trimmed name on submit", async () => {
    render(<AddItemForm listId="l1" />);
    fireEvent.change(screen.getByPlaceholderText(/add an item/i), {
      target: { value: "  Paper towels  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() =>
      expect(addManualGroceryItem).toHaveBeenCalledWith("l1", "Paper towels")
    );
  });

  it("does not call the action for an empty name", () => {
    render(<AddItemForm listId="l1" />);
    const form = screen.getByPlaceholderText(/add an item/i).closest("form")!;
    fireEvent.submit(form);
    expect(addManualGroceryItem).not.toHaveBeenCalled();
  });

  it("clears the input immediately after submit (optimistic)", async () => {
    render(<AddItemForm listId="l1" />);
    const input = screen.getByPlaceholderText(/add an item/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Napkins" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(input.value).toBe(""));
  });

  it("reconciles the optimistic item with the real DB row on success", async () => {
    const onItemAdded = vi.fn();
    const onItemReconciled = vi.fn();
    render(
      <AddItemForm
        listId="l1"
        onItemAdded={onItemAdded}
        onItemReconciled={onItemReconciled}
      />
    );
    fireEvent.change(screen.getByPlaceholderText(/add an item/i), {
      target: { value: "Paper towels" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => expect(onItemReconciled).toHaveBeenCalled());
    const tempId = onItemAdded.mock.calls[0][0].id as string;
    expect(tempId).toMatch(/^temp-/);
    expect(onItemReconciled).toHaveBeenCalledWith(tempId, realItem);
  });

  it("toasts and rolls back the optimistic item when the action errors", async () => {
    addManualGroceryItem.mockResolvedValue({ error: "Too long" });
    const onItemAdded = vi.fn();
    const onItemFailed = vi.fn();
    render(
      <AddItemForm
        listId="l1"
        onItemAdded={onItemAdded}
        onItemFailed={onItemFailed}
      />
    );
    fireEvent.change(screen.getByPlaceholderText(/add an item/i), {
      target: { value: "Paper towels" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Too long"));
    const tempId = onItemAdded.mock.calls[0][0].id as string;
    expect(onItemFailed).toHaveBeenCalledWith(tempId);
  });
});
