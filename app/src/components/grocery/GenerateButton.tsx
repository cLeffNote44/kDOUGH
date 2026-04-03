"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { generateGroceryList } from "@/lib/actions";
import { useRouter } from "next/navigation";

export default function GenerateButton({
  weekStart,
  hasExistingList,
}: {
  weekStart: string;
  hasExistingList: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await generateGroceryList(weekStart);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Grocery list generated");
        router.refresh();
      }
    });
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={isPending}
      className="px-4 py-2 btn-gradient text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending
        ? "Generating..."
        : hasExistingList
        ? "Regenerate List"
        : "Generate from Plan"}
    </button>
  );
}
