import { createClient } from "@/lib/supabase/client";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * Sign out the current user and redirect to login.
 * Shared between Sidebar and MobileHeader.
 */
export async function signOut(router: AppRouterInstance) {
  const supabase = createClient();
  await supabase.auth.signOut();
  router.push("/login");
}
