import type { MockProcess } from 'tests/types/test-types'
import process from 'node:process'
import { vi } from 'vitest'

// Mock 进程相关功能
export function mockProcess(): MockProcess {
  // Mock process.exit
  const originalExit = process.exit
  const mockExit = vi.fn() as any
  process.exit = mockExit

  // Mock process.stdout
  const mockStdout = {
    write: vi.fn(),
    end: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    emit: vi.fn(),
  }

  // Mock process.stderr
  const mockStderr = {
    write: vi.fn(),
    end: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    emit: vi.fn(),
  }

  // Mock process.stdin
  const mockStdin = {
    read: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    emit: vi.fn(),
  }

  // 替换 process 属性
  Object.defineProperty(process, 'stdout', {
    value: mockStdout,
    writable: true,
  })

  Object.defineProperty(process, 'stderr', {
    value: mockStderr,
    writable: true,
  })

  Object.defineProperty(process, 'stdin', {
    value: mockStdin,
    writable: true,
  })

  // Mock process.argv
  process.argv = ['node', 'test.js']

  // Mock process.cwd
  process.cwd = vi.fn(() => '/test/working/directory')

  // Mock process.chdir
  process.chdir = vi.fn()

  // Mock process.env
  process.env = {
    ...process.env,
    NODE_ENV: 'test',
    TZ: 'UTC',
  }

  return {
    mockExit,
    mockStdout,
    mockStderr,
    mockStdin,
    originalExit,
  }
}

// 恢复原始进程功能
export function restoreProcess(originalExit: any): void {
  process.exit = originalExit
  vi.restoreAllMocks()
}

// 模拟命令行参数
export function mockArgv(args: string[]): void {
  process.argv = ['node', 'test.js', ...args]
}

// 模拟环境变量
export function mockEnv(env: Record<string, string>): void {
  Object.assign(process.env, env)
}

// 模拟工作目录
export function mockCwd(cwd: string): void {
  process.cwd = vi.fn(() => cwd)
}
