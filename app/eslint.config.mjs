import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // The Electron main process is intentionally CommonJS, so require() is correct
  // there (it runs in Node, not the bundler graph).
  {
    files: ["electron/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // eslint-plugin-react-hooks v6 (bundled with Next 16) adds React-Compiler-era
  // rules that flag long-standing, intentional client-sync patterns in existing
  // components (post-hydration setState for theme/online status; ref reads in
  // gesture handlers). Adopt them as warnings so they stay visible without
  // failing CI; tighten in a focused follow-up pass.
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
