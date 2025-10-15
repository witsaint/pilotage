/**
 * DAG Graph - 类型安全的有向无环图系统
 * 简化版本：利用 TypeScript 类型推导，减少冗余配置
 */

import type { IContextManager } from './types'
import { NodeStatus } from './types'

// ==================== 类型定义 ====================

/**
 * 提取对象的键类型
 */
type KeysOf<T> = keyof T & string

/**
 * DAG 节点配置
 */
export interface DAGNodeConfig<TInput = unknown, TOutput = unknown> {
  id: string
  name: string
  executor: (inputs: TInput, context: IContextManager) => Promise<TOutput>
  tags?: string[]
  metadata?: Record<string, unknown>
  
  // 可选的验证器配置
  validators?: {
    inputs?: Partial<Record<KeysOf<TInput>, (value: any) => boolean>>
    outputs?: Partial<Record<KeysOf<TOutput>, (value: any) => boolean>>
  }
}

/**
 * DAG 边配置 - 类型安全的连接
 */
export interface DAGEdgeConfig<
  TSource extends Record<string, any>,
  TTarget extends Record<string, any>,
  TSourceKey extends KeysOf<TSource> = KeysOf<TSource>,
  TTargetKey extends KeysOf<TTarget> = KeysOf<TTarget>,
> {
  id: string
  sourceNodeId: string
  sourcePort: TSourceKey
  targetNodeId: string
  targetPort: TTargetKey
  // 可选的类型转换函数
  transform?: (value: TSource[TSourceKey]) => TTarget[TTargetKey]
}

// ==================== DAG 节点 ====================

/**
 * DAG 节点
 */
export class DAGNode<TInput = unknown, TOutput = unknown> {
  public readonly config: DAGNodeConfig<TInput, TOutput>
  public status: NodeStatus = NodeStatus.PENDING
  private result?: TOutput

  constructor(config: DAGNodeConfig<TInput, TOutput>) {
    this.config = config
  }

  get id(): string {
    return this.config.id
  }

  get name(): string {
    return this.config.name
  }

  /**
   * 验证输入
   */
  validateInputs(inputs: Partial<TInput>): { valid: boolean, errors: string[] } {
    const errors: string[] = []

    // 使用自定义验证器（如果有）
    if (this.config.validators?.inputs) {
      for (const [key, validator] of Object.entries(this.config.validators.inputs)) {
        const value = (inputs as any)[key]
        if (value !== undefined && validator && !validator(value)) {
          errors.push(`Validation failed for input: ${key}`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * 验证输出
   */
  validateOutputs(outputs: TOutput): { valid: boolean, errors: string[] } {
    const errors: string[] = []

    // 使用自定义验证器（如果有）
    if (this.config.validators?.outputs) {
      for (const [key, validator] of Object.entries(this.config.validators.outputs)) {
        const value = (outputs as any)[key]
        if (value !== undefined && validator && !validator(value)) {
          errors.push(`Validation failed for output: ${key}`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * 执行节点
   */
  async execute(inputs: TInput, context: IContextManager): Promise<TOutput> {
    // 验证输入
    const inputValidation = this.validateInputs(inputs)
    if (!inputValidation.valid) {
      throw new Error(
        `Input validation failed for node ${this.id}: ${inputValidation.errors.join(', ')}`,
      )
    }

    this.status = NodeStatus.RUNNING

    try {
      const result = await this.config.executor(inputs, context)

      // 验证输出
      const outputValidation = this.validateOutputs(result)
      if (!outputValidation.valid) {
        throw new Error(
          `Output validation failed for node ${this.id}: ${outputValidation.errors.join(', ')}`,
        )
      }

      this.status = NodeStatus.SUCCESS
      this.result = result
      return result
    }
    catch (error) {
      this.status = NodeStatus.FAILED
      throw error
    }
  }

  getResult(): TOutput | undefined {
    return this.result
  }

  reset(): void {
    this.status = NodeStatus.PENDING
    this.result = undefined
  }
}

// ==================== DAG Graph ====================

/**
 * DAG Graph - 有向无环图
 */
export class DAGGraph {
  private nodes: Map<string, DAGNode<any, any>> = new Map()
  private edges: Map<string, DAGEdgeConfig<any, any>> = new Map()
  private adjacencyList: Map<string, string[]> = new Map()

  /**
   * 添加节点
   */
  addNode<TInput, TOutput>(node: DAGNode<TInput, TOutput>): this {
    if (this.nodes.has(node.id)) {
      throw new Error(`Node with id "${node.id}" already exists`)
    }

    this.nodes.set(node.id, node)
    this.adjacencyList.set(node.id, [])
    return this
  }

  /**
   * 类型安全的添加边
   * TypeScript 会自动检查 sourcePort 和 targetPort 是否存在于对应的类型中
   */
  addEdge<
    TSource extends Record<string, any>,
    TTarget extends Record<string, any>,
    TSourceKey extends KeysOf<TSource>,
    TTargetKey extends KeysOf<TTarget>,
  >(edge: DAGEdgeConfig<TSource, TTarget, TSourceKey, TTargetKey>): this {
    // 检查节点是否存在
    const sourceNode = this.nodes.get(edge.sourceNodeId)
    const targetNode = this.nodes.get(edge.targetNodeId)

    if (!sourceNode) {
      throw new Error(`Source node "${edge.sourceNodeId}" not found`)
    }

    if (!targetNode) {
      throw new Error(`Target node "${edge.targetNodeId}" not found`)
    }

    this.edges.set(edge.id, edge)

    // 更新邻接表
    const adjacent = this.adjacencyList.get(edge.sourceNodeId) || []
    adjacent.push(edge.targetNodeId)
    this.adjacencyList.set(edge.sourceNodeId, adjacent)

    return this
  }

  /**
   * 获取节点
   */
  getNode<TInput = any, TOutput = any>(id: string): DAGNode<TInput, TOutput> | undefined {
    return this.nodes.get(id) as DAGNode<TInput, TOutput> | undefined
  }

  /**
   * 获取所有节点
   */
  getAllNodes(): DAGNode<any, any>[] {
    return Array.from(this.nodes.values())
  }

  /**
   * 获取所有边
   */
  getAllEdges(): DAGEdgeConfig<any, any>[] {
    return Array.from(this.edges.values())
  }

  /**
   * 移除节点
   */
  removeNode(id: string): boolean {
    if (!this.nodes.has(id)) {
      return false
    }

    // 移除相关的边
    const edgesToRemove: string[] = []
    for (const [edgeId, edge] of this.edges) {
      if (edge.sourceNodeId === id || edge.targetNodeId === id) {
        edgesToRemove.push(edgeId)
      }
    }

    for (const edgeId of edgesToRemove) {
      this.edges.delete(edgeId)
    }

    // 更新邻接表
    this.adjacencyList.delete(id)
    for (const adjacent of this.adjacencyList.values()) {
      const index = adjacent.indexOf(id)
      if (index > -1) {
        adjacent.splice(index, 1)
      }
    }

    this.nodes.delete(id)
    return true
  }

  /**
   * 移除边
   */
  removeEdge(id: string): boolean {
    const edge = this.edges.get(id)
    if (!edge) {
      return false
    }

    // 更新邻接表
    const adjacent = this.adjacencyList.get(edge.sourceNodeId)
    if (adjacent) {
      const index = adjacent.indexOf(edge.targetNodeId)
      if (index > -1) {
        adjacent.splice(index, 1)
      }
    }

    this.edges.delete(id)
    return true
  }

  /**
   * 清空图
   */
  clear(): void {
    this.nodes.clear()
    this.edges.clear()
    this.adjacencyList.clear()
  }

  /**
   * 重置所有节点状态
   */
  reset(): void {
    for (const node of this.nodes.values()) {
      node.reset()
    }
  }

  /**
   * 执行图
   */
  async execute(
    context: IContextManager,
    initialInputs: Record<string, any> = {},
  ): Promise<Record<string, any>> {
    const executionOrder = this.topologicalSort()
    const nodeOutputs: Map<string, any> = new Map()

    // 设置初始输入
    for (const [nodeId, value] of Object.entries(initialInputs)) {
      nodeOutputs.set(nodeId, value)
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
        const outputs = await node.execute(inputs, context)
        nodeOutputs.set(nodeId, outputs)
      }
      catch (error) {
        console.error(`Node ${nodeId} execution failed:`, error)
        throw error
      }
    }

    // 收集最终输出
    const finalOutputs: Record<string, any> = {}
    for (const [nodeId, outputs] of nodeOutputs) {
      const hasSuccessors = (this.adjacencyList.get(nodeId)?.length || 0) > 0
      if (!hasSuccessors && this.nodes.has(nodeId)) {
        finalOutputs[nodeId] = outputs
      }
    }

    return finalOutputs
  }

  /**
   * 验证图的有效性
   */
  validate(): { valid: boolean, errors: string[] } {
    const errors: string[] = []

    // 检查循环依赖
    if (this.hasCycle()) {
      errors.push('Graph contains circular dependencies')
    }

    // 检查所有边的连接
    for (const edge of this.edges.values()) {
      if (!this.nodes.has(edge.sourceNodeId)) {
        errors.push(`Edge ${edge.id} references non-existent source node: ${edge.sourceNodeId}`)
      }
      if (!this.nodes.has(edge.targetNodeId)) {
        errors.push(`Edge ${edge.id} references non-existent target node: ${edge.targetNodeId}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * 获取拓扑排序结果
   */
  getExecutionOrder(): string[] {
    return this.topologicalSort()
  }

  // ==================== 私有方法 ====================

  private collectNodeInputs(
    nodeId: string,
    nodeOutputs: Map<string, any>,
  ): Record<string, any> {
    const inputs: Record<string, any> = {}

    // 查找所有指向该节点的边
    for (const edge of this.edges.values()) {
      if (edge.targetNodeId === nodeId) {
        const sourceOutputs = nodeOutputs.get(edge.sourceNodeId)
        if (sourceOutputs !== undefined) {
          let value: any

          // 如果源输出是对象，从中提取端口值
          if (typeof sourceOutputs === 'object' && sourceOutputs !== null && !Array.isArray(sourceOutputs)) {
            value = sourceOutputs[edge.sourcePort]
          }
          else {
            value = sourceOutputs
          }

          // 应用转换函数（如果有）
          if (edge.transform) {
            value = edge.transform(value)
          }

          inputs[edge.targetPort] = value
        }
      }
    }

    return inputs
  }

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

  private topologicalSortUtil(
    nodeId: string,
    visited: Set<string>,
    stack: string[],
  ): void {
    visited.add(nodeId)

    const adjacent = this.adjacencyList.get(nodeId) || []
    for (const adjNodeId of adjacent) {
      if (!visited.has(adjNodeId)) {
        this.topologicalSortUtil(adjNodeId, visited, stack)
      }
    }

    stack.push(nodeId)
  }

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

  private hasCycleUtil(
    nodeId: string,
    visited: Set<string>,
    recursionStack: Set<string>,
  ): boolean {
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

// ==================== 便捷函数 ====================

/**
 * 创建 DAG 节点
 */
export function createDAGNode<TInput, TOutput>(
  config: DAGNodeConfig<TInput, TOutput>,
): DAGNode<TInput, TOutput> {
  return new DAGNode(config)
}

/**
 * 创建 DAG 图
 */
export function createDAGGraph(): DAGGraph {
  return new DAGGraph()
}

/**
 * 创建 DAG 节点的便捷函数（简短名称）
 */
export function dagNode<TInput, TOutput>(
  config: DAGNodeConfig<TInput, TOutput>,
): DAGNode<TInput, TOutput> {
  return new DAGNode(config)
}

/**
 * 创建 DAG 图的便捷函数（简短名称）
 */
export function dagGraph(): DAGGraph {
  return new DAGGraph()
}

