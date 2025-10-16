/**
 * 任务图系统核心类型定义
 * 提供完整的类型安全保障，避免使用 any 类型
 */

// ==================== 基础类型 ====================

/** 任务唯一标识符 */
export type TaskId = string

/** 任务状态枚举 */
export enum TaskStatus {
  /** 等待执行 */
  PENDING = 'pending',
  /** 正在执行 */
  RUNNING = 'running',
  /** 执行成功 */
  SUCCESS = 'success',
  /** 执行失败 */
  FAILED = 'failed',
  /** 已取消 */
  CANCELLED = 'cancelled',
  /** 已跳过 */
  SKIPPED = 'skipped',
}

/** 并发策略枚举 */
export enum ConcurrencyStrategy {
  /** 任一分支成功即成功 */
  ANY_SUCCESS = 'any_success',
  /** 所有分支成功才成功 */
  ALL_SUCCESS = 'all_success',
  /** 指定分支成功即成功 */
  SPECIFIED_SUCCESS = 'specified_success',
}

/** 任务执行结果 */
export interface TaskResult<T = unknown> {
  /** 任务ID */
  taskId: TaskId
  /** 执行状态 */
  status: TaskStatus
  /** 返回数据 */
  data?: T
  /** 错误信息 */
  error?: Error
  /** 开始时间 */
  startTime: Date
  /** 结束时间 */
  endTime?: Date
  /** 执行耗时(ms) */
  duration?: number
  /** 重试次数 */
  retryCount: number
}

// ==================== 上下文和数据管理 ====================

/** 上下文数据类型 */
export interface ContextData {
  [key: string]: unknown
}

/** 上下文管理器接口 */
export interface IContextManager<T extends ContextData = ContextData> {
  /** 获取上下文数据 */
  get: <K extends keyof T>(key: K) => T[K] | undefined
  /** 设置上下文数据 */
  set: <K extends string | number>(key: K, value: unknown) => void
  /** 批量设置 */
  merge: (data: Record<string, unknown>) => void
  /** 清空上下文 */
  clear: () => void
  /** 获取所有数据 */
  getAll: () => T
  /** 创建子上下文 */
  createChild: () => IContextManager<T>
}

/** 状态持久化接口 */
export interface IStateManager {
  /** 保存状态 */
  save: (key: string, data: unknown) => Promise<void>
  /** 加载状态 */
  load: <T>(key: string) => Promise<T | undefined>
  /** 删除状态 */
  remove: (key: string) => Promise<void>
  /** 清空所有状态 */
  clear: () => Promise<void>
}

// ==================== 任务定义 ====================

/** 任务执行函数类型 */
export type TaskExecutor<TInput = unknown, TOutput = unknown> = (
  input: TInput,
  context: IContextManager,
) => Promise<TOutput> | TOutput

/** 任务配置 */
export interface TaskConfig<TInput = unknown, TOutput = unknown> {
  /** 任务ID */
  id: TaskId
  /** 任务名称 */
  name: string
  /** 任务描述 */
  description?: string
  /** 执行函数 */
  executor: TaskExecutor<TInput, TOutput>
  /** 依赖的任务ID列表 */
  dependencies?: TaskId[]
  /** 重试配置 */
  retry?: RetryConfig
  /** 超时时间(ms) */
  timeout?: number
  /** 是否可以并行执行 */
  parallel?: boolean
  /** 任务标签 */
  tags?: string[]
  /** 自定义元数据 */
  metadata?: Record<string, unknown>
}

/** 重试配置 */
export interface RetryConfig {
  /** 最大重试次数 */
  maxAttempts: number
  /** 重试延迟(ms) */
  delay?: number
  /** 指数退避倍数 */
  backoffMultiplier?: number
  /** 最大延迟时间(ms) */
  maxDelay?: number
  /** 重试条件判断函数 */
  shouldRetry?: (error: Error, attempt: number) => boolean
}

// ==================== 并发分支 ====================

/** 并发分支配置 */
export interface ConcurrentBranch {
  /** 分支ID */
  id: string
  /** 分支名称 */
  name: string
  /** 分支中的任务ID列表 */
  taskIds: TaskId[]
  /** 是否为关键分支（用于 SPECIFIED_SUCCESS 策略） */
  critical?: boolean
  /** 分支权重（用于优先级排序） */
  weight?: number
}

/** 并发节点配置 */
export interface ConcurrentNode {
  /** 节点ID */
  id: string
  /** 节点名称 */
  name: string
  /** 并发策略 */
  strategy: ConcurrencyStrategy
  /** 并发分支列表 */
  branches: ConcurrentBranch[]
  /** 关键分支ID列表（用于 SPECIFIED_SUCCESS 策略） */
  criticalBranches?: string[]
  /** 最大并发数 */
  maxConcurrency?: number
}

// ==================== 任务图 ====================

/** 任务节点 */
export interface TaskNode<TInput = unknown, TOutput = unknown> {
  /** 任务配置 */
  config: TaskConfig<TInput, TOutput>
  /** 执行结果 */
  result?: TaskResult<TOutput>
  /** 子任务列表 */
  children?: TaskNode[]
  /** 父任务引用 */
  parent?: TaskNode
}

/** 任务图接口 */
export interface ITaskGraph {
  /** 添加任务 */
  addTask: <TInput = unknown, TOutput = unknown>(
    config: TaskConfig<TInput, TOutput>
  ) => void
  /** 添加依赖关系 */
  addDependency: (taskId: TaskId, dependencyId: TaskId) => void
  /** 移除任务 */
  removeTask: (taskId: TaskId) => void
  /** 获取任务 */
  getTask: (taskId: TaskId) => TaskNode | undefined
  /** 获取所有任务 */
  getAllTasks: () => TaskNode[]
  /** 获取可执行任务列表 */
  getExecutableTasks: () => TaskNode[]
  /** 检查是否存在循环依赖 */
  hasCyclicDependency: () => boolean
  /** 拓扑排序 */
  topologicalSort: () => TaskId[]
  /** 添加并发节点 */
  addConcurrentNode: (node: ConcurrentNode) => void
  /** 获取所有并发节点 */
  getAllConcurrentNodes: () => ConcurrentNode[]
  /** 获取任务的依赖 */
  getDependencies: (taskId: TaskId) => TaskId[]
  /** 获取任务的依赖者 */
  getDependents: (taskId: TaskId) => TaskId[]
  /** 验证图的完整性 */
  validate: () => { isValid: boolean, errors: string[] }
}

// ==================== 流程编排 ====================

/** 流程执行事件类型 */
export enum PipelineEventType {
  /** 流程开始 */
  PIPELINE_START = 'pipeline_start',
  /** 流程结束 */
  PIPELINE_END = 'pipeline_end',
  /** 任务开始 */
  TASK_START = 'task_start',
  /** 任务结束 */
  TASK_END = 'task_end',
  /** 任务失败 */
  TASK_FAILED = 'task_failed',
  /** 任务重试 */
  TASK_RETRY = 'task_retry',
  /** 并发节点开始 */
  CONCURRENT_START = 'concurrent_start',
  /** 并发节点结束 */
  CONCURRENT_END = 'concurrent_end',
  /** 流程暂停 */
  PIPELINE_PAUSE = 'pipeline_pause',
  /** 流程恢复 */
  PIPELINE_RESUME = 'pipeline_resume',
}

/** 流程事件数据 */
export interface PipelineEvent<T = unknown> {
  /** 事件类型 */
  type: PipelineEventType
  /** 事件时间戳 */
  timestamp: Date
  /** 流程ID */
  pipelineId: string
  /** 任务ID（如果是任务相关事件） */
  taskId?: TaskId
  /** 事件数据 */
  data?: T
  /** 错误信息（如果是错误事件） */
  error?: Error
}

/** 事件监听器 */
export type EventListener<T = unknown> = (event: PipelineEvent<T>) => void | Promise<void>

/** 事件发射器接口 */
export interface IEventEmitter {
  /** 监听事件 */
  on: <T = unknown>(eventType: PipelineEventType, listener: EventListener<T>) => void
  /** 取消监听 */
  off: <T = unknown>(eventType: PipelineEventType, listener: EventListener<T>) => void
  /** 发射事件 */
  emit: <T = unknown>(event: PipelineEvent<T>) => Promise<void>
  /** 一次性监听 */
  once: <T = unknown>(eventType: PipelineEventType, listener: EventListener<T>) => void
}

/** 流程配置 */
export interface PipelineConfig {
  /** 流程ID */
  id: string
  /** 流程名称 */
  name: string
  /** 流程描述 */
  description?: string
  /** 最大并发任务数 */
  maxConcurrency?: number
  /** 全局超时时间(ms) */
  timeout?: number
  /** 失败策略 */
  failureStrategy?: FailureStrategy
  /** 是否自动重试 */
  autoRetry?: boolean
  /** 是否持久化状态 */
  persistState?: boolean
}

/** 失败策略枚举 */
export enum FailureStrategy {
  /** 立即停止 */
  FAIL_FAST = 'fail_fast',
  /** 继续执行其他任务 */
  CONTINUE = 'continue',
  /** 等待所有任务完成 */
  WAIT_ALL = 'wait_all',
}

/** 流程执行状态 */
export interface PipelineState {
  /** 流程ID */
  id: string
  /** 当前状态 */
  status: TaskStatus
  /** 开始时间 */
  startTime?: Date
  /** 结束时间 */
  endTime?: Date
  /** 已完成任务数 */
  completedTasks: number
  /** 总任务数 */
  totalTasks: number
  /** 失败任务数 */
  failedTasks: number
  /** 当前执行的任务ID列表 */
  runningTasks: TaskId[]
  /** 执行结果 */
  results: Map<TaskId, TaskResult>
}

/** 流程编排器接口 */
export interface IPipeline {
  /** 流程配置 */
  readonly config: PipelineConfig
  /** 任务图 */
  readonly taskGraph: ITaskGraph
  /** 上下文管理器 */
  readonly context: IContextManager
  /** 事件发射器 */
  readonly events: IEventEmitter
  /** 当前状态 */
  readonly state: PipelineState

  /** 执行流程 */
  execute: () => Promise<PipelineState>
  /** 暂停流程 */
  pause: () => Promise<void>
  /** 恢复流程 */
  resume: () => Promise<void>
  /** 停止流程 */
  stop: () => Promise<void>
  /** 获取执行进度 */
  getProgress: () => number
  /** 等待特定任务完成 */
  waitForTask: (taskId: TaskId) => Promise<TaskResult>
  /** 等待所有任务完成 */
  waitForCompletion: () => Promise<PipelineState>

  // ==================== 分步执行控制 ====================

  /** 执行下一个可执行的任务 */
  next: () => Promise<{ taskId: TaskId, result: TaskResult } | null>
  /** 执行指定数量的任务步骤 */
  step: (count?: number) => Promise<TaskResult[]>
  /** 执行直到指定任务完成 */
  executeUntil: (taskId: TaskId) => Promise<TaskResult>
  /** 执行直到满足条件 */
  executeWhile: (condition: (state: PipelineState) => boolean) => Promise<PipelineState>
  /** 获取下一个将要执行的任务 */
  getNextTask: () => TaskNode | null
  /** 获取当前可执行的任务列表 */
  getExecutableTasks: () => TaskNode[]
  /** 跳过指定任务 */
  skipTask: (taskId: TaskId, reason?: string) => Promise<void>
  /** 重新执行指定任务 */
  retryTask: (taskId: TaskId) => Promise<TaskResult>
}

// ==================== DAG 系统类型 ====================

/** DAG 流程状态 */
export interface DAGPipelineState extends PipelineState {
  /** 节点执行状态映射 */
  nodeStates: Map<string, NodeStatus>
  /** 节点执行结果 */
  nodeResults: Map<string, Record<string, unknown>>
}

/** DAG 流程接口 */
export interface IDAGPipeline {
  /** 流程配置 */
  readonly config: PipelineConfig
  /** 节点图 */
  readonly nodeGraph: any // NodeGraph 类型
  /** 上下文管理器 */
  readonly context: IContextManager
  /** 事件发射器 */
  readonly events: IEventEmitter
  /** 当前状态 */
  readonly state: DAGPipelineState

  // 基础执行控制
  execute: () => Promise<DAGPipelineState>
  pause: () => Promise<void>
  resume: () => Promise<void>
  stop: () => Promise<void>

  // 分步执行控制
  next: () => Promise<{ nodeId: string, result: Record<string, unknown> } | null>
  step: (count?: number) => Promise<Array<{ nodeId: string, result: Record<string, unknown> }>>
  executeUntil: (nodeId: string) => Promise<Record<string, unknown>>
  executeWhile: (condition: (state: DAGPipelineState) => boolean) => Promise<DAGPipelineState>

  // 节点控制
  getNextNode: () => any | null // IGraphNode
  getExecutableNodes: () => any[] // IGraphNode[]
  skipNode: (nodeId: string, reason?: string) => Promise<void>
  retryNode: (nodeId: string) => Promise<Record<string, unknown>>

  // 状态查询
  getProgress: () => number
  waitForNode: (nodeId: string) => Promise<Record<string, unknown>>
  waitForCompletion: () => Promise<DAGPipelineState>
}

/** DAG 构建器接口 */
export interface IDAGBuilder {
  // 基础配置
  id: (id: string) => IDAGBuilder
  name: (name: string) => IDAGBuilder
  description: (description: string) => IDAGBuilder

  // 节点添加
  task: (id: string, executor: TaskExecutor, name?: string) => IDAGBuilder
  addTask: (config: TaskConfig) => IDAGBuilder

  // 连接控制
  connect: (fromId: string, toId: string, fromPort?: string, toPort?: string) => IDAGBuilder
  connectMany: (fromIds: string[], toId: string) => IDAGBuilder
  fanOut: (fromId: string, toIds: string[]) => IDAGBuilder

  // 流畅 API
  then: (id: string, executor: TaskExecutor, name?: string) => IDAGBuilder

  // 构建
  build: () => IDAGPipeline
}

/** 节点状态枚举 */
export enum NodeStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  SKIPPED = 'skipped',
}

// ==================== 构建器模式 ====================

/** 任务构建器接口 */
export interface ITaskBuilder<TInput = unknown, TOutput = unknown> {
  /** 设置任务ID */
  id: (id: TaskId) => ITaskBuilder<TInput, TOutput>
  /** 设置任务名称 */
  name: (name: string) => ITaskBuilder<TInput, TOutput>
  /** 设置任务描述 */
  description: (description: string) => ITaskBuilder<TInput, TOutput>
  /** 设置执行函数 */
  executor: <TNewOutput = TOutput>(
    executor: TaskExecutor<TInput, TNewOutput>
  ) => ITaskBuilder<TInput, TNewOutput>
  /** 添加依赖 */
  dependsOn: (...taskIds: TaskId[]) => ITaskBuilder<TInput, TOutput>
  /** 设置重试配置 */
  retry: (config: RetryConfig) => ITaskBuilder<TInput, TOutput>
  /** 设置超时时间 */
  timeout: (ms: number) => ITaskBuilder<TInput, TOutput>
  /** 设置并行执行 */
  parallel: (enabled?: boolean) => ITaskBuilder<TInput, TOutput>
  /** 添加标签 */
  tags: (...tags: string[]) => ITaskBuilder<TInput, TOutput>
  /** 设置元数据 */
  metadata: (data: Record<string, unknown>) => ITaskBuilder<TInput, TOutput>
  /** 构建任务配置 */
  build: () => TaskConfig<TInput, TOutput>
}

/** 流程构建器接口 */
export interface IPipelineBuilder {
  /** 设置流程ID */
  id: (id: string) => IPipelineBuilder
  /** 设置流程名称 */
  name: (name: string) => IPipelineBuilder
  /** 设置流程描述 */
  description: (description: string) => IPipelineBuilder
  /** 设置最大并发数 */
  maxConcurrency: (count: number) => IPipelineBuilder
  /** 设置超时时间 */
  timeout: (ms: number) => IPipelineBuilder
  /** 设置失败策略 */
  failureStrategy: (strategy: FailureStrategy) => IPipelineBuilder
  /** 添加任务 */
  addTask: <TInput = unknown, TOutput = unknown>(
    config: TaskConfig<TInput, TOutput>
  ) => IPipelineBuilder
  /** 添加并发节点 */
  addConcurrentNode: (node: ConcurrentNode) => IPipelineBuilder
  /** 构建流程 */
  build: () => IPipeline
}

// ==================== 工厂接口 ====================

/** 工厂配置 */
export interface FactoryConfig {
  /** 默认上下文管理器 */
  contextManager?: IContextManager
  /** 默认状态管理器 */
  stateManager?: IStateManager
  /** 默认事件发射器 */
  eventEmitter?: IEventEmitter
}

/** 流程工厂接口 */
export interface IPipelineFactory {
  /** 创建任务构建器 */
  createTaskBuilder: <TInput = unknown, TOutput = unknown>() => ITaskBuilder<TInput, TOutput>
  /** 创建流程构建器 */
  createPipelineBuilder: () => IPipelineBuilder
  /** 创建流程实例 */
  createPipeline: (config: PipelineConfig) => IPipeline
  /** 注册任务模板 */
  registerTaskTemplate: <TInput = unknown, TOutput = unknown>(
    name: string,
    template: Partial<TaskConfig<TInput, TOutput>>
  ) => void
  /** 获取任务模板 */
  getTaskTemplate: <TInput = unknown, TOutput = unknown>(
    name: string
  ) => Partial<TaskConfig<TInput, TOutput>> | undefined
}

// 所有类型都已在上面定义并导出，无需重复导出
