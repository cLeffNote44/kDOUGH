"use client";

import { toast } from "sonner";
import type { Ingredient } from "@/types";

interface RecipeExportProps {
  title: string;
  description?: string | null;
  servings?: number | null;
  prep_time?: number | null;
  cook_time?: number | null;
  ingredients: Ingredient[];
  instructions?: string | null;
  source_url?: string | null;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const ingLine = (i: Ingredient) =>
  [i.quantity, i.unit, i.name].map((x) => (x ?? "").trim()).filter(Boolean).join(" ");

export default function RecipeExportButtons(r: RecipeExportProps) {
  const build = (): { text: string; html: string } => {
    const meta = [
      r.servings ? `${r.servings} servings` : "",
      r.prep_time ? `${r.prep_time}m prep` : "",
      r.cook_time ? `${r.cook_time}m cook` : "",
    ]
      .filter(Boolean)
      .join(" · ");

    const text: string[] = [r.title, ""];
    if (r.description) text.push(r.description, "");
    if (meta) text.push(meta, "");
    if (r.ingredients?.length) {
      text.push("INGREDIENTS");
      for (const i of r.ingredients) {
        const l = ingLine(i);
        if (l) text.push(`- ${l}`);
      }
      text.push("");
    }
    if (r.instructions) text.push("INSTRUCTIONS", r.instructions, "");
    if (r.source_url) text.push(`Source: ${r.source_url}`);

    const html: string[] = [`<h1>${escapeHtml(r.title)}</h1>`];
    if (r.description) html.push(`<p>${escapeHtml(r.description)}</p>`);
    if (meta) html.push(`<p class="meta">${escapeHtml(meta)}</p>`);
    if (r.ingredients?.length) {
      html.push("<h2>Ingredients</h2><ul>");
      for (const i of r.ingredients) {
        const l = ingLine(i);
        if (l) html.push(`<li>${escapeHtml(l)}</li>`);
      }
      html.push("</ul>");
    }
    if (r.instructions)
      html.push(
        `<h2>Instructions</h2><div class="steps">${escapeHtml(r.instructions).replace(/\n/g, "<br>")}</div>`
      );
    if (r.source_url)
      html.push(
        `<p class="src">Source: <a href="${escapeHtml(r.source_url)}">${escapeHtml(r.source_url)}</a></p>`
      );

    return { text: text.join("\n").trim(), html: html.join("") };
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(build().text);
      toast.success("Recipe copied to clipboard");
    } catch {
      toast.error("Couldn't copy the recipe");
    }
  };

  const handleShare = async () => {
    const { text } = build();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: r.title, text });
      } catch {
        // User cancelled — no-op.
      }
    } else {
      // No native share (e.g. desktop) — open an email draft instead of copying.
      window.location.assign(
        `mailto:?subject=${encodeURIComponent(r.title)}&body=${encodeURIComponent(text)}`
      );
    }
  };

  const handlePrint = () => {
    const { html } = build();
    const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(
      r.title
    )}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;padding:24px;color:#0f172a;max-width:640px;margin:0 auto}h1{font-size:22px;margin:0 0 4px}h2{font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:#475569;margin:18px 0 6px}.meta{color:#64748b;font-size:13px;margin:0 0 8px}ul{padding-left:18px;margin:0}li{padding:2px 0}.steps{white-space:pre-wrap;line-height:1.6}.src{margin-top:16px;font-size:12px;color:#64748b}</style></head><body>${html}</body></html>`;
    // Print via a hidden iframe — works in the browser and the Electron build.
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);
    const idoc = iframe.contentWindow?.document;
    if (!idoc) return;
    idoc.open();
    idoc.write(doc);
    idoc.close();
    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 1000);
    }, 250);
  };

  const btn =
    "px-2.5 py-1.5 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors";

  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={handleCopy} className={btn} title="Copy as text">
        Copy
      </button>
      <button type="button" onClick={handlePrint} className={btn} title="Print">
        Print
      </button>
      <button type="button" onClick={handleShare} className={btn} title="Share or email">
        Share
      </button>
    </div>
  );
}
