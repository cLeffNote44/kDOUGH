export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import PantryView from "@/components/pantry/PantryView";
import type { PantryItem } from "@/types";

export default async function PantryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let items: PantryItem[] = [];
  if (user) {
    const { data } = await supabase
      .from("pantry_items")
      .select("id, name, created_at")
      .eq("user_id", user.id)
      .order("name");
    items = (data as PantryItem[]) ?? [];
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-display font-semibold text-stone-900 dark:text-stone-100">
          Pantry Staples
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
          Items you always have on hand. When you generate a grocery list, these
          are tucked into a &ldquo;you likely have these&rdquo; section instead of
          the buy list.
        </p>
      </div>
      <PantryView items={items} />
    </div>
  );
}
