import type { ListItem } from '@/ui/list'
import process from 'node:process'
import { render } from 'ink'
import { RootApp } from '@/app/index'
import { addMessage } from '@/app/store'
import { hasInitialized } from '@/config/root-config'
import { MessageType } from '@/types/message'
import { setStatus } from '@/events/status'
import { Status } from '@/config/status'

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
      title: 'Pilotage is not initialized yet',
      desc: 'Pilotage is not initialized yet, please set your channel by /use <channel> the default channel is Gitlab',
    })
    setStatus(Status.NOT_STARTED)
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
