import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiExtractFromImage, isAiAvailable } from "@/lib/import/ai-assist";
import { checkRateLimit } from "@/lib/rate-limit";

// Rate limit: 5 photo OCR requests per hour per user (AI calls are expensive)
const PHOTO_RATE_LIMIT = { maxRequests: 5, windowMs: 60 * 60 * 1000 };

export async function POST(request: Request) {
  // Verify auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting
  const rateCheck = checkRateLimit(`photo:${user.id}`, PHOTO_RATE_LIMIT);
  if (!rateCheck.allowed) {
    const retryAfterSec = Math.ceil((rateCheck.retryAfterMs ?? 0) / 1000);
    return NextResponse.json(
      { error: "Too many photo import requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSec) },
      }
    );
  }

  if (!isAiAvailable()) {
    return NextResponse.json(
      {
        error:
          "Photo import requires an Anthropic API key. Set the ANTHROPIC_API_KEY environment variable to enable this feature.",
      },
      { status: 501 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("photo") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No photo provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported image format. Use JPEG, PNG, WebP, or GIF." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Convert to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const recipe = await aiExtractFromImage(
      base64,
      file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif"
    );

    if (!recipe || !recipe.title || recipe.ingredients.length === 0) {
      return NextResponse.json(
        {
          error:
            "Could not extract a recipe from this image. Try a clearer photo or add the recipe manually.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ recipe });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process photo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
