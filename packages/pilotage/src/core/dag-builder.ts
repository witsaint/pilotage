/**
 * DAG 构建器
 * 提供现代化的 API 来构建 DAG 流程，支持完整的类型推导和类型安全
 */

import type {
  IContextManager,
  PipelineConfig,
  TaskConfig,
  TaskExecutor,
} from './types'

import { ContextManager } from './context'
import {
  DAGPipeline,
  EventEmitter,
  type IDAGPipeline,
} from './dag-pipeline'
import {
  ConditionNode,
  MergeNode,
  NodeGraph,
  TaskNode,
} from './graph-node'

// ==================== 类型推导辅助类型 ====================

/**
 * 并行分支配置
 */
export interface BranchConfig<TInput = unknown, TOutput = unknown> {
  id: string
  executor: TaskExecutor<TInput, TOutput>
  name?: string
}

/**
 * 合并函数类型
 */
export type MergeFunction<TInputs extends Record<string, unknown>, TOutput = unknown> = (
  inputs: TInputs,
) => TOutput | Promise<TOutput>

// ==================== 类型安全的 DAG 构建器 ====================

/**
 * 类型安全的 DAG 构建器
 * TLastOutput 表示上一个节点的输出类型
 */
export class DAGBuilder<TLastOutput = void> {
  private config: Partial<PipelineConfig> = {}
  private nodeGraph: NodeGraph = new NodeGraph()
  private context: IContextManager = new ContextManager()
  private events = new EventEmitter()
  private lastNodeId?: string

  // ==================== 基础配置 ====================

  /**
   * 设置流程 ID
   */
  id(id: string): DAGBuilder<TLastOutput> {
    this.config.id = id
    return this
  }

  /**
   * 设置流程名称
   */
  name(name: string): DAGBuilder<TLastOutput> {
    this.config.name = name
    return this
  }

  /**
   * 设置流程描述
   */
  description(description: string): DAGBuilder<TLastOutput> {
    this.config.description = description
    return this
  }

  // ==================== 节点添加（类型安全） ====================

  /**
   * 添加任务节点（第一个任务，不依赖输入）
   */
  task<TOutput>(
    id: string,
    executor: TaskExecutor<void, TOutput>,
    name?: string,
  ): DAGBuilder<TOutput> {
    const taskConfig: TaskConfig<void, TOutput> = {
      id,
      name: name || id,
      executor,
      dependencies: [],
      tags: [],
      metadata: {},
    }

    const taskNode = new TaskNode(taskConfig as TaskConfig)
    this.nodeGraph.addNode(taskNode)
    this.lastNodeId = id

    return this as unknown as DAGBuilder<TOutput>
  }

  /**
   * 链式连接下一个任务（类型安全的 then）
   * 自动推导输入类型为上一个任务的输出类型
   */
  then<TOutput>(
    id: string,
    executor: TaskExecutor<TLastOutput, TOutput>,
    name?: string,
  ): DAGBuilder<TOutput> {
    const taskConfig: TaskConfig<TLastOutput, TOutput> = {
      id,
      name: name || id,
      executor,
      dependencies: [],
      tags: [],
      metadata: {},
    }

    const taskNode = new TaskNode(taskConfig as TaskConfig)
    this.nodeGraph.addNode(taskNode)

    // 如果有上一个节点，自动连接
    if (this.lastNodeId && this.lastNodeId !== id) {
      this.nodeGraph.addEdge({
        id: `${this.lastNodeId}_to_${id}`,
        type: 'dependency' as any,
        sourceNodeId: this.lastNodeId,
        sourcePort: 'output',
        targetNodeId: id,
        targetPort: 'input',
      })
    }

    this.lastNodeId = id

    return this as unknown as DAGBuilder<TOutput>
  }

  /**
   * 并行分支（类型安全）
   * 所有分支接收相同的输入类型
   */
  parallel<TBranch1Output = unknown, TBranch2Output = unknown>(
    branches: [
      BranchConfig<TLastOutput, TBranch1Output>,
      BranchConfig<TLastOutput, TBranch2Output>,
    ],
  ): ParallelBuilder<TLastOutput, [TBranch1Output, TBranch2Output]>

  parallel<TBranch1Output = unknown, TBranch2Output = unknown, TBranch3Output = unknown>(
    branches: [
      BranchConfig<TLastOutput, TBranch1Output>,
      BranchConfig<TLastOutput, TBranch2Output>,
      BranchConfig<TLastOutput, TBranch3Output>,
    ],
  ): ParallelBuilder<TLastOutput, [TBranch1Output, TBranch2Output, TBranch3Output]>

  parallel<TBranchOutputs extends unknown[]>(
    branches: Array<BranchConfig<TLastOutput, any>>,
  ): ParallelBuilder<TLastOutput, TBranchOutputs> {
    const branchIds: string[] = []

    // 创建所有分支节点
    for (const branch of branches) {
      const taskConfig: TaskConfig<TLastOutput, any> = {
        id: branch.id,
        name: branch.name || branch.id,
        executor: branch.executor,
        dependencies: [],
        tags: ['parallel'],
        metadata: {},
      }

      const taskNode = new TaskNode(taskConfig as TaskConfig)
      this.nodeGraph.addNode(taskNode)
      branchIds.push(branch.id)

      // 连接上一个节点到当前分支
      if (this.lastNodeId) {
        this.nodeGraph.addEdge({
          id: `${this.lastNodeId}_to_${branch.id}`,
          type: 'dependency' as any,
          sourceNodeId: this.lastNodeId,
          sourcePort: 'output',
          targetNodeId: branch.id,
          targetPort: 'input',
        })
      }
    }

    return new ParallelBuilder<TLastOutput, TBranchOutputs>(
      this as unknown as DAGBuilder<any>,
      branchIds,
      this.nodeGraph,
    )
  }

  /**
   * 条件分支（类型安全）
   */
  condition<TTrueOutput = TLastOutput, TFalseOutput = TLastOutput>(
    id: string,
    condition: (data: TLastOutput) => boolean | Promise<boolean>,
    name?: string,
  ): ConditionalBuilder<TLastOutput, TTrueOutput, TFalseOutput> {
    const conditionNode = new ConditionNode(id, name || id, condition as any)
    this.nodeGraph.addNode(conditionNode)

    // 连接上一个节点
    if (this.lastNodeId) {
      this.nodeGraph.addEdge({
        id: `${this.lastNodeId}_to_${id}`,
        type: 'dependency' as any,
        sourceNodeId: this.lastNodeId,
        sourcePort: 'output',
        targetNodeId: id,
        targetPort: 'input',
      })
    }

    return new ConditionalBuilder<TLastOutput, TTrueOutput, TFalseOutput>(
      this as unknown as DAGBuilder<any>,
      conditionNode,
      this.nodeGraph,
    )
  }

  // ==================== 向后兼容方法 ====================

  /**
   * 添加任务配置（向后兼容）
   */
  addTask(config: TaskConfig): DAGBuilder<void> {
    const taskNode = new TaskNode(config)
    this.nodeGraph.addNode(taskNode)
    this.lastNodeId = config.id
    return this as unknown as DAGBuilder<void>
  }

  /**
   * 添加合并节点（向后兼容）
   */
  merge(
    id: string,
    mergeFunction?: (inputs: Record<string, unknown>) => unknown,
    name?: string,
  ): DAGBuilder<void> {
    const mergeNode = new MergeNode(id, name || id, mergeFunction)
    this.nodeGraph.addNode(mergeNode)
    this.lastNodeId = id
    return this as unknown as DAGBuilder<void>
  }

  /**
   * 连接两个节点（向后兼容）
   */
  connect(fromId: string, toId: string, fromPort = 'output', toPort = 'input'): DAGBuilder<TLastOutput> {
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

  /**
   * 批量连接（向后兼容）
   */
  connectMany(fromIds: string[], toId: string): DAGBuilder<TLastOutput> {
    for (const fromId of fromIds) {
      this.connect(fromId, toId)
    }
    return this
  }

  /**
   * 扇出连接（向后兼容）
   */
  fanOut(fromId: string, toIds: string[]): DAGBuilder<TLastOutput> {
    for (const toId of toIds) {
      this.connect(fromId, toId)
    }
    return this
  }

  // ==================== 构建 ====================

  /**
   * 构建 DAG 流程
   */
  build(): IDAGPipeline {
    const config: PipelineConfig = {
      id: this.config.id || `dag_${Date.now()}`,
      name: this.config.name || 'DAG Pipeline',
      description: this.config.description,
      maxConcurrency: this.config.maxConcurrency,
      timeout: this.config.timeout,
    }

    return new DAGPipeline(config, this.nodeGraph, this.context)
  }
}

// ==================== 并行构建器 ====================

/**
 * 类型安全的并行构建器
 */
export class ParallelBuilder<_TInput, TOutputs extends unknown[]> {
  constructor(
    private builder: DAGBuilder<any>,
    private branchIds: string[],
    private nodeGraph: NodeGraph,
  ) {}

  /**
   * 合并并行分支的结果
   * 自动推导合并函数的输入类型
   */
  merge<TMergeOutput>(
    id: string,
    mergeFunction: (inputs: { [K in keyof TOutputs]: TOutputs[K] }) => TMergeOutput | Promise<TMergeOutput>,
    name?: string,
  ): DAGBuilder<TMergeOutput> {
    // 包装合并函数以匹配接口
    const wrappedMerge = (inputs: Record<string, unknown>): TMergeOutput | Promise<TMergeOutput> => {
      // 将 Record 转换为数组形式
      const inputArray = this.branchIds.map((_id, index) => {
        const key = `input${index + 1}`
        return inputs[key]
      }) as { [K in keyof TOutputs]: TOutputs[K] }

      return mergeFunction(inputArray)
    }

    const mergeNode = new MergeNode(id, name || id, wrappedMerge)
    this.nodeGraph.addNode(mergeNode)

    // 连接所有分支到合并节点
    for (let i = 0; i < this.branchIds.length; i++) {
      this.nodeGraph.addEdge({
        id: `${this.branchIds[i]}_to_${id}`,
        type: 'dependency' as any,
        sourceNodeId: this.branchIds[i],
        sourcePort: 'output',
        targetNodeId: id,
        targetPort: `input${i + 1}`,
      })
    }

    const newBuilder = this.builder as unknown as DAGBuilder<TMergeOutput>
    // @ts-expect-error - 访问私有属性
    newBuilder.lastNodeId = id

    return newBuilder
  }
}

// ==================== 条件构建器 ====================

/**
 * 类型安全的条件构建器
 */
export class ConditionalBuilder<TInput, TTrueOutput, TFalseOutput> {
  constructor(
    private builder: DAGBuilder<any>,
    private conditionNode: ConditionNode,
    private nodeGraph: NodeGraph,
  ) {}

  /**
   * 条件为真时执行的分支
   */
  onTrue<TOutput = TTrueOutput>(
    id: string,
    executor: TaskExecutor<TInput, TOutput>,
    name?: string,
  ): ConditionalBuilder<TInput, TOutput, TFalseOutput> {
    const taskConfig: TaskConfig<TInput, TOutput> = {
      id,
      name: name || id,
      executor,
      dependencies: [],
      tags: ['conditional', 'true-branch'],
      metadata: {},
    }

    const taskNode = new TaskNode(taskConfig as TaskConfig)
    this.nodeGraph.addNode(taskNode)

    // 连接条件节点到真分支
    this.nodeGraph.addEdge({
      id: `${this.conditionNode.id}_true_to_${id}`,
      type: 'conditional' as any,
      sourceNodeId: this.conditionNode.id,
      sourcePort: 'true',
      targetNodeId: id,
      targetPort: 'input',
    })

    return new ConditionalBuilder<TInput, TOutput, TFalseOutput>(
      this.builder,
      this.conditionNode,
      this.nodeGraph,
    )
  }

  /**
   * 条件为假时执行的分支
   */
  onFalse<TOutput = TFalseOutput>(
    id: string,
    executor: TaskExecutor<TInput, TOutput>,
    name?: string,
  ): ConditionalBuilder<TInput, TTrueOutput, TOutput> {
    const taskConfig: TaskConfig<TInput, TOutput> = {
      id,
      name: name || id,
      executor,
      dependencies: [],
      tags: ['conditional', 'false-branch'],
      metadata: {},
    }

    const taskNode = new TaskNode(taskConfig as TaskConfig)
    this.nodeGraph.addNode(taskNode)

    // 连接条件节点到假分支
    this.nodeGraph.addEdge({
      id: `${this.conditionNode.id}_false_to_${id}`,
      type: 'conditional' as any,
      sourceNodeId: this.conditionNode.id,
      sourcePort: 'false',
      targetNodeId: id,
      targetPort: 'input',
    })

    return new ConditionalBuilder<TInput, TTrueOutput, TOutput>(
      this.builder,
      this.conditionNode,
      this.nodeGraph,
    )
  }

  /**
   * 结束条件分支，返回主构建器
   */
  endCondition(): DAGBuilder<TTrueOutput | TFalseOutput> {
    return this.builder as unknown as DAGBuilder<TTrueOutput | TFalseOutput>
  }

  // ==================== 向后兼容方法 ====================

  /**
   * 条件为真的分支（向后兼容别名）
   */
  then<TOutput = TTrueOutput>(
    id: string,
    executor: TaskExecutor<TInput, TOutput>,
    name?: string,
  ): ConditionalBuilder<TInput, TOutput, TFalseOutput> {
    return this.onTrue(id, executor, name)
  }

  /**
   * 条件为假的分支（向后兼容别名）
   */
  else<TOutput = TFalseOutput>(
    id: string,
    executor: TaskExecutor<TInput, TOutput>,
    name?: string,
  ): ConditionalBuilder<TInput, TTrueOutput, TOutput> {
    return this.onFalse(id, executor, name)
  }

  /**
   * 结束条件（向后兼容别名）
   */
  endIf(): DAGBuilder<TTrueOutput | TFalseOutput> {
    return this.endCondition()
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建类型安全的 DAG 构建器
 */
export function dag(): DAGBuilder<void> {
  return new DAGBuilder<void>()
}

/**
 * 创建 DAG 构建器（别名）
 */
export function createDAGBuilder(): DAGBuilder<void> {
  return new DAGBuilder<void>()
}

// ==================== 向后兼容的导出 ====================

// 保持向后兼容的类别名
export { ParallelBuilder as DAGParallelBuilder }
export { ConditionalBuilder as DAGConditionalBuilder }
