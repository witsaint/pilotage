/**
 * DAG Graph 使用示例
 */

import { ContextManager } from './context'
import {
  createDAGGraph,
  createDAGNode,
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

  // 类型安全的连接
  graph
    .addEdge({
      id: 'source_to_double',
      sourceNodeId: 'source',
      sourcePort: 'numbers', // ✅ TypeScript 自动检查
      targetNodeId: 'double',
      targetPort: 'numbers',
    })
    .addEdge({
      id: 'double_to_stats',
      sourceNodeId: 'double',
      sourcePort: 'doubled', // ✅ TypeScript 自动检查
      targetNodeId: 'stats',
      targetPort: 'doubled',
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

  // 并行分支
  graph
    .addEdge({
      id: 'source_to_double',
      sourceNodeId: 'source',
      sourcePort: 'numbers',
      targetNodeId: 'double',
      targetPort: 'numbers',
    })
    .addEdge({
      id: 'source_to_filter',
      sourceNodeId: 'source',
      sourcePort: 'numbers',
      targetNodeId: 'filter',
      targetPort: 'numbers',
    })
    .addEdge({
      id: 'double_to_merge',
      sourceNodeId: 'double',
      sourcePort: 'doubled',
      targetNodeId: 'merge',
      targetPort: 'doubled',
    })
    .addEdge({
      id: 'filter_to_merge',
      sourceNodeId: 'filter',
      sourcePort: 'filtered',
      targetNodeId: 'merge',
      targetPort: 'filtered',
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
    sourcePort: 'text', // string
    targetNodeId: 'length',
    targetPort: 'length', // number
    // 类型安全的转换函数
    transform: (text: string) => text.length,
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

  // 连接
  graph.addEdge({
    id: 'input_to_validate',
    sourceNodeId: 'input',
    sourcePort: 'name',
    targetNodeId: 'validate',
    targetPort: 'name',
  })
  graph.addEdge({
    id: 'input_age_to_validate',
    sourceNodeId: 'input',
    sourcePort: 'age',
    targetNodeId: 'validate',
    targetPort: 'age',
  })
  graph.addEdge({
    id: 'input_email_to_validate',
    sourceNodeId: 'input',
    sourcePort: 'email',
    targetNodeId: 'validate',
    targetPort: 'email',
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
    sourcePort: 'required',
    targetNodeId: 'processor',
    targetPort: 'required',
  })
  graph.addEdge({
    id: 'source1_optional_to_processor',
    sourceNodeId: 'source1',
    sourcePort: 'optional',
    targetNodeId: 'processor',
    targetPort: 'optional',
  })
  graph.addEdge({
    id: 'source1_nullable_to_processor',
    sourceNodeId: 'source1',
    sourcePort: 'nullable',
    targetNodeId: 'processor',
    targetPort: 'nullable',
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
    sourcePort: 'required',
    targetNodeId: 'processor',
    targetPort: 'required',
  })

  console.log('\n执行部分数据:\n')
  const context2 = new ContextManager()
  const result2 = await graph.execute(context2, {})
  console.log('结果2:', result2)

  console.log('\n✨ 可选输入示例完成\n')
}

// ==================== 示例 6: 图操作 ====================

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
    }),
  )

  nodes.forEach(node => graph.addNode(node))

  // 创建依赖关系: A -> B, A -> C, B -> D, C -> D, D -> E
  graph
    .addEdge({
      id: 'A_to_B',
      sourceNodeId: 'A',
      sourcePort: 'value',
      targetNodeId: 'B',
      targetPort: 'value',
    })
    .addEdge({
      id: 'A_to_C',
      sourceNodeId: 'A',
      sourcePort: 'value',
      targetNodeId: 'C',
      targetPort: 'value',
    })
    .addEdge({
      id: 'B_to_D',
      sourceNodeId: 'B',
      sourcePort: 'value',
      targetNodeId: 'D',
      targetPort: 'value',
    })
    .addEdge({
      id: 'C_to_D',
      sourceNodeId: 'C',
      sourcePort: 'value',
      targetNodeId: 'D',
      targetPort: 'value',
    })
    .addEdge({
      id: 'D_to_E',
      sourceNodeId: 'D',
      sourcePort: 'value',
      targetNodeId: 'E',
      targetPort: 'value',
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
  await dagGraphOperationsExample()

  console.log('='.repeat(60))
  console.log('\n✅ 所有 DAG Graph 示例运行完成！')
  console.log('\n💡 DAG Graph 特性总结:')
  console.log('  1. ✅ TypeScript 类型即配置 - 不需要重复声明端口')
  console.log('  2. ✅ 类型安全的端口连接 - 编译时检查兼容性')
  console.log('  3. ✅ 支持类型转换 - transform 函数')
  console.log('  4. ✅ 自定义验证器 - 运行时数据验证')
  console.log('  5. ✅ 支持可选输入 - 使用 TypeScript 可选属性')
  console.log('  6. ✅ 完整的图操作 - 增删改查')
  console.log('  7. ✅ 拓扑排序 - 自动确定执行顺序')
  console.log('  8. ✅ 循环检测 - 保证 DAG 的有效性')
}
