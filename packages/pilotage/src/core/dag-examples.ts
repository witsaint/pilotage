/**
 * DAG 流程系统使用示例
 * 展示如何使用现代化的 DAG 系统构建复杂流程
 */

import type { TaskConfig } from './types'
import { createDAGBuilder, dag } from './dag-builder'
import { ConditionNode, EdgeType, MergeNode, NodeGraph, TaskNode } from './graph-node'

// ==================== 基础使用示例 ====================

/**
 * 示例1: 简单的线性流程
 * 展示基本的 then 链式调用
 */
export async function basicLinearFlowExample(): Promise<void> {
  console.log('=== 基础线性流程示例 ===')

  const pipeline = dag()
    .id('basic-linear')
    .name('基础线性流程')
    .task('init', async () => {
      console.log('初始化数据')
      return { data: 'initialized', timestamp: Date.now() }
    })
    .then('process', async (input) => {
      console.log('处理数据:', input)
      return { ...input, processed: true }
    })
    .then('validate', async (input) => {
      console.log('验证数据:', input)
      return { ...input, valid: true }
    })
    .then('finalize', async (input) => {
      console.log('完成处理:', input)
      return { ...input, completed: Date.now() }
    })
    .build()

  try {
    console.log('\n执行完整流程:')
    const result = await pipeline.execute()
    console.log('流程执行完成:', result.status)
    console.log('执行进度:', `${Math.round(pipeline.getProgress() * 100)}%`)
  }
  catch (error) {
    console.error('流程执行失败:', error)
  }
}

/**
 * 示例2: 复杂分支合并流程
 * 展示 A->C, B->C 的复杂连接场景
 */
export async function complexBranchMergeExample(): Promise<void> {
  console.log('\n=== 复杂分支合并流程示例 ===')

  const pipeline = createDAGBuilder()
    .id('complex-branch-merge')
    .name('复杂分支合并流程')
    // 初始任务
    .task('start', async () => {
      console.log('开始处理')
      return 'initial-data'
    })
    // 并行分支 A 和 B
    .task('branchA', async (input) => {
      console.log('分支 A 处理:', input)
      await new Promise(resolve => setTimeout(resolve, 100))
      return `A-processed-${input}`
    })
    .task('branchB', async (input) => {
      console.log('分支 B 处理:', input)
      await new Promise(resolve => setTimeout(resolve, 150))
      return `B-processed-${input}`
    })
    // 合并节点 C
    .merge('mergeC', (inputs) => {
      console.log('合并节点 C 收到:', inputs)
      return {
        merged: Object.values(inputs),
        timestamp: Date.now(),
      }
    })
    // 最终处理
    .then('final', async (input) => {
      console.log('最终处理:', input)
      return { final: input, completed: true }
    })
    // 手动连接：start -> branchA, start -> branchB, branchA -> mergeC, branchB -> mergeC
    .connect('start', 'branchA')
    .connect('start', 'branchB')
    .connect('branchA', 'mergeC')
    .connect('branchB', 'mergeC')
    .build()

  try {
    console.log('\n分步执行流程:')

    // 执行第一步
    console.log('1. 执行初始任务')
    await pipeline.next()

    // 执行并行分支
    console.log('2. 执行并行分支 (2步)')
    await pipeline.step(2)

    // 执行到合并节点
    console.log('3. 执行到合并节点')
    const mergeResult = await pipeline.executeUntil('mergeC')
    console.log('合并结果:', mergeResult)

    // 完成剩余任务
    console.log('4. 完成剩余任务')
    await pipeline.waitForCompletion()

    console.log('最终进度:', `${Math.round(pipeline.getProgress() * 100)}%`)
  }
  catch (error) {
    console.error('流程执行失败:', error)
  }
}

/**
 * 示例3: 条件分支流程
 * 展示条件节点和动态路径选择
 */
export async function conditionalFlowExample(): Promise<void> {
  console.log('\n=== 条件分支流程示例 ===')

  const pipeline = dag()
    .id('conditional-flow')
    .name('条件分支流程')
    .task('input', async () => {
      const value = Math.random()
      console.log('生成随机值:', value)
      return { value, threshold: 0.5 }
    })
    .condition('check', async (input: any) => {
      const result = input.value > input.threshold
      console.log(`条件检查: ${input.value} > ${input.threshold} = ${result}`)
      return result
    })
    .then('highValue', async (input) => {
      console.log('处理高值:', input)
      return { ...input, category: 'high' }
    })
    .else('lowValue', async (input) => {
      console.log('处理低值:', input)
      return { ...input, category: 'low' }
    })
    .endIf()
    .merge('result', (inputs) => {
      console.log('收集结果:', inputs)
      return {
        final: Object.values(inputs)[0],
        processed: Date.now(),
      }
    })
    .build()

  try {
    console.log('\n执行条件流程:')
    const result = await pipeline.execute()
    console.log('条件流程完成:', result.status)
  }
  catch (error) {
    console.error('条件流程失败:', error)
  }
}

/**
 * 示例4: 并行处理与合并
 * 展示并行构建器的使用
 */
export async function parallelProcessingExample(): Promise<void> {
  console.log('\n=== 并行处理与合并示例 ===')

  const pipeline = dag()
    .id('parallel-processing')
    .name('并行处理流程')
    .task('prepare', async () => {
      console.log('准备数据')
      return ['item1', 'item2', 'item3', 'item4']
    })
    .parallel([
      {
        id: 'processType1',
        executor: async (items: string[]) => {
          console.log('类型1处理:', items.slice(0, 2))
          await new Promise(resolve => setTimeout(resolve, 100))
          return { type1: items.slice(0, 2).map(item => `${item}-type1`) }
        },
      },
      {
        id: 'processType2',
        executor: async (items: string[]) => {
          console.log('类型2处理:', items.slice(2))
          await new Promise(resolve => setTimeout(resolve, 150))
          return { type2: items.slice(2).map(item => `${item}-type2`) }
        },
      },
    ])
    .merge('combine', (inputs) => {
      console.log('合并处理结果:', inputs)
      const [result1, result2] = inputs
      return {
        combined: { ...result1, ...result2 },
        totalItems: 2,
      }
    })
    .then('summary', async (input) => {
      console.log('生成摘要:', input)
      return {
        summary: `处理了 ${input.totalItems} 个项目`,
        details: input.combined,
        timestamp: Date.now(),
      }
    })
    .build()

  try {
    console.log('\n执行并行处理:')

    // 使用条件执行 - 执行到 50% 进度
    console.log('1. 执行到 50% 进度')
    await pipeline.executeWhile(_state => pipeline.getProgress() < 0.5)
    console.log('当前进度:', `${Math.round(pipeline.getProgress() * 100)}%`)

    // 继续执行剩余部分
    console.log('2. 完成剩余执行')
    await pipeline.waitForCompletion()
    console.log('最终进度:', `${Math.round(pipeline.getProgress() * 100)}%`)
  }
  catch (error) {
    console.error('并行处理失败:', error)
  }
}

/**
 * 示例5: 错误处理和任务控制
 * 展示跳过、重试等高级功能
 */
export async function errorHandlingExample(): Promise<void> {
  console.log('\n=== 错误处理和任务控制示例 ===')

  let attemptCount = 0

  const pipeline = dag()
    .id('error-handling')
    .name('错误处理流程')
    .task('stable', async () => {
      console.log('稳定任务执行')
      return 'stable-result'
    })
    .then('unstable', async (input) => {
      attemptCount++
      console.log(`不稳定任务执行 (尝试 ${attemptCount})`)

      if (attemptCount < 3) {
        throw new Error(`模拟失败 (尝试 ${attemptCount})`)
      }

      return `${input}-unstable-success`
    })
    .then('optional', async (input) => {
      console.log('可选任务执行')
      return `${input}-optional`
    })
    .then('final', async (input) => {
      console.log('最终任务执行')
      return `${input}-final`
    })
    .build()

  try {
    console.log('\n演示错误处理:')

    // 执行第一个稳定任务
    console.log('1. 执行稳定任务')
    await pipeline.next()

    // 尝试执行不稳定任务
    console.log('2. 尝试执行不稳定任务')
    try {
      await pipeline.next()
    }
    catch (error) {
      console.log('任务失败，进行重试', error)

      // 重试不稳定任务
      try {
        await pipeline.retryNode('unstable')
      }
      catch (retryError) {
        console.log('重试仍然失败，再次重试', retryError)
        await pipeline.retryNode('unstable')
      }
    }

    // 跳过可选任务
    console.log('3. 跳过可选任务')
    await pipeline.skipNode('optional', '演示跳过功能')

    // 完成最终任务
    console.log('4. 完成最终任务')
    await pipeline.executeUntil('final')

    console.log('错误处理流程完成')
  }
  catch (error) {
    console.error('错误处理示例失败:', error)
  }
}

/**
 * 运行所有 DAG 系统示例
 */
export async function runDAGExamples(): Promise<void> {
  console.log('🚀 DAG 流程系统示例演示\n')

  try {
    // DAG Builder 示例
    await basicLinearFlowExample()
    await complexBranchMergeExample()
    await conditionalFlowExample()
    await parallelProcessingExample()
    await errorHandlingExample()

    // NodeGraph 直接操作示例
    await directNodeGraphExample()
    await nodeGraphConditionalExample()
    await nodeGraphAdvancedExample()

    console.log('\n✅ 所有 DAG 系统示例执行完成!')
  }
  catch (error) {
    console.error('\n❌ DAG 系统示例执行失败:', error)
  }
}

// ==================== 对比示例 ====================

/**
 * 展示 DAG 系统的优势
 */
export function dagAdvantagesExample(): void {
  console.log('\n=== DAG 系统优势展示 ===')

  console.log(`
📊 功能对比:

现代 DAG 系统:
✅ 任务依赖管理
✅ 并发控制  
✅ 重试机制
✅ 事件系统
✅ 复杂图结构 (A->C, B->C)
✅ 多种节点类型 (Task, Group, Condition, Merge)
✅ 端口连接
✅ 条件分支
✅ 分步执行控制
✅ 统一构建器 API

🎯 DAG 系统适用场景:

✨ 复杂的工作流编排
✨ 条件分支和动态路径
✨ 需要精细控制的场景
✨ 图形化工作流设计
✨ 现代化的流程引擎需求
✨ 微服务编排
✨ 数据处理管道
✨ CI/CD 流程
✨ 业务流程自动化
`)
}

// ==================== 直接使用 NodeGraph 的示例 ====================

/**
 * 示例7: 直接使用 NodeGraph 构建图结构
 * 展示如何不使用构建器，直接操作图节点
 */
export async function directNodeGraphExample(): Promise<void> {
  console.log('\n=== 直接使用 NodeGraph 示例 ===\n')

  // 1. 创建图实例
  const graph = new NodeGraph()

  // 2. 创建任务配置
  const task1Config: TaskConfig = {
    id: 'fetch',
    name: '获取数据',
    executor: async () => {
      console.log('执行: 获取数据')
      return { data: [1, 2, 3, 4, 5] }
    },
    dependencies: [],
    tags: ['data'],
    metadata: {},
  }

  const task2Config: TaskConfig = {
    id: 'process',
    name: '处理数据',
    executor: async (input: any) => {
      console.log('执行: 处理数据', input)
      return { processed: input.data.map((n: number) => n * 2) }
    },
    dependencies: [],
    tags: ['transform'],
    metadata: {},
  }

  const task3Config: TaskConfig = {
    id: 'save',
    name: '保存结果',
    executor: async (input: any) => {
      console.log('执行: 保存结果', input)
      return { saved: true, count: input.processed.length }
    },
    dependencies: [],
    tags: ['storage'],
    metadata: {},
  }

  // 3. 创建节点并添加到图中
  const node1 = new TaskNode(task1Config)
  const node2 = new TaskNode(task2Config)
  const node3 = new TaskNode(task3Config)

  graph.addNode(node1)
  graph.addNode(node2)
  graph.addNode(node3)

  // 4. 添加边（连接）
  graph.addEdge({
    id: 'fetch_to_process',
    type: EdgeType.DEPENDENCY,
    sourceNodeId: 'fetch',
    sourcePort: 'output',
    targetNodeId: 'process',
    targetPort: 'input',
  })

  graph.addEdge({
    id: 'process_to_save',
    type: EdgeType.DEPENDENCY,
    sourceNodeId: 'process',
    sourcePort: 'output',
    targetNodeId: 'save',
    targetPort: 'input',
  })

  // 5. 查看图信息
  console.log('📊 图信息:')
  console.log(`  节点数量: ${graph.getAllNodes().length}`)
  console.log(`  边数量: ${graph.getAllEdges().length}`)

  // 6. 查看节点和边详情
  console.log('\n📋 节点列表:')
  for (const node of graph.getAllNodes()) {
    console.log(`  - ${node.id}: ${node.name} (${node.type})`)
  }

  console.log('\n📋 边连接:')
  for (const edge of graph.getAllEdges()) {
    console.log(`  - ${edge.sourceNodeId} -> ${edge.targetNodeId} (${edge.type})`)
  }

  // 7. 验证图
  const validation = graph.validate()
  console.log('\n✅ 图验证:')
  console.log(`  有效性: ${validation.isValid}`)
  if (validation.errors.length > 0) {
    console.log(`  错误: ${validation.errors.join(', ')}`)
  }

  console.log('\n✨ NodeGraph 直接使用完成\n')
}

/**
 * 示例8: 使用 NodeGraph 创建条件分支图
 */
export async function nodeGraphConditionalExample(): Promise<void> {
  console.log('\n=== NodeGraph 条件分支示例 ===\n')

  const graph = new NodeGraph()

  // 1. 创建检查任务
  const checkTask: TaskConfig = {
    id: 'check',
    name: '检查值',
    executor: async () => {
      const value = Math.random() * 100
      console.log(`检查值: ${value}`)
      return { value }
    },
    dependencies: [],
    tags: [],
    metadata: {},
  }

  // 2. 创建条件节点
  const conditionNode = new ConditionNode(
    'validate',
    '验证条件',
    (data: any) => data.value > 50,
  )

  // 3. 创建真分支任务
  const trueBranchTask: TaskConfig = {
    id: 'highValue',
    name: '处理高值',
    executor: async (input: any) => {
      console.log(`高值处理: ${input.value}`)
      return { result: 'high', value: input.value }
    },
    dependencies: [],
    tags: ['high'],
    metadata: {},
  }

  // 4. 创建假分支任务
  const falseBranchTask: TaskConfig = {
    id: 'lowValue',
    name: '处理低值',
    executor: async (input: any) => {
      console.log(`低值处理: ${input.value}`)
      return { result: 'low', value: input.value }
    },
    dependencies: [],
    tags: ['low'],
    metadata: {},
  }

  // 5. 创建合并节点
  const mergeNode = new MergeNode(
    'merge',
    '合并结果',
    (inputs: Record<string, any>) => {
      console.log('合并结果:', inputs)
      return { merged: true, data: Object.values(inputs)[0] }
    },
  )

  // 6. 添加所有节点
  const checkNode = new TaskNode(checkTask)
  const trueNode = new TaskNode(trueBranchTask)
  const falseNode = new TaskNode(falseBranchTask)

  graph.addNode(checkNode)
  graph.addNode(conditionNode)
  graph.addNode(trueNode)
  graph.addNode(falseNode)
  graph.addNode(mergeNode)

  // 7. 连接节点
  // check -> condition
  graph.addEdge({
    id: 'check_to_condition',
    type: EdgeType.DEPENDENCY,
    sourceNodeId: 'check',
    sourcePort: 'output',
    targetNodeId: 'validate',
    targetPort: 'input',
  })

  // condition -> true branch
  graph.addEdge({
    id: 'condition_to_high',
    type: EdgeType.CONDITION,
    sourceNodeId: 'validate',
    sourcePort: 'true',
    targetNodeId: 'highValue',
    targetPort: 'input',
  })

  // condition -> false branch
  graph.addEdge({
    id: 'condition_to_low',
    type: EdgeType.CONDITION,
    sourceNodeId: 'validate',
    sourcePort: 'false',
    targetNodeId: 'lowValue',
    targetPort: 'input',
  })

  // branches -> merge
  graph.addEdge({
    id: 'high_to_merge',
    type: EdgeType.DEPENDENCY,
    sourceNodeId: 'highValue',
    sourcePort: 'output',
    targetNodeId: 'merge',
    targetPort: 'input1',
  })

  graph.addEdge({
    id: 'low_to_merge',
    type: EdgeType.DEPENDENCY,
    sourceNodeId: 'lowValue',
    sourcePort: 'output',
    targetNodeId: 'merge',
    targetPort: 'input2',
  })

  // 8. 查看图结构
  console.log('📊 条件图信息:')
  console.log(`  节点数量: ${graph.getAllNodes().length}`)
  console.log(`  节点类型:`)
  for (const node of graph.getAllNodes()) {
    console.log(`    - ${node.id} (${node.type})`)
  }

  console.log('\n📋 边连接:')
  for (const edge of graph.getAllEdges()) {
    console.log(`  ${edge.sourceNodeId} -> ${edge.targetNodeId} (${edge.type})`)
  }

  console.log('\n✨ 条件图结构创建完成\n')
}

/**
 * 示例9: NodeGraph 的高级操作
 */
export async function nodeGraphAdvancedExample(): Promise<void> {
  console.log('\n=== NodeGraph 高级操作示例 ===\n')

  const graph = new NodeGraph()

  // 创建多个任务形成复杂的依赖关系
  const tasks = ['A', 'B', 'C', 'D', 'E', 'F']

  for (const taskId of tasks) {
    const taskConfig: TaskConfig = {
      id: taskId,
      name: `任务 ${taskId}`,
      executor: async () => {
        console.log(`执行任务 ${taskId}`)
        return { task: taskId, timestamp: Date.now() }
      },
      dependencies: [],
      tags: [],
      metadata: {},
    }
    graph.addNode(new TaskNode(taskConfig))
  }

  // 创建复杂的依赖关系
  // A -> B, A -> C
  // B -> D, C -> D
  // D -> E
  // C -> F
  const edges = [
    ['A', 'B'],
    ['A', 'C'],
    ['B', 'D'],
    ['C', 'D'],
    ['D', 'E'],
    ['C', 'F'],
  ]

  for (const [from, to] of edges) {
    graph.addEdge({
      id: `${from}_to_${to}`,
      type: EdgeType.DEPENDENCY,
      sourceNodeId: from,
      sourcePort: 'output',
      targetNodeId: to,
      targetPort: 'input',
    })
  }

  console.log('📊 复杂图结构:')
  console.log('  依赖关系:')
  console.log('    A -> B, C')
  console.log('    B -> D')
  console.log('    C -> D, F')
  console.log('    D -> E')

  // 1. 查看所有节点
  console.log('\n📋 所有节点:')
  for (const node of graph.getAllNodes()) {
    console.log(`  - ${node.id}: ${node.name}`)
  }

  // 2. 查看所有边
  console.log('\n📋 所有边:')
  for (const edge of graph.getAllEdges()) {
    console.log(`  - ${edge.id}: ${edge.sourceNodeId} -> ${edge.targetNodeId}`)
  }

  // 3. 节点查找
  console.log('\n🔍 节点查找:')
  const nodeA = graph.getNode('A')
  if (nodeA) {
    console.log(`  找到节点 A: ${nodeA.name} (${nodeA.type})`)
  }

  const nodeD = graph.getNode('D')
  if (nodeD) {
    console.log(`  找到节点 D: ${nodeD.name} (${nodeD.type})`)
  }

  // 4. 边查找
  console.log('\n🔍 边查找:')
  const edgeAB = graph.getEdge('A_to_B')
  if (edgeAB) {
    console.log(`  找到边 A->B: ${edgeAB.sourceNodeId} -> ${edgeAB.targetNodeId}`)
  }

  // 5. 图验证
  console.log('\n✅ 图验证:')
  const validation = graph.validate()
  console.log(`  有效性: ${validation.isValid}`)
  console.log(`  错误数: ${validation.errors.length}`)
  if (validation.errors.length > 0) {
    console.log(`  错误列表:`)
    for (const error of validation.errors) {
      console.log(`    - ${error}`)
    }
  }

  // 6. 统计信息
  console.log('\n📊 统计信息:')
  console.log(`  总节点数: ${graph.getAllNodes().length}`)
  console.log(`  总边数: ${graph.getAllEdges().length}`)

  console.log('\n✨ 高级操作完成\n')
}

/**
 * 示例10: 使用 NodeGraph.execute() 执行图并传递数据
 * 展示如何通过 execute 方法执行图，以及数据如何在节点间传递
 */
export async function nodeGraphExecutionExample(): Promise<void> {
  console.log('\n=== NodeGraph 执行与数据传递示例 ===\n')

  const graph = new NodeGraph()

  // 创建一个数据处理流程：sourceData（虚拟数据源） -> transform -> filter -> output

  // 转换节点 - 每个数字乘以2
  const transformTask: TaskConfig = {
    id: 'transform',
    name: '转换数据',
    executor: async (inputs: any) => {
      console.log('1. 转换节点接收数据:', inputs)
      console.log(`   数据类型: ${Array.isArray(inputs) ? 'Array' : 'Object'}`)

      // 根据 collectNodeInputs 的行为，inputs 可能是：
      // - 数组（当只有一个输入且值是数组时）
      // - 对象 { port: value }
      const numbers = Array.isArray(inputs) ? inputs : (inputs.input || inputs)

      const transformed = numbers.map((n: number) => n * 2)
      console.log(`   转换后: [${transformed.join(', ')}]`)
      return { numbers: transformed }
    },
    dependencies: [],
    tags: [],
    metadata: {},
  }

  // 过滤节点 - 只保留大于20的数字
  const filterTask: TaskConfig = {
    id: 'filter',
    name: '过滤数据',
    executor: async (inputs: any) => {
      console.log('2. 过滤节点接收数据:', inputs)
      const numbers = inputs.input?.numbers || inputs.numbers
      const filtered = numbers.filter((n: number) => n > 20)
      console.log(`   过滤后: [${filtered.join(', ')}]`)
      return { numbers: filtered, count: filtered.length }
    },
    dependencies: [],
    tags: [],
    metadata: {},
  }

  // 输出节点
  const outputTask: TaskConfig = {
    id: 'output',
    name: '输出结果',
    executor: async (inputs: any) => {
      console.log('3. 输出节点接收数据:', inputs)
      const numbers = inputs.input?.numbers || inputs.numbers
      const count = inputs.input?.count || inputs.count
      console.log(`   最终结果: [${numbers.join(', ')}], 共 ${count} 个数字`)
      return { final: numbers, count }
    },
    dependencies: [],
    tags: [],
    metadata: {},
  }

  // 添加节点
  graph.addNode(new TaskNode(transformTask))
  graph.addNode(new TaskNode(filterTask))
  graph.addNode(new TaskNode(outputTask))

  // 连接节点形成流水线
  // sourceData 是虚拟节点，通过 initialInputs 提供
  graph.addEdge({
    id: 'source_to_transform',
    type: EdgeType.DEPENDENCY,
    sourceNodeId: 'sourceData',
    sourcePort: 'output',
    targetNodeId: 'transform',
    targetPort: 'input',
  })

  graph.addEdge({
    id: 'transform_to_filter',
    type: EdgeType.DEPENDENCY,
    sourceNodeId: 'transform',
    sourcePort: 'output',
    targetNodeId: 'filter',
    targetPort: 'input',
  })

  graph.addEdge({
    id: 'filter_to_output',
    type: EdgeType.DEPENDENCY,
    sourceNodeId: 'filter',
    sourcePort: 'output',
    targetNodeId: 'output',
    targetPort: 'input',
  })

  console.log('📊 流程图结构:')
  console.log('  sourceData（虚拟）-> transform -> filter -> output\n')

  // 创建上下文管理器
  const { ContextManager } = await import('./context')
  const context = new ContextManager()

  // 设置一些共享上下文数据
  context.set('executionId', 'demo-123')
  context.set('timestamp', new Date().toISOString())

  console.log('🚀 开始执行图...\n')

  // graph.execute() 的 initialInputs 参数说明：
  // - key 是虚拟节点 ID（不需要真实存在的节点）
  // - value 是该虚拟节点的输出数据
  // - 通过 edge 连接到实际节点，数据就会传递过去
  const initialInputs = {
    sourceData: [10, 20, 30, 40, 50], // 虚拟节点 'sourceData' 的输出
  }

  console.log('📥 初始输入:', initialInputs)
  console.log('   虚拟节点 "sourceData" 提供数据: [10, 20, 30, 40, 50]')
  console.log()

  try {
    const result = await graph.execute(context, initialInputs)
    console.log('\n✅ 图执行完成!')
    console.log('📤 最终输出:', result)
  }
  catch (error) {
    console.error('❌ 执行失败:', error)
  }

  const separator = '='.repeat(60)
  console.log(`\n${separator}`)
  console.log('💡 数据传递机制详解:')
  console.log()
  console.log('1. **初始数据如何传递**')
  console.log('   graph.execute(context, { virtualNodeId: data })')
  console.log('   - virtualNodeId 不需要是真实节点')
  console.log('   - 数据通过 edge 连接传递给实际节点')
  console.log('   - initialInputs 会被包装成虚拟节点的输出')
  console.log()
  console.log('2. **节点接收数据的形式**')
  console.log('   - 第一个节点（从虚拟节点接收）：')
  console.log('     如果值是基本类型/数组，直接作为 inputs 传入')
  console.log('   - 后续节点（从实际节点接收）：')
  console.log('     inputs = { port1: value1, port2: value2 }')
  console.log()
  console.log('3. **节点输出数据**')
  console.log('   - 返回对象：{ key1: value1, key2: value2 }')
  console.log('   - 每个 key 可以通过 edge.sourcePort 连接到其他节点')
  console.log('   - 例如：return { numbers: [1,2,3], count: 3 }')
  console.log()
  console.log('4. **Edge 数据映射**')
  console.log('   - sourceNode.outputs[sourcePort] -> targetNode.inputs[targetPort]')
  console.log('   - 可以通过不同的 port 名称进行数据路由')
  console.log()
  console.log('5. **上下文管理器 (Context)**')
  console.log('   - 在所有节点间共享')
  console.log('   - 用于存储全局配置、状态等')
  console.log('   - 节点通过 context 参数访问')
  console.log()
  console.log('6. **最终输出格式**')
  console.log('   - 返回所有叶子节点的输出')
  console.log('   - 格式: { nodeId: { output: nodeOutputs } }')
  console.log(separator)

  console.log('\n✨ 执行与数据传递示例完成\n')
}

/**
 * 运行所有 NodeGraph 示例
 */
export async function runNodeGraphExamples(): Promise<void> {
  console.log('🚀 开始运行 NodeGraph 示例...\n')

  await directNodeGraphExample()
  await nodeGraphConditionalExample()
  await nodeGraphAdvancedExample()
  await nodeGraphExecutionExample()

  console.log('✅ 所有 NodeGraph 示例运行完成！')
}

// 如果直接运行此文件，则执行所有示例
if (require.main === module) {
  runDAGExamples()
}
