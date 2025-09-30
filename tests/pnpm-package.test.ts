import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PnpmPackageTester, createPnpmPackageTestEnvironment, mockPnpmCommand } from './mocks/fs'

describe('PNPM Package Testing', () => {
  let packageTester: PnpmPackageTester

  beforeEach(() => {
    packageTester = new PnpmPackageTester()
  })

  afterEach(() => {
    packageTester.clear()
  })

  describe('Package Structure Creation', () => {
    it('should create a basic pnpm package structure', () => {
      packageTester
        .createPnpmProject({
          name: 'test-package',
          version: '1.0.0',
          description: 'A test package',
          type: 'module',
        })

      expect(packageTester.hasFile('package.json')).toBe(true)
      expect(packageTester.hasFile('README.md')).toBe(true)
      expect(packageTester.hasFile('.gitignore')).toBe(true)
      expect(packageTester.hasFile('tsconfig.json')).toBe(true)

      const packageJson = packageTester.getPackageJson()
      expect(packageJson.name).toBe('test-package')
      expect(packageJson.version).toBe('1.0.0')
      expect(packageJson.type).toBe('module')
    })

    it('should create a pnpm workspace project', () => {
      packageTester
        .createPnpmProject({
          name: 'workspace-root',
          workspaces: ['packages/*', 'apps/*'],
        })

      expect(packageTester.hasFile('pnpm-workspace.yaml')).toBe(true)
      
      const workspaceContent = packageTester.getFile('pnpm-workspace.yaml')
      expect(workspaceContent).toContain('packages:')
      expect(workspaceContent).toContain('packages/*')
      expect(workspaceContent).toContain('apps/*')
    })

    it('should add custom dependencies and scripts', () => {
      packageTester
        .createPnpmProject({
          name: 'custom-package',
          dependencies: {
            'lodash': '^4.17.21',
            'axios': '^1.6.0',
          },
          devDependencies: {
            'typescript': '^5.0.0',
            'vitest': '^3.0.0',
          },
          scripts: {
            'build': 'tsc',
            'test': 'vitest',
            'lint': 'eslint .',
          },
        })

      const packageJson = packageTester.getPackageJson()
      expect(packageJson.dependencies).toEqual({
        'lodash': '^4.17.21',
        'axios': '^1.6.0',
      })
      expect(packageJson.devDependencies).toEqual({
        'typescript': '^5.0.0',
        'vitest': '^3.0.0',
      })
      expect(packageJson.scripts).toMatchObject({
        'build': 'tsc',
        'test': 'vitest',
        'lint': 'eslint .',
      })
    })
  })

  describe('File Management', () => {
    it('should add source files', () => {
      packageTester
        .addSourceFile('src/index.ts', 'export function main() { return "Hello, World!" }')
        .addSourceFile('src/utils.ts', 'export function helper() { return "Helper" }')

      expect(packageTester.hasFile('src/index.ts')).toBe(true)
      expect(packageTester.hasFile('src/utils.ts')).toBe(true)
      expect(packageTester.getFile('src/index.ts')).toContain('export function main')
    })

    it('should add test files', () => {
      packageTester
        .addTestFile('tests/index.test.ts', 'import { describe, it, expect } from "vitest"')
        .addTestFile('tests/utils.test.ts', 'import { describe, it, expect } from "vitest"')

      expect(packageTester.hasFile('tests/index.test.ts')).toBe(true)
      expect(packageTester.hasFile('tests/utils.test.ts')).toBe(true)
    })

    it('should add configuration files', () => {
      packageTester
        .addTsConfig({
          compilerOptions: {
            target: 'ES2022',
            module: 'ESNext',
            strict: true,
          },
        })
        .addVitestConfig({
          test: {
            environment: 'node',
            globals: true,
          },
        })
        .addEslintConfig({
          extends: ['@antfu/eslint-config'],
          rules: {
            'no-console': 'warn',
          },
        })

      expect(packageTester.hasFile('tsconfig.json')).toBe(true)
      expect(packageTester.hasFile('vitest.config.ts')).toBe(true)
      expect(packageTester.hasFile('eslint.config.mjs')).toBe(true)

      const tsConfig = packageTester.getFile('tsconfig.json')
      expect(tsConfig).toContain('ES2022')
      expect(tsConfig).toContain('ESNext')
    })
  })

  describe('Package.json Management', () => {
    it('should merge package.json configurations', () => {
      packageTester
        .addPackageJson({
          name: 'original-package',
          version: '1.0.0',
        })
        .addPackageJson({
          name: 'updated-package',
          description: 'Updated description',
          author: 'Test Author',
        })

      const packageJson = packageTester.getPackageJson()
      expect(packageJson.name).toBe('updated-package')
      expect(packageJson.version).toBe('1.0.0')
      expect(packageJson.description).toBe('Updated description')
      expect(packageJson.author).toBe('Test Author')
    })

    it('should handle complex package.json structures', () => {
      packageTester.addPackageJson({
        name: 'complex-package',
        version: '2.0.0',
        type: 'module',
        main: './dist/index.mjs',
        module: './dist/index.mjs',
        types: './dist/index.d.ts',
        files: ['dist', 'src'],
        exports: {
          '.': {
            import: './dist/index.mjs',
            require: './dist/index.cjs',
            types: './dist/index.d.ts',
          },
        },
        scripts: {
          build: 'unbuild',
          test: 'vitest run',
          dev: 'unbuild --dev',
          lint: 'eslint .',
          format: 'prettier --write .',
        },
        keywords: ['typescript', 'library', 'esm'],
        repository: {
          type: 'git',
          url: 'https://github.com/test/complex-package.git',
        },
        bugs: {
          url: 'https://github.com/test/complex-package/issues',
        },
        homepage: 'https://github.com/test/complex-package#readme',
        license: 'MIT',
        author: {
          name: 'Test Author',
          email: 'test@example.com',
          url: 'https://github.com/test',
        },
      })

      const packageJson = packageTester.getPackageJson()
      expect(packageJson.exports).toBeDefined()
      expect(packageJson.repository).toBeDefined()
      expect(packageJson.author).toBeDefined()
      expect(packageJson.keywords).toEqual(['typescript', 'library', 'esm'])
    })
  })

  describe('PNPM Workspace Testing', () => {
    it('should create workspace with multiple packages', () => {
      packageTester
        .addPnpmWorkspace({
          packages: ['packages/*', 'apps/*', 'tools/*'],
        })
        .addPnpmLock({
          lockfileVersion: '6.0',
          packages: {
            'packages/core': {
              version: '1.0.0',
              dependencies: {
                'typescript': '^5.0.0',
              },
            },
          },
        })

      expect(packageTester.hasFile('pnpm-workspace.yaml')).toBe(true)
      expect(packageTester.hasFile('pnpm-lock.yaml')).toBe(true)

      const workspaceContent = packageTester.getFile('pnpm-workspace.yaml')
      expect(workspaceContent).toContain('packages/*')
      expect(workspaceContent).toContain('apps/*')
      expect(workspaceContent).toContain('tools/*')
    })

    it('should handle workspace dependencies', () => {
      packageTester
        .createPnpmProject({
          name: 'workspace-root',
          workspaces: ['packages/*'],
        })
        .addPackageJson({
          name: 'workspace-package',
          version: '1.0.0',
          dependencies: {
            'workspace-package-core': 'workspace:*',
            'external-package': '^1.0.0',
          },
        })

      const packageJson = packageTester.getPackageJson()
      expect(packageJson.dependencies).toHaveProperty('workspace-package-core')
      expect(packageJson.dependencies).toHaveProperty('external-package')
    })
  })

  describe('File System Integration', () => {
    it('should work with file system mocks', async () => {
      packageTester
        .createPnpmProject({
          name: 'fs-test-package',
        })
        .addSourceFile('src/index.ts', 'export const version = "1.0.0"')
        .addTestFile('tests/index.test.ts', 'import { describe, it, expect } from "vitest"')

      const files = packageTester.getAllFiles()
      await createPnpmPackageTestEnvironment(files)

      // 这里可以测试文件系统操作
      expect(Object.keys(files)).toContain('package.json')
      expect(Object.keys(files)).toContain('src/index.ts')
      expect(Object.keys(files)).toContain('tests/index.test.ts')
    })

    it('should handle complex project structures', () => {
      packageTester
        .createPnpmProject({
          name: 'complex-project',
          workspaces: ['packages/*', 'apps/*'],
        })
        .addSourceFile('packages/core/src/index.ts', 'export class Core {}')
        .addSourceFile('packages/utils/src/index.ts', 'export function util() {}')
        .addSourceFile('apps/web/src/main.ts', 'import { Core } from "@repo/core"')
        .addTestFile('packages/core/tests/index.test.ts', 'import { describe, it } from "vitest"')
        .addConfigFile('packages/core/tsconfig.json', '{"compilerOptions": {"strict": true}}')
        .addConfigFile('apps/web/vite.config.ts', 'import { defineConfig } from "vite"')

      const files = packageTester.getAllFiles()
      expect(files['packages/core/src/index.ts']).toContain('export class Core')
      expect(files['packages/utils/src/index.ts']).toContain('export function util')
      expect(files['apps/web/src/main.ts']).toContain('import { Core }')
      expect(files['packages/core/tests/index.test.ts']).toContain('import { describe')
    })
  })

  describe('PNPM Command Mocking', () => {
    it('should mock pnpm commands', () => {
      const { mockExeca, executePnpm } = mockPnpmCommand('pnpm', ['install'])

      // 模拟 pnpm install 命令
      mockExeca.mockResolvedValue({
        exitCode: 0,
        stdout: 'Packages installed successfully',
        stderr: '',
      })

      expect(mockExeca).toBeDefined()
      expect(executePnpm).toBeDefined()
    })

    it('should handle pnpm workspace commands', () => {
      const { mockExeca } = mockPnpmCommand('pnpm', ['-r', 'build'])

      // 模拟 pnpm -r build 命令
      mockExeca.mockResolvedValue({
        exitCode: 0,
        stdout: 'All packages built successfully',
        stderr: '',
      })

      expect(mockExeca).toBeDefined()
    })
  })

  describe('Real-world Package Scenarios', () => {
    it('should create a TypeScript library package', () => {
      packageTester
        .createPnpmProject({
          name: '@test/typescript-lib',
          version: '1.0.0',
          description: 'A TypeScript library',
          type: 'module',
          dependencies: {
            'lodash': '^4.17.21',
          },
          devDependencies: {
            'typescript': '^5.0.0',
            'vitest': '^3.0.0',
            'unbuild': '^3.0.0',
            '@types/lodash': '^4.14.0',
          },
          scripts: {
            'build': 'unbuild',
            'dev': 'unbuild --dev',
            'test': 'vitest run',
            'test:watch': 'vitest watch',
            'lint': 'eslint .',
            'typecheck': 'tsc --noEmit',
          },
        })
        .addSourceFile('src/index.ts', `
export function greet(name: string): string {
  return \`Hello, \${name}!\`
}

export function add(a: number, b: number): number {
  return a + b
}
`)
        .addTestFile('src/index.test.ts', `
import { describe, it, expect } from 'vitest'
import { greet, add } from './index'

describe('greet', () => {
  it('should return greeting message', () => {
    expect(greet('World')).toBe('Hello, World!')
  })
})

describe('add', () => {
  it('should add two numbers', () => {
    expect(add(2, 3)).toBe(5)
  })
})
`)
        .addTsConfig({
          compilerOptions: {
            target: 'ES2022',
            module: 'ESNext',
            moduleResolution: 'Node',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            declaration: true,
            outDir: './dist',
          },
        })
        .addVitestConfig({
          test: {
            environment: 'node',
            globals: true,
            coverage: {
              provider: 'v8',
              reporter: ['text', 'json', 'html'],
            },
          },
        })

      const packageJson = packageTester.getPackageJson()
      expect(packageJson.name).toBe('@test/typescript-lib')
      expect(packageJson.type).toBe('module')
      expect(packageJson.scripts).toHaveProperty('build')
      expect(packageJson.scripts).toHaveProperty('test')
      expect(packageJson.scripts).toHaveProperty('typecheck')

      expect(packageTester.hasFile('src/index.ts')).toBe(true)
      expect(packageTester.hasFile('src/index.test.ts')).toBe(true)
      expect(packageTester.hasFile('tsconfig.json')).toBe(true)
      expect(packageTester.hasFile('vitest.config.ts')).toBe(true)
    })

    it('should create a monorepo with multiple packages', () => {
      // 创建根工作区
      packageTester
        .createPnpmProject({
          name: 'monorepo-root',
          workspaces: ['packages/*', 'apps/*'],
        })
        .addPnpmWorkspace({
          packages: ['packages/*', 'apps/*'],
        })

      // 添加核心包
      packageTester
        .addSourceFile('packages/core/package.json', JSON.stringify({
          name: '@monorepo/core',
          version: '1.0.0',
          main: './dist/index.mjs',
          types: './dist/index.d.ts',
          dependencies: {
            'lodash': '^4.17.21',
          },
        }, null, 2))
        .addSourceFile('packages/core/src/index.ts', 'export const CORE_VERSION = "1.0.0"')

      // 添加工具包
      packageTester
        .addSourceFile('packages/utils/package.json', JSON.stringify({
          name: '@monorepo/utils',
          version: '1.0.0',
          main: './dist/index.mjs',
          types: './dist/index.d.ts',
          dependencies: {
            '@monorepo/core': 'workspace:*',
          },
        }, null, 2))
        .addSourceFile('packages/utils/src/index.ts', 'export { CORE_VERSION } from "@monorepo/core"')

      // 添加应用
      packageTester
        .addSourceFile('apps/web/package.json', JSON.stringify({
          name: '@monorepo/web',
          version: '1.0.0',
          type: 'module',
          dependencies: {
            '@monorepo/core': 'workspace:*',
            '@monorepo/utils': 'workspace:*',
          },
        }, null, 2))
        .addSourceFile('apps/web/src/main.ts', `
import { CORE_VERSION } from '@monorepo/core'
import { CORE_VERSION as UTILS_VERSION } from '@monorepo/utils'

console.log('Core version:', CORE_VERSION)
console.log('Utils version:', UTILS_VERSION)
`)

      expect(packageTester.hasFile('pnpm-workspace.yaml')).toBe(true)
      expect(packageTester.hasFile('packages/core/package.json')).toBe(true)
      expect(packageTester.hasFile('packages/utils/package.json')).toBe(true)
      expect(packageTester.hasFile('apps/web/package.json')).toBe(true)

      const corePackage = JSON.parse(packageTester.getFile('packages/core/package.json')!)
      const utilsPackage = JSON.parse(packageTester.getFile('packages/utils/package.json')!)
      const webPackage = JSON.parse(packageTester.getFile('apps/web/package.json')!)

      expect(corePackage.name).toBe('@monorepo/core')
      expect(utilsPackage.dependencies).toHaveProperty('@monorepo/core')
      expect(webPackage.dependencies).toHaveProperty('@monorepo/core')
      expect(webPackage.dependencies).toHaveProperty('@monorepo/utils')
    })
  })
})
