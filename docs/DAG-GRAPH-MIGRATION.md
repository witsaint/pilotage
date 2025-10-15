# DAG Graph 迁移指南

## 概述

DAG Graph 是 Pilotage 中最新的类型安全图系统，它整合了之前 `TypedGraph` 和 `TypedGraph-V2` 的优点，提供了更简洁、更强大的 API。

## 主要变化

### 1. 命名统一

- **TypedGraph** → **DAG Graph**
- **TypedTaskNode** → **DAGNode**
- **TypedTaskConfig** → **DAGNodeConfig**
- **TypedEdgeConfig** → **DAGEdgeConfig**

### 2. 简化的 API

#### 之前（TypedGraph）

```typescript
import { createTypedGraph, createTypedTask, PortDefinition, PortType } from 'pilotage'

// 需要显式定义端口
const inputs: PortDefinition[] = [
  {
    name: 'numbers',
    type: PortType.ARRAY,
    required: true,
    description: '数字数组',
  },
]

const outputs: PortDefinition[] = [
  {
    name: 'doubled',
    type: PortType.ARRAY,
    required: true,
    description: '翻倍后的数组',
  },
]

const node = createTypedTask({
  id: 'double',
  name: '翻倍',
  inputs,
  outputs,
  executor: async (inputs, context) => {
    return { doubled: inputs.numbers.map(n => n * 2) }
  },
})
```

#### 现在（DAG Graph）

```typescript
import { dagNode } from 'pilotage'

// 类型即配置，无需重复声明端口
const node = dagNode<
  { numbers: number[] },    // 输入类型
  { doubled: number[] }     // 输出类型
>({
  id: 'double',
  name: '翻倍',
  executor: async (inputs, context) => {
    // inputs.numbers 自动推导为 number[]
    return { doubled: inputs.numbers.map(n => n * 2) }
  },
})
```

### 3. 保留的功能

以下功能仍然可用：

✅ **类型安全的端口连接**
```typescript
graph.addEdge({
  id: 'edge1',
  sourceNodeId: 'source',
  sourcePort: 'numbers',  // ✅ TypeScript 自动检查
  targetNodeId: 'double',
  targetPort: 'numbers',
})
```

✅ **类型转换函数**
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

✅ **自定义验证器**
```typescript
const node = dagNode<UserInput, UserOutput>({
  id: 'validate',
  name: '验证',
  executor: async (inputs) => { /* ... */ },
  validators: {
    inputs: {
      name: (v: string) => v.length > 0,
      age: (v: number) => v >= 0 && v <= 150,
    },
  },
})
```

### 4. 移除的概念

以下概念已简化或移除：

❌ **PortDefinition** - 不再需要显式定义端口，TypeScript 类型即配置

❌ **PortType 枚举** - 使用 TypeScript 原生类型

❌ **required 字段** - TypeScript 的可选属性 (`?`) 已经提供了这个功能

## 迁移步骤

### 步骤 1: 更新导入

**之前:**
```typescript
import {
  createTypedGraph,
  createTypedTask,
  PortDefinition,
  PortType,
} from 'pilotage'
```

**之后:**
```typescript
import {
  dagGraph,
  dagNode,
} from 'pilotage'
```

### 步骤 2: 移除端口定义

**之前:**
```typescript
const inputs: PortDefinition[] = [
  { name: 'value', type: PortType.NUMBER, required: true },
]

const outputs: PortDefinition[] = [
  { name: 'result', type: PortType.NUMBER, required: true },
]

const node = createTypedTask({
  id: 'multiply',
  name: '乘法',
  inputs,
  outputs,
  executor: async (inputs) => ({ result: inputs.value * 2 }),
})
```

**之后:**
```typescript
const node = dagNode<
  { value: number },
  { result: number }
>({
  id: 'multiply',
  name: '乘法',
  executor: async (inputs) => ({ result: inputs.value * 2 }),
})
```

### 步骤 3: 更新图创建

**之前:**
```typescript
const graph = createTypedGraph()
```

**之后:**
```typescript
const graph = dagGraph()
```

### 步骤 4: 验证器迁移

如果之前在 `PortDefinition` 中使用了 `validator`：

**之前:**
```typescript
const inputs: PortDefinition[] = [
  {
    name: 'age',
    type: PortType.NUMBER,
    required: true,
    validator: (v: number) => v >= 0 && v <= 150,
  },
]
```

**之后:**
```typescript
const node = dagNode<UserInput, UserOutput>({
  id: 'validate',
  name: '验证',
  executor: async (inputs) => { /* ... */ },
  validators: {
    inputs: {
      age: (v: number) => v >= 0 && v <= 150,
    },
  },
})
```

## 对比示例

### 完整示例对比

#### 之前（TypedGraph）

```typescript
import { createTypedGraph, createTypedTask, PortDefinition, PortType } from 'pilotage'
import { ContextManager } from 'pilotage'

// 定义端口
const sourceOutputs: PortDefinition[] = [
  { name: 'numbers', type: PortType.ARRAY, required: true },
]

const doubleInputs: PortDefinition[] = [
  { name: 'numbers', type: PortType.ARRAY, required: true },
]

const doubleOutputs: PortDefinition[] = [
  { name: 'doubled', type: PortType.ARRAY, required: true },
]

// 创建节点
const source = createTypedTask({
  id: 'source',
  name: '数据源',
  inputs: [],
  outputs: sourceOutputs,
  executor: async () => ({ numbers: [1, 2, 3, 4, 5] }),
})

const double = createTypedTask({
  id: 'double',
  name: '翻倍',
  inputs: doubleInputs,
  outputs: doubleOutputs,
  executor: async (inputs) => ({
    doubled: inputs.numbers.map(n => n * 2),
  }),
})

// 创建图
const graph = createTypedGraph()
graph.addNode(source)
graph.addNode(double)
graph.addEdge({
  id: 'source_to_double',
  sourceNodeId: 'source',
  sourcePort: 'numbers',
  targetNodeId: 'double',
  targetPort: 'numbers',
})

// 执行
const context = new ContextManager()
const result = await graph.execute(context, {})
```

#### 之后（DAG Graph）

```typescript
import { dagGraph, dagNode } from 'pilotage'
import { ContextManager } from 'pilotage'

// 创建节点（类型即配置）
const source = dagNode<{}, { numbers: number[] }>({
  id: 'source',
  name: '数据源',
  executor: async () => ({ numbers: [1, 2, 3, 4, 5] }),
})

const double = dagNode<{ numbers: number[] }, { doubled: number[] }>({
  id: 'double',
  name: '翻倍',
  executor: async (inputs) => ({
    doubled: inputs.numbers.map(n => n * 2),
  }),
})

// 创建图
const graph = dagGraph()
graph.addNode(source)
graph.addNode(double)
graph.addEdge({
  id: 'source_to_double',
  sourceNodeId: 'source',
  sourcePort: 'numbers',
  targetNodeId: 'double',
  targetPort: 'numbers',
})

// 执行
const context = new ContextManager()
const result = await graph.execute(context, {})
```

## 优势总结

### 代码量减少

- ✅ 不需要定义 `PortDefinition[]`
- ✅ 不需要导入 `PortType` 枚举
- ✅ TypeScript 类型定义一次即可

### 类型安全

- ✅ 编译时检查端口存在性
- ✅ 编译时检查类型兼容性
- ✅ 更好的 IDE 智能提示

### 维护性

- ✅ 更少的代码，更少的错误
- ✅ 类型和逻辑在一起，易于理解
- ✅ 符合 TypeScript 惯用法

## 常见问题

### Q: 如何定义可选输入？

使用 TypeScript 的可选属性语法：

```typescript
interface MyInput {
  required: string
  optional?: number  // 可选
}

const node = dagNode<MyInput, MyOutput>({ /* ... */ })
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

## 支持

如有问题，请查看：

- [DAG Graph 文档](./DAG-GRAPH.md)
- [示例代码](../packages/pilotage/src/core/dag-graph-examples.ts)
- [测试用例](../tests/dag-graph.test.ts)

