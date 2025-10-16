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
 * DAG 条件节点配置 - 支持多分支
 */
export interface DAGConditionNodeConfig<TInput = unknown, TBranches extends string = 'true' | 'false'> {
  id: string
  name: string
  condition: (inputs: TInput, context: IContextManager) => Promise<TBranches>
  branches: TBranches[]
  tags?: string[]
  metadata?: Record<string, unknown>

  // 可选的验证器配置
  validators?: {
    inputs?: Partial<Record<KeysOf<TInput>, (value: any) => boolean>>
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
        if (value !== undefined && validator && typeof validator === 'function' && !validator(value)) {
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
        if (value !== undefined && validator && typeof validator === 'function' && !validator(value)) {
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

/**
 * DAG 条件节点 - 支持多分支
 */
export class DAGConditionNode<TInput = unknown, TBranches extends string = 'true' | 'false'> {
  public readonly config: DAGConditionNodeConfig<TInput, TBranches>
  public status: NodeStatus = NodeStatus.PENDING
  private result?: Record<TBranches, TInput | undefined>

  constructor(config: DAGConditionNodeConfig<TInput, TBranches>) {
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
        if (value !== undefined && validator && typeof validator === 'function' && !validator(value)) {
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
   * 执行条件判断
   */
  async execute(inputs: TInput, context: IContextManager): Promise<Record<TBranches, TInput | undefined>> {
    // 验证输入
    const inputValidation = this.validateInputs(inputs)
    if (!inputValidation.valid) {
      throw new Error(
        `Input validation failed for condition node ${this.id}: ${inputValidation.errors.join(', ')}`,
      )
    }

    this.status = NodeStatus.RUNNING

    try {
      const selectedBranch = await this.config.condition(inputs, context)

      // 验证分支是否有效
      if (!this.config.branches.includes(selectedBranch)) {
        throw new Error(`Invalid branch "${selectedBranch}" for condition node ${this.id}. Valid branches: ${this.config.branches.join(', ')}`)
      }

      // 创建结果对象，只有选中的分支有数据，其他分支为 undefined
      const result = {} as Record<TBranches, TInput | undefined>
      for (const branch of this.config.branches) {
        result[branch] = branch === selectedBranch ? inputs : undefined
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

  getResult(): Record<TBranches, TInput | undefined> | undefined {
    return this.result
  }

  reset(): void {
    this.status = NodeStatus.PENDING
    this.result = undefined
  }
}

// ==================== DAG Graph ====================

/**
 * 节点类型映射
 */
type NodeTypeMap = Record<string, { input: any, output: any }>

/**
 * 条件节点类型映射（暂时未使用，保留用于未来扩展）
 */
type _ConditionNodeTypeMap = Record<string, { input: any, output: { true: any, false: any } }>

/**
 * 从节点类型映射中提取特定节点的输出类型
 */
type GetNodeOutput<T extends NodeTypeMap, K extends keyof T> = T[K] extends { output: infer O } ? O : never

/**
 * 从节点类型映射中提取特定节点的输入类型
 */
type GetNodeInput<T extends NodeTypeMap, K extends keyof T> = T[K] extends { input: infer I } ? I : never

/**
 * 简化的边配置 - 直接连接节点，不需要指定端口
 */
export interface SimpleDAGEdgeConfig<
  TNodeTypes extends NodeTypeMap,
  TSourceId extends keyof TNodeTypes,
  TTargetId extends keyof TNodeTypes,
> {
  id: string
  sourceNodeId: TSourceId
  targetNodeId: TTargetId
  // 可选的类型转换函数
  transform?: (value: GetNodeOutput<TNodeTypes, TSourceId>) => GetNodeInput<TNodeTypes, TTargetId>
}

/**
 * DAG Graph - 有向无环图
 */
export class DAGGraph<TNodeTypes extends NodeTypeMap = NodeTypeMap> {
  private nodes: Map<string, DAGNode<any, any>> = new Map()
  private conditionNodes: Map<string, DAGConditionNode<any>> = new Map()
  private edges: Map<string, DAGEdgeConfig<any, any>> = new Map()
  private adjacencyList: Map<string, string[]> = new Map()

  /**
   * 添加节点
   */
  addNode<TInput, TOutput>(
    node: DAGNode<TInput, TOutput>,
  ): DAGGraph<TNodeTypes & Record<typeof node.id, { input: TInput, output: TOutput }>> {
    if (this.nodes.has(node.id) || this.conditionNodes.has(node.id)) {
      throw new Error(`Node with id "${node.id}" already exists`)
    }

    this.nodes.set(node.id, node)
    this.adjacencyList.set(node.id, [])
    return this as any
  }

  /**
   * 添加条件节点
   */
  addConditionNode<TInput, TBranches extends string>(
    conditionNode: DAGConditionNode<TInput, TBranches>,
  ): DAGGraph<TNodeTypes & Record<typeof conditionNode.id, { input: TInput, output: Record<TBranches, TInput> }>> {
    if (this.nodes.has(conditionNode.id) || this.conditionNodes.has(conditionNode.id)) {
      throw new Error(`Node with id "${conditionNode.id}" already exists`)
    }

    this.conditionNodes.set(conditionNode.id, conditionNode as any)
    this.adjacencyList.set(conditionNode.id, [])
    return this as any
  }

  /**
   * 简化的添加边方法 - 直接连接节点，不需要指定端口
   * 上一个节点的输出直接作为下一个节点的输入
   */
  addEdge<
    TSourceId extends keyof TNodeTypes,
    TTargetId extends keyof TNodeTypes,
  >(
    edge: SimpleDAGEdgeConfig<TNodeTypes, TSourceId, TTargetId>,
  ): this {
    // 检查节点是否存在（包括条件节点）
    const sourceNode = this.nodes.get(edge.sourceNodeId as string)
    const sourceConditionNode = this.conditionNodes.get(edge.sourceNodeId as string)
    const targetNode = this.nodes.get(edge.targetNodeId as string)
    const targetConditionNode = this.conditionNodes.get(edge.targetNodeId as string)

    if (!sourceNode && !sourceConditionNode) {
      throw new Error(`Source node "${String(edge.sourceNodeId)}" not found`)
    }

    if (!targetNode && !targetConditionNode) {
      throw new Error(`Target node "${String(edge.targetNodeId)}" not found`)
    }

    // 创建兼容的边配置
    const compatibleEdge: DAGEdgeConfig<any, any> = {
      id: edge.id,
      sourceNodeId: edge.sourceNodeId as string,
      sourcePort: 'output', // 固定使用 'output' 作为源端口
      targetNodeId: edge.targetNodeId as string,
      targetPort: 'input', // 固定使用 'input' 作为目标端口
      transform: edge.transform,
    }

    this.edges.set(edge.id, compatibleEdge)

    // 更新邻接表
    const adjacent = this.adjacencyList.get(edge.sourceNodeId as string) || []
    adjacent.push(edge.targetNodeId as string)
    this.adjacencyList.set(edge.sourceNodeId as string, adjacent)

    return this
  }

  /**
   * 便捷方法：直接通过节点对象连接
   * 自动添加节点（如果尚未添加）
   * 支持普通节点和条件节点
   */
  connect<
    TSourceInput,
    TSourceOutput,
    TTargetInput,
    TTargetOutput,
  >(
    sourceNode: DAGNode<TSourceInput, TSourceOutput> | DAGConditionNode<TSourceInput, any>,
    targetNode: DAGNode<TTargetInput, TTargetOutput>,
    options?: {
      id?: string
      transform?: (value: any) => TTargetInput
      autoAddNodes?: boolean // 是否自动添加节点，默认为 true
    },
  ): this {
    const autoAddNodes = options?.autoAddNodes !== false // 默认为 true

    // 自动添加节点（如果尚未添加）
    if (autoAddNodes) {
      if (!this.nodes.has(sourceNode.id) && !this.conditionNodes.has(sourceNode.id)) {
        if ('condition' in sourceNode) {
          // 条件节点
          this.addConditionNode(sourceNode as DAGConditionNode<any, any>)
        }
        else {
          // 普通节点
          this.addNode(sourceNode as DAGNode<any, any>)
        }
      }
      if (!this.nodes.has(targetNode.id) && !this.conditionNodes.has(targetNode.id)) {
        this.addNode(targetNode)
      }
    }

    const edgeId = options?.id || `${sourceNode.id}_to_${targetNode.id}`

    return this.addEdge({
      id: edgeId,
      sourceNodeId: sourceNode.id as any,
      targetNodeId: targetNode.id as any,
      transform: options?.transform as any,
    })
  }

  /**
   * 获取节点
   */
  getNode<TInput = any, TOutput = any>(id: string): DAGNode<TInput, TOutput> | undefined {
    return this.nodes.get(id) as DAGNode<TInput, TOutput> | undefined
  }

  /**
   * 获取条件节点
   */
  getConditionNode<TInput = any>(id: string): DAGConditionNode<TInput> | undefined {
    return this.conditionNodes.get(id) as DAGConditionNode<TInput> | undefined
  }

  /**
   * 获取所有节点（包括条件节点）
   */
  getAllNodes(): Array<DAGNode<any, any> | DAGConditionNode<any>> {
    return [...this.nodes.values(), ...this.conditionNodes.values()]
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
    const isRegularNode = this.nodes.has(id)
    const isConditionNode = this.conditionNodes.has(id)

    if (!isRegularNode && !isConditionNode) {
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

    // 移除节点
    if (isRegularNode) {
      this.nodes.delete(id)
    }
    if (isConditionNode) {
      this.conditionNodes.delete(id)
    }

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
    this.conditionNodes.clear()
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
    for (const conditionNode of this.conditionNodes.values()) {
      conditionNode.reset()
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
      const conditionNode = this.conditionNodes.get(nodeId)

      if (!node && !conditionNode)
        continue

      // 收集输入数据
      const inputs = this.collectNodeInputs(nodeId, nodeOutputs)

      // 执行节点
      try {
        let outputs: any

        if (node) {
          // 执行普通节点
          outputs = await node.execute(inputs, context)
        }
        else if (conditionNode) {
          // 执行条件节点
          outputs = await conditionNode.execute(inputs, context)
        }

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

          // 检查源节点是否是条件节点
          const sourceConditionNode = this.conditionNodes.get(edge.sourceNodeId)
          if (sourceConditionNode) {
            // 条件节点的输出格式：{ branch1: data, branch2: undefined, ... }
            // 根据边的ID或目标节点ID来确定应该使用哪个分支的数据
            value = this.getConditionalBranchData(sourceOutputs, edge)
          }
          // 对于简化的边，直接使用源节点的完整输出
          else if (edge.sourcePort === 'output' && edge.targetPort === 'input') {
            value = sourceOutputs
          }
          // 兼容旧的端口方式
          else if (typeof sourceOutputs === 'object' && sourceOutputs !== null && !Array.isArray(sourceOutputs)) {
            value = sourceOutputs[edge.sourcePort]
          }
          else {
            value = sourceOutputs
          }

          // 应用转换函数（如果有）
          if (edge.transform) {
            value = edge.transform(value)
          }

          // 对于简化的边，直接作为输入对象
          if (edge.targetPort === 'input') {
            if (value !== undefined) {
              Object.assign(inputs, value)
            }
          }
          // 兼容旧的端口方式
          else {
            inputs[edge.targetPort] = value
          }
        }
      }
    }

    return inputs
  }

  /**
   * 根据条件节点的分支结果和边的配置来确定应该使用哪个分支的数据
   */
  private getConditionalBranchData(
    sourceOutputs: Record<string, any>,
    edge: DAGEdgeConfig<any, any>,
  ): any {
    // 边ID直接就是分支名称
    const edgeId = edge.id

    // 检查边ID是否在条件节点的输出中存在
    if (edgeId in sourceOutputs) {
      return sourceOutputs[edgeId]
    }

    // 如果边ID不是分支名称，返回第一个非 undefined 的分支数据（兼容旧行为）
    for (const [_branchKey, branchValue] of Object.entries(sourceOutputs)) {
      if (branchValue !== undefined) {
        return branchValue
      }
    }

    return undefined
  }

  private topologicalSort(): string[] {
    const visited = new Set<string>()
    const stack: string[] = []

    // 包含所有节点（普通节点和条件节点）
    const allNodeIds = [...this.nodes.keys(), ...this.conditionNodes.keys()]
    for (const nodeId of allNodeIds) {
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

    // 包含所有节点（普通节点和条件节点）
    const allNodeIds = [...this.nodes.keys(), ...this.conditionNodes.keys()]
    for (const nodeId of allNodeIds) {
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
export function createDAGGraph<TNodeTypes extends NodeTypeMap = NodeTypeMap>(): DAGGraph<TNodeTypes> {
  return new DAGGraph<TNodeTypes>()
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
export function dagGraph<TNodeTypes extends NodeTypeMap = NodeTypeMap>(): DAGGraph<TNodeTypes> {
  return new DAGGraph<TNodeTypes>()
}

/**
 * 创建 DAG 条件节点的便捷函数
 */
export function dagConditionNode<TInput = unknown, TBranches extends string = 'true' | 'false'>(
  config: DAGConditionNodeConfig<TInput, TBranches>,
): DAGConditionNode<TInput, TBranches> {
  return new DAGConditionNode(config)
}
