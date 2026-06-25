import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="text-center max-w-md">
        <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Page not found
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
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
