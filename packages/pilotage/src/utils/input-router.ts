// src/utils/input-router.ts
import type { Status } from '@/config/status'
import type { Action } from '@/types/action'
import { getStatus } from '@/app/store/'
import { registry } from '@/commands'
import { setStatus } from '@/events/status'

interface StateInputHandler {
  handler: Action
  nextState?: Status // 处理完成后切换到哪个状态
}

class InputRouter {
  private stateHandlers = new Map<Status, StateInputHandler>()
  private pendingData: Map<string, any> = new Map()

  // 注册状态处理器
  register(status: Status, handler: StateInputHandler): void {
    this.stateHandlers.set(status, handler)
  }

  // 路由输入到对应的处理器
  async route(input: string): Promise<void> {
    const currentStatus = getStatus()
    const handlerConfig = this.stateHandlers.get(currentStatus)

    if (handlerConfig) {
      await handlerConfig.handler.run(input)

      // 如果有下一个状态，切换到该状态
      if (handlerConfig.nextState) {
        setStatus(handlerConfig.nextState)
      }
    }
    else {
      // 默认行为：尝试作为命令执行
      await this.handleDefaultCommand(input)
    }
  }

  // 默认命令处理
  private async handleDefaultCommand(input: string): Promise<void> {
    // 解析命令，例如 "command arg1 arg2" 或 "config host token"
    const parts = input.trim().split(/\s+/)
    const command = parts[0]
    const args = parts.slice(1)

    // 尝试执行命令
    try {
      const resolved = registry.resolve(command)
      if (resolved) {
        // 这里需要根据命令定义解析参数
        // 可以集成yargs或其他解析器
        await registry.execute(resolved, args as any)
      }
    }
    catch (error: unknown) {
      if (error instanceof Error) {
        registry.execute('addErrMsg', { message: error.message })
      }
      else {
        registry.execute('addErrMsg', { message: `Unknown error: ${String(error)}` })
      }
    }
  }

  // 获取暂存的数据（用于多步骤交互）
  getPendingData(key: string): any {
    return this.pendingData.get(key)
  }

  setPendingData(key: string, value: any): void {
    this.pendingData.set(key, value)
  }

  clearPendingData(key?: string): void {
    if (key) {
      this.pendingData.delete(key)
    }
    else {
      this.pendingData.clear()
    }
  }
}

export const inputRouter = new InputRouter()
