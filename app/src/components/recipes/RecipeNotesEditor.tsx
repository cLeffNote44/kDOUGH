"use client";

import { useState, useTransition } from "react";
import { setRecipeNotes } from "@/lib/actions";
import { toast } from "sonner";

interface RecipeNotesEditorProps {
  recipeId: string;
  initialNotes: string | null;
}

export default function RecipeNotesEditor({
  recipeId,
  initialNotes,
}: RecipeNotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saved, setSaved] = useState(initialNotes ?? "");
  const [isPending, startTransition] = useTransition();

  const dirty = notes !== saved;

  const handleSave = () => {
    startTransition(async () => {
      const result = await setRecipeNotes(recipeId, notes);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSaved(notes);
      toast.success("Notes saved");
    });
  };

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-3">
        Notes
      </h2>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        maxLength={5000}
        placeholder="Tweaks, substitutions, how it turned out…"
        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
      />
      <div className="mt-2 flex justify-end">
        <button
          onClick={handleSave}
          disabled={!dirty || isPending}
          className="px-4 py-1.5 btn-gradient text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving…" : "Save notes"}
        </button>
      </div>
    </div>
  );
}
