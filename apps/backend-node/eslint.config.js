import { sharedTsConfig } from '@omni-post/shared-config/eslint.config.js';
import importPlugin from 'eslint-plugin-import';

export default [
  {
    ignores: ['data/**'],
  },
  ...sharedTsConfig,
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      'no-undef': 'off',
      'import/extensions': ['error', 'always', { js: 'always', ts: 'never', tsx: 'never', ignorePackages: true }],
    },
  },
];
