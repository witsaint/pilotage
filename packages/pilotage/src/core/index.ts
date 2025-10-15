/**
 * DAG 流程编排系统
 * 现代化的有向无环图流程引擎
 */

// ==================== 核心类型 ====================

// 上下文管理
export {
  ContextManager,
} from './context'

// ==================== 核心实现 ====================

// 类型安全的 DAG 构建器
export {
  type BranchConfig,
  ConditionalBuilder,
  createDAGBuilder,
  dag,
  DAGBuilder,
  DAGConditionalBuilder,
  DAGParallelBuilder,
  type MergeFunction,
  ParallelBuilder,
} from './dag-builder'

export {
  // DAG 示例
  basicLinearFlowExample,
  complexBranchMergeExample,
  conditionalFlowExample,
  dagAdvantagesExample,
  directNodeGraphExample,
  errorHandlingExample,
  nodeGraphAdvancedExample,
  nodeGraphConditionalExample,
  nodeGraphExecutionExample,
  parallelProcessingExample,
  runDAGExamples,
  runNodeGraphExamples,
} from './dag-examples'

// DAG 流程系统
export {
  createDAGPipeline,
  DAGPipeline,
  EventEmitter,
  migrateTaskGraphToNodeGraph,
} from './dag-pipeline'

// 工厂模式
export {
  createFactory,
  createFactoryBuilder,
  FactoryManager,
  FactoryPresets,
  getDefaultFactory,
  PipelineFactory,
} from './factory'

// 图节点系统
export {
  ConcurrentGraphNode,
  ConditionNode,
  EdgeType,
  GroupNode,
  type IGraphEdge,
  type IGraphNode,
  MergeNode,
  NodeGraph,
  NodeType,
  TaskNode,
} from './graph-node'

// 状态管理
export {
  FileStateManager,
  MemoryStateManager,
} from './state'

// ==================== 枚举类型 ====================

export type {
  // 基础类型
  ContextData,
  DAGPipelineState,
  IContextManager,
  IDAGBuilder,
  IDAGPipeline,
  IEventEmitter,
  PipelineConfig,
  PipelineEvent,
  PipelineState,
  RetryConfig,
  TaskConfig,
  TaskExecutor,
  TaskId,
} from './types'

export {
  ConcurrencyStrategy,
  FailureStrategy,
  NodeStatus,
  PipelineEventType,
  TaskStatus,
} from './types'

// ==================== 便捷函数 ====================

// 导入所需的类型和函数
import type { IDAGPipeline, TaskConfig } from './types'
import { ContextManager } from './context'
import { createDAGBuilder, dag, DAGBuilder } from './dag-builder'
import { DAGPipeline, EventEmitter } from './dag-pipeline'
import { NodeGraph } from './graph-node'
import { NodeStatus } from './types'

/**
 * 创建简单的 DAG 流程
 */
export function createSimpleDAG(
  id: string,
  tasks: TaskConfig[],
  options?: {
    name?: string
    maxConcurrency?: number
    failureStrategy?: 'fail_fast' | 'continue' | 'wait_all'
  },
): IDAGPipeline {
  const builder = createDAGBuilder().id(id)

  if (options?.name) {
    builder.name(options.name)
  }

  // 添加任务并自动链接
  let lastTaskId: string | undefined
  for (const task of tasks) {
    builder.addTask(task)

    if (lastTaskId) {
      builder.connect(lastTaskId, task.id)
    }
    lastTaskId = task.id
  }

  return builder.build()
}

/**
 * 创建并行 DAG 流程
 */
export function createParallelDAG(
  id: string,
  parallelTasks: TaskConfig[],
  options?: {
    name?: string
    mergeFunction?: (inputs: Record<string, unknown>) => unknown
  },
): IDAGPipeline {
  const builder = createDAGBuilder()
    .id(id)
    .name(options?.name || id)

  // 添加所有并行任务
  for (const task of parallelTasks) {
    builder.addTask(task)
  }

  // 添加合并节点
  const mergeId = `${id}_merge`
  builder.merge(mergeId, options?.mergeFunction)

  // 连接所有任务到合并节点
  for (const task of parallelTasks) {
    builder.connect(task.id, mergeId)
  }

  return builder.build()
}

/**
 * 创建条件分支 DAG 流程
 */
export function createConditionalDAG(
  id: string,
  condition: (data: unknown) => boolean | Promise<boolean>,
  trueTask: TaskConfig,
  falseTask: TaskConfig,
  options?: {
    name?: string
    mergeFunction?: (inputs: Record<string, unknown>) => unknown
  },
): IDAGPipeline {
  const builder = createDAGBuilder()
    .id(id)
    .name(options?.name || id)

  // 添加条件节点
  const conditionId = `${id}_condition`
  const conditionBuilder = builder.condition(conditionId, condition)

  // 添加分支任务
  conditionBuilder
    .then(trueTask.id, trueTask.executor, trueTask.name)
    .else(falseTask.id, falseTask.executor, falseTask.name)
    .endIf()

  // 添加合并节点
  const mergeId = `${id}_merge`
  builder.merge(mergeId, options?.mergeFunction)

  // 连接分支到合并节点
  builder
    .connect(trueTask.id, mergeId)
    .connect(falseTask.id, mergeId)

  return builder.build()
}

/**
 * 获取执行统计信息
 */
export function getExecutionStats(pipeline: IDAGPipeline): {
  totalNodes: number
  completedNodes: number
  failedNodes: number
  skippedNodes: number
  progress: number
  duration?: number
} {
  const state = pipeline.state
  const totalNodes = pipeline.nodeGraph.getAllNodes().length

  let completedNodes = 0
  let failedNodes = 0
  let skippedNodes = 0

  for (const status of state.nodeStates.values()) {
    switch (status) {
      case NodeStatus.SUCCESS:
        completedNodes++
        break
      case NodeStatus.FAILED:
        failedNodes++
        break
      case NodeStatus.SKIPPED:
        skippedNodes++
        break
    }
  }

  return {
    totalNodes,
    completedNodes,
    failedNodes,
    skippedNodes,
    progress: pipeline.getProgress(),
    duration: state.endTime && state.startTime
      ? state.endTime.getTime() - state.startTime.getTime()
      : undefined,
  }
}

/**
 * 格式化持续时间
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }
  else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`
  }
  else {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }
}

/**
 * 创建执行报告
 */
export function createExecutionReport(pipeline: IDAGPipeline): {
  summary: string
  details: {
    id: string
    name: string
    status: string
    duration?: number
    error?: string
  }[]
  stats: ReturnType<typeof getExecutionStats>
} {
  const stats = getExecutionStats(pipeline)
  const state = pipeline.state

  const details = pipeline.nodeGraph.getAllNodes().map(node => ({
    id: node.id,
    name: node.name,
    status: state.nodeStates.get(node.id) || 'pending',
    duration: undefined, // 可以从结果中提取
    error: undefined, // 可以从结果中提取
  }))

  const summary = `DAG 执行完成: ${stats.completedNodes}/${stats.totalNodes} 节点成功 (${Math.round(stats.progress * 100)}%)`

  return {
    summary,
    details,
    stats,
  }
}

// ==================== 导出示例 ====================

// ==================== 默认导出 ====================

export default {
  // 核心类
  DAGPipeline,
  DAGBuilder,
  NodeGraph,
  ContextManager,
  EventEmitter,

  // 构建器
  createDAGBuilder,
  dag,

  // 便捷函数
  createSimpleDAG,
  createParallelDAG,
  createConditionalDAG,

  // 工具
  getExecutionStats,
  formatDuration,
  createExecutionReport,
}
