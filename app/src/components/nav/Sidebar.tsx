"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { useTheme } from "../ThemeProvider";
import { NAV_LINKS } from "./NavLinks";
import { NavIconSvg } from "./NavIcons";
import { signOut } from "./sign-out";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      router.refresh();
    },
    [router]
  );

  const handleSignOut = () => signOut(router);

  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[72px] z-50 glass-strong border-r border-stone-200/60 dark:border-stone-700/40"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-center h-16"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <button onClick={() => navigate("/")} className="p-1">
          <img src="/favicon-32.png" alt="kDOUGH" className="w-8 h-8 rounded-lg" />
        </button>
      </div>

      {/* Nav links */}
      <nav
        className="flex-1 flex flex-col items-center gap-1 pt-2"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        {NAV_LINKS.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);

          return (
            <button
              key={link.href}
              onClick={() => navigate(link.href)}
              title={link.label}
              className={`flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-xl transition-colors ${
                isActive
                  ? "bg-gradient-to-b from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 text-amber-700 dark:text-amber-400"
                  : "text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/50"
              }`}
            >
              <NavIconSvg name={link.icon} />
              <span className="text-[10px] font-medium leading-tight">
                {link.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div
        className="flex flex-col items-center gap-2 pb-4"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2.5 rounded-xl text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors"
        >
          {theme === "dark" ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          )}
        </button>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          title="Sign out"
          className="p-2.5 rounded-xl text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
