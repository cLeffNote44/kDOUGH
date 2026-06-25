// Registers jest-dom matchers (e.g. toBeInTheDocument) and their TS types for
// the whole suite. Safe to load in the node environment — the matchers only
// touch the DOM when actually invoked, which only happens in jsdom tests.
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// Unmount React trees between tests, but only in a DOM environment so the
// node-based lib tests are unaffected.
afterEach(async () => {
  if (typeof document !== "undefined") {
    const { cleanup } = await import("@testing-library/react");
    cleanup();
  }
});
