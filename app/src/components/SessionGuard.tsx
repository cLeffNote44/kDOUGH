"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SessionGuard() {
  const router = useRouter();

  useEffect(() => {
    // If user opted out of "Remember me" and this is a new browser session
    // (sessionStorage is empty after browser restart), sign them out.
    const noPersist = localStorage.getItem("kd-no-persist");
    const sessionActive = sessionStorage.getItem("kd-session-active");

    if (noPersist === "true" && !sessionActive) {
      const supabase = createClient();
      supabase.auth.signOut().then(() => {
        localStorage.removeItem("kd-no-persist");
        router.push("/login");
        router.refresh();
      });
      return;
    }

    // Mark this browser session as active
    sessionStorage.setItem("kd-session-active", "true");
  }, [router]);

  return null;
}
