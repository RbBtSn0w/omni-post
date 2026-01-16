import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    outputFile: './test-results/reports/test-results.json',
    // 添加测试文件匹配规则，帮助IDE识别测试文件
    testMatch: [
      '**/tests/**/*.test.js',
      '**/__tests__/**/*.js',
      '**/*.test.js',
      '**/*.spec.js'
    ],
    // 添加Jest兼容的testRegex配置，帮助IDE识别测试文件
    testRegex: /(\.test|\.spec)\.(js|ts|jsx|tsx)$/,
    // 启用watch模式下的文件监听，帮助IDE实时更新测试状态
    watch: {
      ignored: ['node_modules', 'dist', 'test-results']
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './test-results/coverage',
      include: ['src/**/*.{js,vue}'],
      exclude: ['node_modules', 'dist', 'src/main.js', 'src/router/**/*.js', 'src/App.vue'],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80
      },
      reportOnFailure: true,
      failOnError: true
    },
    reporters: [
      'default',
      ['junit', {
        outputFile: './test-results/reports/test-results.xml',
        includeConsoleOutput: true
      }],
      ['json', {
        outputFile: './test-results/reports/test-results.json'
      }]
    ]
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
