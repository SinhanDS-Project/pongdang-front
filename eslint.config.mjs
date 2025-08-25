import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

import next from "eslint-config-next";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...next(),
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    ignores: ['.next/**', 'node_modules/**', 'dist/**'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { project: true },
    },
    plugins: { prettier },
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      // 팀 규칙 추가
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  }
];

export default eslintConfig;
