import process from 'node:process'
import { render, useStderr } from 'ink'
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

const FILE_NAMES = [
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
  const [mode, setMode] = useState<'command' | 'file' | 'result'>('command')
  const [result, setResult] = useState('')
  const { write } = useStderr()

  const handleCommandSubmit = (command: string): void => {
    process.stdout.write('\x1B[u')
    setResult(`执行命令: ${command}`)
    write(`\n 执行命令: ${command} \n`)
    setMode('result')
  }

  const handleFileSubmit = (filename: string): void => {
    setResult(`选择文件: ${filename}`)
    setMode('result')
  }

  const handleRestart = (): void => {
    setResult('')
    setMode('command')
  }

  const renderContent = (): React.JSX.Element => {
    switch (mode) {
      case 'command':
        return (
          <>
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
          </>
        )
      case 'file':
        return (
          <>
            <BoxTitle
              title="文件选择"
              content="选择文件，支持自动补全"
              level={Level.INFO}
            />
            <BoxInput
              onSubmit={handleFileSubmit}
              placeholder="输入文件名 (如: package.json, index.ts...)"
              suggestions={FILE_NAMES}
              maxSuggestions={6}
            />
          </>
        )
      case 'result':
        return (
          <>
            <BoxTitle
              title="执行结果"
              content={result}
              level={Level.SUCCESS}
            />
            <BoxInput
              onSubmit={handleRestart}
              placeholder="按回车重新开始"
            />
          </>
        )
      default:
        return <></>
    }
  }

  return <>{renderContent()}</>
}

// 启动函数
export function startAutocompleteDemo(): void {
  try {
    render(<AutocompleteApp />)
  }
  catch (error) {
    console.error('Error starting autocomplete demo:', error)
    process.exit(1)
  }
}

// 简单的使用示例
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
    render(component)
  })
}
