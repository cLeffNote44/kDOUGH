"use client";

import { useState, useTransition } from "react";
import { setRecipeRating } from "@/lib/actions";
import { toast } from "sonner";

interface RatingStarsProps {
  recipeId: string;
  initialRating: number | null;
  readonly?: boolean;
  size?: "sm" | "md";
}

export default function RatingStars({
  recipeId,
  initialRating,
  readonly = false,
  size = "md",
}: RatingStarsProps) {
  const [rating, setRating] = useState(initialRating ?? 0);
  const [hover, setHover] = useState(0);
  const [isPending, startTransition] = useTransition();

  const handleSet = (value: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (readonly) return;

    const prev = rating;
    setRating(value); // optimistic
    startTransition(async () => {
      const result = await setRecipeRating(recipeId, value);
      if (result.error) {
        setRating(prev); // revert
        toast.error(result.error);
      }
    });
  };

  const starSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <div
      className="flex items-center gap-0.5"
      role={readonly ? "img" : "radiogroup"}
      aria-label={
        readonly
          ? rating > 0
            ? `Rated ${rating} of 5`
            : "Not rated"
          : "Rate this recipe"
      }
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const active = (hover || rating) >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={readonly || isPending}
            onClick={(e) => handleSet(n, e)}
            onMouseEnter={() => !readonly && setHover(n)}
            onMouseLeave={() => !readonly && setHover(0)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className={readonly ? "cursor-default" : "cursor-pointer"}
          >
            <svg
              className={`${starSize} ${
                active ? "text-amber-400" : "text-slate-300 dark:text-slate-600"
              }`}
              viewBox="0 0 20 20"
              fill={active ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.05 9.801c-.783-.57-.38-1.81.588-1.81h4.915a1 1 0 00.95-.69l1.519-4.674z"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
