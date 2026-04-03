"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteRecipe } from "@/lib/actions";

export default function DeleteRecipeButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-stone-500 dark:text-stone-400">Delete &ldquo;{title}&rdquo;?</span>
        <button
          onClick={async () => {
            setDeleting(true);
            const result = await deleteRecipe(id);
            if (result?.error) {
              toast.error(result.error);
              setDeleting(false);
              setConfirming(false);
            }
          }}
          disabled={deleting}
          className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg transition-colors"
        >
          {deleting ? "Deleting..." : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1.5 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
    >
      Delete
    </button>
  );
}
