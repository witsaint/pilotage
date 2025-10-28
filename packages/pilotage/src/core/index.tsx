import type { ListItem } from '@/ui/list'
import process from 'node:process'
import { render } from 'ink'
import { RootApp } from '@/app/index'
import { addMessage } from '@/app/store'
import { MessageType } from '@/types/message'

export function initialize(): void {
  // 初始化
  const listItems: ListItem[] = [
    {
      title: 'Item 1',
      desc: 'Description 1',
    },
  ]

  addMessage(listItems, MessageType.List, {
    props: {
      style: 'none',
    },
  })
}

/**
 *
 */
export function bootstrap(): void {
  initialize()
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
