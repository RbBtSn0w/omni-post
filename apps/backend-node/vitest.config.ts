import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        root: '.',
        include: ['tests/**/*.test.ts'],
        globals: true,
        environment: 'node',
        setupFiles: ['tests/setup.ts'],
        testTimeout: 30000,
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts'],
            exclude: ['src/index.ts', 'src/db/migrations.ts'],
            reporter: ['text', 'html', 'lcov', 'json'],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
