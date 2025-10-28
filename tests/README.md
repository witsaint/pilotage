# 测试文档

这个目录包含了项目的完整测试基础设施，专门为 Node.js 命令行工具和库的测试而设计。

## 目录结构

```
tests/
├── README.md                 # 测试文档
├── setup.ts                 # 全局测试设置
├── setup-env.ts             # 环境配置
├── cli.test.ts              # CLI 测试示例
├── config/
│   └── test-config.ts       # 测试配置
├── fixtures/                # 测试数据
│   ├── sample-data.json
│   └── test-commands.txt
├── mocks/                   # Mock 工具
│   ├── fs.ts               # 文件系统 Mock
│   └── process.ts          # 进程 Mock
├── types/
│   └── test-types.ts       # 测试类型定义
└── utils/
    └── test-helpers.ts     # 测试工具函数
```

## 快速开始

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test-coverage

# 监听模式运行测试
pnpm test-unit-watch

# 使用 UI 界面运行测试
pnpm test-ui

# 调试模式运行测试
pnpm test-debug
```

### 编写测试

#### 基本测试示例

```typescript
import { describe, expect, it } from 'vitest'
import { main } from '../src/index'

describe('main function', () => {
  it('should return expected result', () => {
    const result = main()
    expect(result).toBe('Hello, world!')
  })
})
```

#### CLI 测试示例

```typescript
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { assert, CLITester } from './utils/test-helpers'

describe('CLI Commands', () => {
  let cliTester: CLITester

  beforeEach(() => {
    cliTester = new CLITester()
  })

  afterEach(() => {
    cliTester.restore()
  })

  it('should execute command successfully', async () => {
    const result = await cliTester
      .setArgs(['--help'])
      .exec('node', ['--version'])

    assert.commandSuccess(result)
    assert.outputContains(result, 'v')
  })
})
```

## 测试工具

### CLITester

用于测试命令行工具的工具类：

```typescript
const cliTester = new CLITester()

// 设置命令行参数
cliTester.setArgs(['--verbose', '--config', 'config.json'])

// 设置环境变量
cliTester.setEnv({ DEBUG: 'true', NODE_ENV: 'test' })

// 设置工作目录
cliTester.setCwd('/tmp/test-dir')

// 执行命令
const result = await cliTester.exec('my-command', ['arg1', 'arg2'])

// 恢复原始状态
cliTester.restore()
```

### FileSystemTester

用于测试文件系统操作的工具类：

```typescript
const fsTester = new FileSystemTester()

// 添加测试文件
fsTester.addFile('/tmp/test.txt', 'Hello, World!')

// 添加测试目录
fsTester.addDirectory('/tmp/test-dir')

// 检查文件是否存在
expect(fsTester.exists('/tmp/test.txt')).toBe(true)

// 获取文件内容
expect(fsTester.getFile('/tmp/test.txt')).toBe('Hello, World!')
```

### PnpmPackageTester

专门用于测试 pnpm package 的工具类：

```typescript
const packageTester = new PnpmPackageTester()

// 创建基本的 pnpm 项目
packageTester.createPnpmProject({
  name: 'my-package',
  version: '1.0.0',
  type: 'module',
  dependencies: {
    lodash: '^4.17.21',
  },
  devDependencies: {
    typescript: '^5.0.0',
    vitest: '^3.0.0',
  },
})

// 添加源码文件
packageTester
  .addSourceFile('src/index.ts', 'export function main() { return "Hello!" }')
  .addTestFile('src/index.test.ts', 'import { describe, it } from "vitest"')

// 添加配置文件
packageTester
  .addTsConfig({ compilerOptions: { strict: true } })
  .addVitestConfig({ test: { environment: 'node' } })

// 创建 pnpm workspace
packageTester
  .addPnpmWorkspace({ packages: ['packages/*', 'apps/*'] })
  .addPnpmLock({ lockfileVersion: '6.0' })

// 检查文件
expect(packageTester.hasFile('package.json')).toBe(true)
expect(packageTester.hasFile('src/index.ts')).toBe(true)

// 获取 package.json
const packageJson = packageTester.getPackageJson()
expect(packageJson.name).toBe('my-package')
```

### 测试数据生成器

```typescript
import { testData } from './utils/test-helpers'

// 生成随机字符串
const randomStr = testData.randomString(10)

// 生成随机数字
const randomNum = testData.randomNumber(1, 100)

// 生成随机邮箱
const email = testData.randomEmail()

// 生成测试配置
const config = testData.testConfig({ custom: 'value' })
```

### 断言工具

```typescript
import { assert } from './utils/test-helpers'

// 断言命令执行成功
assert.commandSuccess(result)

// 断言命令执行失败
assert.commandFailure(result)

// 断言输出包含特定内容
assert.outputContains(result, 'expected text')

// 断言错误输出包含特定内容
assert.errorContains(result, 'error message')
```

## Mock 工具

### 文件系统 Mock

```typescript
import { createTestFileSystem } from './mocks/fs'

const files = {
  '/tmp/file1.txt': 'Content 1',
  '/tmp/file2.txt': 'Content 2',
}

createTestFileSystem(files)
// 现在 fs 模块会使用这些模拟文件
```

### 进程 Mock

```typescript
import { mockArgv, mockEnv, mockProcess } from './mocks/process'

// Mock 进程相关功能
const { mockExit, mockStdout } = mockProcess()

// 模拟命令行参数
mockArgv(['--help', '--verbose'])

// 模拟环境变量
mockEnv({ DEBUG: 'true' })
```

## 测试配置

### 环境变量

测试环境会自动设置以下环境变量：

- `NODE_ENV=test`
- `TZ=UTC`
- `DEBUG=false`
- `LOG_LEVEL=error`

### 覆盖率要求

项目设置了以下覆盖率阈值：

- 分支覆盖率: 80%
- 函数覆盖率: 80%
- 行覆盖率: 80%
- 语句覆盖率: 80%

### 超时设置

- 测试超时: 10 秒
- Hook 超时: 10 秒

## 最佳实践

1. **使用描述性的测试名称**：让测试名称清楚地说明测试的目的
2. **一个测试一个断言**：每个测试应该只验证一个行为
3. **使用 beforeEach/afterEach**：确保测试之间的隔离
4. **Mock 外部依赖**：使用提供的 Mock 工具来隔离测试
5. **测试边界条件**：包括正常情况、边界情况和错误情况
6. **保持测试简单**：避免复杂的测试逻辑
7. **使用测试数据生成器**：避免硬编码测试数据

## 调试测试

### 使用 VS Code 调试

1. 在测试文件中设置断点
2. 使用 `pnpm test-debug` 运行测试
3. 在 VS Code 中附加调试器

### 使用测试 UI

```bash
pnpm test-ui
```

这会打开一个 Web 界面，可以可视化地运行和调试测试。

## 常见问题

### Q: 如何测试异步函数？

A: 使用 `async/await` 或返回 Promise：

```typescript
it('should handle async operation', async () => {
  const result = await asyncFunction()
  expect(result).toBeDefined()
})
```

### Q: 如何测试错误情况？

A: 使用 `expect().toThrow()` 或测试错误返回值：

```typescript
it('should throw error for invalid input', () => {
  expect(() => {
    functionWithValidation('invalid')
  }).toThrow('Invalid input')
})
```

### Q: 如何测试文件系统操作？

A: 使用 `FileSystemTester` 或文件系统 Mock：

```typescript
const fsTester = new FileSystemTester()
fsTester.addFile('/tmp/test.txt', 'content')
// 测试使用该文件的功能
```
