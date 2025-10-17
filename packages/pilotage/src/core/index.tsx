import process from 'node:process'
import { render } from 'ink'
import { RootApp } from '@/app/index'

export function initialize(): void {
  // 初始化
}

/**
 *
 */
export function bootstrap(): void {
  try {
    render(<RootApp />, {
      // stdout: process.stdout,
      // stdin: process.stdin,
      exitOnCtrlC: true,
      patchConsole: false,
      isScreenReaderEnabled: false,
    })
  }
  catch (error) {
    console.error('Error starting RootApp:', error)
    process.exit(1)
  }
}
