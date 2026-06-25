// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// The login page talks to the browser Supabase client directly and uses the
// App Router. Mock both so the form renders + submits in isolation.
const signInWithPassword = vi.hoisted(() => vi.fn());
const signUp = vi.hoisted(() => vi.fn());
const resetPasswordForEmail = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signInWithPassword, signUp, resetPasswordForEmail },
  }),
}));

const push = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

import LoginPage from "./page";

function submitForm(fromControl: HTMLElement) {
  const form = fromControl.closest("form");
  if (!form) throw new Error("no form");
  fireEvent.submit(form);
}

describe("LoginPage", () => {
  beforeEach(() => {
    signInWithPassword.mockReset().mockResolvedValue({ error: null });
    signUp.mockReset().mockResolvedValue({ error: null });
    resetPasswordForEmail.mockReset().mockResolvedValue({ error: null });
    push.mockReset();
    refresh.mockReset();
  });

  it("renders the sign-in form", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("signs in and redirects to the planner on success", async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret123" },
    });
    submitForm(screen.getByLabelText("Email"));

    await waitFor(() =>
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: "a@b.com",
        password: "secret123",
      })
    );
    expect(push).toHaveBeenCalledWith("/");
    expect(refresh).toHaveBeenCalled();
  });

  it("shows the error and does not redirect when sign-in fails", async () => {
    signInWithPassword.mockResolvedValue({ error: { message: "Bad creds" } });
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret123" },
    });
    submitForm(screen.getByLabelText("Email"));

    expect(await screen.findByText("Bad creds")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("creates an account and shows the confirm-email notice in sign-up mode", async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "new@b.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret123" },
    });
    submitForm(screen.getByLabelText("Email"));

    await waitFor(() =>
      expect(signUp).toHaveBeenCalledWith(
        expect.objectContaining({ email: "new@b.com", password: "secret123" })
      )
    );
    expect(await screen.findByText("Check your email!")).toBeInTheDocument();
  });

  it("sends a password reset email from the forgot-password form", async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "a@b.com" },
    });
    submitForm(screen.getByLabelText("Email"));

    await waitFor(() =>
      expect(resetPasswordForEmail).toHaveBeenCalledWith(
        "a@b.com",
        expect.objectContaining({ redirectTo: expect.any(String) })
      )
    );
    expect(await screen.findByText("Reset email sent!")).toBeInTheDocument();
  });

  it("persists the no-persist flag when 'Remember me' is unchecked", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("checkbox")); // uncheck Remember me
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret123" },
    });
    submitForm(screen.getByLabelText("Email"));

    await waitFor(() =>
      expect(setItem).toHaveBeenCalledWith("kd-no-persist", "true")
    );
    setItem.mockRestore();
  });
});
