import process from 'node:process'
import { afterAll, afterEach, beforeAll, beforeEach, expect, vi } from 'vitest'

// 全局测试设置
beforeAll(async () => {
  // 设置测试环境变量
  process.env.NODE_ENV = 'test'
  process.env.TZ = 'UTC'
})

beforeEach(() => {
  // 每个测试前的清理
  vi.clearAllMocks()
})

afterEach(() => {
  // 每个测试后的清理
  vi.restoreAllMocks()
})

afterAll(async () => {
  // 测试结束后的清理
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

// 扩展 expect 匹配器
import '@testing-library/jest-dom'

// 全局测试工具
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeValidCommand: () => T
    toHaveValidOutput: () => T
    toBeValidCLI: () => T
  }
}

// 自定义匹配器
expect.extend({
  toBeValidCommand(received: string) {
    const isValid = typeof received === 'string' && received.length > 0
    return {
      pass: isValid,
      message: () => `expected ${received} to be a valid command`,
    }
  },

  toHaveValidOutput(received: any) {
    const isValid = received !== null && received !== undefined
    return {
      pass: isValid,
      message: () => `expected ${received} to have valid output`,
    }
  },

  toBeValidCLI(received: any) {
    const isValid = received && typeof received === 'object' && 'command' in received
    return {
      pass: isValid,
      message: () => `expected ${received} to be a valid CLI object`,
    }
  },
})
