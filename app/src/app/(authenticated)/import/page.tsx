"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveImportedRecipe } from "@/lib/actions";
import type { Ingredient } from "@/types";
import Link from "next/link";

interface ImportedRecipe {
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string;
  image_url: string;
  source_url: string;
  servings: number;
  prep_time: number | null;
  cook_time: number | null;
}

type ImportTab = "url" | "photo";

export default function ImportPage() {
  const [tab, setTab] = useState<ImportTab>("url");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportedRecipe | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleUrlImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const res = await fetch("/api/recipes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to import recipe");
      } else {
        setPreview(data.recipe);
      }
    } catch {
      setError("Network error — could not reach the server.");
    }

    setLoading(false);
  };

  const handlePhotoImport = async (file: File) => {
    setLoading(true);
    setError(null);
    setPreview(null);

    // Show local preview of the image
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreviewUrl(objectUrl);

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const res = await fetch("/api/recipes/photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to extract recipe from photo");
      } else {
        setPreview(data.recipe);
      }
    } catch {
      setError("Network error — could not reach the server.");
    }

    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoImport(file);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);

    const result = await saveImportedRecipe(preview);

    if (result.error) {
      setError(result.error);
      setSaving(false);
    } else {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      setPhotoPreviewUrl(null);
      router.push(`/recipes/${result.id}`);
    }
  };

  // Revoke object URL on unmount
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  const resetState = () => {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setPreview(null);
    setUrl("");
    setError(null);
    setPhotoPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/recipes"
          className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
        >
          &larr;
        </Link>
        <h1 className="text-xl font-display font-semibold text-stone-900 dark:text-stone-100">Import Recipe</h1>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 bg-stone-100 dark:bg-stone-800 rounded-lg p-1">
        <button
          onClick={() => {
            setTab("url");
            resetState();
          }}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            tab === "url"
              ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm"
              : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
          }`}
        >
          From URL
        </button>
        <button
          onClick={() => {
            setTab("photo");
            resetState();
          }}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            tab === "photo"
              ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm"
              : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
          }`}
        >
          From Photo
        </button>
      </div>

      {/* URL import */}
      {tab === "url" && !preview && (
        <form onSubmit={handleUrlImport} className="flex gap-3 mb-6">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a recipe URL..."
            required
            className="flex-1 px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white/80 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 btn-gradient rounded-lg whitespace-nowrap"
          >
            {loading ? "Importing..." : "Import"}
          </button>
        </form>
      )}

      {/* Photo import */}
      {tab === "photo" && !preview && !loading && (
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
            id="photo-upload"
          />
          <label
            htmlFor="photo-upload"
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-xl cursor-pointer hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors"
          >
            <svg
              className="w-10 h-10 text-stone-400 dark:text-stone-500 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
              />
            </svg>
            <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
              Click to upload a photo
            </span>
            <span className="text-xs text-stone-400 dark:text-stone-500 mt-1">
              Recipe card, cookbook page, or screenshot
            </span>
          </label>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <Link
            href="/recipes/new"
            className="text-sm text-red-600 dark:text-red-400 underline mt-2 inline-block"
          >
            Add recipe manually instead &rarr;
          </Link>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="glass rounded-xl border border-stone-200/60 dark:border-stone-700/40 p-8 text-center">
          {photoPreviewUrl && (
            <img
              src={photoPreviewUrl}
              alt="Uploaded photo"
              className="w-32 h-32 object-cover rounded-lg mx-auto mb-4"
            />
          )}
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg
              className="animate-spin h-4 w-4 text-amber-600 dark:text-amber-400"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-stone-500 dark:text-stone-400">
              {tab === "url"
                ? "Fetching and parsing recipe..."
                : "Reading recipe from photo..."}
            </p>
          </div>
          <p className="text-sm text-stone-400 dark:text-stone-500">
            {tab === "photo"
              ? "Using AI to extract the recipe. This may take 10-15 seconds."
              : "This may take a few seconds."}
          </p>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="glass rounded-xl border border-stone-200/60 dark:border-stone-700/40 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-display font-semibold text-stone-900 dark:text-stone-100">
                  {preview.title}
                </h2>
                {preview.description && (
                  <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                    {preview.description}
                  </p>
                )}
                <div className="flex gap-3 text-xs text-stone-400 dark:text-stone-500 mt-2">
                  {preview.servings && <span>{preview.servings} servings</span>}
                  {preview.prep_time && (
                    <span>{preview.prep_time} min prep</span>
                  )}
                  {preview.cook_time && (
                    <span>{preview.cook_time} min cook</span>
                  )}
                </div>
              </div>
              {preview.image_url && (
                <img
                  src={preview.image_url}
                  alt={preview.title}
                  className="w-20 h-20 rounded-lg object-cover ml-4 flex-shrink-0"
                />
              )}
            </div>
          </div>

          {/* Ingredients */}
          {preview.ingredients.length > 0 && (
            <div className="p-4 border-b border-stone-100 dark:border-stone-800">
              <h3 className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-2">
                Ingredients ({preview.ingredients.length})
              </h3>
              <ul className="space-y-1">
                {preview.ingredients.map((ing, i) => (
                  <li key={i} className="text-sm text-stone-700 dark:text-stone-300">
                    {ing.quantity && (
                      <span className="font-medium">{ing.quantity}</span>
                    )}{" "}
                    {ing.unit && (
                      <span className="text-stone-500 dark:text-stone-400">{ing.unit}</span>
                    )}{" "}
                    {ing.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructions preview */}
          {preview.instructions && (
            <div className="p-4 border-b border-stone-100 dark:border-stone-800">
              <h3 className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-2">
                Instructions
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 whitespace-pre-wrap line-clamp-6">
                {preview.instructions}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="p-4 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 btn-gradient rounded-lg"
            >
              {saving ? "Saving..." : "Save to Library"}
            </button>
            <button
              onClick={resetState}
              className="px-5 py-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium rounded-lg transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Help text */}
      {!loading && !preview && !error && (
        <div className="text-center py-8">
          <p className="text-sm text-stone-400 dark:text-stone-500">
            {tab === "url"
              ? "Paste a URL from any recipe website. We'll extract the title, ingredients, and instructions automatically."
              : "Upload a photo of a recipe card, cookbook page, or screenshot. AI will read and extract the recipe for you."}
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-2">
            If import fails, you can always{" "}
            <Link href="/recipes/new" className="text-amber-600 dark:text-amber-400 underline">
              add it manually
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
