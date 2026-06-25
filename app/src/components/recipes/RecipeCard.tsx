"use client";

import { useState } from "react";
import Link from "next/link";
import FavoriteButton from "./FavoriteButton";

// Map first tag to a color stripe — adds visual variety to the grid
const TAG_COLORS: Record<string, string> = {
  breakfast: "bg-amber-400",
  lunch: "bg-emerald-400",
  dinner: "bg-orange-400",
  dessert: "bg-pink-400",
  snack: "bg-sky-400",
  vegetarian: "bg-green-400",
  vegan: "bg-lime-400",
  quick: "bg-yellow-400",
  healthy: "bg-teal-400",
};

interface RecipeCardProps {
  id: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  prep_time: number | null;
  cook_time: number | null;
  image_url: string | null;
  is_favorite?: boolean;
}

export default function RecipeCard({
  id,
  title,
  description,
  tags,
  prep_time,
  cook_time,
  image_url,
  is_favorite = false,
}: RecipeCardProps) {
  const [imgError, setImgError] = useState(false);
  const firstTag = tags?.[0]?.toLowerCase() ?? "";
  const stripeColor = TAG_COLORS[firstTag] ?? "bg-teal-400";
  const initial = title.charAt(0).toUpperCase();

  return (
    <Link
      href={`/recipes/${id}`}
      className="group glass rounded-xl border border-slate-200/60 dark:border-slate-700/40 overflow-hidden hover:border-teal-300 dark:hover:border-teal-700 card-hover-lift"
    >
      {/* Color stripe */}
      <div className={`h-1 ${stripeColor}`} />

      {/* Image area */}
      <div className="relative aspect-[16/9] bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {/* Favorite button */}
        <div className="absolute top-2 right-2 z-10">
          <FavoriteButton recipeId={id} initialFavorite={is_favorite} size="sm" />
        </div>
        {image_url && !imgError ? (
          // next/image gives no benefit with images.unoptimized (no optimizer in
          // the Electron standalone build), so use a plain lazy <img> — matches
          // RecipeDetailModal and the import preview.
          <img
            src={image_url}
            alt={title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 dark:from-teal-600/10 dark:to-cyan-600/10 flex items-center justify-center">
            <span className="text-4xl font-display font-bold text-teal-500/40 dark:text-teal-400/20">
              {initial}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            {description}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          {(prep_time || cook_time) ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {prep_time ? `${prep_time}m prep` : ""}
              {prep_time && cook_time ? " · " : ""}
              {cook_time ? `${cook_time}m cook` : ""}
            </p>
          ) : (
            <span />
          )}
          {tags && tags.length > 0 && (
            <div className="flex gap-1">
              {tags.slice(0, 2).map((t) => (
                <span
                  key={t}
                  className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs rounded"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
