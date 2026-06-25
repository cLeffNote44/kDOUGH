"use client";

import { useState, useEffect, useRef } from "react";
import { useFocusTrap } from "@/components/useFocusTrap";

const STEPS = [
  {
    title: "Welcome to kDOUGH!",
    description:
      "Your personal meal planner and grocery list generator. Let's take a quick look around.",
    illustration: (
      <svg
        className="w-24 h-24 text-teal-500"
        viewBox="0 0 96 96"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Chef hat */}
        <path d="M32 52v12h32V52" />
        <path d="M30 52c0-6 3-10 8-12-1-4 1-8 5-10 3-2 7-2 10 0 3-2 7-2 10 0 4 2 6 6 5 10 5 2 8 6 8 12" />
        {/* Hat band */}
        <path d="M32 52h32" opacity="0.5" />
        {/* Heart */}
        <path
          d="M44 42c-1-2-4-3-5-1s0 5 5 8c5-3 6-6 5-8s-4-1-5 1"
          className="text-teal-400"
          strokeWidth="1.2"
        />
        {/* Steam */}
        <path d="M42 70c0 3-2 5-2 8" opacity="0.3" strokeDasharray="2 2" />
        <path d="M48 70c0 4 0 6 0 8" opacity="0.3" strokeDasharray="2 2" />
        <path d="M54 70c0 3 2 5 2 8" opacity="0.3" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    title: "Plan Your Week",
    description:
      "Tap any empty meal slot to add a recipe. Tap a planned meal to move, change, or remove it — and drag-and-drop works too on desktop.",
    illustration: (
      <svg
        className="w-24 h-24 text-teal-500"
        viewBox="0 0 96 96"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Calendar outline */}
        <rect x="16" y="24" width="64" height="52" rx="4" />
        {/* Calendar header */}
        <path d="M16 36h64" />
        {/* Hang tabs */}
        <path d="M32 20v8M64 20v8" strokeWidth="2" />
        {/* Grid lines */}
        <path d="M16 48h64M16 60h64" opacity="0.3" />
        <path d="M38 36v40M60 36v40" opacity="0.3" />
        {/* Check mark in a cell */}
        <path
          d="M24 44l3 3 6-6"
          className="text-emerald-500"
          strokeWidth="2"
        />
        {/* Filled cell indicator */}
        <rect
          x="42"
          y="40"
          width="14"
          height="6"
          rx="1.5"
          className="text-teal-400"
          opacity="0.5"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    ),
  },
  {
    title: "Smart Grocery Lists",
    description:
      "Generate grocery lists from your meal plan. Items are auto-categorized by aisle for faster shopping.",
    illustration: (
      <svg
        className="w-24 h-24 text-teal-500"
        viewBox="0 0 96 96"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Shopping bag */}
        <path d="M24 36h48l-4 40H28z" />
        {/* Bag handles */}
        <path d="M36 36v-6a12 12 0 0124 0v6" />
        {/* Items peeking out */}
        <circle cx="38" cy="50" r="4" className="text-emerald-400" opacity="0.6" />
        <circle cx="52" cy="46" r="3" className="text-teal-400" opacity="0.6" />
        <path d="M44 52l4-8 4 8" className="text-emerald-500" opacity="0.5" />
        {/* Checklist overlay */}
        <path d="M56 56h10M56 62h8M56 68h10" opacity="0.4" />
        <path d="M52 56l1.5 1.5 3-3M52 62l1.5 1.5 3-3" opacity="0.4" strokeWidth="1.2" />
      </svg>
    ),
  },
];

export default function OnboardingModal() {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check localStorage for persistence across sessions. localStorage is
    // client-only, so showing the modal must happen post-hydration, not during
    // render — the setState-in-effect here is intentional.
    const onboarded = localStorage.getItem("kd-onboarded");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!onboarded) setShow(true);
  }, []);

  const handleComplete = () => {
    localStorage.setItem("kd-onboarded", "true");
    setShow(false);
  };

  // Focus trap + Escape-to-dismiss (completes the tour) + focus restore.
  // `show` gates it since this component stays mounted while hidden.
  useFocusTrap(modalRef, handleComplete, show);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="glass-strong rounded-2xl shadow-lg w-full max-w-sm mx-4 p-6 border border-slate-200/60 dark:border-slate-700/40 text-center"
      >
        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step
                  ? "bg-teal-500"
                  : "bg-slate-300 dark:bg-slate-600"
              }`}
            />
          ))}
        </div>

        {/* Illustration */}
        <div className="flex justify-center mb-4">
          {STEPS[step].illustration}
        </div>

        {/* Title & description */}
        <h2 id="onboarding-title" className="font-display font-semibold text-lg text-slate-900 dark:text-slate-100 mb-2">
          {STEPS[step].title}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          {STEPS[step].description}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2 btn-gradient text-sm rounded-lg"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-6 py-2 btn-gradient text-sm rounded-lg"
            >
              Get Started
            </button>
          )}
        </div>

        {/* Skip */}
        {step < STEPS.length - 1 && (
          <button
            onClick={handleComplete}
            className="mt-4 text-xs text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            Skip tour
          </button>
        )}
      </div>
    </div>
  );
}
