"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const THRESHOLD = 80;
const MAX_PULL = 120;

export default function PullToRefresh({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (window.scrollY <= 0 && !isRefreshing) {
        touchStartY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    },
    [isRefreshing]
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current) return;

    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY > 0 && window.scrollY <= 0) {
      // Apply resistance: square root curve for natural feel
      const pull = Math.min(MAX_PULL, deltaY * 0.4);
      setPullDistance(pull);
    } else {
      isPulling.current = false;
      setPullDistance(0);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(40); // Hold at partial height during refresh
      router.refresh();
      // Reset after delay (router.refresh doesn't return a promise)
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 600);
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, router]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator — only visible on mobile */}
      <div
        className="flex items-center justify-center overflow-hidden md:hidden"
        style={{
          height: pullDistance > 0 ? `${pullDistance}px` : 0,
          transition: isPulling.current ? "none" : "height 0.2s ease-out",
        }}
      >
        <div
          className={isRefreshing ? "animate-spin" : ""}
          style={{
            transform: `rotate(${progress * 360}deg)`,
            transition: isRefreshing ? "none" : "transform 0.1s ease-out",
          }}
        >
          <svg
            className="w-6 h-6 text-amber-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isRefreshing ? (
              <>
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </>
            ) : (
              <path d="M12 5v14m0 0l-6-6m6 6l6-6" />
            )}
          </svg>
        </div>
      </div>
      {children}
    </div>
  );
}
