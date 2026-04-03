import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 px-4">
      <div className="text-center max-w-md">
        <h2 className="text-lg font-display font-semibold text-stone-900 dark:text-stone-100 mb-2">
          Page not found
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="px-5 py-2 btn-gradient rounded-lg inline-block"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
