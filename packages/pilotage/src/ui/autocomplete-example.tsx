import process from 'node:process'
import { Box, render } from 'ink'
import React, { useState } from 'react'
import { Level } from '@/config/level'
import { BoxInput } from './box-input'
import { BoxTitle } from './box-title'

// 示例数据
const COMMANDS = [
  'git add',
  'git commit',
  'git push',
  'git pull',
  'git status',
  'git log',
  'git branch',
  'git checkout',
  'git merge',
  'git clone',
  'npm install',
  'npm run',
  'npm start',
  'npm build',
  'npm test',
  'pnpm install',
  'pnpm run',
  'pnpm start',
  'pnpm build',
  'pnpm test',
  'docker build',
  'docker run',
  'docker ps',
  'docker stop',
  'docker rm',
  'ls',
  'cd',
  'mkdir',
  'rm',
  'cp',
  'mv',
  'cat',
  'grep',
  'find',
  'chmod',
  'chown',
]

const _FILE_NAMES = [
  'package.json',
  'tsconfig.json',
  'README.md',
  'index.ts',
  'index.js',
  'app.tsx',
  'app.jsx',
  'main.ts',
  'main.js',
  'config.ts',
  'config.js',
  'utils.ts',
  'utils.js',
  'types.ts',
  'types.js',
  'components',
  'src',
  'dist',
  'node_modules',
  'public',
  'assets',
  'styles',
  'tests',
  'docs',
]

// 主应用组件
function AutocompleteApp(): React.JSX.Element {
  const [_result, setResult] = useState('')

  const handleCommandSubmit = (command: string): void => {
    // 移除 process.stdout.write('\x1B[u')，这会导致光标位置错乱
    setResult(`执行命令: ${command}`)
  }

  return (
    <Box flexDirection="column" padding={1} gap={1}>
      <BoxTitle
        title="命令输入"
        content="输入命令，支持自动补全"
        level={Level.INFO}
      />
      <BoxTitle
        title="命令输入"
        content="输入命令，支持自动补全"
        level={Level.INFO}
      />
      <BoxInput
        onSubmit={handleCommandSubmit}
        placeholder="输入命令 (如: git, npm, docker...)"
        suggestions={COMMANDS}
        maxSuggestions={8}
      />
    </Box>
  )
}

// 启动函数
export function startAutocompleteDemo(): void {
  try {
    // 方案:先输出 banner,然后让 Ink 使用 alternate screen
    // 这样 banner 会保留在主屏幕,Ink 在独立屏幕渲染,退出后回到主屏幕
    process.stdout.write('\n')

    render(<AutocompleteApp />, {
      stdout: process.stdout,
      stdin: process.stdin,
      exitOnCtrlC: true,
      patchConsole: false, // 不修补 console,避免干扰之前的输出
      // 不使用 alternate screen,直接在当前位置渲染
    })
  }
  catch (error) {
    console.error('Error starting autocomplete demo:', error)
    process.exit(1)
  }
}// 简单的使用示例
export function quickAutocompleteInput(
  placeholder: string = 'Enter input',
  suggestions: string[] = [],
  maxSuggestions: number = 5,
): Promise<string> {
  return new Promise((resolve) => {
    const component = (
      <BoxInput
        onSubmit={(value) => {
          resolve(value)
          setTimeout(() => process.exit(0), 100)
        }}
        placeholder={placeholder}
        suggestions={suggestions}
        maxSuggestions={maxSuggestions}
      />
    )
    process.stdout.write('\n')
    render(component, {
      stdout: process.stdout,
      stdin: process.stdin,
      exitOnCtrlC: true,
      patchConsole: false,
    })
  })
}
