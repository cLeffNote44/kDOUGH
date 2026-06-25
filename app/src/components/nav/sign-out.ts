import { createClient } from "@/lib/supabase/client";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * Sign out the current user and redirect to login.
 * Shared between Sidebar and MobileHeader.
 */
export async function signOut(router: AppRouterInstance) {
  const supabase = createClient();
  await supabase.auth.signOut();

  // Clear any service-worker caches so a later user on the same device can't be
  // served the previous user's cached assets/state.
  if (typeof caches !== "undefined") {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    } catch {
      // Cache API unavailable or blocked — non-fatal.
    }
  }

  router.push("/login");
}
