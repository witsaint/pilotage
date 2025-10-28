import process from 'node:process'
import { afterAll, beforeAll, vi } from 'vitest'
import { mockFs } from './mocks/fs'
import { mockProcess } from './mocks/process'

// 全局测试环境设置
beforeAll(() => {
  // 设置测试环境变量
  process.env.NODE_ENV = 'test'
  process.env.TZ = 'UTC'
  process.env.DEBUG = 'false'
  process.env.LOG_LEVEL = 'error'

  // 初始化 mocks
  mockProcess()
  mockFs()

  // 设置测试超时
  vi.setConfig({
    testTimeout: 10000,
    hookTimeout: 10000,
  })
})

afterAll(() => {
  // 清理测试环境
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

// 导出测试环境配置
export const testEnv = {
  NODE_ENV: 'test',
  TZ: 'UTC',
  DEBUG: 'false',
  LOG_LEVEL: 'error',
  TEST_TIMEOUT: 10000,
  TEST_RETRY_COUNT: 3,
} as const
