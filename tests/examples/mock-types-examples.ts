import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Stats } from 'node:fs'
import * as fs from 'node:fs'

// 示例 1: 使用 vi.mocked() 进行类型安全的 Mock
describe('Mock Types Examples', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('1. vi.mocked() - 推荐方式', () => {
    it('should mock with full type safety', () => {
      // 创建类型化的 mock
      const mockFs = vi.mocked(fs)
      
      // 设置 mock 实现，有完整的类型提示
      mockFs.existsSync.mockImplementation((path) => {
        // path 参数有正确的类型提示
        return String(path).includes('test')
      })

      // 验证调用
      expect(mockFs.existsSync('/test/file.txt')).toBe(true)
      expect(mockFs.existsSync('/other/file.txt')).toBe(false)
    })

    it('should mock complex return types', () => {
      const mockFs = vi.mocked(fs)
      
      // Mock 返回复杂的 Stats 对象
      mockFs.statSync.mockImplementation((path): Stats => {
        const isFile = String(path).endsWith('.txt')
        return {
          isFile: () => isFile,
          isDirectory: () => !isFile,
          size: isFile ? 1024 : 0,
          mtime: new Date(),
          ctime: new Date(),
          atime: new Date(),
          birthtime: new Date(),
          mode: 0o644,
          uid: 0,
          gid: 0,
          dev: 0,
          ino: 0,
          nlink: 1,
          rdev: 0,
          blksize: 4096,
          blocks: 1,
          atimeMs: Date.now(),
          mtimeMs: Date.now(),
          ctimeMs: Date.now(),
          birthtimeMs: Date.now(),
          isBlockDevice: () => false,
          isCharacterDevice: () => false,
          isFIFO: () => false,
          isSocket: () => false,
          isSymbolicLink: () => false,
        } as Stats
      })

      const stats = mockFs.statSync('/test/file.txt')
      expect(stats.isFile()).toBe(true)
      expect(stats.size).toBe(1024)
    })
  })

  describe('2. vi.fn() 与类型定义', () => {
    // 定义函数类型
    type ApiCall = (url: string, options?: RequestInit) => Promise<Response>
    type DataProcessor = (data: unknown) => string

    it('should create typed mock functions', () => {
      // 创建类型化的 mock 函数
      const mockApiCall = vi.fn<ApiCall>()
      const mockProcessor = vi.fn<DataProcessor>()

      // 设置 mock 实现
      mockApiCall.mockResolvedValue(new Response('{"data": "test"}'))
      mockProcessor.mockReturnValue('processed data')

      // 使用时有完整的类型提示
      expect(mockApiCall).toBeDefined()
      expect(mockProcessor).toBeDefined()
    })

    it('should mock async functions with proper types', async () => {
      type AsyncProcessor = (input: string) => Promise<{ result: string; timestamp: number }>
      
      const mockAsyncProcessor = vi.fn<AsyncProcessor>()
      mockAsyncProcessor.mockResolvedValue({
        result: 'processed',
        timestamp: Date.now()
      })

      const result = await mockAsyncProcessor('test input')
      expect(result.result).toBe('processed')
      expect(typeof result.timestamp).toBe('number')
    })
  })

  describe('3. vi.spyOn() 进行部分 Mock', () => {
    it('should spy on specific methods', () => {
      // 只 mock 特定的方法
      const mockExistsSync = vi.spyOn(fs, 'existsSync')
      const mockReadFileSync = vi.spyOn(fs, 'readFileSync')

      // 设置 mock 行为
      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue('file content')

      // 验证
      expect(fs.existsSync('/test/file.txt')).toBe(true)
      expect(fs.readFileSync('/test/file.txt')).toBe('file content')

      // 验证调用
      expect(mockExistsSync).toHaveBeenCalledWith('/test/file.txt')
      expect(mockReadFileSync).toHaveBeenCalledWith('/test/file.txt')
    })
  })

  describe('4. vi.hoisted() 进行提升 Mock', () => {
    // 在模块顶层定义 mock
    const mockUtils = vi.hoisted(() => ({
      formatDate: vi.fn((date: Date) => date.toISOString()),
      parseJson: vi.fn((json: string) => JSON.parse(json)),
      validateInput: vi.fn((input: unknown) => typeof input === 'string'),
    }))

    // Mock 模块
    vi.mock('./utils', () => mockUtils)

    it('should use hoisted mocks', () => {
      // 使用 mock
      const result = mockUtils.formatDate(new Date('2023-01-01'))
      expect(result).toBe('2023-01-01T00:00:00.000Z')
    })
  })

  describe('5. 自定义 Mock 类型', () => {
    // 定义自定义接口
    interface DatabaseConnection {
      connect(): Promise<void>
      query(sql: string): Promise<unknown[]>
      close(): Promise<void>
    }

    interface UserService {
      findById(id: string): Promise<{ id: string; name: string } | null>
      create(user: { name: string }): Promise<{ id: string; name: string }>
      update(id: string, user: Partial<{ name: string }>): Promise<void>
    }

    it('should mock custom interfaces', () => {
      // 创建 mock 对象
      const mockDb: DatabaseConnection = {
        connect: vi.fn().mockResolvedValue(undefined),
        query: vi.fn().mockResolvedValue([]),
        close: vi.fn().mockResolvedValue(undefined),
      }

      const mockUserService: UserService = {
        findById: vi.fn().mockResolvedValue({ id: '1', name: 'John' }),
        create: vi.fn().mockResolvedValue({ id: '2', name: 'Jane' }),
        update: vi.fn().mockResolvedValue(undefined),
      }

      // 使用 mock
      expect(mockDb.connect).toBeDefined()
      expect(mockUserService.findById).toBeDefined()
    })
  })

  describe('6. Mock 模块的完整类型', () => {
    // Mock 整个模块
    vi.mock('node:fs', () => ({
      existsSync: vi.fn(),
      readFileSync: vi.fn(),
      writeFileSync: vi.fn(),
      mkdirSync: vi.fn(),
      constants: {
        F_OK: 0,
        R_OK: 4,
        W_OK: 2,
        X_OK: 1,
      },
    }))

    it('should mock entire modules with types', () => {
      const mockFs = vi.mocked(fs)
      
      // 设置 mock 行为
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue('content')

      // 验证
      expect(mockFs.existsSync('/test')).toBe(true)
      expect(mockFs.readFileSync('/test')).toBe('content')
    })
  })

  describe('7. 泛型 Mock 类型', () => {
    // 泛型接口
    interface Repository<T> {
      findById(id: string): Promise<T | null>
      findAll(): Promise<T[]>
      save(entity: T): Promise<T>
      delete(id: string): Promise<void>
    }

    it('should mock generic interfaces', () => {
      type User = { id: string; name: string; email: string }
      
      // 创建泛型 mock
      const mockUserRepository: Repository<User> = {
        findById: vi.fn().mockResolvedValue({ id: '1', name: 'John', email: 'john@example.com' }),
        findAll: vi.fn().mockResolvedValue([]),
        save: vi.fn().mockImplementation((user) => Promise.resolve(user)),
        delete: vi.fn().mockResolvedValue(undefined),
      }

      // 使用时有完整的类型提示
      expect(mockUserRepository.findById).toBeDefined()
      expect(mockUserRepository.save).toBeDefined()
    })
  })

  describe('8. Mock 错误类型', () => {
    class CustomError extends Error {
      constructor(message: string, public code: string) {
        super(message)
        this.name = 'CustomError'
      }
    }

    it('should mock error types', () => {
      const mockError = vi.fn().mockImplementation(() => {
        throw new CustomError('Test error', 'TEST_ERROR')
      })

      expect(() => mockError()).toThrow(CustomError)
      expect(() => mockError()).toThrow('Test error')
    })
  })
})
