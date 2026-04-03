"use client";

import { useState, useRef, useCallback } from "react";

interface SwipeableItemProps {
  children: React.ReactNode;
  onCheck: () => void;
  onRemove: () => void;
  isManual: boolean;
}

const THRESHOLD = 60;
const MAX_OFFSET = 80;

export default function SwipeableItem({
  children,
  onCheck,
  onRemove,
  isManual,
}: SwipeableItemProps) {
  const [offsetX, setOffsetX] = useState(0);
  const isSwiping = useRef(false);
  const directionDecided = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    startTime.current = Date.now();
    isSwiping.current = false;
    directionDecided.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - startX.current;
    const deltaY = e.touches[0].clientY - startY.current;

    // Decide direction once after initial movement
    if (!directionDecided.current) {
      if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return;
      directionDecided.current = true;
      // If vertical scroll dominates, abandon swipe
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        isSwiping.current = false;
        return;
      }
      isSwiping.current = true;
    }

    if (!isSwiping.current) return;

    // Prevent vertical scroll while swiping
    e.preventDefault();

    // Clamp offset: right swipe for check, left swipe for delete (only manual items)
    const maxLeft = isManual ? -MAX_OFFSET : 0;
    const clamped = Math.max(maxLeft, Math.min(MAX_OFFSET, deltaX));
    setOffsetX(clamped);
  }, [isManual]);

  const handleTouchEnd = useCallback(() => {
    const elapsed = Date.now() - startTime.current;
    const displacement = Math.abs(offsetX);

    // Short tap: treat as a click → check
    if (!isSwiping.current || (elapsed < 200 && displacement < 10)) {
      setOffsetX(0);
      // Don't fire onCheck here — the parent li's onClick handles taps
      return;
    }

    if (offsetX > THRESHOLD) {
      // Right swipe → check
      onCheck();
    } else if (offsetX < -THRESHOLD && isManual) {
      // Left swipe → remove
      onRemove();
    }

    // Spring back
    setOffsetX(0);
    isSwiping.current = false;
    directionDecided.current = false;
  }, [offsetX, onCheck, onRemove, isManual]);

  // Calculate background opacity based on swipe distance
  const rightProgress = Math.min(Math.max(offsetX / THRESHOLD, 0), 1);
  const leftProgress = Math.min(Math.max(-offsetX / THRESHOLD, 0), 1);

  return (
    <div
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background action indicators */}
      {(offsetX > 0 || offsetX < 0) && (
        <div className="absolute inset-0 flex">
          {/* Right swipe: check */}
          <div
            className="flex items-center justify-start flex-1 px-5"
            style={{
              backgroundColor: `rgba(34, 197, 94, ${rightProgress * 0.9})`,
            }}
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              style={{ opacity: rightProgress }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          {/* Left swipe: delete (only for manual items) */}
          <div
            className="flex items-center justify-end flex-1 px-5"
            style={{
              backgroundColor: isManual
                ? `rgba(239, 68, 68, ${leftProgress * 0.9})`
                : "transparent",
            }}
          >
            {isManual && (
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                style={{ opacity: leftProgress }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Foreground content */}
      <div
        className="relative bg-white dark:bg-stone-900"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping.current ? "none" : "transform 0.2s ease-out",
          willChange: offsetX !== 0 ? "transform" : "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}
