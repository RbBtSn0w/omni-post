import { sharedTsConfig } from '@omni-post/shared-config/eslint.config.js';

export default [
  ...sharedTsConfig,
  {
    rules: {
      'no-undef': 'off',
    },
  },
];
