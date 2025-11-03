import type { ListItem } from '@/ui/list'
import process from 'node:process'
import { render } from 'ink'
import { RootApp } from '@/app/index'
import { registry } from '@/commands'
import { hasInitialized } from '@/config/root-config'
import { Status } from '@/config/status'
import { setStatus } from '@/events/status'
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
      title: 'Pilotage is not Starteds yet',
      desc: 'Please configure the pilotage first by /config',
    })
    setStatus(Status.NOT_STARTED)
  }

  registry.execute('addMessage', {
    message: listItems,
    type: MessageType.List,
    config: {
      props: {
        style: 'none',
      },
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
