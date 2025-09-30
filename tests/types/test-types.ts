// 测试相关的类型定义

export interface TestResult {
  success: boolean
  exitCode: number
  stdout: string
  stderr: string
}

export interface TestFile {
  path: string
  content: string
  isDirectory?: boolean
}

export interface TestConfig {
  name: string
  version: string
  description: string
  [key: string]: any
}

export interface MockProcess {
  mockExit: any
  mockStdout: any
  mockStderr: any
  mockStdin: any
  originalExit: any
}

export interface TestEnvironment {
  NODE_ENV: string
  TZ: string
  DEBUG: string
  LOG_LEVEL: string
  TEST_TIMEOUT: number
  TEST_RETRY_COUNT: number
}

// CLI 测试相关类型
export interface CLICommand {
  command: string
  args: string[]
  options?: {
    cwd?: string
    env?: Record<string, string>
    timeout?: number
  }
}

export interface CLIResult extends TestResult {
  command: string
  args: string[]
  duration: number
}

// 文件系统测试相关类型
export interface FileSystemMock {
  files: Record<string, string>
  directories: string[]
}

export interface TestDataGenerator {
  randomString: (length?: number) => string
  randomNumber: (min?: number, max?: number) => number
  randomEmail: () => string
  randomFilePath: (extension?: string) => string
  testConfig: (overrides?: Record<string, any>) => TestConfig
}

// 断言相关类型
export interface TestAssertions {
  commandSuccess: (result: TestResult) => TestResult
  commandFailure: (result: TestResult) => TestResult
  outputContains: (result: TestResult, text: string) => TestResult
  errorContains: (result: TestResult, text: string) => TestResult
}

// 测试工具类类型
export interface CLITesterInterface {
  setArgs: (args: string[]) => CLITesterInterface
  setEnv: (env: Record<string, string>) => CLITesterInterface
  setCwd: (cwd: string) => CLITesterInterface
  exec: (command: string, args?: string[]) => Promise<TestResult>
  restore: () => void
}

export interface FileSystemTesterInterface {
  addFile: (path: string, content: string) => FileSystemTesterInterface
  addDirectory: (path: string) => FileSystemTesterInterface
  getFile: (path: string) => string | undefined
  exists: (path: string) => boolean
  getAllFiles: () => Record<string, string>
  clear: () => void
}

// 全局测试类型扩展
declare global {
  namespace Vi {
    interface Assertion<T = any> {
      toBeValidCommand(): T
      toHaveValidOutput(): T
      toBeValidCLI(): T
    }
  }
}
