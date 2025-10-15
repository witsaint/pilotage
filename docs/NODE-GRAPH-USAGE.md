# NodeGraph 直接使用指南

`NodeGraph` 是 Pilotage DAG 系统的底层图结构实现。虽然通常推荐使用 `dag()` 构建器来创建流程，但在某些场景下直接使用 `NodeGraph` 可以提供更细粒度的控制。

## 📚 目录

- [何时使用 NodeGraph](#何时使用-nodegraph)
- [基础概念](#基础概念)
- [创建图结构](#创建图结构)
- [节点类型](#节点类型)
- [边类型](#边类型)
- [图操作](#图操作)
- [示例代码](#示例代码)

## 何时使用 NodeGraph

### ✅ 适用场景

- 需要完全控制图结构的底层实现
- 构建复杂的图可视化工具
- 实现自定义的流程编排逻辑
- 与其他系统集成，需要直接操作图数据

### ❌ 不适用场景

- 简单的线性流程（使用 `dag()` 更简单）
- 标准的并发和条件分支（`dag()` 提供了更友好的 API）
- 需要类型推导的场景（`dag()` 提供完整的 TypeScript 类型支持）

## 基础概念

### 节点（Node）

图中的基本执行单元，每个节点都有：
- **ID**: 唯一标识符
- **名称**: 人类可读的描述
- **类型**: 节点的类型（任务、条件、合并等）
- **输入/输出端口**: 定义数据流入和流出的接口
- **执行器**: 实际执行的函数

### 边（Edge）

连接节点的关系，定义了数据流向和执行顺序：
- **依赖边（DEPENDENCY）**: 普通的顺序依赖
- **条件边（CONDITION）**: 条件分支的 true/false 路径
- **并发边（PARALLEL）**: 并发执行的分支

### 图（Graph）

包含所有节点和边的容器，提供：
- 节点和边的增删改查
- 图验证（循环检测、引用检查等）
- 图遍历和执行

## 创建图结构

### 1. 创建图实例

```typescript
import { NodeGraph } from 'pilotage'

const graph = new NodeGraph()
```

### 2. 创建节点

```typescript
import { TaskNode, EdgeType } from 'pilotage'
import type { TaskConfig } from 'pilotage'

// 定义任务配置
const taskConfig: TaskConfig = {
  id: 'myTask',
  name: '我的任务',
  executor: async (input) => {
    console.log('执行任务', input)
    return { result: 'success' }
  },
  dependencies: [],
  tags: ['demo'],
  metadata: {},
}

// 创建任务节点
const taskNode = new TaskNode(taskConfig)

// 添加到图中
graph.addNode(taskNode)
```

### 3. 创建边

```typescript
// 连接两个节点
graph.addEdge({
  id: 'task1_to_task2',
  type: EdgeType.DEPENDENCY,
  sourceNodeId: 'task1',
  sourcePort: 'output',
  targetNodeId: 'task2',
  targetPort: 'input',
})
```

## 节点类型

### TaskNode - 任务节点

执行具体业务逻辑的节点。

```typescript
import { TaskNode } from 'pilotage'

const node = new TaskNode({
  id: 'process',
  name: '处理数据',
  executor: async (input) => {
    // 处理逻辑
    return { processed: true }
  },
  dependencies: [],
  tags: [],
  metadata: {},
})
```

### ConditionNode - 条件节点

根据条件判断选择不同的执行路径。

```typescript
import { ConditionNode } from 'pilotage'

const conditionNode = new ConditionNode(
  'checkValue',
  '检查值',
  (data) => data.value > 50  // 条件函数
)
```

### MergeNode - 合并节点

合并多个分支的结果。

```typescript
import { MergeNode } from 'pilotage'

const mergeNode = new MergeNode(
  'merge',
  '合并结果',
  (inputs) => {
    // 合并逻辑
    return { merged: Object.values(inputs) }
  }
)
```

### GroupNode - 分组节点

将多个节点组织成一个逻辑单元。

```typescript
import { GroupNode } from 'pilotage'

const groupNode = new GroupNode('myGroup', '数据处理组')
// 可以包含子图
```

## 边类型

### EdgeType.DEPENDENCY

普通的依赖关系，表示顺序执行。

```typescript
graph.addEdge({
  id: 'step1_to_step2',
  type: EdgeType.DEPENDENCY,
  sourceNodeId: 'step1',
  sourcePort: 'output',
  targetNodeId: 'step2',
  targetPort: 'input',
})
```

### EdgeType.CONDITION

条件分支的边，连接 `ConditionNode` 和分支节点。

```typescript
// true 分支
graph.addEdge({
  id: 'condition_to_true',
  type: EdgeType.CONDITION,
  sourceNodeId: 'checkValue',
  sourcePort: 'true',
  targetNodeId: 'handleTrue',
  targetPort: 'input',
})

// false 分支
graph.addEdge({
  id: 'condition_to_false',
  type: EdgeType.CONDITION,
  sourceNodeId: 'checkValue',
  sourcePort: 'false',
  targetNodeId: 'handleFalse',
  targetPort: 'input',
})
```

### EdgeType.PARALLEL

并发执行的边。

```typescript
graph.addEdge({
  id: 'start_to_parallel1',
  type: EdgeType.PARALLEL,
  sourceNodeId: 'start',
  sourcePort: 'output',
  targetNodeId: 'parallel1',
  targetPort: 'input',
})
```

## 图操作

### 查询节点

```typescript
// 获取单个节点
const node = graph.getNode('nodeId')

// 获取所有节点
const allNodes = graph.getAllNodes()
```

### 查询边

```typescript
// 获取单个边
const edge = graph.getEdge('edgeId')

// 获取所有边
const allEdges = graph.getAllEdges()
```

### 验证图

```typescript
const validation = graph.validate()
console.log('有效性:', validation.isValid)
console.log('错误:', validation.errors)
```

验证会检查：
- 所有节点配置是否有效
- 边引用的节点是否存在
- 是否存在循环依赖

## 示例代码

### 完整示例：创建条件分支流程

```typescript
import { ConditionNode, EdgeType, MergeNode, NodeGraph, TaskNode } from 'pilotage'
import type { TaskConfig } from 'pilotage'

async function createConditionalFlow() {
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

  // 3. 创建 true 分支
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

  // 4. 创建 false 分支
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
  graph.addNode(new TaskNode(checkTask))
  graph.addNode(conditionNode)
  graph.addNode(new TaskNode(trueBranchTask))
  graph.addNode(new TaskNode(falseBranchTask))
  graph.addNode(mergeNode)

  // 7. 连接节点
  graph.addEdge({
    id: 'check_to_condition',
    type: EdgeType.DEPENDENCY,
    sourceNodeId: 'check',
    sourcePort: 'output',
    targetNodeId: 'validate',
    targetPort: 'input',
  })

  graph.addEdge({
    id: 'condition_to_high',
    type: EdgeType.CONDITION,
    sourceNodeId: 'validate',
    sourcePort: 'true',
    targetNodeId: 'highValue',
    targetPort: 'input',
  })

  graph.addEdge({
    id: 'condition_to_low',
    type: EdgeType.CONDITION,
    sourceNodeId: 'validate',
    sourcePort: 'false',
    targetNodeId: 'lowValue',
    targetPort: 'input',
  })

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

  // 8. 验证图
  const validation = graph.validate()
  console.log('图验证:', validation)

  return graph
}
```

### 查看更多示例

在 `packages/pilotage/src/core/dag-examples.ts` 中包含了更多完整的示例：

- `directNodeGraphExample()` - 基础的线性流程
- `nodeGraphConditionalExample()` - 条件分支流程
- `nodeGraphAdvancedExample()` - 复杂图结构操作

运行示例：

```typescript
import { runNodeGraphExamples } from 'pilotage'

await runNodeGraphExamples()
```

## 🔗 相关文档

- [DAG 构建器指南](./DAG-TYPE-SAFETY.md) - 推荐的高级 API
- [类型安全迁移指南](./MIGRATION-TYPE-SAFE-DAG.md) - 从旧 API 迁移
- [测试文档](./TESTING.md) - 如何测试 DAG 流程

## 💡 最佳实践

1. **优先使用 `dag()` 构建器**
   - 对于大多数场景，`dag()` 提供了更友好和类型安全的 API
   - 只在需要底层控制时才直接使用 `NodeGraph`

2. **验证图结构**
   - 始终在执行前调用 `graph.validate()`
   - 检查返回的错误信息

3. **使用有意义的 ID 和名称**
   - 节点 ID 应该唯一且描述性强
   - 名称应该清晰说明节点的作用

4. **合理使用边类型**
   - 使用 `EdgeType` 枚举而不是字符串
   - 确保边的类型与节点类型匹配

5. **错误处理**
   - 在节点执行器中妥善处理错误
   - 使用 try-catch 保护关键操作

