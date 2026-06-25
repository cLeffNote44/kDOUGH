"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { rehostExternalRecipeImages } from "@/lib/actions";

/**
 * Shown on the recipes page when some recipes still hotlink images from their
 * source site (which can fail to load). One click re-hosts them into storage.
 */
export default function RehostImagesButton() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const run = async () => {
    setBusy(true);
    const res = await rehostExternalRecipeImages();
    setBusy(false);
    if (res && "error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    const fixed = res && "fixed" in res ? res.fixed : 0;
    const failed = res && "failed" in res ? res.failed : 0;
    if (fixed === 0 && failed === 0) {
      toast.success("Photos are already up to date");
    } else {
      toast.success(
        `Re-hosted ${fixed} photo${fixed === 1 ? "" : "s"}` +
          (failed ? ` · ${failed} couldn't be fetched` : "")
      );
    }
    router.refresh();
  };

  return (
    <div className="flex items-center justify-between gap-3 mb-4 px-3 py-2.5 glass rounded-lg border border-slate-200/60 dark:border-slate-700/40">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Some recipe photos are hosted on their original site and may not load.
      </p>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg btn-gradient disabled:opacity-60"
      >
        {busy ? "Fixing…" : "Fix photos"}
      </button>
    </div>
  );
}
