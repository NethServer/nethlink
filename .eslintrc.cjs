module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    '@electron-toolkit/eslint-config-ts/recommended',
    '@electron-toolkit/eslint-config-prettier',
    'prettier',
  ],
  rules: {
    // disable the rule for all files
    'no-prototype-builtins': 'off',
    'no-case-declarations': 'off',
    'no-useless-escape': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-this-alias': 'warn',
    'react/react-in-jsx-scope': 'off',
    // the NethVoice API and the design tokens use snake_case on the wire:
    // check declarations, not properties
    camelcase: ['error', { properties: 'never' }],
    // the '/' marker keeps TypeScript triple-slash directives intact:
    // without it the autofix rewrites /// <reference ... /> into // / <reference ... />
    'spaced-comment': ['error', 'always', { markers: ['/'] }],
    quotes: ['error', 'single', { avoidEscape: true }],
    'no-duplicate-imports': 'error',
    'react/display-name': 'off',
    // TypeScript prop types already cover what prop-types would check
    'react/prop-types': 'off',
    '@typescript-eslint/ban-ts-comment': 'warn',
  },
  overrides: [
    {
      // main, preload and shared are plain TypeScript: a use* factory there is not
      // a React hook, so the React rules can only produce false positives
      files: ['src/main/**', 'src/preload/**', 'src/shared/**'],
      rules: {
        'react-hooks/rules-of-hooks': 'off',
        'react-hooks/exhaustive-deps': 'off',
      },
    },
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', 'react-hooks', '@typescript-eslint', 'prettier'],
  settings: {
    react: {
      version: 'detect',
    },
  },
}
