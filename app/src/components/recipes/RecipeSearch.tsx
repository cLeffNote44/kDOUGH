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
          className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors"
        >
          Search
        </button>
        {(currentQuery || currentTag) && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-sm transition-colors"
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
                  ? "bg-teal-200 dark:bg-teal-800/60 text-teal-800 dark:text-teal-200 font-medium"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
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
