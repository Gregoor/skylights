import { FlatCompat } from "@eslint/eslintrc";
import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default defineConfig([
  { ignores: ["web/src/lexicon", "web/.next"] },
  tseslint.config(eslint.configs.recommended, tseslint.configs.recommended),
  ...compat.config({
    extends: ["next"],
    settings: { next: { rootDir: "web/" } },
  }),
]);
