"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { NAV_LINKS } from "./NavLinks";
import { NavIconSvg } from "./NavIcons";

export default function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      router.refresh();
    },
    [router]
  );

  return (
    <nav className="fixed bottom-0 inset-x-0 md:hidden z-40 glass-strong border-t border-stone-200/60 dark:border-stone-700/40 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {NAV_LINKS.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);

          return (
            <button
              key={link.href}
              onClick={() => navigate(link.href)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-stone-400 dark:text-stone-500"
              }`}
            >
              <NavIconSvg name={link.icon} />
              <span className="text-[10px] font-medium leading-tight">
                {link.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
