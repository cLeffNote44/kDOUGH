// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const generateGroceryList = vi.hoisted(() => vi.fn());
vi.mock("@/lib/actions", () => ({ generateGroceryList }));
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import GenerateButton from "./GenerateButton";

describe("GenerateButton", () => {
  beforeEach(() => {
    generateGroceryList.mockReset().mockResolvedValue({ success: true });
    toast.error.mockReset();
    toast.success.mockReset();
    refresh.mockReset();
  });

  it("labels itself based on whether a list already exists", () => {
    const { rerender } = render(
      <GenerateButton weekStart="2026-01-05" hasExistingList={false} />
    );
    expect(
      screen.getByRole("button", { name: /generate from plan/i })
    ).toBeInTheDocument();
    rerender(<GenerateButton weekStart="2026-01-05" hasExistingList={true} />);
    expect(
      screen.getByRole("button", { name: /regenerate list/i })
    ).toBeInTheDocument();
  });

  it("generates for the given week and refreshes on success", async () => {
    render(<GenerateButton weekStart="2026-01-05" hasExistingList={false} />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() =>
      expect(generateGroceryList).toHaveBeenCalledWith("2026-01-05")
    );
    expect(toast.success).toHaveBeenCalledWith("Grocery list generated");
    expect(refresh).toHaveBeenCalled();
  });

  it("shows a pending label while the action is in flight", async () => {
    generateGroceryList.mockReturnValue(new Promise(() => {})); // never resolves
    render(<GenerateButton weekStart="2026-01-05" hasExistingList={false} />);
    fireEvent.click(screen.getByRole("button"));
    expect(await screen.findByText("Generating...")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("toasts the error and does not refresh on failure", async () => {
    generateGroceryList.mockResolvedValue({ error: "No meals planned" });
    render(<GenerateButton weekStart="2026-01-05" hasExistingList={true} />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("No meals planned")
    );
    expect(refresh).not.toHaveBeenCalled();
  });
});
