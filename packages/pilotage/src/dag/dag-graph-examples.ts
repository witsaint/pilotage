/**
 * DAG Graph 使用示例
 */

import { ContextManager } from './context'
import {
  createDAGGraph,
  createDAGNode,
  dagConditionNode,
  dagGraph,
  dagNode,
} from './dag-graph'

// ==================== 数据类型定义 ====================

// 空输入类型 - 用于源节点
type EmptyInput = Record<string, never>

interface NumberArrayData {
  numbers: number[]
}

interface DoubledData {
  doubled: number[]
}

interface StatisticsData {
  sum: number
  average: number
  count: number
}

interface FilteredData {
  filtered: number[]
  count: number
}

// ==================== 示例 1: 基础流程 ====================

/**
 * 示例1: 简单的数据处理流程
 */
export async function dagGraphBasicExample(): Promise<void> {
  console.log('\n=== DAG Graph 基础示例 ===\n')

  // 使用简短的函数名
  const graph = dagGraph()

  // 创建源节点
  const sourceNode = dagNode<EmptyInput, NumberArrayData>({
    id: 'source',
    name: '数据源',
    executor: async () => {
      console.log('生成数据...')
      return { numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }
    },
  })

  // 创建翻倍节点
  const doubleNode = dagNode<NumberArrayData, DoubledData>({
    id: 'double',
    name: '数字翻倍',
    executor: async (inputs) => {
      console.log('翻倍:', inputs.numbers)
      return {
        doubled: inputs.numbers.map(n => n * 2),
      }
    },
  })

  // 创建统计节点
  const statsNode = dagNode<DoubledData, StatisticsData>({
    id: 'stats',
    name: '计算统计',
    executor: async (inputs) => {
      console.log('统计:', inputs.doubled)
      const sum = inputs.doubled.reduce((a, b) => a + b, 0)
      return {
        sum,
        average: sum / inputs.doubled.length,
        count: inputs.doubled.length,
      }
    },
  })

  // 添加节点到图
  graph
    .addNode(sourceNode)
    .addNode(doubleNode)
    .addNode(statsNode)

  // 简化的连接 - 不需要指定端口
  graph
    .addEdge({
      id: 'source_to_double',
      sourceNodeId: 'source',
      targetNodeId: 'double',
    })
    .addEdge({
      id: 'double_to_stats',
      sourceNodeId: 'double',
      targetNodeId: 'stats',
    })

  // 验证图
  const validation = graph.validate()
  console.log('\n图验证:', validation.valid ? '✅ 通过' : '❌ 失败')
  if (!validation.valid) {
    console.log('错误:', validation.errors)
  }

  // 查看执行顺序
  console.log('执行顺序:', graph.getExecutionOrder())

  // 执行图
  console.log('\n开始执行:\n')
  const context = new ContextManager()
  const result = await graph.execute(context, {})

  console.log('\n最终结果:', result)
  console.log('\n✨ 基础示例完成\n')
}

// ==================== 示例 2: 并行流程 ====================

/**
 * 示例2: 并行处理多个分支
 */
export async function dagGraphParallelExample(): Promise<void> {
  console.log('\n=== DAG Graph 并行处理示例 ===\n')

  const graph = createDAGGraph()

  // 数据源
  const source = createDAGNode<EmptyInput, NumberArrayData>({
    id: 'source',
    name: '数据源',
    executor: async () => ({ numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }),
  })

  // 分支1: 翻倍
  const double = createDAGNode<NumberArrayData, DoubledData>({
    id: 'double',
    name: '翻倍',
    executor: async (inputs) => {
      console.log('分支1: 翻倍')
      return { doubled: inputs.numbers.map(n => n * 2) }
    },
  })

  // 分支2: 过滤
  const filter = createDAGNode<NumberArrayData, FilteredData>({
    id: 'filter',
    name: '过滤偶数',
    executor: async (inputs) => {
      console.log('分支2: 过滤偶数')
      const filtered = inputs.numbers.filter(n => n % 2 === 0)
      return { filtered, count: filtered.length }
    },
  })

  // 合并节点
  const merge = createDAGNode<{ doubled: number[], filtered: number[] }, { result: string }>({
    id: 'merge',
    name: '合并结果',
    executor: async (inputs) => {
      console.log('合并分支结果', inputs)
      return {
        result: `Doubled: ${inputs.doubled?.length || 0} items, Filtered: ${inputs.filtered?.length || 0} items`,
      }
    },
  })

  // 构建图
  graph
    .addNode(source)
    .addNode(double)
    .addNode(filter)
    .addNode(merge)

  // 并行分支 - 简化的连接
  graph
    .addEdge({
      id: 'source_to_double',
      sourceNodeId: 'source',
      targetNodeId: 'double',
    })
    .addEdge({
      id: 'source_to_filter',
      sourceNodeId: 'source',
      targetNodeId: 'filter',
    })
    .addEdge({
      id: 'double_to_merge',
      sourceNodeId: 'double',
      targetNodeId: 'merge',
    })
    .addEdge({
      id: 'filter_to_merge',
      sourceNodeId: 'filter',
      targetNodeId: 'merge',
    })

  console.log('执行并行流程:\n')
  const context = new ContextManager()
  const result = await graph.execute(context, {})

  console.log('\n最终结果:', result)
  console.log('\n✨ 并行示例完成\n')
}

// ==================== 示例 3: 类型转换 ====================

interface TextData {
  text: string
}

interface LengthData {
  length: number
}

interface DoubleLength {
  value: number
}

export async function dagGraphTransformExample(): Promise<void> {
  console.log('\n=== DAG Graph 类型转换示例 ===\n')

  const graph = dagGraph()

  const textNode = dagNode<EmptyInput, TextData>({
    id: 'text',
    name: '生成文本',
    executor: async () => ({ text: 'Hello, TypeScript DAG Graph!' }),
  })

  const lengthNode = dagNode<LengthData, DoubleLength>({
    id: 'length',
    name: '长度翻倍',
    executor: async (inputs) => {
      console.log('接收长度:', inputs.length)
      return { value: inputs.length * 2 }
    },
  })

  graph
    .addNode(textNode)
    .addNode(lengthNode)

  // 使用 transform 进行类型转换
  graph.addEdge({
    id: 'text_to_length',
    sourceNodeId: 'text',
    targetNodeId: 'length',
    // 类型安全的转换函数
    transform: (textData: { text: string }) => ({ length: textData.text.length }),
  })

  console.log('执行类型转换:\n')
  const context = new ContextManager()
  const result = await graph.execute(context, {})

  console.log('\n最终结果:', result)
  console.log('\n✨ 类型转换示例完成\n')
}

// ==================== 示例 4: 带验证器 ====================

interface UserInput {
  name: string
  age: number
  email?: string
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export async function dagGraphValidationExample(): Promise<void> {
  console.log('\n=== DAG Graph 数据验证示例 ===\n')

  const graph = dagGraph()

  // 输入节点
  const inputNode = dagNode<EmptyInput, UserInput>({
    id: 'input',
    name: '用户输入',
    executor: async () => ({
      name: 'John Doe',
      age: 30,
      email: 'john@example.com',
    }),
  })

  // 带验证器的节点
  const validateNode = dagNode<UserInput, ValidationResult>({
    id: 'validate',
    name: '验证用户数据',
    executor: async (inputs) => {
      console.log('验证用户:', inputs)
      const errors: string[] = []

      if (inputs.name.length < 2) {
        errors.push('Name must be at least 2 characters')
      }

      if (inputs.age < 0 || inputs.age > 150) {
        errors.push('Age must be between 0 and 150')
      }

      if (inputs.email && !inputs.email.includes('@')) {
        errors.push('Invalid email format')
      }

      return {
        isValid: errors.length === 0,
        errors,
      }
    },
    // 自定义验证器
    validators: {
      inputs: {
        name: (v: string) => v.length > 0,
        age: (v: number) => !Number.isNaN(v),
        email: (v: string | undefined) => !v || v.includes('@'),
      },
    },
  })

  graph.addNode(inputNode)
  graph.addNode(validateNode)

  // 简化的连接
  graph.addEdge({
    id: 'input_to_validate',
    sourceNodeId: 'input',
    targetNodeId: 'validate',
  })

  console.log('执行验证（有效数据）:\n')
  const context = new ContextManager()
  const result = await graph.execute(context, {})

  console.log('\n结果:', result)
  console.log('\n✨ 验证示例完成\n')
}

// ==================== 示例 5: 可选输入 ====================

/**
 * 示例5: 处理可选输入
 */
export async function dagGraphOptionalInputExample(): Promise<void> {
  console.log('\n=== DAG Graph 可选输入示例 ===\n')

  const graph = dagGraph()

  // 定义带可选字段的输入类型
  interface OptionalInputData {
    required: string
    optional?: number // 可选字段
    nullable?: string | null // 可为 null 的字段
  }

  interface ProcessedData {
    result: string
    hasOptional: boolean
    hasNullable: boolean
  }

  // 源节点 - 提供部分数据
  const source1 = dagNode<EmptyInput, OptionalInputData>({
    id: 'source1',
    name: '完整数据源',
    executor: async () => ({
      required: 'Hello',
      optional: 42,
      nullable: 'World',
    }),
  })

  const source2 = dagNode<EmptyInput, OptionalInputData>({
    id: 'source2',
    name: '部分数据源',
    executor: async () => ({
      required: 'Hi',
      // optional 和 nullable 省略
    }),
  })

  // 处理节点 - 需要处理可选输入
  const processor = dagNode<OptionalInputData, ProcessedData>({
    id: 'processor',
    name: '处理可选数据',
    executor: async (inputs) => {
      console.log('接收到的输入:', inputs)

      // 使用可选链和空值合并运算符
      const optionalValue = inputs.optional ?? 0
      const nullableValue = inputs.nullable ?? 'default'

      return {
        result: `${inputs.required} - ${optionalValue} - ${nullableValue}`,
        hasOptional: inputs.optional !== undefined,
        hasNullable: inputs.nullable !== undefined && inputs.nullable !== null,
      }
    },
    validators: {
      inputs: {
        required: (v: string) => v.length > 0,
        optional: (v: number | undefined) => v === undefined || v >= 0,
        nullable: (_v: string | null | undefined) => true, // 总是有效
      },
    },
  })

  graph
    .addNode(source1)
    .addNode(processor)

  graph.addEdge({
    id: 'source1_to_processor',
    sourceNodeId: 'source1',
    targetNodeId: 'processor',
  })

  console.log('执行完整数据:\n')
  const context1 = new ContextManager()
  const result1 = await graph.execute(context1, {})
  console.log('结果1:', result1)

  // 使用部分数据源
  graph.clear()
  graph.addNode(source2).addNode(processor)
  graph.addEdge({
    id: 'source2_to_processor',
    sourceNodeId: 'source2',
    targetNodeId: 'processor',
  })

  console.log('\n执行部分数据:\n')
  const context2 = new ContextManager()
  const result2 = await graph.execute(context2, {})
  console.log('结果2:', result2)

  console.log('\n✨ 可选输入示例完成\n')
}

// ==================== 示例 6: 类型安全检测 ====================

/**
 * 示例6: 类型安全检测 - 演示编译时错误检测
 */
export async function dagGraphTypeSafetyExample(): Promise<void> {
  console.log('\n=== DAG Graph 类型安全检测示例 ===\n')

  const graph = dagGraph()

  // 创建节点
  const source = dagNode<EmptyInput, { data: string }>({
    id: 'source',
    name: '数据源',
    executor: async () => ({ data: 'Hello' }),
  })

  const processor = dagNode<{ data: string }, { result: string }>({
    id: 'processor',
    name: '处理器',
    executor: async inputs => ({ result: inputs.data.toUpperCase() }),
  })

  // 添加节点
  graph.addNode(source).addNode(processor)

  // ✅ 正确的连接 - 这应该能通过类型检查
  graph.addEdge({
    id: 'correct_edge',
    sourceNodeId: 'source',
    targetNodeId: 'processor',
  })

  console.log('✅ 类型安全的边连接已创建')
  console.log('💡 尝试取消注释错误的连接代码，TypeScript 会报错！')

  // 执行图
  const context = new ContextManager()
  const result = await graph.execute(context, {})
  console.log('执行结果:', result)

  console.log('\n✨ 类型安全检测示例完成\n')
}

// ==================== 示例 7: 便捷连接方法 ====================

/**
 * 示例7: 使用便捷的 connect 方法
 */
export async function dagGraphConnectExample(): Promise<void> {
  console.log('\n=== DAG Graph 便捷连接示例 ===\n')

  const graph = dagGraph()

  // 创建节点
  const source = dagNode<EmptyInput, { message: string }>({
    id: 'source',
    name: '消息源',
    executor: async () => ({ message: 'Hello, World!' }),
  })

  const processor = dagNode<{ message: string }, { result: string }>({
    id: 'processor',
    name: '消息处理器',
    executor: async inputs => ({ result: inputs.message.toUpperCase() }),
  })

  const logger = dagNode<{ result: string }, { logged: boolean }>({
    id: 'logger',
    name: '日志记录器',
    executor: async (inputs) => {
      console.log('处理结果:', inputs.result)
      return { logged: true }
    },
  })

  // 使用便捷的 connect 方法 - 自动添加节点
  graph
    .connect(source, processor)
    .connect(processor, logger)

  console.log('使用便捷连接方法构建图:\n')
  const context = new ContextManager()
  const result = await graph.execute(context, {})

  console.log('\n最终结果:', result)
  console.log('\n✨ 便捷连接示例完成\n')
}

// ==================== 示例 8: 自动添加节点 ====================

/**
 * 示例8: 自动添加节点功能
 */
export async function dagGraphAutoAddNodesExample(): Promise<void> {
  console.log('\n=== DAG Graph 自动添加节点示例 ===\n')

  const graph = dagGraph()

  // 创建节点
  const source = dagNode<EmptyInput, { data: string }>({
    id: 'source',
    name: '数据源',
    executor: async () => ({ data: 'Auto Add Nodes!' }),
  })

  const processor = dagNode<{ data: string }, { result: string }>({
    id: 'processor',
    name: '处理器',
    executor: async inputs => ({ result: inputs.data.toUpperCase() }),
  })

  const logger = dagNode<{ result: string }, { logged: boolean }>({
    id: 'logger',
    name: '日志记录器',
    executor: async (inputs) => {
      console.log('自动添加节点结果:', inputs.result)
      return { logged: true }
    },
  })

  // 方式1: 自动添加节点（默认行为）
  console.log('方式1: 自动添加节点（默认）')
  graph.connect(source, processor)
  graph.connect(processor, logger)

  console.log('节点数:', graph.getAllNodes().length) // 应该是 3
  console.log('边数:', graph.getAllEdges().length) // 应该是 2

  // 清空图，演示方式2
  graph.clear()

  // 方式2: 禁用自动添加节点
  console.log('\n方式2: 禁用自动添加节点')
  graph.addNode(source) // 手动添加源节点
  graph.addNode(processor) // 手动添加 processor 节点
  graph.connect(source, processor, { autoAddNodes: false }) // 不会自动添加新节点
  // 不连接 processor 到 logger，因为 logger 没有被添加

  console.log('节点数:', graph.getAllNodes().length) // 应该是 2（source 和 processor）
  console.log('边数:', graph.getAllEdges().length) // 应该是 1（source -> processor）

  // 清空图，演示方式3
  graph.clear()

  // 方式3: 混合使用
  console.log('\n方式3: 混合使用')
  graph.addNode(source) // 手动添加源节点
  graph.connect(source, processor) // 自动添加 processor
  graph.connect(processor, logger) // 自动添加 logger

  console.log('节点数:', graph.getAllNodes().length) // 应该是 3
  console.log('边数:', graph.getAllEdges().length) // 应该是 2

  // 执行图
  console.log('\n执行图:')
  const context = new ContextManager()
  const result = await graph.execute(context, {})

  console.log('最终结果:', result)
  console.log('\n✨ 自动添加节点示例完成\n')
}

// ==================== 示例 9: 条件节点 ====================

/**
 * 示例9: 条件节点功能
 */
export async function dagGraphConditionalExample(): Promise<void> {
  console.log('\n=== DAG Graph 条件节点示例 ===\n')

  const graph = dagGraph()

  // 创建数据源节点
  const source = dagNode<EmptyInput, { value: number }>({
    id: 'source',
    name: '数据源',
    executor: async () => {
      const value = Math.random() * 100
      console.log(`生成随机值: ${value}`)
      return { value }
    },
  })

  // 创建条件节点
  const condition = dagConditionNode<{ value: number }, 'high' | 'low'>({
    id: 'condition',
    name: '条件判断',
    branches: ['high', 'low'], // 分支名称：high 和 low
    condition: async (inputs) => {
      const result = inputs.value > 50 ? 'high' : 'low'
      console.log(`条件判断: ${inputs.value} > 50 = ${result}`)
      return result
    },
  })

  // 创建高值分支节点
  const highBranch = dagNode<{ value: number }, { result: string }>({
    id: 'highBranch',
    name: '高值处理',
    executor: async (inputs) => {
      console.log(`处理高值: ${inputs.value}`)
      return { result: `高值: ${inputs.value}` }
    },
  })

  // 创建低值分支节点
  const lowBranch = dagNode<{ value: number }, { result: string }>({
    id: 'lowBranch',
    name: '低值处理',
    executor: async (inputs) => {
      console.log(`处理低值: ${inputs.value}`)
      return { result: `低值: ${inputs.value}` }
    },
  })

  // 创建合并节点
  const merge = dagNode<{ result: string }, { final: string }>({
    id: 'merge',
    name: '结果合并',
    executor: async (inputs) => {
      console.log(`合并结果: ${inputs.result}`)
      return { final: `最终结果: ${inputs.result}` }
    },
  })

  // 添加节点到图
  graph
    .addNode(source)
    .addConditionNode(condition)
    .addNode(highBranch)
    .addNode(lowBranch)
    .addNode(merge)

  // 连接节点
  graph
    .addEdge({ id: 'source_to_condition', sourceNodeId: 'source', targetNodeId: 'condition' })
    .addEdge({ id: 'high', sourceNodeId: 'condition', targetNodeId: 'highBranch' })
    .addEdge({ id: 'low', sourceNodeId: 'condition', targetNodeId: 'lowBranch' })
    .addEdge({ id: 'high_to_merge', sourceNodeId: 'highBranch', targetNodeId: 'merge' })
    .addEdge({ id: 'low_to_merge', sourceNodeId: 'lowBranch', targetNodeId: 'merge' })

  console.log('图验证:', graph.validate() ? '✅ 通过' : '❌ 失败')
  console.log('执行顺序:', graph.getExecutionOrder())

  // 执行图
  console.log('\n开始执行:')
  const context = new ContextManager()
  const result = await graph.execute(context, {})

  console.log('\n最终结果:', result)
  console.log('\n✨ 条件节点示例完成\n')
}

// ==================== 示例 10: 多分支条件节点 ====================

/**
 * 示例10: 多分支条件节点功能
 */
export async function dagGraphMultiBranchExample(): Promise<void> {
  console.log('\n=== DAG Graph 多分支条件节点示例 ===\n')

  const graph = dagGraph()

  // 创建数据源节点
  const source = dagNode<EmptyInput, { score: number }>({
    id: 'source',
    name: '成绩数据源',
    executor: async () => {
      const score = Math.floor(Math.random() * 100)
      console.log(`生成成绩: ${score}`)
      return { score }
    },
  })

  // 创建多分支条件节点
  const gradeCondition = dagConditionNode<{ score: number }, 'A' | 'B' | 'C' | 'D' | 'F'>({
    id: 'gradeCondition',
    name: '成绩分级',
    branches: ['A', 'B', 'C', 'D', 'F'],
    condition: async (inputs) => {
      const { score } = inputs
      let grade: 'A' | 'B' | 'C' | 'D' | 'F'

      if (score >= 90)
        grade = 'A'
      else if (score >= 80)
        grade = 'B'
      else if (score >= 70)
        grade = 'C'
      else if (score >= 60)
        grade = 'D'
      else grade = 'F'

      console.log(`成绩分级: ${score} -> ${grade}`)
      return grade
    },
  })

  // 创建各个等级的处理节点
  const gradeA = dagNode<{ score: number }, { result: string }>({
    id: 'gradeA',
    name: '优秀处理',
    executor: async (inputs) => {
      console.log(`处理优秀成绩: ${inputs.score}`)
      return { result: `优秀! 成绩: ${inputs.score}` }
    },
  })

  const gradeB = dagNode<{ score: number }, { result: string }>({
    id: 'gradeB',
    name: '良好处理',
    executor: async (inputs) => {
      console.log(`处理良好成绩: ${inputs.score}`)
      return { result: `良好! 成绩: ${inputs.score}` }
    },
  })

  const gradeC = dagNode<{ score: number }, { result: string }>({
    id: 'gradeC',
    name: '中等处理',
    executor: async (inputs) => {
      console.log(`处理中等成绩: ${inputs.score}`)
      return { result: `中等! 成绩: ${inputs.score}` }
    },
  })

  const gradeD = dagNode<{ score: number }, { result: string }>({
    id: 'gradeD',
    name: '及格处理',
    executor: async (inputs) => {
      console.log(`处理及格成绩: ${inputs.score}`)
      return { result: `及格! 成绩: ${inputs.score}` }
    },
  })

  const gradeF = dagNode<{ score: number }, { result: string }>({
    id: 'gradeF',
    name: '不及格处理',
    executor: async (inputs) => {
      console.log(`处理不及格成绩: ${inputs.score}`)
      return { result: `不及格! 成绩: ${inputs.score}` }
    },
  })

  // 创建合并节点
  const merge = dagNode<{ result: string }, { final: string }>({
    id: 'merge',
    name: '结果合并',
    executor: async (inputs) => {
      console.log(`合并结果: ${inputs.result}`)
      return { final: `最终结果: ${inputs.result}` }
    },
  })

  // 添加节点到图
  graph
    .addNode(source)
    .addConditionNode(gradeCondition)
    .addNode(gradeA)
    .addNode(gradeB)
    .addNode(gradeC)
    .addNode(gradeD)
    .addNode(gradeF)
    .addNode(merge)

  // 连接节点
  graph
    .addEdge({ id: 'source_to_condition', sourceNodeId: 'source', targetNodeId: 'gradeCondition' })
    .addEdge({ id: 'A', sourceNodeId: 'gradeCondition', targetNodeId: 'gradeA' })
    .addEdge({ id: 'B', sourceNodeId: 'gradeCondition', targetNodeId: 'gradeB' })
    .addEdge({ id: 'C', sourceNodeId: 'gradeCondition', targetNodeId: 'gradeC' })
    .addEdge({ id: 'D', sourceNodeId: 'gradeCondition', targetNodeId: 'gradeD' })
    .addEdge({ id: 'F', sourceNodeId: 'gradeCondition', targetNodeId: 'gradeF' })
    .addEdge({ id: 'A_to_merge', sourceNodeId: 'gradeA', targetNodeId: 'merge' })
    .addEdge({ id: 'B_to_merge', sourceNodeId: 'gradeB', targetNodeId: 'merge' })
    .addEdge({ id: 'C_to_merge', sourceNodeId: 'gradeC', targetNodeId: 'merge' })
    .addEdge({ id: 'D_to_merge', sourceNodeId: 'gradeD', targetNodeId: 'merge' })
    .addEdge({ id: 'F_to_merge', sourceNodeId: 'gradeF', targetNodeId: 'merge' })

  console.log('图验证:', graph.validate() ? '✅ 通过' : '❌ 失败')
  console.log('执行顺序:', graph.getExecutionOrder())

  // 执行图
  console.log('\n开始执行:')
  const context = new ContextManager()
  const result = await graph.execute(context, {})

  console.log('\n最终结果:', result)
  console.log('\n✨ 多分支条件节点示例完成\n')
}

// ==================== 示例 11: 条件节点 connect 方法 ====================

/**
 * 示例11: 条件节点 connect 方法
 */
export async function dagGraphConditionalConnectExample(): Promise<void> {
  console.log('\n=== DAG Graph 条件节点 connect 方法示例 ===\n')

  const graph = dagGraph()

  // 创建数据源节点
  const source = dagNode<EmptyInput, { value: number }>({
    id: 'source',
    name: '数据源',
    executor: async () => {
      const value = Math.random() * 100
      console.log(`生成随机值: ${value}`)
      return { value }
    },
  })

  // 创建条件节点
  const condition = dagConditionNode<{ value: number }, 'high' | 'low'>({
    id: 'condition',
    name: '条件判断',
    branches: ['high', 'low'],
    condition: async (inputs) => {
      const result = inputs.value > 50 ? 'high' : 'low'
      console.log(`条件判断: ${inputs.value} > 50 = ${result}`)
      return result
    },
  })

  // 创建分支节点
  const highBranch = dagNode<{ value: number }, { result: string }>({
    id: 'highBranch',
    name: '高值处理',
    executor: async (inputs) => {
      console.log(`处理高值: ${inputs.value}`)
      return { result: `高值: ${inputs.value}` }
    },
  })

  const lowBranch = dagNode<{ value: number }, { result: string }>({
    id: 'lowBranch',
    name: '低值处理',
    executor: async (inputs) => {
      console.log(`处理低值: ${inputs.value}`)
      return { result: `低值: ${inputs.value}` }
    },
  })

  // 创建合并节点
  const merge = dagNode<{ result: string }, { final: string }>({
    id: 'merge',
    name: '结果合并',
    executor: async (inputs) => {
      console.log(`合并结果: ${inputs.result}`)
      return { final: `最终结果: ${inputs.result}` }
    },
  })

  // 使用 connect 方法连接节点
  graph
    .connect(source, condition as any)
    .connect(condition as any, highBranch)
    .connect(condition as any, lowBranch)
    .connect(highBranch, merge)
    .connect(lowBranch, merge)

  console.log('图验证:', graph.validate() ? '✅ 通过' : '❌ 失败')
  console.log('执行顺序:', graph.getExecutionOrder())

  // 执行图
  console.log('\n开始执行:')
  const context = new ContextManager()
  const result = await graph.execute(context, {})

  console.log('\n最终结果:', result)
  console.log('\n✨ 条件节点 connect 方法示例完成\n')
}

// ==================== 示例 12: 图操作 ====================

export async function dagGraphOperationsExample(): Promise<void> {
  console.log('\n=== DAG Graph 图操作示例 ===\n')

  const graph = dagGraph()

  // 添加多个节点
  const nodes = ['A', 'B', 'C', 'D', 'E'].map(id =>
    dagNode<{ value: number }, { value: number }>({
      id,
      name: `节点 ${id}`,
      executor: async (inputs) => {
        console.log(`执行节点 ${id}`)
        return { value: inputs.value + 1 }
      },
    }))

  nodes.forEach(node => graph.addNode(node))

  // 创建依赖关系: A -> B, A -> C, B -> D, C -> D, D -> E
  graph
    .addEdge({
      id: 'A_to_B',
      sourceNodeId: 'A',
      targetNodeId: 'B',
    })
    .addEdge({
      id: 'A_to_C',
      sourceNodeId: 'A',
      targetNodeId: 'C',
    })
    .addEdge({
      id: 'B_to_D',
      sourceNodeId: 'B',
      targetNodeId: 'D',
    })
    .addEdge({
      id: 'C_to_D',
      sourceNodeId: 'C',
      targetNodeId: 'D',
    })
    .addEdge({
      id: 'D_to_E',
      sourceNodeId: 'D',
      targetNodeId: 'E',
    })

  console.log('图信息:')
  console.log(`  节点数: ${graph.getAllNodes().length}`)
  console.log(`  边数: ${graph.getAllEdges().length}`)
  console.log(`  执行顺序: ${graph.getExecutionOrder().join(' -> ')}`)

  // 验证图
  const validation = graph.validate()
  console.log(`  有效性: ${validation.valid ? '✅' : '❌'}`)

  // 移除一条边
  console.log('\n移除边 C_to_D...')
  graph.removeEdge('C_to_D')
  console.log(`  新的执行顺序: ${graph.getExecutionOrder().join(' -> ')}`)

  // 移除一个节点
  console.log('\n移除节点 E...')
  graph.removeNode('E')
  console.log(`  剩余节点: ${graph.getAllNodes().map(n => n.id).join(', ')}`)

  console.log('\n✨ 图操作示例完成\n')
}

// ==================== 运行所有示例 ====================

/**
 * 运行所有 DAG Graph 示例
 */
export async function runDAGGraphExamples(): Promise<void> {
  console.log('🚀 开始运行 DAG Graph 示例...\n')
  console.log('='.repeat(60))

  await dagGraphBasicExample()
  await dagGraphParallelExample()
  await dagGraphTransformExample()
  await dagGraphValidationExample()
  await dagGraphOptionalInputExample()
  await dagGraphTypeSafetyExample()
  await dagGraphConnectExample()
  await dagGraphAutoAddNodesExample()
  await dagGraphConditionalExample()
  await dagGraphMultiBranchExample()
  await dagGraphConditionalConnectExample()
  await dagGraphOperationsExample()

  console.log('='.repeat(60))
  console.log('\n✅ 所有 DAG Graph 示例运行完成！')
  console.log('\n💡 DAG Graph 特性总结:')
  console.log('  1. ✅ TypeScript 类型即配置 - 不需要重复声明端口')
  console.log('  2. ✅ 简化的边连接 - 不需要指定端口，直接连接节点')
  console.log('  3. ✅ 支持类型转换 - transform 函数')
  console.log('  4. ✅ 自定义验证器 - 运行时数据验证')
  console.log('  5. ✅ 支持可选输入 - 使用 TypeScript 可选属性')
  console.log('  6. ✅ 强类型边连接 - 检测节点ID和类型匹配')
  console.log('  7. ✅ 便捷连接方法 - connect() 直接连接节点对象')
  console.log('  8. ✅ 自动添加节点 - connect() 自动添加未添加的节点')
  console.log('  9. ✅ 条件节点支持 - 支持条件分支和合并')
  console.log('  10. ✅ 多分支条件节点 - 支持任意数量的分支')
  console.log('  11. ✅ 条件节点 connect 方法 - 条件节点支持便捷连接')
  console.log('  12. ✅ 完整的图操作 - 增删改查')
  console.log('  13. ✅ 拓扑排序 - 自动确定执行顺序')
  console.log('  14. ✅ 循环检测 - 保证 DAG 的有效性')
}
