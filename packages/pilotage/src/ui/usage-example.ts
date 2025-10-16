// 自动补全输入框使用示例

import { quickAutocompleteInput } from './autocomplete-example'

// 示例1: 命令补全
export async function commandExample(): Promise<void> {
  console.log('=== 命令补全示例 ===')
  
  const commands = [
    'git add',
    'git commit',
    'git push',
    'git pull',
    'npm install',
    'npm run',
    'npm start',
    'docker build',
    'docker run'
  ]
  
  const command = await quickAutocompleteInput(
    '输入命令 (如: git, npm, docker...)',
    commands,
    5
  )
  
  console.log(`您选择的命令: ${command}`)
}

// 示例2: 文件补全
export async function fileExample(): Promise<void> {
  console.log('=== 文件补全示例 ===')
  
  const files = [
    'package.json',
    'tsconfig.json',
    'README.md',
    'index.ts',
    'app.tsx',
    'main.js',
    'config.ts',
    'utils.js'
  ]
  
  const filename = await quickAutocompleteInput(
    '输入文件名 (如: package.json, index.ts...)',
    files,
    6
  )
  
  console.log(`您选择的文件: ${filename}`)
}

// 示例3: 自定义补全
export async function customExample(): Promise<void> {
  console.log('=== 自定义补全示例 ===')
  
  const options = [
    '选项1: 创建新项目',
    '选项2: 运行现有项目',
    '选项3: 构建项目',
    '选项4: 测试项目',
    '选项5: 部署项目',
    '选项6: 清理项目'
  ]
  
  const choice = await quickAutocompleteInput(
    '选择操作 (如: 创建, 运行, 构建...)',
    options,
    4
  )
  
  console.log(`您选择的操作: ${choice}`)
}

// 主函数
export async function runAutocompleteExamples(): Promise<void> {
  console.log('开始运行自动补全示例...\n')
  
  await commandExample()
  console.log('\n' + '='.repeat(50) + '\n')
  
  await fileExample()
  console.log('\n' + '='.repeat(50) + '\n')
  
  await customExample()
  
  console.log('\n所有自动补全示例运行完成!')
}
