"use client";

import { useState, useTransition } from "react";
import { toggleFavorite } from "@/lib/actions";
import { toast } from "sonner";

interface FavoriteButtonProps {
  recipeId: string;
  initialFavorite: boolean;
  size?: "sm" | "md";
}

export default function FavoriteButton({
  recipeId,
  initialFavorite,
  size = "md",
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation if inside a card
    e.stopPropagation();

    const newValue = !isFavorite;
    setIsFavorite(newValue); // Optimistic update

    startTransition(async () => {
      const result = await toggleFavorite(recipeId);
      if (result.error) {
        setIsFavorite(!newValue); // Revert on error
        toast.error(result.error);
      }
    });
  };

  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const buttonSize = size === "sm" ? "p-1" : "p-1.5";

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      className={`${buttonSize} rounded-lg transition-colors ${
        isFavorite
          ? "text-rose-500 hover:text-rose-600"
          : "text-stone-300 dark:text-stone-600 hover:text-rose-400 dark:hover:text-rose-400"
      } disabled:opacity-50`}
    >
      <svg
        className={iconSize}
        viewBox="0 0 24 24"
        fill={isFavorite ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  );
}
