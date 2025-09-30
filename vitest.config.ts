import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // 测试环境
    environment: 'node',

    // 全局配置
    globals: true,

    // 测试文件匹配模式
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],

    // 排除文件
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
    ],

    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,ts}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{js,ts}',
        'src/**/*.spec.{js,ts}',
        'src/**/index.{js,ts}',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },

    // 超时设置
    testTimeout: 10000,
    hookTimeout: 10000,

    // 并行测试
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },

    // 报告器
    reporters: [
      'verbose',
      ['json', { outputFile: './test-results/results.json' }],
      ['html', { outputFile: './test-results/index.html' }],
    ],

    // 监听模式配置
    watch: false,

    // 静默模式
    silent: false,

    // 测试设置文件
    setupFiles: ['./tests/setup.ts'],
  },

  // 路径别名
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },

  // 定义全局变量
  define: {
    'import.meta.vitest': 'undefined',
  },
})
