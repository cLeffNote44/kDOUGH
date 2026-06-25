"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Kept in sync with RECIPE_IMAGE_BUCKET in @/lib/recipe-images (not imported here:
// that module pulls in Node-only deps and this is a client component).
const RECIPE_IMAGE_BUCKET = "recipe-images";
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Recipe photo control: upload from the device (straight to Supabase Storage,
 * client-side, so it isn't bound by the server-action body limit) or paste an
 * image URL. The chosen value submits as `image_url`; the server re-hosts a
 * pasted external URL on save (uploads already point at our storage).
 */
export default function RecipeImageField({
  userId,
  defaultUrl,
}: {
  userId: string;
  defaultUrl?: string | null;
}) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 5MB.");
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${userId}/${crypto.randomUUID()}.${ext || "jpg"}`;
      const { error: upErr } = await supabase.storage
        .from(RECIPE_IMAGE_BUCKET)
        .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
      if (upErr) {
        setError("Upload failed. Please try again.");
      } else {
        setUrl(supabase.storage.from(RECIPE_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl);
      }
    } catch {
      setError("Upload failed. Please try again.");
    }
    setUploading(false);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        Photo
      </label>

      {url ? (
        <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden border border-slate-200/60 dark:border-slate-700/40 bg-slate-100 dark:bg-slate-800 mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Recipe"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => setUrl("")}
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Remove photo"
            title="Remove photo"
          >
            &times;
          </button>
        </div>
      ) : (
        <div className="w-full aspect-[16/9] rounded-lg border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-sm text-slate-400 dark:text-slate-500 mb-2">
          No photo yet
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="px-3 py-1.5 text-sm font-medium text-teal-700 dark:text-teal-400 border border-teal-300 dark:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors disabled:opacity-60"
        >
          {uploading ? "Uploading…" : url ? "Replace photo" : "Upload photo"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>

      <input
        name="image_url"
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="…or paste an image URL"
        className="mt-2 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
      />
      {error && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>}
    </div>
  );
}
