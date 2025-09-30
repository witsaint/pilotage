import { vi } from 'vitest'
import { execa } from 'execa'
import { mockArgv, mockEnv, mockCwd } from '../mocks/process'

// 命令行测试工具
export class CLITester {
  private originalArgv: string[]
  private originalEnv: NodeJS.ProcessEnv
  private originalCwd: string

  constructor() {
    this.originalArgv = [...process.argv]
    this.originalEnv = { ...process.env }
    this.originalCwd = process.cwd()
  }

  // 设置命令行参数
  setArgs(args: string[]) {
    mockArgv(args)
    return this
  }

  // 设置环境变量
  setEnv(env: Record<string, string>) {
    mockEnv(env)
    return this
  }

  // 设置工作目录
  setCwd(cwd: string) {
    mockCwd(cwd)
    return this
  }

  // 执行命令
  async exec(command: string, args: string[] = []) {
    try {
      const result = await execa(command, args, {
        cwd: process.cwd(),
        env: process.env,
        timeout: 10000,
      })
      return {
        success: true,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
      }
    } catch (error: any) {
      return {
        success: false,
        exitCode: error.exitCode || 1,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
      }
    }
  }

  // 恢复原始状态
  restore() {
    process.argv = this.originalArgv
    process.env = this.originalEnv
    process.cwd = () => this.originalCwd
  }
}

// 文件系统测试工具
export class FileSystemTester {
  private files: Record<string, string> = {}

  // 添加文件
  addFile(path: string, content: string) {
    this.files[path] = content
    return this
  }

  // 添加目录
  addDirectory(path: string) {
    this.files[path] = ''
    return this
  }

  // 获取文件内容
  getFile(path: string): string | undefined {
    return this.files[path]
  }

  // 检查文件是否存在
  exists(path: string): boolean {
    return path in this.files
  }

  // 获取所有文件
  getAllFiles(): Record<string, string> {
    return { ...this.files }
  }

  // 清理
  clear() {
    this.files = {}
  }
}

// 异步测试工具
export async function waitFor(condition: () => boolean, timeout = 5000) {
  const start = Date.now()
  
  while (Date.now() - start < timeout) {
    if (condition()) {
      return true
    }
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  
  throw new Error(`Condition not met within ${timeout}ms`)
}

// 捕获控制台输出
export function captureConsole() {
  const originalConsole = { ...console }
  const logs: string[] = []
  
  console.log = vi.fn((...args) => {
    logs.push(args.join(' '))
  })
  
  console.error = vi.fn((...args) => {
    logs.push(`ERROR: ${args.join(' ')}`)
  })
  
  console.warn = vi.fn((...args) => {
    logs.push(`WARN: ${args.join(' ')}`)
  })
  
  return {
    logs,
    restore: () => {
      Object.assign(console, originalConsole)
    },
  }
}

// 模拟用户输入
export function mockUserInput(inputs: string[]) {
  const mockStdin = {
    read: vi.fn(),
    on: vi.fn((event: string, callback: Function) => {
      if (event === 'data') {
        // 模拟用户输入
        inputs.forEach((input, index) => {
          setTimeout(() => {
            callback(Buffer.from(input + '\n'))
          }, index * 100)
        })
      }
    }),
    once: vi.fn(),
    emit: vi.fn(),
  }
  
  Object.defineProperty(process, 'stdin', {
    value: mockStdin,
    writable: true,
  })
  
  return mockStdin
}

// 测试数据生成器
export const testData = {
  // 生成随机字符串
  randomString(length = 10): string {
    return Math.random().toString(36).substring(2, 2 + length)
  },
  
  // 生成随机数字
  randomNumber(min = 0, max = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  },
  
  // 生成随机邮箱
  randomEmail(): string {
    return `test${this.randomNumber(1000, 9999)}@example.com`
  },
  
  // 生成随机文件路径
  randomFilePath(extension = 'txt'): string {
    return `/tmp/test-${this.randomString()}.${extension}`
  },
  
  // 生成测试配置对象
  testConfig(overrides: Record<string, any> = {}): Record<string, any> {
    return {
      name: 'test-project',
      version: '1.0.0',
      description: 'Test project',
      ...overrides,
    }
  },
}

// 断言工具
export const assert = {
  // 断言命令执行成功
  commandSuccess(result: any) {
    if (!result.success) {
      throw new Error(`Command failed: ${result.stderr}`)
    }
    return result
  },
  
  // 断言命令执行失败
  commandFailure(result: any) {
    if (result.success) {
      throw new Error(`Expected command to fail, but it succeeded: ${result.stdout}`)
    }
    return result
  },
  
  // 断言输出包含特定内容
  outputContains(result: any, text: string) {
    if (!result.stdout.includes(text)) {
      throw new Error(`Expected output to contain "${text}", but got: ${result.stdout}`)
    }
    return result
  },
  
  // 断言错误输出包含特定内容
  errorContains(result: any, text: string) {
    if (!result.stderr.includes(text)) {
      throw new Error(`Expected error to contain "${text}", but got: ${result.stderr}`)
    }
    return result
  },
}
