// Inline SVG illustrations for empty states
// Uses currentColor so they automatically adapt to light/dark mode

export function EmptyGroceryIllustration() {
  return (
    <svg
      className="w-20 h-20 mx-auto mb-4 text-stone-300 dark:text-stone-600"
      viewBox="0 0 80 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Cart body */}
      <path d="M16 24h5l8 30h28l7-22H30" />
      {/* Wheels */}
      <circle cx="33" cy="60" r="3" />
      <circle cx="52" cy="60" r="3" />
      {/* Handle */}
      <path d="M16 24l-4-6" />
      {/* Plus sign inside cart */}
      <path d="M42 36v10M37 41h10" strokeDasharray="2 2" opacity="0.6" />
    </svg>
  );
}

export function EmptyRecipesIllustration() {
  return (
    <svg
      className="w-20 h-20 mx-auto mb-4 text-stone-300 dark:text-stone-600"
      viewBox="0 0 80 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Open book spine */}
      <path d="M40 18v42" />
      {/* Left page */}
      <path d="M40 18c-5-4-15-6-24-3v42c9-3 19-1 24 3" />
      {/* Right page */}
      <path d="M40 18c5-4 15-6 24-3v42c-9-3-19-1-24 3" />
      {/* Lines on left page */}
      <path d="M22 28h10M22 34h8M22 40h10" opacity="0.4" />
      {/* Lines on right page */}
      <path d="M48 28h10M48 34h8M48 40h10" opacity="0.4" />
      {/* Small heart above */}
      <path d="M37 10c-1-2-4-2-4 0s4 5 4 5 4-3 4-5-3-2-4 0" opacity="0.5" />
    </svg>
  );
}

export function EmptySearchIllustration() {
  return (
    <svg
      className="w-16 h-16 mx-auto mb-3 text-stone-300 dark:text-stone-600"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Magnifying glass */}
      <circle cx="26" cy="26" r="14" />
      <path d="M36 36l14 14" strokeWidth="2.5" />
      {/* Question mark inside */}
      <path d="M22 22c0-4 3-6 5.5-5.5S32 20 28 22.5c-1 .6-2 1.5-2 3" opacity="0.5" />
      <circle cx="26" cy="31" r="0.8" fill="currentColor" stroke="none" opacity="0.5" />
    </svg>
  );
}
