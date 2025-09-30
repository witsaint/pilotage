# 测试基础设施文档

本项目已经配置了完整的单元测试基础设施，专门为 Node.js 命令行工具和库的测试而设计。

## 🚀 快速开始

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

## 📁 项目结构

```
tests/
├── README.md                 # 详细测试文档
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

## 🛠️ 已配置的工具

### 测试框架
- **Vitest** - 现代化的测试框架
- **@vitest/ui** - 可视化测试界面
- **@vitest/coverage-v8** - 代码覆盖率报告

### 测试工具
- **@testing-library/jest-dom** - DOM 测试工具
- **@testing-library/user-event** - 用户事件模拟
- **execa** - 命令行执行工具
- **supertest** - HTTP 测试工具
- **mock-fs** - 文件系统模拟

### 开发工具
- **cross-env** - 跨平台环境变量
- **dotenv** - 环境变量加载
- **npm-run-all** - 并行脚本执行

## 📋 测试脚本

| 脚本 | 描述 |
|------|------|
| `pnpm test` | 运行所有测试 |
| `pnpm test-unit` | 运行单元测试 |
| `pnpm test-unit-watch` | 监听模式运行测试 |
| `pnpm test-coverage` | 生成覆盖率报告 |
| `pnpm test-ui` | 打开测试 UI 界面 |
| `pnpm test-debug` | 调试模式运行测试 |

## 🎯 测试能力

### 1. 基础功能测试
- ✅ 函数单元测试
- ✅ 模块导入/导出测试
- ✅ 类型检查测试

### 2. 命令行工具测试
- ✅ 命令行参数处理
- ✅ 环境变量设置
- ✅ 工作目录管理
- ✅ 命令执行和输出捕获
- ✅ 错误处理测试

### 3. 文件系统测试
- ✅ 文件读写操作
- ✅ 目录操作
- ✅ 文件系统 Mock
- ✅ 路径处理
- ✅ pnpm package 结构测试
- ✅ workspace 配置测试

### 4. 进程和系统测试
- ✅ 进程 Mock
- ✅ 标准输入/输出模拟
- ✅ 环境变量管理
- ✅ 退出码处理

### 5. 集成测试
- ✅ 完整工作流测试
- ✅ 多组件协作测试
- ✅ 端到端测试场景

## 🔧 测试工具类

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
    'lodash': '^4.17.21',
  },
  devDependencies: {
    'typescript': '^5.0.0',
    'vitest': '^3.0.0',
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
import { testData } from './tests/utils/test-helpers'

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
import { assert } from './tests/utils/test-helpers'

// 断言命令执行成功
assert.commandSuccess(result)

// 断言命令执行失败
assert.commandFailure(result)

// 断言输出包含特定内容
assert.outputContains(result, 'expected text')

// 断言错误输出包含特定内容
assert.errorContains(result, 'error message')
```

## 📊 覆盖率配置

项目设置了以下覆盖率阈值：

- 分支覆盖率: 80%
- 函数覆盖率: 80%
- 行覆盖率: 80%
- 语句覆盖率: 80%

覆盖率报告会生成在 `./coverage` 目录中，包括：
- HTML 报告
- JSON 报告
- LCOV 报告

## 🎨 自定义匹配器

项目扩展了 Vitest 的 expect 匹配器：

```typescript
// 检查是否为有效命令
expect(command).toBeValidCommand()

// 检查是否有有效输出
expect(result).toHaveValidOutput()

// 检查是否为有效 CLI 对象
expect(cli).toBeValidCLI()
```

## 🔍 调试和开发

### 使用 VS Code 调试
1. 在测试文件中设置断点
2. 使用 `pnpm test-debug` 运行测试
3. 在 VS Code 中附加调试器

### 使用测试 UI
```bash
pnpm test-ui
```
这会打开一个 Web 界面，可以可视化地运行和调试测试。

## 📝 最佳实践

1. **使用描述性的测试名称**：让测试名称清楚地说明测试的目的
2. **一个测试一个断言**：每个测试应该只验证一个行为
3. **使用 beforeEach/afterEach**：确保测试之间的隔离
4. **Mock 外部依赖**：使用提供的 Mock 工具来隔离测试
5. **测试边界条件**：包括正常情况、边界情况和错误情况
6. **保持测试简单**：避免复杂的测试逻辑
7. **使用测试数据生成器**：避免硬编码测试数据

## 🚨 注意事项

1. 测试环境会自动设置 `NODE_ENV=test`
2. 所有测试都在隔离的环境中运行
3. Mock 会在每个测试后自动清理
4. 测试超时设置为 10 秒
5. 支持并行测试执行

## 📚 更多信息

详细的测试文档和示例请查看 `tests/README.md` 文件。

## 🎉 总结

这个测试基础设施为 Node.js 库和命令行工具提供了：

- ✅ 完整的测试框架配置
- ✅ 丰富的测试工具和辅助函数
- ✅ 命令行工具测试能力
- ✅ 文件系统测试支持
- ✅ 进程和环境变量 Mock
- ✅ 代码覆盖率报告
- ✅ 可视化测试界面
- ✅ 调试支持
- ✅ 详细的文档和示例

现在你可以开始编写高质量的测试了！🎯
