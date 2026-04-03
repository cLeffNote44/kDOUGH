"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface RecipeSearchProps {
  currentQuery: string;
  currentTag: string;
  allTags: string[];
}

export default function RecipeSearch({
  currentQuery,
  currentTag,
  allTags,
}: RecipeSearchProps) {
  const [query, setQuery] = useState(currentQuery);
  const router = useRouter();

  const buildUrl = (q: string, tag: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (tag) params.set("tag", tag);
    const qs = params.toString();
    return `/recipes${qs ? `?${qs}` : ""}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl(query, currentTag));
  };

  const handleTagClick = (tag: string) => {
    const newTag = tag === currentTag ? "" : tag;
    router.push(buildUrl(query, newTag));
  };

  const handleClear = () => {
    setQuery("");
    router.push("/recipes");
  };

  return (
    <div className="mb-4 space-y-3">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes..."
          className="flex-1 px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white/80 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-sm font-medium rounded-lg transition-colors"
        >
          Search
        </button>
        {(currentQuery || currentTag) && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 text-sm transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                tag === currentTag
                  ? "bg-amber-200 dark:bg-amber-800/60 text-amber-800 dark:text-amber-200 font-medium"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
