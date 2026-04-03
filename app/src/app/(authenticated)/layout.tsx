import Nav from "@/components/Nav";
import SessionGuard from "@/components/SessionGuard";
import Toaster from "@/components/ui/Toaster";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import PullToRefresh from "@/components/PullToRefresh";
import OnboardingModal from "@/components/OnboardingModal";
import OfflineIndicator from "@/components/OfflineIndicator";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen md:ml-[72px]">
      <SessionGuard />
      <Nav />
      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20 md:pb-6">
        <PullToRefresh>{children}</PullToRefresh>
      </main>
      <Toaster />
      <KeyboardShortcuts />
      <OnboardingModal />
      <OfflineIndicator />
      <ServiceWorkerRegistration />
    </div>
  );
}
