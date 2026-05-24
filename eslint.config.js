import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import jbjContrast from "./eslint-rules/no-low-opacity-text.js";

export default tseslint.config(
  { ignores: ["dist", "eslint-rules/**"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jbj-contrast": jbjContrast,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // Hard-block new low-opacity text. Honors scripts/contrast/allowlist.json
      // baseline so legacy files don't fire. Opt out per-element via
      // // contrast-ok, data-decorative, data-no-contrast-guard, or
      // class `jj-watermark`. See docs/contrast-system.md §4.
      "jbj-contrast/no-low-opacity-text": "error",
    },
  },
);
