import type { Stats } from 'node:fs'
import { vi } from 'vitest'

// 文件系统 Mock 类型定义
interface MockStats extends Stats {
  isFile: () => boolean
  isDirectory: () => boolean
  size: number
}

// interface MockDirent extends Dirent {
//   name: string
//   isFile: () => boolean
//   isDirectory: () => boolean
// }

// Mock 文件系统
export function mockFs(): void {
  // Mock fs.promises
  vi.mock('node:fs/promises', () => ({
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    rmdir: vi.fn(),
    unlink: vi.fn(),
    access: vi.fn(),
    stat: vi.fn(),
    readdir: vi.fn(),
    copyFile: vi.fn(),
    rename: vi.fn(),
  }))

  // Mock fs
  vi.mock('node:fs', () => ({
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    rmdirSync: vi.fn(),
    unlinkSync: vi.fn(),
    accessSync: vi.fn(),
    statSync: vi.fn(),
    readdirSync: vi.fn(),
    copyFileSync: vi.fn(),
    renameSync: vi.fn(),
    constants: {
      F_OK: 0,
      R_OK: 4,
      W_OK: 2,
      X_OK: 1,
    },
  }))

  // Mock path
  vi.mock('node:path', async () => {
    // 直接导入 path 模块，因为它是同步的
    const path = await import('node:path')

    return {
      resolve: vi.fn((...args: string[]) => {
        return path.resolve(...args)
      }),
      join: vi.fn((...args: string[]) => {
        return path.join(...args)
      }),
      dirname: vi.fn((p: string) => {
        return path.dirname(p)
      }),
      basename: vi.fn((p: string, ext?: string) => {
        return path.basename(p, ext)
      }),
      extname: vi.fn((p: string) => {
        return path.extname(p)
      }),
      isAbsolute: vi.fn((p: string) => {
        return path.isAbsolute(p)
      }),
      sep: '/',
      delimiter: ':',
    }
  })
}

// 创建测试文件系统
export async function createTestFileSystem(files: Record<string, string>): Promise<void> {
  const fs = await import('node:fs')
  const mockFs = vi.mocked(fs)

  // 设置文件存在性检查
  mockFs.existsSync.mockImplementation((filePath) => {
    const pathStr = String(filePath)
    return pathStr in files
  })

  // 设置文件读取
  mockFs.readFileSync.mockImplementation((filePath, _encoding) => {
    const pathStr = String(filePath)
    if (pathStr in files) {
      return files[pathStr]
    }
    throw new Error(`ENOENT: no such file or directory, open '${pathStr}'`)
  })

  // 设置目录读取
  mockFs.readdirSync.mockImplementation((dirPath, options) => {
    const pathStr = String(dirPath)
    const dirFiles = Object.keys(files)
      .filter(file => file.startsWith(pathStr))
      .map(file => file.replace(`${pathStr}/`, '').split('/')[0])
      .filter((file, index, arr) => arr.indexOf(file) === index)

    if (options?.withFileTypes) {
      return dirFiles.map(name => ({
        name,
        isFile: () => files[`${pathStr}/${name}`] !== undefined,
        isDirectory: () => Object.keys(files).some(file => file.startsWith(`${pathStr}/${name}/`)),
        isBlockDevice: () => false,
        isCharacterDevice: () => false,
        isFIFO: () => false,
        isSocket: () => false,
        isSymbolicLink: () => false,
      })) as any[]
    }

    return dirFiles as string[]
  })

  // 设置文件状态
  mockFs.statSync.mockImplementation((filePath) => {
    const pathStr = String(filePath)
    const isFile = pathStr in files
    const isDir = Object.keys(files).some(file => file.startsWith(`${pathStr}/`))

    return {
      isFile: () => isFile,
      isDirectory: () => isDir,
      isBlockDevice: () => false,
      isCharacterDevice: () => false,
      isFIFO: () => false,
      isSocket: () => false,
      isSymbolicLink: () => false,
      size: isFile ? files[pathStr].length : 0,
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
    } as MockStats
  })
}

// 清理文件系统 mock
export function cleanupTestFileSystem(): void {
  vi.clearAllMocks()
}

// pnpm package 测试工具
export class PnpmPackageTester {
  private files: Record<string, string> = {}
  private packageJson: Record<string, unknown> = {}

  constructor() {
    this.setupDefaultPackageJson()
  }

  // 设置默认的 package.json
  private setupDefaultPackageJson(): void {
    this.packageJson = {
      name: 'test-package',
      version: '1.0.0',
      type: 'module',
      main: './dist/index.mjs',
      module: './dist/index.mjs',
      types: './dist/index.d.ts',
      files: ['dist'],
      scripts: {
        build: 'unbuild',
        test: 'vitest run',
        dev: 'unbuild --dev',
      },
      devDependencies: {
        typescript: '^5.0.0',
        vitest: '^3.0.0',
        unbuild: '^3.0.0',
      },
    }
  }

  // 添加 package.json 文件
  addPackageJson(packageJson: Record<string, unknown>): this {
    this.packageJson = { ...this.packageJson, ...packageJson }
    this.files['package.json'] = JSON.stringify(this.packageJson, null, 2)
    return this
  }

  // 添加 pnpm-workspace.yaml
  addPnpmWorkspace(workspace: Record<string, unknown>): this {
    this.files['pnpm-workspace.yaml'] = this.yamlStringify(workspace)
    return this
  }

  // 添加 pnpm-lock.yaml
  addPnpmLock(lockData: Record<string, unknown>): this {
    this.files['pnpm-lock.yaml'] = this.yamlStringify(lockData)
    return this
  }

  // 添加源码文件
  addSourceFile(path: string, content: string): this {
    this.files[path] = content
    return this
  }

  // 添加测试文件
  addTestFile(path: string, content: string): this {
    this.files[path] = content
    return this
  }

  // 添加配置文件
  addConfigFile(path: string, content: string): this {
    this.files[path] = content
    return this
  }

  // 添加 README
  addReadme(content: string): this {
    this.files['README.md'] = content
    return this
  }

  // 添加 .gitignore
  addGitignore(content: string): this {
    this.files['.gitignore'] = content
    return this
  }

  // 添加 TypeScript 配置
  addTsConfig(config: Record<string, unknown>): this {
    this.files['tsconfig.json'] = JSON.stringify(config, null, 2)
    return this
  }

  // 添加 Vitest 配置
  addVitestConfig(config: Record<string, unknown>): this {
    this.files['vitest.config.ts'] = this.generateVitestConfig(config)
    return this
  }

  // 添加 ESLint 配置
  addEslintConfig(config: Record<string, unknown>): this {
    this.files['eslint.config.mjs'] = this.generateEslintConfig(config)
    return this
  }

  // 添加构建配置
  addBuildConfig(config: Record<string, unknown>): this {
    this.files['build.config.ts'] = this.generateBuildConfig(config)
    return this
  }

  // 创建完整的 pnpm 项目结构
  createPnpmProject(options: {
    name: string
    version?: string
    description?: string
    type?: 'module' | 'commonjs'
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    scripts?: Record<string, string>
    workspaces?: string[]
  }): this {
    const {
      name,
      version = '1.0.0',
      description = 'Test package',
      type = 'module',
      dependencies = {},
      devDependencies = {},
      scripts = {},
      workspaces = [],
    } = options

    // 更新 package.json
    this.addPackageJson({
      name,
      version,
      description,
      type,
      dependencies,
      devDependencies,
      scripts: {
        build: 'unbuild',
        test: 'vitest run',
        dev: 'unbuild --dev',
        ...scripts,
      },
    })

    // 添加 pnpm-workspace.yaml
    if (workspaces.length > 0) {
      this.addPnpmWorkspace({
        packages: workspaces,
      })
    }

    // 添加基础文件
    this.addReadme(`# ${name}\n\n${description}`)
    this.addGitignore('node_modules\ndist\ncoverage\n.env\n')
    this.addTsConfig({
      compilerOptions: {
        target: 'ESNext',
        module: 'ESNext',
        moduleResolution: 'Node',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
      },
    })

    return this
  }

  // 获取所有文件
  getAllFiles(): Record<string, string> {
    return { ...this.files }
  }

  // 获取 package.json
  getPackageJson(): Record<string, unknown> {
    return { ...this.packageJson }
  }

  // 检查文件是否存在
  hasFile(path: string): boolean {
    return path in this.files
  }

  // 获取文件内容
  getFile(path: string): string | undefined {
    return this.files[path]
  }

  // 清理
  clear(): void {
    this.files = {}
    this.setupDefaultPackageJson()
  }

  // 辅助方法：YAML 字符串化
  private yamlStringify(obj: Record<string, unknown>): string {
    // 简单的 YAML 字符串化，实际项目中可以使用 yaml 库
    return Object.entries(obj)
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return `${key}:\n${this.yamlStringify(value as Record<string, unknown>)
            .split('\n')
            .map(line => `  ${line}`)
            .join('\n')}`
        }
        return `${key}: ${value}`
      })
      .join('\n')
  }

  // 生成 Vitest 配置
  private generateVitestConfig(config: Record<string, unknown>): string {
    return `import { defineConfig } from 'vitest/config'

export default defineConfig(${JSON.stringify(config, null, 2)})
`
  }

  // 生成 ESLint 配置
  private generateEslintConfig(config: Record<string, unknown>): string {
    return `import { defineConfig } from 'eslint-define-config'

export default defineConfig(${JSON.stringify(config, null, 2)})
`
  }

  // 生成构建配置
  private generateBuildConfig(config: Record<string, unknown>): string {
    return `import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig(${JSON.stringify(config, null, 2)})
`
  }
}

// 创建 pnpm package 测试环境
export async function createPnpmPackageTestEnvironment(
  files: Record<string, string>,
): Promise<void> {
  await createTestFileSystem(files)
}

// 模拟 pnpm 命令执行
export function mockPnpmCommand(command: string, _args: string[] = []): {
  mockExeca: any
  executePnpm: (cmd: string, cmdArgs?: string[]) => Promise<any>
} {
  const mockExeca = vi.fn()

  // Mock execa 来模拟 pnpm 命令
  vi.mock('execa', () => ({
    execa: mockExeca,
  }))

  return {
    mockExeca,
    executePnpm: async (cmd: string, cmdArgs: string[] = []) => {
      const result = await mockExeca(cmd, cmdArgs)
      return result
    },
  }
}
