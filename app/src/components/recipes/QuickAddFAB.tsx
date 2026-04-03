"use client";

import Link from "next/link";

export default function QuickAddFAB() {
  return (
    <Link
      href="/recipes/new"
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-30 w-14 h-14 btn-gradient rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
      aria-label="Add new recipe"
    >
      <svg
        className="w-7 h-7 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    </Link>
  );
}
