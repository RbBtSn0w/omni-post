import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      // Ban Node.js core module imports
      'no-restricted-imports': ['error', {
        paths: [
          { name: 'fs', message: 'Node.js fs module is not allowed in shared package.' },
          { name: 'fs/promises', message: 'Node.js fs module is not allowed in shared package.' },
          { name: 'path', message: 'Node.js path module is not allowed in shared package.' },
          { name: 'crypto', message: 'Node.js crypto module is not allowed in shared package.' },
          { name: 'http', message: 'Node.js http module is not allowed in shared package.' },
          { name: 'https', message: 'Node.js https module is not allowed in shared package.' },
          { name: 'child_process', message: 'Node.js child_process module is not allowed in shared package.' },
          { name: 'os', message: 'Node.js os module is not allowed in shared package.' },
          { name: 'net', message: 'Node.js net module is not allowed in shared package.' },
        ],
        patterns: [
          { group: ['node:*'], message: 'Node.js built-in modules are not allowed in shared package.' }
        ]
      }],
      // Ban browser/DOM globals
      'no-restricted-globals': ['error',
        { name: 'window', message: 'Browser window global is not allowed in shared package.' },
        { name: 'document', message: 'Browser document global is not allowed in shared package.' },
        { name: 'navigator', message: 'Browser navigator global is not allowed in shared package.' },
        { name: 'localStorage', message: 'Browser localStorage global is not allowed in shared package.' },
        { name: 'sessionStorage', message: 'Browser sessionStorage global is not allowed in shared package.' },
        { name: 'location', message: 'Browser location global is not allowed in shared package.' },
        { name: 'fetch', message: 'Browser fetch global is not allowed in shared package. Use environment-agnostic alternatives.' },
        { name: 'XMLHttpRequest', message: 'Browser XMLHttpRequest is not allowed in shared package.' },
      ],
    },
  },
  {
    ignores: ['dist/', 'tests/', 'node_modules/'],
  },
];
