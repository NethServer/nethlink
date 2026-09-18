import js from '@eslint/js'
import globals from 'globals'
import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  {
    ignores: ['node_modules/**', 'dist/**', 'out/**'],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        ...globals.jest,
      },
    },
    rules: {
      'no-prototype-builtins': 'off',
      'no-case-declarations': 'off',
      'no-useless-escape': 'off',
      // Backend payloads and theme tokens are snake_case by contract, so this
      // rule only ever fires on identifiers we are not free to rename.
      camelcase: 'off',
      // The `/` marker keeps `--fix` from mangling TypeScript triple-slash
      // directives (`/// <reference ... />`) into `// / <reference ... />`.
      'spaced-comment': ['error', 'always', { markers: ['/'] }],
      'no-duplicate-imports': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-this-alias': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
    },
  },
  // React rules apply to the renderer only. The main process has helpers named
  // `use*` (useNethVoiceAPI, useLogin) that are plain functions, not hooks, and
  // rules-of-hooks flags them when it is allowed to see them.
  {
    files: ['src/renderer/**/*.{js,jsx,ts,tsx}'],
    ...react.configs.flat.recommended,
    settings: { react: { version: 'detect' } },
  },
  {
    files: ['src/renderer/**/*.{js,jsx,ts,tsx}'],
    ...react.configs.flat['jsx-runtime'],
  },
  {
    files: ['src/renderer/**/*.{js,jsx,ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // TypeScript already checks component props.
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/display-name': 'off',
    },
  },
  eslintConfigPrettier,
)
