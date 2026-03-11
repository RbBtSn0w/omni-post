import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
