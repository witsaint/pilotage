/**
 * DAG 流程引擎
 * 基于有向无环图的现代化流程编排系统
 */

import type {
  IContextManager,
  IEventEmitter,
  PipelineConfig,
  PipelineState,
  TaskId,
  TaskResult,
} from './types'
import {
  type IGraphEdge,
  type IGraphNode,
  NodeGraph,
  NodeStatus,
  TaskNode,
} from './graph-node'

import { PipelineEventType, TaskStatus } from './types'

// ==================== 事件系统 ====================

/** 事件监听器 */
export type EventListener<T = unknown> = (data: T) => void | Promise<void>

/** 流程事件 */
export interface PipelineEvent<T = unknown> {
  type: PipelineEventType
  timestamp: Date
  data: T
}

/** 事件发射器实现 */
export class EventEmitter implements IEventEmitter {
  private listeners: Map<PipelineEventType, Set<EventListener>> = new Map()

  /**
   * 监听事件
   */
  on<T = unknown>(eventType: PipelineEventType, listener: EventListener<T>): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(listener as EventListener)
  }

  /**
   * 移除监听器
   */
  off<T = unknown>(eventType: PipelineEventType, listener: EventListener<T>): void {
    const eventListeners = this.listeners.get(eventType)
    if (eventListeners) {
      eventListeners.delete(listener as EventListener)
    }
  }

  /**
   * 发射事件
   */
  async emit<T = unknown>(event: PipelineEvent<T>): Promise<void> {
    const eventListeners = this.listeners.get(event.type)
    if (!eventListeners)
      return

    const promises = Array.from(eventListeners).map(listener =>
      Promise.resolve(listener(event.data)))

    await Promise.all(promises)
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners(eventType?: PipelineEventType): void {
    if (eventType) {
      this.listeners.delete(eventType)
    }
    else {
      this.listeners.clear()
    }
  }

  /**
   * 获取监听器数量
   */
  listenerCount(eventType: PipelineEventType): number {
    const eventListeners = this.listeners.get(eventType)
    return eventListeners ? eventListeners.size : 0
  }

  /**
   * 一次性监听事件
   */
  once<T = unknown>(eventType: PipelineEventType, listener: EventListener<T>): void {
    const onceListener: EventListener<T> = (data) => {
      this.off(eventType, onceListener)
      return listener(data)
    }
    this.on(eventType, onceListener)
  }
}

// ==================== DAG 流程状态 ====================

/** DAG 流程状态 */
export interface DAGPipelineState extends PipelineState {
  /** 节点执行状态映射 */
  nodeStates: Map<string, NodeStatus>
  /** 节点执行结果 */
  nodeResults: Map<string, Record<string, unknown>>
}

// ==================== DAG 流程接口 ====================

export interface IDAGPipeline {
  /** 流程配置 */
  readonly config: PipelineConfig
  /** 节点图 */
  readonly nodeGraph: NodeGraph
  /** 上下文管理器 */
  readonly context: IContextManager
  /** 事件发射器 */
  readonly events: IEventEmitter
  /** 当前状态 */
  readonly state: DAGPipelineState

  // ==================== 基础执行控制 ====================

  /** 执行整个流程 */
  execute: () => Promise<DAGPipelineState>
  /** 暂停流程 */
  pause: () => Promise<void>
  /** 恢复流程 */
  resume: () => Promise<void>
  /** 停止流程 */
  stop: () => Promise<void>

  // ==================== 分步执行控制 ====================

  /** 执行下一个可执行的节点 */
  next: () => Promise<{ nodeId: string, result: Record<string, unknown> } | null>
  /** 执行指定数量的节点步骤 */
  step: (count?: number) => Promise<Array<{ nodeId: string, result: Record<string, unknown> }>>
  /** 执行直到指定节点完成 */
  executeUntil: (nodeId: string) => Promise<Record<string, unknown>>
  /** 执行直到满足条件 */
  executeWhile: (condition: (state: DAGPipelineState) => boolean) => Promise<DAGPipelineState>

  // ==================== 节点控制 ====================

  /** 获取下一个将要执行的节点 */
  getNextNode: () => IGraphNode | null
  /** 获取当前可执行的节点列表 */
  getExecutableNodes: () => IGraphNode[]
  /** 跳过指定节点 */
  skipNode: (nodeId: string, reason?: string) => Promise<void>
  /** 重新执行指定节点 */
  retryNode: (nodeId: string) => Promise<Record<string, unknown>>

  // ==================== 状态查询 ====================

  /** 获取执行进度 */
  getProgress: () => number
  /** 等待特定节点完成 */
  waitForNode: (nodeId: string) => Promise<Record<string, unknown>>
  /** 等待所有节点完成 */
  waitForCompletion: () => Promise<DAGPipelineState>
}

// ==================== DAG 流程实现 ====================

export class DAGPipeline implements IDAGPipeline {
  readonly config: PipelineConfig
  readonly nodeGraph: NodeGraph
  readonly context: IContextManager
  readonly events: IEventEmitter

  private _state: DAGPipelineState
  private runningNodes: Map<string, Promise<Record<string, unknown>>> = new Map()
  private pausePromise?: Promise<void>
  private pauseResolve?: () => void
  private shouldStop = false

  constructor(
    config: PipelineConfig,
    nodeGraph: NodeGraph,
    context: IContextManager,
    events?: IEventEmitter,
  ) {
    this.config = config
    this.nodeGraph = nodeGraph
    this.context = context
    this.events = events || new EventEmitter()

    this._state = {
      id: config.id,
      status: TaskStatus.PENDING,
      startTime: undefined,
      endTime: undefined,
      duration: 0,
      results: new Map(),
      nodeStates: new Map(),
      nodeResults: new Map(),
    }
  }

  get state(): DAGPipelineState {
    return { ...this._state }
  }

  // ==================== 基础执行控制 ====================

  async execute(): Promise<DAGPipelineState> {
    if (this._state.status === TaskStatus.RUNNING) {
      throw new Error('Pipeline is already running')
    }

    this._state.status = TaskStatus.RUNNING
    this._state.startTime = new Date()
    this.shouldStop = false

    await this.emitEvent(PipelineEventType.PIPELINE_START, {
      pipelineId: this.config.id,
    })

    try {
      // 执行节点图
      await this.executeNodeGraph()

      this._state.status = TaskStatus.SUCCESS
      this._state.endTime = new Date()
      this._state.duration = this._state.endTime.getTime() - this._state.startTime!.getTime()

      await this.emitEvent(PipelineEventType.PIPELINE_END, {
        pipelineId: this.config.id,
        finalState: this._state,
      })
    }
    catch (error) {
      this._state.status = TaskStatus.FAILED
      this._state.endTime = new Date()
      this._state.duration = this._state.endTime.getTime() - this._state.startTime!.getTime()

      await this.emitEvent(PipelineEventType.PIPELINE_END, {
        pipelineId: this.config.id,
        error: error as Error,
      })

      throw error
    }

    return this.state
  }

  async pause(): Promise<void> {
    if (this._state.status !== TaskStatus.RUNNING) {
      return
    }

    this.pausePromise = new Promise((resolve) => {
      this.pauseResolve = resolve
    })

    await this.emitEvent(PipelineEventType.PIPELINE_PAUSE, {
      pipelineId: this.config.id,
    })
  }

  async resume(): Promise<void> {
    if (this.pauseResolve) {
      this.pauseResolve()
      this.pausePromise = undefined
      this.pauseResolve = undefined

      await this.emitEvent(PipelineEventType.PIPELINE_RESUME, {
        pipelineId: this.config.id,
      })
    }
  }

  async stop(): Promise<void> {
    this.shouldStop = true
    if (this.pauseResolve) {
      this.pauseResolve()
    }
  }

  // ==================== 分步执行控制 ====================

  async next(): Promise<{ nodeId: string, result: Record<string, unknown> } | null> {
    const nextNode = this.getNextNode()
    if (!nextNode) {
      return null
    }

    try {
      const result = await this.executeNode(nextNode)
      return { nodeId: nextNode.id,
result }
    }
    catch (error) {
      throw new Error(`Failed to execute next node ${nextNode.id}: ${error}`)
    }
  }

  async step(count = 1): Promise<Array<{ nodeId: string, result: Record<string, unknown> }>> {
    const results: Array<{ nodeId: string, result: Record<string, unknown> }> = []

    for (let i = 0; i < count; i++) {
      const nextResult = await this.next()
      if (!nextResult) {
        break // 没有更多可执行节点
      }
      results.push(nextResult)
    }

    return results
  }

  async executeUntil(nodeId: string): Promise<Record<string, unknown>> {
    while (true) {
      // 检查节点是否已完成
      const nodeResult = this._state.nodeResults.get(nodeId)
      if (nodeResult) {
        return nodeResult
      }

      // 执行下一个节点
      const nextResult = await this.next()
      if (!nextResult) {
        throw new Error(`Cannot reach node ${nodeId} - no more executable nodes`)
      }

      // 如果刚执行的就是目标节点，返回结果
      if (nextResult.nodeId === nodeId) {
        return nextResult.result
      }
    }
  }

  async executeWhile(condition: (state: DAGPipelineState) => boolean): Promise<DAGPipelineState> {
    while (condition(this._state)) {
      const nextResult = await this.next()
      if (!nextResult) {
        break // 没有更多可执行节点
      }
    }
    return this._state
  }

  // ==================== 节点控制 ====================

  getNextNode(): IGraphNode | null {
    const executableNodes = this.getExecutableNodes()
    return executableNodes.length > 0 ? executableNodes[0] : null
  }

  getExecutableNodes(): IGraphNode[] {
    return this.nodeGraph.getAllNodes().filter((node) => {
      // 过滤掉已完成、失败或跳过的节点
      const nodeState = this._state.nodeStates.get(node.id)
      if (nodeState && nodeState !== NodeStatus.PENDING) {
        return false
      }

      // 检查依赖是否满足
      return this.areNodeDependenciesSatisfied(node)
    })
  }

  async skipNode(nodeId: string, reason = 'Manually skipped'): Promise<void> {
    const node = this.nodeGraph.getNode(nodeId)
    if (!node) {
      throw new Error(`Node ${nodeId} not found`)
    }

    // 设置节点状态为跳过
    this._state.nodeStates.set(nodeId, NodeStatus.SKIPPED)
    this._state.nodeResults.set(nodeId, { skipped: true,
reason })

    // 触发节点跳过事件
    await this.emitEvent(PipelineEventType.TASK_FAILED, {
      taskId: nodeId,
      result: { skipped: true,
reason },
    })
  }

  async retryNode(nodeId: string): Promise<Record<string, unknown>> {
    const node = this.nodeGraph.getNode(nodeId)
    if (!node) {
      throw new Error(`Node ${nodeId} not found`)
    }

    // 清除之前的状态和结果
    this._state.nodeStates.delete(nodeId)
    this._state.nodeResults.delete(nodeId)

    // 重新执行节点
    return await this.executeNode(node)
  }

  // ==================== 状态查询 ====================

  getProgress(): number {
    const totalNodes = this.nodeGraph.getAllNodes().length
    const completedNodes = Array.from(this._state.nodeStates.values()).filter(
      status => status === NodeStatus.SUCCESS || status === NodeStatus.FAILED || status === NodeStatus.SKIPPED,
    ).length

    return totalNodes > 0 ? completedNodes / totalNodes : 0
  }

  async waitForNode(nodeId: string): Promise<Record<string, unknown>> {
    while (!this._state.nodeResults.has(nodeId)) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return this._state.nodeResults.get(nodeId)!
  }

  async waitForCompletion(): Promise<DAGPipelineState> {
    while (this._state.status === TaskStatus.RUNNING) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return this.state
  }

  // ==================== 私有方法 ====================

  private async executeNodeGraph(): Promise<void> {
    const executionOrder = this.nodeGraph.topologicalSort()
    const nodeOutputs: Map<string, Record<string, unknown>> = new Map()

    for (const nodeId of executionOrder) {
      if (this.shouldStop) {
        break
      }

      // 检查暂停
      if (this.pausePromise) {
        await this.pausePromise
      }

      const node = this.nodeGraph.getNode(nodeId)
      if (!node)
        continue

      // 检查节点是否已被跳过
      if (this._state.nodeStates.get(nodeId) === NodeStatus.SKIPPED) {
        continue
      }

      // 收集输入数据
      const inputs = this.collectNodeInputs(nodeId, nodeOutputs)

      // 执行节点
      try {
        const outputs = await this.executeNode(node, inputs)
        nodeOutputs.set(nodeId, outputs)
      }
      catch (error) {
        console.error(`Node ${nodeId} execution failed:`, error)
        throw error
      }
    }
  }

  private async executeNode(node: IGraphNode, inputs?: Record<string, unknown>): Promise<Record<string, unknown>> {
    const nodeId = node.id

    // 设置节点状态为运行中
    this._state.nodeStates.set(nodeId, NodeStatus.RUNNING)

    await this.emitEvent(PipelineEventType.TASK_START, {
      pipelineId: this.config.id,
      taskId: nodeId,
    })

    try {
      // 执行节点
      const result = await node.execute(this.context, inputs || {})

      // 设置节点状态为成功
      this._state.nodeStates.set(nodeId, NodeStatus.SUCCESS)
      this._state.nodeResults.set(nodeId, result)

      await this.emitEvent(PipelineEventType.TASK_END, {
        pipelineId: this.config.id,
        taskId: nodeId,
        result,
      })

      return result
    }
    catch (error) {
      // 设置节点状态为失败
      this._state.nodeStates.set(nodeId, NodeStatus.FAILED)

      await this.emitEvent(PipelineEventType.TASK_FAILED, {
        pipelineId: this.config.id,
        taskId: nodeId,
        error: error as Error,
      })

      throw error
    }
  }

  private collectNodeInputs(nodeId: string, nodeOutputs: Map<string, Record<string, unknown>>): Record<string, unknown> {
    const inputs: Record<string, unknown> = {}

    // 查找所有指向该节点的连线
    for (const edge of this.nodeGraph.getAllEdges()) {
      if (edge.targetNodeId === nodeId) {
        const sourceOutputs = nodeOutputs.get(edge.sourceNodeId)
        if (sourceOutputs) {
          const sourceValue = sourceOutputs[edge.sourcePort || 'output']
          inputs[edge.targetPort || 'input'] = sourceValue
        }
      }
    }

    return inputs
  }

  private areNodeDependenciesSatisfied(node: IGraphNode): boolean {
    // 检查所有输入连线的源节点是否已完成
    for (const edge of this.nodeGraph.getAllEdges()) {
      if (edge.targetNodeId === node.id) {
        const sourceNodeState = this._state.nodeStates.get(edge.sourceNodeId)
        if (sourceNodeState !== NodeStatus.SUCCESS) {
          return false
        }
      }
    }
    return true
  }

  private async emitEvent<T = unknown>(
    type: PipelineEventType,
    data?: T & { pipelineId?: string },
  ): Promise<void> {
    const event = {
      type,
      timestamp: new Date(),
      data: {
        pipelineId: this.config.id,
        ...data,
      },
    }

    await this.events.emit(event)
  }
}

// ==================== 便捷函数 ====================

/**
 * 创建 DAG 流程实例
 */
export function createDAGPipeline(
  config: PipelineConfig,
  nodeGraph: NodeGraph,
  context: IContextManager,
  events?: IEventEmitter,
): DAGPipeline {
  return new DAGPipeline(config, nodeGraph, context, events)
}

/**
 * 从 TaskGraph 迁移到 NodeGraph
 */
export function migrateTaskGraphToNodeGraph(taskGraph: any): NodeGraph {
  const nodeGraph = new NodeGraph()

  // 将 TaskNode 转换为 TaskNode (IGraphNode)
  for (const task of taskGraph.getAllTasks()) {
    const taskNode = new TaskNode(task.config)
    nodeGraph.addNode(taskNode)
  }

  // 添加依赖连线
  for (const task of taskGraph.getAllTasks()) {
    const dependencies = taskGraph.getDependencies(task.config.id)
    for (const depId of dependencies) {
      nodeGraph.addEdge({
        id: `${depId}_to_${task.config.id}`,
        type: 'dependency' as any,
        sourceNodeId: depId,
        sourcePort: 'output',
        targetNodeId: task.config.id,
        targetPort: 'input',
      })
    }
  }

  return nodeGraph
}
