# Vitest Mock 类型定义指南

本指南详细介绍了在 Vitest 中如何正确地进行类型化的 Mock，确保类型安全和完整的 IDE 支持。

## 🎯 核心概念

### 1. `vi.mocked()` - 推荐方式

这是最推荐的方式，可以保持完整的类型安全：

```typescript
import * as fs from 'node:fs'
import { vi } from 'vitest'

// 创建类型化的 mock
const mockFs = vi.mocked(fs)

// 现在有完整的类型提示
mockFs.existsSync.mockImplementation((path) => {
  // path 参数有正确的类型提示
  return String(path).includes('test')
})
```

### 2. `vi.fn()` 与类型定义

```typescript
// 定义函数类型
type ApiCall = (url: string, options?: RequestInit) => Promise<Response>

// 创建类型化的 mock
const mockApiCall = vi.fn<ApiCall>()

// 设置 mock 实现
mockApiCall.mockResolvedValue(new Response('{"data": "test"}'))
```

### 3. `vi.spyOn()` 进行部分 Mock

```typescript
const fsModule = {
  existsSync: (path: string) => false,
  readFileSync: (path: string) => '',
}

// 只 mock 特定的方法
const mockExistsSync = vi.spyOn(fsModule, 'existsSync')
mockExistsSync.mockReturnValue(true)
```

## 📋 详细示例

### 基础 Mock 类型

```typescript
import { vi } from 'vitest'

// 1. 简单函数 Mock
type SimpleFunction = (input: string) => string
const mockSimple = vi.fn<SimpleFunction>()
mockSimple.mockReturnValue('mocked result')

// 2. 异步函数 Mock
type AsyncFunction = (input: string) => Promise<string>
const mockAsync = vi.fn<AsyncFunction>()
mockAsync.mockResolvedValue('async result')

// 3. 复杂参数函数 Mock
type ComplexFunction = (options: { name: string, age: number }) => boolean
const mockComplex = vi.fn<ComplexFunction>()
mockComplex.mockImplementation(options => options.age > 18)
```

### 接口 Mock 类型

```typescript
// 定义接口
interface UserService {
  findById: (id: string) => Promise<{ id: string, name: string } | null>
  create: (user: { name: string }) => Promise<{ id: string, name: string }>
  update: (id: string, user: Partial<{ name: string }>) => Promise<void>
}

// 创建 Mock 对象
const mockUserService: UserService = {
  findById: vi.fn().mockResolvedValue({ id: '1', name: 'John' }),
  create: vi.fn().mockResolvedValue({ id: '2', name: 'Jane' }),
  update: vi.fn().mockResolvedValue(undefined),
}
```

### 泛型 Mock 类型

```typescript
// 泛型接口
interface Repository<T> {
  findById: (id: string) => Promise<T | null>
  findAll: () => Promise<T[]>
  save: (entity: T) => Promise<T>
}

// 使用泛型
interface User { id: string, name: string, email: string }
const mockUserRepository: Repository<User> = {
  findById: vi.fn().mockResolvedValue({ id: '1', name: 'John', email: 'john@example.com' }),
  findAll: vi.fn().mockResolvedValue([]),
  save: vi.fn().mockImplementation(user => Promise.resolve(user)),
}
```

### 模块 Mock 类型

```typescript
// Mock 整个模块
const mockFsModule = {
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  constants: {
    F_OK: 0,
    R_OK: 4,
    W_OK: 2,
    X_OK: 1,
  },
}

const mockFs = vi.mocked(mockFsModule)
mockFs.existsSync.mockReturnValue(true)
mockFs.readFileSync.mockReturnValue('file content')
```

### 错误类型 Mock

```typescript
class CustomError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'CustomError'
  }
}

// Mock 抛出错误
const mockErrorFunction = vi.fn().mockImplementation(() => {
  throw new CustomError('Test error', 'TEST_ERROR')
})

expect(() => mockErrorFunction()).toThrow(CustomError)
```

## 🛠️ 高级技巧

### 1. 使用 `vi.hoisted()` 进行提升 Mock

```typescript
// 在模块顶层定义 mock
const mockUtils = vi.hoisted(() => ({
  formatDate: vi.fn((date: Date) => date.toISOString()),
  parseJson: vi.fn((json: string) => JSON.parse(json)),
  validateInput: vi.fn((input: unknown) => typeof input === 'string'),
}))

// Mock 模块
vi.mock('./utils', () => mockUtils)
```

### 2. 条件 Mock 类型

```typescript
type ConditionalFunction<T> = T extends string
  ? (input: T) => string
  : (input: T) => number

const mockConditional = vi.fn<ConditionalFunction<string>>()
mockConditional.mockReturnValue('string result')
```

### 3. 联合类型 Mock

```typescript
type StringOrNumber = string | number
type ProcessFunction = (input: StringOrNumber) => string

const mockProcess = vi.fn<ProcessFunction>()
mockProcess.mockImplementation(input => String(input))
```

## 📝 最佳实践

### 1. 类型安全优先

```typescript
// ✅ 好的做法
const mockFn = vi.fn<MyFunctionType>()
mockFn.mockImplementation((param) => {
  // param 有正确的类型提示
  return processParam(param)
})

// ❌ 避免的做法
const mockFn = vi.fn() as any
```

### 2. 明确的返回类型

```typescript
// ✅ 好的做法
interface MockReturn {
  success: boolean
  data: unknown
}

const mockApi = vi.fn().mockReturnValue({
  success: true,
  data: { id: 1 }
} as MockReturn)

// ❌ 避免的做法
const mockApi = vi.fn().mockReturnValue({
  success: true,
  data: { id: 1 }
})
```

### 3. 使用 `vi.mocked()` 进行模块 Mock

```typescript
// ✅ 好的做法
import * as fs from 'node:fs'
const mockFs = vi.mocked(fs)

// ❌ 避免的做法
const mockFs = fs as any
```

## 🔧 常见问题解决

### 1. Mock 函数没有类型提示

```typescript
// 问题：没有类型提示
const mockFn = vi.fn()

// 解决：添加类型定义
const mockFn = vi.fn<MyFunctionType>()
```

### 2. Mock 返回值类型不匹配

```typescript
// 问题：类型不匹配
const mockFn = vi.fn().mockReturnValue('string')

// 解决：明确返回类型
const mockFn = vi.fn<() => string>().mockReturnValue('string')
```

### 3. 模块 Mock 类型丢失

```typescript
// 问题：模块 Mock 后类型丢失
vi.mock('./module', () => ({ myFunction: vi.fn() }))

// 解决：使用 vi.mocked()
import * as module from './module'
const mockModule = vi.mocked(module)
```

## 📚 完整示例

查看 `tests/examples/mock-types-examples.test.ts` 文件，其中包含了所有类型的完整示例和测试用例。

## 🎉 总结

在 Vitest 中进行类型化的 Mock 的关键点：

1. **使用 `vi.mocked()`** - 最推荐的方式
2. **定义明确的类型** - 避免使用 `any`
3. **利用 TypeScript 类型系统** - 获得完整的 IDE 支持
4. **遵循最佳实践** - 保持代码的可维护性

通过这些技巧，你可以在 Vitest 中创建类型安全、易于维护的 Mock，提高测试代码的质量和开发效率。
