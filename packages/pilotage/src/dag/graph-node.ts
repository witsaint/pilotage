/**
 * 图节点抽象模型
 * 提供统一的节点接口，支持任务节点、组节点等不同类型
 */

import type {
  ConcurrentNode,
  IContextManager,
  TaskConfig,
  TaskResult,
} from './types'

// ==================== 节点类型定义 ====================

/** 节点类型枚举 */
export enum NodeType {
  /** 任务节点 */
  TASK = 'task',
  /** 组节点（包含多个子节点） */
  GROUP = 'group',
  /** 并发节点 */
  CONCURRENT = 'concurrent',
  /** 条件节点 */
  CONDITION = 'condition',
  /** 合并节点 */
  MERGE = 'merge',
}

/** 节点状态 */
export enum NodeStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  SKIPPED = 'skipped',
}

/** 连线类型 */
export enum EdgeType {
  /** 普通依赖连线 */
  DEPENDENCY = 'dependency',
  /** 条件连线 */
  CONDITION = 'condition',
  /** 并发分支连线 */
  PARALLEL = 'parallel',
}

/** 基础节点接口 */
export interface IGraphNode {
  /** 节点ID */
  id: string
  /** 节点名称 */
  name: string
  /** 节点类型 */
  type: NodeType
  /** 节点状态 */
  status: NodeStatus
  /** 输入端口 */
  inputs: string[]
  /** 输出端口 */
  outputs: string[]
  /** 节点元数据 */
  metadata?: Record<string, unknown>
  /** 执行节点 */
  execute: (context: IContextManager, inputs: Record<string, unknown>) => Promise<Record<string, unknown>>
  /** 验证节点配置 */
  validate: () => { isValid: boolean, errors: string[] }
  /** 克隆节点 */
  clone: () => IGraphNode
}

/** 连线接口 */
export interface IGraphEdge {
  /** 连线ID */
  id: string
  /** 连线类型 */
  type: EdgeType
  /** 源节点ID */
  sourceNodeId: string
  /** 源端口 */
  sourcePort: string
  /** 目标节点ID */
  targetNodeId: string
  /** 目标端口 */
  targetPort: string
  /** 连线条件（用于条件连线） */
  condition?: (data: unknown) => boolean | Promise<boolean>
  /** 连线元数据 */
  metadata?: Record<string, unknown>
}

// ==================== 具体节点实现 ====================

/** 任务节点 */
export class TaskNode implements IGraphNode {
  public id: string
  public name: string
  public type = NodeType.TASK
  public status = NodeStatus.PENDING
  public inputs: string[] = ['input']
  public outputs: string[] = ['output']
  public metadata?: Record<string, unknown>

  private taskConfig: TaskConfig
  private result?: TaskResult

  constructor(taskConfig: TaskConfig) {
    this.id = taskConfig.id
    this.name = taskConfig.name
    this.taskConfig = taskConfig
    this.metadata = taskConfig.metadata
  }

  async execute(context: IContextManager, inputs: Record<string, unknown>): Promise<Record<string, unknown>> {
    this.status = NodeStatus.RUNNING

    try {
      // 获取输入数据
      const inputData = inputs.input

      // 执行任务
      const result = await this.taskConfig.executor(inputData, context)

      this.status = NodeStatus.SUCCESS
      this.result = {
        taskId: this.id,
        status: this.status as any,
        data: result,
        startTime: new Date(),
        endTime: new Date(),
        retryCount: 0,
      }

      return { output: result }
    }
    catch (error) {
      this.status = NodeStatus.FAILED
      this.result = {
        taskId: this.id,
        status: this.status as any,
        error: error as Error,
        startTime: new Date(),
        endTime: new Date(),
        retryCount: 0,
      }
      throw error
    }
  }

  validate(): { isValid: boolean, errors: string[] } {
    const errors: string[] = []

    if (!this.id)
      errors.push('Task node must have an ID')
    if (!this.name)
      errors.push('Task node must have a name')
    if (!this.taskConfig.executor)
      errors.push('Task node must have an executor')

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  clone(): TaskNode {
    return new TaskNode({ ...this.taskConfig })
  }

  getTaskConfig(): TaskConfig {
    return this.taskConfig
  }

  getResult(): TaskResult | undefined {
    return this.result
  }
}

/** 组节点 */
export class GroupNode implements IGraphNode {
  public id: string
  public name: string
  public type = NodeType.GROUP
  public status = NodeStatus.PENDING
  public inputs: string[] = ['input']
  public outputs: string[] = ['output']
  public metadata?: Record<string, unknown>

  private children: IGraphNode[] = []
  private internalEdges: IGraphEdge[] = []

  constructor(id: string, name: string) {
    this.id = id
    this.name = name
  }

  /**
   * 添加子节点
   */
  addChild(node: IGraphNode): GroupNode {
    this.children.push(node)
    return this
  }

  /**
   * 添加内部连线
   */
  addInternalEdge(edge: IGraphEdge): GroupNode {
    this.internalEdges.push(edge)
    return this
  }

  /**
   * 获取子节点
   */
  getChildren(): IGraphNode[] {
    return [...this.children]
  }

  /**
   * 获取内部连线
   */
  getInternalEdges(): IGraphEdge[] {
    return [...this.internalEdges]
  }

  async execute(context: IContextManager, inputs: Record<string, unknown>): Promise<Record<string, unknown>> {
    this.status = NodeStatus.RUNNING

    try {
      // 创建子上下文
      const childContext = context.createChild()

      // 执行内部图
      const graph = new NodeGraph()
      for (const child of this.children) {
        graph.addNode(child)
      }
      for (const edge of this.internalEdges) {
        graph.addEdge(edge)
      }

      const result = await graph.execute(childContext, inputs)

      this.status = NodeStatus.SUCCESS
      return result
    }
    catch (error) {
      this.status = NodeStatus.FAILED
      throw error
    }
  }

  validate(): { isValid: boolean, errors: string[] } {
    const errors: string[] = []

    if (!this.id)
      errors.push('Group node must have an ID')
    if (!this.name)
      errors.push('Group node must have a name')

    // 验证子节点
    for (const child of this.children) {
      const childValidation = child.validate()
      if (!childValidation.isValid) {
        errors.push(...childValidation.errors.map(err => `Child node ${child.id}: ${err}`))
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  clone(): GroupNode {
    const cloned = new GroupNode(this.id, this.name)
    cloned.children = this.children.map(child => child.clone())
    cloned.internalEdges = [...this.internalEdges]
    cloned.metadata = { ...this.metadata }
    return cloned
  }
}

/** 并发节点 */
export class ConcurrentGraphNode implements IGraphNode {
  public id: string
  public name: string
  public type = NodeType.CONCURRENT
  public status = NodeStatus.PENDING
  public inputs: string[] = ['input']
  public outputs: string[] = ['output']
  public metadata?: Record<string, unknown>

  private concurrentConfig: ConcurrentNode
  private branches: GroupNode[] = []

  constructor(concurrentConfig: ConcurrentNode) {
    this.id = concurrentConfig.id
    this.name = concurrentConfig.name
    this.concurrentConfig = concurrentConfig
  }

  /**
   * 添加分支
   */
  addBranch(branch: GroupNode): ConcurrentGraphNode {
    this.branches.push(branch)
    return this
  }

  async execute(context: IContextManager, inputs: Record<string, unknown>): Promise<Record<string, unknown>> {
    this.status = NodeStatus.RUNNING

    try {
      // 并发执行所有分支
      const branchPromises = this.branches.map(async (branch) => {
        const branchContext = context.createChild()
        return await branch.execute(branchContext, inputs)
      })

      const results = await Promise.allSettled(branchPromises)

      // 根据并发策略判断成功条件
      const successResults = results.filter(r => r.status === 'fulfilled')
      const success = this.evaluateSuccess(successResults.length, results.length)

      if (success) {
        this.status = NodeStatus.SUCCESS
        return { output: successResults.map(r => (r as PromiseFulfilledResult<any>).value) }
      }
      else {
        this.status = NodeStatus.FAILED
        throw new Error('Concurrent execution failed based on strategy')
      }
    }
    catch (error) {
      this.status = NodeStatus.FAILED
      throw error
    }
  }

  private evaluateSuccess(successCount: number, totalCount: number): boolean {
    switch (this.concurrentConfig.strategy) {
      case 'any_success':
        return successCount > 0
      case 'all_success':
        return successCount === totalCount
      case 'specified_success':
        // 简化实现，可以根据需要扩展
        return successCount >= Math.ceil(totalCount / 2)
      default:
        return successCount === totalCount
    }
  }

  validate(): { isValid: boolean, errors: string[] } {
    const errors: string[] = []

    if (!this.id)
      errors.push('Concurrent node must have an ID')
    if (!this.name)
      errors.push('Concurrent node must have a name')
    if (this.branches.length === 0)
      errors.push('Concurrent node must have at least one branch')

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  clone(): ConcurrentGraphNode {
    const cloned = new ConcurrentGraphNode({ ...this.concurrentConfig })
    cloned.branches = this.branches.map(branch => branch.clone())
    return cloned
  }
}

/** 条件节点 */
export class ConditionNode implements IGraphNode {
  public id: string
  public name: string
  public type = NodeType.CONDITION
  public status = NodeStatus.PENDING
  public inputs: string[] = ['input']
  public outputs: string[] = ['true', 'false']
  public metadata?: Record<string, unknown>

  private condition: (data: unknown) => boolean | Promise<boolean>

  constructor(id: string, name: string, condition: (data: unknown) => boolean | Promise<boolean>) {
    this.id = id
    this.name = name
    this.condition = condition
  }

  async execute(context: IContextManager, inputs: Record<string, unknown>): Promise<Record<string, unknown>> {
    this.status = NodeStatus.RUNNING

    try {
      const inputData = inputs.input
      const result = await this.condition(inputData)

      this.status = NodeStatus.SUCCESS

      if (result) {
        return {
          true: inputData,
          false: undefined,
        }
      }
      else {
        return {
          true: undefined,
          false: inputData,
        }
      }
    }
    catch (error) {
      this.status = NodeStatus.FAILED
      throw error
    }
  }

  validate(): { isValid: boolean, errors: string[] } {
    const errors: string[] = []

    if (!this.id)
      errors.push('Condition node must have an ID')
    if (!this.name)
      errors.push('Condition node must have a name')
    if (!this.condition)
      errors.push('Condition node must have a condition function')

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  clone(): ConditionNode {
    return new ConditionNode(this.id, this.name, this.condition)
  }
}

/** 合并节点 */
export class MergeNode implements IGraphNode {
  public id: string
  public name: string
  public type = NodeType.MERGE
  public status = NodeStatus.PENDING
  public inputs: string[] = ['input1', 'input2']
  public outputs: string[] = ['output']
  public metadata?: Record<string, unknown>

  private mergeFunction?: (inputs: Record<string, unknown>) => unknown

  constructor(id: string, name: string, mergeFunction?: (inputs: Record<string, unknown>) => unknown) {
    this.id = id
    this.name = name
    this.mergeFunction = mergeFunction
  }

  async execute(context: IContextManager, inputs: Record<string, unknown>): Promise<Record<string, unknown>> {
    this.status = NodeStatus.RUNNING

    try {
      let result: unknown

      if (this.mergeFunction) {
        result = this.mergeFunction(inputs)
      }
      else {
        // 默认合并策略：收集所有非 undefined 的输入
        result = Object.values(inputs).filter(v => v !== undefined)
      }

      this.status = NodeStatus.SUCCESS
      return { output: result }
    }
    catch (error) {
      this.status = NodeStatus.FAILED
      throw error
    }
  }

  validate(): { isValid: boolean, errors: string[] } {
    const errors: string[] = []

    if (!this.id)
      errors.push('Merge node must have an ID')
    if (!this.name)
      errors.push('Merge node must have a name')

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  clone(): MergeNode {
    return new MergeNode(this.id, this.name, this.mergeFunction)
  }
}

// ==================== 图执行引擎 ====================

/** 节点图 */
export class NodeGraph {
  private nodes: Map<string, IGraphNode> = new Map()
  private edges: Map<string, IGraphEdge> = new Map()
  private adjacencyList: Map<string, string[]> = new Map()
  private reverseAdjacencyList: Map<string, string[]> = new Map()

  /**
   * 添加节点
   */
  addNode(node: IGraphNode): NodeGraph {
    this.nodes.set(node.id, node)
    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, [])
    }
    if (!this.reverseAdjacencyList.has(node.id)) {
      this.reverseAdjacencyList.set(node.id, [])
    }
    return this
  }

  /**
   * 添加连线
   */
  addEdge(edge: IGraphEdge): NodeGraph {
    this.edges.set(edge.id, edge)

    // 更新邻接表
    const sourceAdjacent = this.adjacencyList.get(edge.sourceNodeId) || []
    sourceAdjacent.push(edge.targetNodeId)
    this.adjacencyList.set(edge.sourceNodeId, sourceAdjacent)

    const targetReverse = this.reverseAdjacencyList.get(edge.targetNodeId) || []
    targetReverse.push(edge.sourceNodeId)
    this.reverseAdjacencyList.set(edge.targetNodeId, targetReverse)

    return this
  }

  /**
   * 获取节点
   */
  getNode(id: string): IGraphNode | undefined {
    return this.nodes.get(id)
  }

  /**
   * 获取所有节点
   */
  getAllNodes(): IGraphNode[] {
    return Array.from(this.nodes.values())
  }

  /**
   * 获取连线
   */
  getEdge(id: string): IGraphEdge | undefined {
    return this.edges.get(id)
  }

  /**
   * 获取所有连线
   */
  getAllEdges(): IGraphEdge[] {
    return Array.from(this.edges.values())
  }

  /**
   * 执行图
   */
  async execute(context: IContextManager, initialInputs: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    // 拓扑排序
    const executionOrder = this.topologicalSort()
    const nodeOutputs: Map<string, Record<string, unknown>> = new Map()

    // 设置初始输入
    for (const [key, value] of Object.entries(initialInputs)) {
      nodeOutputs.set(key, { output: value })
    }

    // 按拓扑顺序执行节点
    for (const nodeId of executionOrder) {
      const node = this.nodes.get(nodeId)
      if (!node)
        continue

      // 收集输入数据
      const inputs = this.collectNodeInputs(nodeId, nodeOutputs)

      // 执行节点
      try {
        const outputs = await node.execute(context, inputs)
        nodeOutputs.set(nodeId, outputs)
      }
      catch (error) {
        console.error(`Node ${nodeId} execution failed:`, error)
        throw error
      }
    }

    // 收集最终输出（没有后续节点的节点的输出）
    const finalOutputs: Record<string, unknown> = {}
    for (const [nodeId, outputs] of nodeOutputs) {
      const hasSuccessors = this.adjacencyList.get(nodeId)?.length || 0
      if (hasSuccessors === 0) {
        finalOutputs[nodeId] = outputs
      }
    }

    return finalOutputs
  }

  /**
   * 收集节点输入
   */
  private collectNodeInputs(nodeId: string, nodeOutputs: Map<string, Record<string, unknown>>): Record<string, unknown> {
    const inputs: Record<string, unknown> = {}

    // 查找所有指向该节点的连线
    for (const edge of this.edges.values()) {
      if (edge.targetNodeId === nodeId) {
        const sourceOutputs = nodeOutputs.get(edge.sourceNodeId)
        if (sourceOutputs && sourceOutputs[edge.sourcePort] !== undefined) {
          inputs[edge.targetPort] = sourceOutputs[edge.sourcePort]
        }
      }
    }

    return inputs
  }

  /**
   * 拓扑排序
   */
  private topologicalSort(): string[] {
    const visited = new Set<string>()
    const stack: string[] = []

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        this.topologicalSortUtil(nodeId, visited, stack)
      }
    }

    return stack.reverse()
  }

  private topologicalSortUtil(nodeId: string, visited: Set<string>, stack: string[]): void {
    visited.add(nodeId)

    const adjacent = this.adjacencyList.get(nodeId) || []
    for (const adjNodeId of adjacent) {
      if (!visited.has(adjNodeId)) {
        this.topologicalSortUtil(adjNodeId, visited, stack)
      }
    }

    stack.push(nodeId)
  }

  /**
   * 验证图
   */
  validate(): { isValid: boolean, errors: string[] } {
    const errors: string[] = []

    // 验证所有节点
    for (const node of this.nodes.values()) {
      const nodeValidation = node.validate()
      if (!nodeValidation.isValid) {
        errors.push(...nodeValidation.errors)
      }
    }

    // 验证连线引用的节点存在
    for (const edge of this.edges.values()) {
      if (!this.nodes.has(edge.sourceNodeId)) {
        errors.push(`Edge ${edge.id} references non-existent source node ${edge.sourceNodeId}`)
      }
      if (!this.nodes.has(edge.targetNodeId)) {
        errors.push(`Edge ${edge.id} references non-existent target node ${edge.targetNodeId}`)
      }
    }

    // 检查循环依赖
    if (this.hasCycle()) {
      errors.push('Graph contains cycles')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * 检查是否有循环
   */
  private hasCycle(): boolean {
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (this.hasCycleUtil(nodeId, visited, recursionStack)) {
          return true
        }
      }
    }

    return false
  }

  private hasCycleUtil(nodeId: string, visited: Set<string>, recursionStack: Set<string>): boolean {
    visited.add(nodeId)
    recursionStack.add(nodeId)

    const adjacent = this.adjacencyList.get(nodeId) || []
    for (const adjNodeId of adjacent) {
      if (!visited.has(adjNodeId)) {
        if (this.hasCycleUtil(adjNodeId, visited, recursionStack)) {
          return true
        }
      }
      else if (recursionStack.has(adjNodeId)) {
        return true
      }
    }

    recursionStack.delete(nodeId)
    return false
  }
}

// 所有类型和类都已在上面定义并导出，无需重复导出
