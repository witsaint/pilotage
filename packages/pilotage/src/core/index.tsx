import type { ListItem } from '@/ui/list'
import process from 'node:process'
import { render } from 'ink'
import { RootApp } from '@/app/index'
import { addMessage } from '@/app/store'
import { hasInitialized } from '@/config/root-config'
import { MessageType } from '@/types/message'

/**
 * 初始化应用
 */
export function initialize(): void {
  const isInited = hasInitialized()
  const listItems: ListItem[] = []
  if (isInited) {
    listItems.push({
      title: '已经初始化',
      desc: '已经初始化',
    })
  }
  else {
    listItems.push({
      title: '未初始化',
      desc: '未初始化',
    })
  }

  addMessage(listItems, MessageType.List, {
    props: {
      style: 'none',
    },
  })
}

/**
 * 启动应用
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
