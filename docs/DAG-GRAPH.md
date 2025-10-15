# DAG Graph - 类型安全的有向无环图系统

## 概述

DAG Graph 是一个类型安全的有向无环图（Directed Acyclic Graph）执行系统，它利用 TypeScript 的类型推导能力，提供了简洁而强大的 API，无需重复配置端口定义。

## 核心特性

### 1. TypeScript 类型即配置

不需要显式声明输入输出端口，TypeScript 会自动从泛型参数中推导：

```typescript
// ❌ 旧方式：需要重复声明端口
const node = createNode({
  inputs: [
    { name: 'numbers', type: 'number[]' }
  ],
  outputs: [
    { name: 'doubled', type: 'number[]' }
  ],
  executor: async (inputs) => { /* ... */ }
})

// ✅ 新方式：类型即配置
const node = dagNode<
  { numbers: number[] },  // 输入类型
  { doubled: number[] }   // 输出类型
>({
  id: 'double',
  name: '翻倍',
  executor: async (inputs) => {
    // inputs.numbers 自动推导为 number[]
    return { doubled: inputs.numbers.map(n => n * 2) }
  }
})
```

### 2. 类型安全的端口连接

连接节点时，TypeScript 会自动检查端口名称和类型兼容性：

```typescript
// ✅ 正确的连接
graph.addEdge({
  id: 'edge1',
  sourceNodeId: 'source',
  sourcePort: 'numbers',  // ✅ TypeScript 知道这个端口存在
  targetNodeId: 'double',
  targetPort: 'numbers',  // ✅ TypeScript 知道这个端口存在
})

// ❌ 错误的连接（编译时会报错）
graph.addEdge({
  id: 'edge2',
  sourceNodeId: 'source',
  sourcePort: 'invalid',  // ❌ TypeScript 报错：端口不存在
  targetNodeId: 'double',
  targetPort: 'numbers',
})
```

### 3. 支持类型转换

当两个节点的端口类型不兼容时，可以使用 `transform` 函数进行转换：

```typescript
graph.addEdge({
  id: 'text_to_length',
  sourceNodeId: 'text',
  sourcePort: 'text',      // string
  targetNodeId: 'length',
  targetPort: 'length',    // number
  // 类型安全的转换函数
  transform: (text: string) => text.length,
})
```

### 4. 自定义验证器

可以为节点的输入输出添加自定义验证逻辑：

```typescript
const validateNode = dagNode<UserInput, ValidationResult>({
  id: 'validate',
  name: '验证用户数据',
  executor: async (inputs) => {
    // 验证逻辑
    return { isValid: true, errors: [] }
  },
  validators: {
    inputs: {
      name: (v: string) => v.length > 0,
      age: (v: number) => !isNaN(v) && v >= 0 && v <= 150,
      email: (v?: string) => !v || v.includes('@'),
    },
  },
})
```

### 5. 完整的图操作

支持动态添加、删除节点和边：

```typescript
// 添加节点
graph.addNode(node1)
graph.addNode(node2)

// 添加边
graph.addEdge(edge1)

// 移除边
graph.removeEdge('edge1')

// 移除节点
graph.removeNode('node1')

// 清空图
graph.clear()

// 重置所有节点状态
graph.reset()
```

### 6. 自动拓扑排序

图会自动计算正确的执行顺序：

```typescript
const order = graph.getExecutionOrder()
console.log(order)  // ['A', 'B', 'C', 'D', 'E']
```

### 7. 循环依赖检测

执行前会自动检测循环依赖：

```typescript
const validation = graph.validate()
if (!validation.valid) {
  console.log('错误:', validation.errors)
  // ['Graph contains circular dependencies']
}
```

## API 参考

### 创建节点

```typescript
// 完整函数名
const node = createDAGNode<TInput, TOutput>(config)

// 简短函数名
const node = dagNode<TInput, TOutput>(config)
```

**配置选项：**

```typescript
interface DAGNodeConfig<TInput, TOutput> {
  id: string                                              // 节点 ID（唯一）
  name: string                                            // 节点名称
  executor: (inputs: TInput, context: IContextManager) => Promise<TOutput>
  tags?: string[]                                         // 标签
  metadata?: Record<string, unknown>                      // 元数据
  
  // 可选的验证器
  validators?: {
    inputs?: Partial<Record<keyof TInput, (value: any) => boolean>>
    outputs?: Partial<Record<keyof TOutput, (value: any) => boolean>>
  }
}
```

### 创建图

```typescript
// 完整函数名
const graph = createDAGGraph()

// 简短函数名
const graph = dagGraph()
```

### 添加边

```typescript
graph.addEdge<TSource, TTarget, TSourceKey, TTargetKey>({
  id: string                    // 边 ID（唯一）
  sourceNodeId: string          // 源节点 ID
  sourcePort: TSourceKey        // 源端口名称
  targetNodeId: string          // 目标节点 ID
  targetPort: TTargetKey        // 目标端口名称
  transform?: (value: TSource[TSourceKey]) => TTarget[TTargetKey]  // 可选的类型转换函数
})
```

### 执行图

```typescript
const results = await graph.execute(
  context: IContextManager,
  initialInputs?: Record<string, any>
)
```

### 验证图

```typescript
const validation = graph.validate()
// { valid: boolean, errors: string[] }
```

### 其他方法

```typescript
// 获取节点
const node = graph.getNode('nodeId')

// 获取所有节点
const nodes = graph.getAllNodes()

// 获取所有边
const edges = graph.getAllEdges()

// 移除节点
graph.removeNode('nodeId')

// 移除边
graph.removeEdge('edgeId')

// 清空图
graph.clear()

// 重置所有节点状态
graph.reset()

// 获取执行顺序
const order = graph.getExecutionOrder()
```

## 使用示例

### 基础示例

```typescript
import { dagGraph, dagNode } from 'pilotage'
import { ContextManager } from 'pilotage'

// 创建图
const graph = dagGraph()

// 创建源节点
const source = dagNode<{}, { numbers: number[] }>({
  id: 'source',
  name: '数据源',
  executor: async () => ({ numbers: [1, 2, 3, 4, 5] })
})

// 创建处理节点
const double = dagNode<{ numbers: number[] }, { doubled: number[] }>({
  id: 'double',
  name: '翻倍',
  executor: async (inputs) => ({
    doubled: inputs.numbers.map(n => n * 2)
  })
})

// 创建统计节点
const stats = dagNode<{ doubled: number[] }, { sum: number, average: number }>({
  id: 'stats',
  name: '统计',
  executor: async (inputs) => {
    const sum = inputs.doubled.reduce((a, b) => a + b, 0)
    return { sum, average: sum / inputs.doubled.length }
  }
})

// 构建图
graph
  .addNode(source)
  .addNode(double)
  .addNode(stats)
  .addEdge({
    id: 'source_to_double',
    sourceNodeId: 'source',
    sourcePort: 'numbers',
    targetNodeId: 'double',
    targetPort: 'numbers',
  })
  .addEdge({
    id: 'double_to_stats',
    sourceNodeId: 'double',
    sourcePort: 'doubled',
    targetNodeId: 'stats',
    targetPort: 'doubled',
  })

// 执行
const context = new ContextManager()
const result = await graph.execute(context, {})
console.log(result)  // { stats: { sum: 30, average: 6 } }
```

### 并行处理示例

```typescript
const graph = dagGraph()

// 数据源
const source = dagNode<{}, { numbers: number[] }>({
  id: 'source',
  executor: async () => ({ numbers: [1, 2, 3, 4, 5] })
})

// 分支1：翻倍
const double = dagNode<{ numbers: number[] }, { doubled: number[] }>({
  id: 'double',
  executor: async (inputs) => ({
    doubled: inputs.numbers.map(n => n * 2)
  })
})

// 分支2：过滤偶数
const filter = dagNode<{ numbers: number[] }, { filtered: number[] }>({
  id: 'filter',
  executor: async (inputs) => ({
    filtered: inputs.numbers.filter(n => n % 2 === 0)
  })
})

// 合并节点
const merge = dagNode<{ doubled: number[], filtered: number[] }, { result: string }>({
  id: 'merge',
  executor: async (inputs) => ({
    result: `Doubled: ${inputs.doubled.length}, Filtered: ${inputs.filtered.length}`
  })
})

// 构建并行流程
graph
  .addNode(source)
  .addNode(double)
  .addNode(filter)
  .addNode(merge)
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

const context = new ContextManager()
const result = await graph.execute(context, {})
```

### 类型转换示例

```typescript
import { dagGraph, dagNode, ContextManager } from 'pilotage'

// 空输入类型
type EmptyInput = Record<string, never>

const graph = dagGraph()

const textNode = dagNode<EmptyInput, { text: string }>({
  id: 'text',
  executor: async () => ({ text: 'Hello, World!' })
})

const lengthNode = dagNode<{ length: number }, { value: number }>({
  id: 'length',
  executor: async (inputs) => ({ value: inputs.length * 2 })
})

graph
  .addNode(textNode)
  .addNode(lengthNode)
  .addEdge({
    id: 'text_to_length',
    sourceNodeId: 'text',
    sourcePort: 'text',      // string
    targetNodeId: 'length',
    targetPort: 'length',    // number
    // 类型转换
    transform: (text: string) => text.length,
  })

const context = new ContextManager()
const result = await graph.execute(context, {})
```

### 可选输入示例

```typescript
import { dagGraph, dagNode, ContextManager } from 'pilotage'

type EmptyInput = Record<string, never>

// 定义带可选字段的输入类型
interface OptionalInputData {
  required: string
  optional?: number        // 可选字段
  nullable?: string | null // 可为 null 的字段
}

interface ProcessedData {
  result: string
  hasOptional: boolean
}

const graph = dagGraph()

// 源节点 - 可能提供部分数据
const source = dagNode<EmptyInput, OptionalInputData>({
  id: 'source',
  executor: async () => ({
    required: 'Hello',
    // optional 和 nullable 可以省略
  })
})

// 处理节点 - 需要处理可选输入
const processor = dagNode<OptionalInputData, ProcessedData>({
  id: 'processor',
  executor: async (inputs) => {
    // 使用空值合并运算符提供默认值
    const optionalValue = inputs.optional ?? 0
    const nullableValue = inputs.nullable ?? 'default'
    
    return {
      result: `${inputs.required} - ${optionalValue} - ${nullableValue}`,
      hasOptional: inputs.optional !== undefined,
    }
  },
  validators: {
    inputs: {
      required: (v: string) => v.length > 0,
      optional: (v: number | undefined) => v === undefined || v >= 0,
    },
  },
})

graph
  .addNode(source)
  .addNode(processor)
  .addEdge({
    id: 'source_to_processor',
    sourceNodeId: 'source',
    sourcePort: 'required',
    targetNodeId: 'processor',
    targetPort: 'required',
  })

const context = new ContextManager()
const result = await graph.execute(context, {})
```

## 与旧系统的对比

| 特性 | TypedGraph (旧) | DAG Graph (新) |
|------|----------------|----------------|
| 端口定义 | 需要显式声明 `PortDefinition[]` | 类型参数自动推导 |
| 类型安全 | ✅ | ✅ |
| 编译时检查 | ✅ | ✅ |
| 运行时验证 | ✅ | ✅（可选） |
| API 复杂度 | 较高 | 低 |
| 代码量 | 多 | 少 |
| 类型转换 | ✅ | ✅ |
| 自定义验证器 | ✅ | ✅ |

## 最佳实践

### 1. 明确定义类型

始终使用 interface 或 type 定义输入输出类型，而不是内联对象类型：

```typescript
// ✅ 推荐
interface NumberArrayInput {
  numbers: number[]
}

interface DoubledOutput {
  doubled: number[]
}

const node = dagNode<NumberArrayInput, DoubledOutput>({ /* ... */ })

// ❌ 不推荐（但可行）
const node = dagNode<{ numbers: number[] }, { doubled: number[] }>({ /* ... */ })
```

### 2. 使用有意义的节点 ID 和名称

```typescript
// ✅ 推荐
const node = dagNode({
  id: 'user_validation',
  name: '用户数据验证',
  // ...
})

// ❌ 不推荐
const node = dagNode({
  id: 'n1',
  name: 'Node 1',
  // ...
})
```

### 3. 添加验证器

对于关键数据，添加验证器确保数据正确性：

```typescript
const node = dagNode<UserInput, UserOutput>({
  id: 'process_user',
  name: '处理用户',
  executor: async (inputs) => { /* ... */ },
  validators: {
    inputs: {
      age: (v: number) => v >= 0 && v <= 150,
      email: (v: string) => v.includes('@'),
    },
  },
})
```

### 4. 使用类型转换函数

当类型不兼容时，使用 `transform` 函数而不是在 executor 中处理：

```typescript
// ✅ 推荐
graph.addEdge({
  id: 'edge1',
  sourceNodeId: 'text',
  sourcePort: 'text',
  targetNodeId: 'length',
  targetPort: 'length',
  transform: (text: string) => text.length,
})

// ❌ 不推荐（虽然可行）
// 在目标节点的 executor 中处理类型转换
```

### 5. 执行前验证图

```typescript
const validation = graph.validate()
if (!validation.valid) {
  throw new Error(`Graph validation failed: ${validation.errors.join(', ')}`)
}

const result = await graph.execute(context, {})
```

## 常见问题

### Q: 如何定义可选输入？

使用 TypeScript 的可选属性语法：

```typescript
interface MyInput {
  required: string
  optional?: number         // 可选字段
  nullable?: string | null  // 可为 null 的字段
}

const node = dagNode<MyInput, MyOutput>({
  id: 'process',
  executor: async (inputs) => {
    // 使用空值合并运算符提供默认值
    const optionalValue = inputs.optional ?? 0
    const nullableValue = inputs.nullable ?? 'default'
    
    return {
      result: `${inputs.required} - ${optionalValue} - ${nullableValue}`
    }
  }
})
```

### Q: 如何定义空输入（源节点）？

对于不需要输入的源节点，使用 `EmptyInput` 类型：

```typescript
type EmptyInput = Record<string, never>

const sourceNode = dagNode<EmptyInput, { data: number[] }>({
  id: 'source',
  executor: async () => ({ data: [1, 2, 3] })
})
```

### Q: 如何进行运行时验证？

使用 `validators` 选项：

```typescript
const node = dagNode<MyInput, MyOutput>({
  id: 'validate',
  executor: async (inputs) => { /* ... */ },
  validators: {
    inputs: {
      age: (v: number) => v >= 0,
      email: (v?: string) => !v || v.includes('@'),
    },
  },
})
```

### Q: 如何处理类型不兼容的端口？

使用 `transform` 函数：

```typescript
graph.addEdge({
  id: 'edge1',
  sourceNodeId: 'text',
  sourcePort: 'text',      // string
  targetNodeId: 'length',
  targetPort: 'length',    // number
  transform: (text: string) => text.length,
})
```

### Q: 如何添加端口描述？

使用 JSDoc 注释：

```typescript
interface MyInput {
  /** 用户的年龄，必须在 0-150 之间 */
  age: number
  
  /** 用户的电子邮件地址（可选） */
  email?: string
}
```

## 更多示例

查看 `dag-graph-examples.ts` 了解更多示例：

- 基础数据处理流程
- 并行处理多个分支
- 类型转换
- 数据验证
- 可选输入处理
- 图操作（增删改查）

运行示例：

```typescript
import { runDAGGraphExamples } from 'pilotage'

await runDAGGraphExamples()
```

