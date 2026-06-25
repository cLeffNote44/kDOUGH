"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    "w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/80 dark:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-200 dark:bg-slate-800">
      <div className="w-full max-w-sm mx-auto p-8">
        <div className="text-center mb-8">
          <img
            src="/icon-192.png"
            alt="kDOUGH"
            className="w-20 h-20 mx-auto mb-3 rounded-2xl"
          />
          <h1 className="text-2xl font-display font-semibold text-slate-900 dark:text-slate-100">kDOUGH</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Set your new password</p>
        </div>

        {success ? (
          <div className="glass rounded-xl border border-green-200 dark:border-green-800/40 p-6 text-center">
            <p className="text-green-800 dark:text-green-300 font-medium">Password updated!</p>
            <p className="text-green-600 dark:text-green-400 text-sm mt-2">
              Your password has been successfully reset.
            </p>
            <button
              onClick={() => {
                router.push("/");
                router.refresh();
              }}
              className="mt-4 text-sm text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 font-medium"
            >
              Go to app
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                New password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                minLength={6}
                className={inputClasses}
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
                minLength={6}
                className={inputClasses}
              />
            </div>

            {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 btn-gradient rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
