/**
 * DAG 构建器
 * 提供现代化的 API 来构建 DAG 流程，支持复杂的图结构
 */

import type {
  IContextManager,
  PipelineConfig,
  TaskConfig,
  TaskExecutor,
} from './types'

import {
  type IGraphNode,
  NodeGraph,
  TaskNode,
  GroupNode,
  ConditionNode,
  MergeNode,
} from './graph-node'

import {
  type IDAGPipeline,
  DAGPipeline,
} from './dag-pipeline'

import { ContextManager } from './context'
import { EventEmitter } from './dag-pipeline'

// ==================== DAG 构建器接口 ====================

export interface IDAGBuilder {
  // ==================== 基础配置 ====================
  
  /** 设置流程ID */
  id: (id: string) => IDAGBuilder
  /** 设置流程名称 */
  name: (name: string) => IDAGBuilder
  /** 设置流程描述 */
  description: (description: string) => IDAGBuilder

  // ==================== 节点添加 ====================
  
  /** 添加任务节点 */
  task: (id: string, executor: TaskExecutor, name?: string) => IDAGBuilder
  /** 添加任务节点（完整配置） */
  addTask: (config: TaskConfig) => IDAGBuilder
  /** 添加组节点 */
  group: (id: string, name?: string) => GroupBuilder
  /** 添加条件节点 */
  condition: (id: string, condition: (data: unknown) => boolean | Promise<boolean>, name?: string) => ConditionalBuilder
  /** 添加合并节点 */
  merge: (id: string, mergeFunction?: (inputs: Record<string, unknown>) => unknown, name?: string) => IDAGBuilder

  // ==================== 连接控制 ====================
  
  /** 连接两个节点 */
  connect: (fromId: string, toId: string, fromPort?: string, toPort?: string) => IDAGBuilder
  /** 批量连接 */
  connectMany: (fromIds: string[], toId: string) => IDAGBuilder
  /** 扇出连接 */
  fanOut: (fromId: string, toIds: string[]) => IDAGBuilder

  // ==================== 流畅 API ====================
  
  /** 链式连接（then 语义） */
  then: (id: string, executor: TaskExecutor, name?: string) => IDAGBuilder
  /** 并行分支 */
  parallel: (branches: Array<{ id: string, executor: TaskExecutor, name?: string }>) => ParallelBuilder

  // ==================== 构建 ====================
  
  /** 构建统一流程 */
  build: () => IDAGPipeline
}

// ==================== 统一构建器实现 ====================

export class DAGBuilder implements IDAGBuilder {
  private config: Partial<PipelineConfig> = {}
  private nodeGraph: NodeGraph = new NodeGraph()
  private context: IContextManager = new ContextManager()
  private events = new EventEmitter()
  private lastNodeId?: string

  // ==================== 基础配置 ====================

  id(id: string): IDAGBuilder {
    this.config.id = id
    return this
  }

  name(name: string): IDAGBuilder {
    this.config.name = name
    return this
  }

  description(description: string): IDAGBuilder {
    this.config.description = description
    return this
  }

  // ==================== 节点添加 ====================

  task(id: string, executor: TaskExecutor, name?: string): IDAGBuilder {
    const taskConfig: TaskConfig = {
      id,
      name: name || id,
      executor,
      dependencies: [],
      tags: [],
      metadata: {},
    }

    const taskNode = new TaskNode(taskConfig)
    this.nodeGraph.addNode(taskNode)
    this.lastNodeId = id

    return this
  }

  addTask(config: TaskConfig): IDAGBuilder {
    const taskNode = new TaskNode(config)
    this.nodeGraph.addNode(taskNode)
    this.lastNodeId = config.id

    return this
  }

  group(id: string, name?: string): GroupBuilder {
    const groupNode = new GroupNode(id, name || id)
    this.nodeGraph.addNode(groupNode)
    return new GroupBuilder(this, groupNode)
  }

  condition(
    id: string,
    condition: (data: unknown) => boolean | Promise<boolean>,
    name?: string,
  ): ConditionalBuilder {
    const conditionNode = new ConditionNode(id, name || id, condition)
    this.nodeGraph.addNode(conditionNode)
    return new ConditionalBuilder(this, conditionNode)
  }

  merge(
    id: string,
    mergeFunction?: (inputs: Record<string, unknown>) => unknown,
    name?: string,
  ): IDAGBuilder {
    const mergeNode = new MergeNode(id, name || id, mergeFunction)
    this.nodeGraph.addNode(mergeNode)
    this.lastNodeId = id

    return this
  }

  // ==================== 连接控制 ====================

  connect(fromId: string, toId: string, fromPort = 'output', toPort = 'input'): IDAGBuilder {
    this.nodeGraph.addEdge({
      id: `${fromId}_to_${toId}`,
      type: 'dependency' as any,
      sourceNodeId: fromId,
      sourcePort: fromPort,
      targetNodeId: toId,
      targetPort: toPort,
    })

    return this
  }

  connectMany(fromIds: string[], toId: string): IDAGBuilder {
    for (const fromId of fromIds) {
      this.connect(fromId, toId)
    }
    return this
  }

  fanOut(fromId: string, toIds: string[]): IDAGBuilder {
    for (const toId of toIds) {
      this.connect(fromId, toId)
    }
    return this
  }

  // ==================== 流畅 API ====================

  then(id: string, executor: TaskExecutor, name?: string): IDAGBuilder {
    this.task(id, executor, name)

    // 如果有上一个节点，自动连接
    if (this.lastNodeId && this.lastNodeId !== id) {
      this.connect(this.lastNodeId, id)
    }

    return this
  }

  parallel(branches: Array<{ id: string, executor: TaskExecutor, name?: string }>): ParallelBuilder {
    const branchIds: string[] = []

    // 添加所有分支节点
    for (const branch of branches) {
      this.task(branch.id, branch.executor, branch.name)
      branchIds.push(branch.id)

      // 连接到当前节点
      if (this.lastNodeId && this.lastNodeId !== branch.id) {
        this.connect(this.lastNodeId, branch.id)
      }
    }

    return new ParallelBuilder(this, branchIds)
  }

  // ==================== 构建 ====================

  build(): IDAGPipeline {
    // 验证配置
    if (!this.config.id) {
      throw new Error('Pipeline ID is required')
    }

    // 构建完整配置
    const fullConfig: PipelineConfig = {
      id: this.config.id,
      name: this.config.name || this.config.id,
      description: this.config.description,
      maxConcurrency: this.config.maxConcurrency || 10,
      timeout: this.config.timeout,
      autoRetry: this.config.autoRetry || false,
      persistState: this.config.persistState || false,
    }

    // 验证图
    const validation = this.nodeGraph.validate()
    if (!validation.isValid) {
      throw new Error(`Graph validation failed: ${validation.errors.join(', ')}`)
    }

    return new DAGPipeline(fullConfig, this.nodeGraph, this.context, this.events)
  }

  // ==================== 内部方法 ====================

  /** 获取节点图（供子构建器使用） */
  getNodeGraph(): NodeGraph {
    return this.nodeGraph
  }

  /** 设置最后一个节点ID（供子构建器使用） */
  setLastNodeId(nodeId: string): void {
    this.lastNodeId = nodeId
  }
}

// ==================== 子构建器 ====================

export class GroupBuilder {
  constructor(
    private parentBuilder: DAGBuilder,
    private groupNode: GroupNode,
  ) {}

  addTask(id: string, executor: TaskExecutor, name?: string): GroupBuilder {
    const taskConfig: TaskConfig = {
      id,
      name: name || id,
      executor,
      dependencies: [],
      tags: [],
      metadata: {},
    }

    const taskNode = new TaskNode(taskConfig)
    this.groupNode.addChild(taskNode)

    return this
  }

  connect(fromId: string, toId: string): GroupBuilder {
    // 在组内连接节点
    this.groupNode.addInternalEdge({
      id: `${fromId}_to_${toId}`,
      type: 'dependency' as any,
      sourceNodeId: fromId,
      sourcePort: 'output',
      targetNodeId: toId,
      targetPort: 'input',
    })

    return this
  }

  endGroup(): DAGBuilder {
    this.parentBuilder.setLastNodeId(this.groupNode.id)
    return this.parentBuilder
  }
}

export class ConditionalBuilder {
  constructor(
    private parentBuilder: DAGBuilder,
    private conditionNode: ConditionNode,
  ) {}

  then(id: string, executor: TaskExecutor, name?: string): ConditionalBuilder {
    this.parentBuilder.task(id, executor, name)
    this.parentBuilder.connect(this.conditionNode.id, id, 'true', 'input')
    return this
  }

  else(id: string, executor: TaskExecutor, name?: string): ConditionalBuilder {
    this.parentBuilder.task(id, executor, name)
    this.parentBuilder.connect(this.conditionNode.id, id, 'false', 'input')
    return this
  }

  endIf(): DAGBuilder {
    this.parentBuilder.setLastNodeId(this.conditionNode.id)
    return this.parentBuilder
  }
}

export class ParallelBuilder {
  constructor(
    private parentBuilder: DAGBuilder,
    private branchIds: string[],
  ) {}

  merge(
    mergeId: string,
    mergeFunction?: (inputs: Record<string, unknown>) => unknown,
    name?: string,
  ): DAGBuilder {
    this.parentBuilder.merge(mergeId, mergeFunction, name)
    this.parentBuilder.connectMany(this.branchIds, mergeId)
    return this.parentBuilder
  }

  endParallel(): DAGBuilder {
    // 清除最后节点ID，因为有多个分支结束
    this.parentBuilder.setLastNodeId('')
    return this.parentBuilder
  }
}

// ==================== 便捷函数 ====================

/**
 * 创建 DAG 构建器
 */
export function createDAGBuilder(): DAGBuilder {
  return new DAGBuilder()
}

/**
 * 快速创建 DAG 流程的 DSL
 */
export function dag(): DAGBuilder {
  return new DAGBuilder()
}

// ==================== 使用示例 ====================

/**
 * 示例：使用 DAG 构建器创建复杂流程
 */
export function exampleDAGFlow(): IDAGPipeline {
  return dag()
    .id('unified-example')
    .name('统一流程示例')
    .task('start', async () => 'Hello')
    .then('processA', async input => `${input} from A`)
    .then('processB', async input => `${input} from B`)
    .condition('check', async input => (input as string).includes('A'))
    .then('trueTask', async input => `True: ${input}`)
    .else('falseTask', async input => `False: ${input}`)
    .endIf()
    .merge('final', inputs => Object.values(inputs).join(' | '))
    .build()
}

/**
 * 示例：复杂的分支合并场景
 */
export function exampleComplexDAGFlow(): IDAGPipeline {
  return dag()
    .id('complex-flow')
    .name('复杂分支流程')
    .task('init', async () => 'initialized')
    .parallel([
      { id: 'branchA', executor: async () => 'A result' },
      { id: 'branchB', executor: async () => 'B result' },
      { id: 'branchC', executor: async () => 'C result' },
    ])
    .merge('combine', inputs => ({
      results: Object.values(inputs),
      count: Object.keys(inputs).length,
    }))
    .then('finalize', async input => `Final: ${JSON.stringify(input)}`)
    .build()
}
