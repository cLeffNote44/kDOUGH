/**
 * Recipe image storage. Images — whether scraped from the source site, pasted as
 * a URL, or uploaded from a device — are re-hosted in the public `recipe-images`
 * bucket so the app serves them from its own origin. That sidesteps the hotlink
 * protection many recipe sites use (which was making card images fail to load).
 */

import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { safeFetch } from "@/lib/import/ssrf";

export const RECIPE_IMAGE_BUCKET = "recipe-images";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB — matches the bucket's file_size_limit
const MAX_URL_LEN = 2048;

// Allowed image types mapped to a file extension (matches the bucket's mime list).
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

type ServerSupabase = SupabaseClient<Database>;

/** True if a URL already points at our own storage bucket (don't re-host those). */
export function isStoredImageUrl(url: string): boolean {
  return url.includes(`/storage/v1/object/public/${RECIPE_IMAGE_BUCKET}/`);
}

async function uploadBytes(
  supabase: ServerSupabase,
  userId: string,
  body: ArrayBuffer,
  contentType: string,
  ext: string
): Promise<string | null> {
  const path = `${userId}/${randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(RECIPE_IMAGE_BUCKET)
    .upload(path, body, { contentType, cacheControl: "31536000", upsert: false });
  if (error) {
    console.error("recipe image upload failed:", error.message);
    return null;
  }
  return supabase.storage.from(RECIPE_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Fetch an external image (SSRF-guarded), validate type/size, and re-host it in
 * the user's storage folder. Returns the public URL, or null on any failure.
 */
export async function storeImageFromUrl(
  supabase: ServerSupabase,
  userId: string,
  sourceUrl: string
): Promise<string | null> {
  try {
    const res = await safeFetch(sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; kDOUGH/1.0; +https://k-dough.vercel.app)",
        Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8,*/*;q=0.5",
      },
      timeoutMs: 15000,
    });
    if (!res.ok) return null;

    const contentType = (res.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    const ext = MIME_EXT[contentType];
    if (!ext) return null; // not an allowed image type

    const declared = res.headers.get("content-length");
    if (declared && Number(declared) > MAX_BYTES) return null;

    const body = await res.arrayBuffer();
    if (body.byteLength === 0 || body.byteLength > MAX_BYTES) return null;

    return await uploadBytes(supabase, userId, body, contentType, ext);
  } catch (err) {
    console.error("storeImageFromUrl failed:", err);
    return null;
  }
}

/**
 * Resolve the image_url to persist for a recipe:
 * - empty -> null
 * - already one of our stored URLs (e.g. a device upload) -> keep as-is
 * - external http(s) URL -> re-host it; fall back to the raw URL if that fails
 */
export async function resolveRecipeImageUrl(
  supabase: ServerSupabase,
  userId: string,
  rawUrl: string | null | undefined
): Promise<string | null> {
  const url = (rawUrl ?? "").trim();
  if (!url || url.length > MAX_URL_LEN) return null;
  if (isStoredImageUrl(url)) return url;
  if (!/^https?:\/\//i.test(url)) return null; // ignore data:/blob:/relative
  const stored = await storeImageFromUrl(supabase, userId, url);
  return stored ?? url;
}
