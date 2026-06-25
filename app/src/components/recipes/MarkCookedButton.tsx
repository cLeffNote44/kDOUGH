"use client";

import { useTransition } from "react";
import { markCooked, undoLastCook } from "@/lib/actions";
import { toast } from "sonner";

interface MarkCookedButtonProps {
  recipeId: string;
  size?: "sm" | "md";
}

export default function MarkCookedButton({
  recipeId,
  size = "md",
}: MarkCookedButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent) => {
    // Safe inside a card <Link>.
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      const result = await markCooked(recipeId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Marked as cooked", {
        action: {
          label: "Undo",
          onClick: () =>
            startTransition(async () => {
              const undo = await undoLastCook(recipeId);
              if (undo.error) toast.error(undo.error);
            }),
        },
      });
    });
  };

  const padding = size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm";

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`${padding} font-medium rounded-lg border border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors disabled:opacity-50`}
    >
      {isPending ? "Saving…" : "Mark cooked"}
    </button>
  );
}
