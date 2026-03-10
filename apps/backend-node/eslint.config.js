import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'test-results/**', 'data/**', '**/*.min.js'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      import: importPlugin,
    },
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
      'no-undef': 'off',
      'import/extensions': ['error', 'always', { js: 'always', ts: 'never', tsx: 'never', ignorePackages: true }],
    },
  },
];
