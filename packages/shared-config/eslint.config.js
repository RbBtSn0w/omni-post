import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export const sharedIgnores = [
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/test-results/**',
  '**/.cache/**',
  '**/.vite/**',
  '**/node_modules/**',
  '**/*.min.js',
];

export const sharedBaseConfig = [
  {
    ignores: sharedIgnores,
  },
  js.configs.recommended,
];

export const sharedBrowserConfig = [
  ...sharedBaseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
];

export const sharedTsConfig = [
  ...sharedBaseConfig,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];

export default sharedBaseConfig;
