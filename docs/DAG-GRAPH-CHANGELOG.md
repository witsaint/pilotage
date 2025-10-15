# DAG Graph 更新日志

## 2025-10-15 - DAG Graph 1.0

### 🎉 新功能

#### DAG Graph - 类型安全的有向无环图系统

全新的类型安全图系统，整合了之前 `TypedGraph` 和 `TypedGraph-V2` 的优点：

- ✅ **TypeScript 类型即配置** - 不需要重复声明端口定义
- ✅ **类型安全的端口连接** - 编译时检查端口存在性和类型兼容性
- ✅ **支持类型转换** - `transform` 函数处理类型不兼容的情况
- ✅ **自定义验证器** - 可选的运行时数据验证
- ✅ **完整的图操作** - 支持增删改查节点和边
- ✅ **自动拓扑排序** - 自动确定正确的执行顺序
- ✅ **循环依赖检测** - 确保图的有效性

### 📦 新增 API

#### 工厂函数

```typescript
// 创建节点
createDAGNode<TInput, TOutput>(config: DAGNodeConfig)
dagNode<TInput, TOutput>(config: DAGNodeConfig)  // 简短版本

// 创建图
createDAGGraph()
dagGraph()  // 简短版本
```

#### 类型定义

```typescript
DAGNodeConfig<TInput, TOutput>
DAGEdgeConfig<TSource, TTarget, TSourceKey, TTargetKey>
DAGNode<TInput, TOutput>
DAGGraph
```

### 🔄 迁移自

以下模块已被整合到 DAG Graph：

- ❌ `typed-graph.ts` - 移除（功能已整合）
- ❌ `typed-graph-examples.ts` - 移除（示例已更新）
- ❌ `typed-graph-v2.ts` - 移除（功能已整合）
- ❌ `typed-graph-v2-examples.ts` - 移除（示例已更新）

### 📝 文档

新增文档：

- `DAG-GRAPH.md` - 完整的 API 文档和使用指南
- `DAG-GRAPH-MIGRATION.md` - 从 TypedGraph 迁移到 DAG Graph 的指南
- `DAG-GRAPH-CHANGELOG.md` - 本文档

移除文档：

- ❌ `TYPED-GRAPH.md`
- ❌ `TYPED-GRAPH-V2.md`

### 🧪 测试

新增测试：

- `tests/dag-graph.test.ts` - DAG Graph 的完整测试套件

移除测试：

- ❌ `tests/typed-graph.test.ts`
- ❌ `tests/typed-graph-v2.test.ts`

### 📊 示例

新增示例（在 `dag-graph-examples.ts`）：

1. **基础示例** - `dagGraphBasicExample()`
   - 简单的数据处理流程
   - 节点链式连接
   - 类型安全的数据传递

2. **并行处理示例** - `dagGraphParallelExample()`
   - 多分支并行处理
   - 结果合并
   - 类型安全的多输入

3. **类型转换示例** - `dagGraphTransformExample()`
   - 使用 `transform` 函数
   - 处理类型不兼容的端口
   - string → number 转换

4. **数据验证示例** - `dagGraphValidationExample()`
   - 自定义验证器
   - 输入数据验证
   - 运行时错误处理

5. **图操作示例** - `dagGraphOperationsExample()`
   - 动态添加/删除节点和边
   - 图结构查询
   - 拓扑排序

### 💡 设计理念

#### 之前（TypedGraph）

```typescript
// 需要显式定义端口
const inputs: PortDefinition[] = [
  { name: 'numbers', type: PortType.ARRAY, required: true },
]

const outputs: PortDefinition[] = [
  { name: 'doubled', type: PortType.ARRAY, required: true },
]

const node = createTypedTask({
  id: 'double',
  inputs,
  outputs,
  executor: async (inputs) => ({
    doubled: inputs.numbers.map(n => n * 2),
  }),
})
```

#### 现在（DAG Graph）

```typescript
// 类型即配置
const node = dagNode<
  { numbers: number[] },
  { doubled: number[] }
>({
  id: 'double',
  executor: async (inputs) => ({
    doubled: inputs.numbers.map(n => n * 2),
  }),
})
```

### 🎯 优势

1. **代码量减少 50%+**
   - 不需要定义 `PortDefinition[]`
   - 不需要导入 `PortType` 枚举

2. **更好的类型安全**
   - 编译时检查端口存在性
   - 编译时检查类型兼容性
   - 更精准的 IDE 智能提示

3. **符合 TypeScript 惯用法**
   - 使用泛型类型参数
   - 利用 TypeScript 的类型推导
   - 可选属性用 `?` 表示

4. **更易维护**
   - 类型和逻辑在一起
   - 减少重复代码
   - 更清晰的代码结构

### ⚠️ 破坏性变更

以下 API 已移除：

- `createTypedGraph()` → 使用 `dagGraph()` 或 `createDAGGraph()`
- `createTypedTask()` → 使用 `dagNode()` 或 `createDAGNode()`
- `PortDefinition` 类型 → 使用 TypeScript 原生类型
- `PortType` 枚举 → 使用 TypeScript 原生类型
- `TypedGraph` 类 → 使用 `DAGGraph`
- `TypedTaskNode` 类 → 使用 `DAGNode`

### 📚 资源

- [API 文档](./DAG-GRAPH.md)
- [迁移指南](./DAG-GRAPH-MIGRATION.md)
- [示例代码](../packages/pilotage/src/core/dag-graph-examples.ts)
- [测试用例](../tests/dag-graph.test.ts)

### 🚀 快速开始

```typescript
import { dagGraph, dagNode, ContextManager } from 'pilotage'

// 创建节点
const source = dagNode<{}, { numbers: number[] }>({
  id: 'source',
  executor: async () => ({ numbers: [1, 2, 3, 4, 5] }),
})

const double = dagNode<{ numbers: number[] }, { doubled: number[] }>({
  id: 'double',
  executor: async (inputs) => ({
    doubled: inputs.numbers.map(n => n * 2),
  }),
})

// 创建图
const graph = dagGraph()
  .addNode(source)
  .addNode(double)
  .addEdge({
    id: 'edge1',
    sourceNodeId: 'source',
    sourcePort: 'numbers',
    targetNodeId: 'double',
    targetPort: 'numbers',
  })

// 执行
const context = new ContextManager()
const result = await graph.execute(context, {})
console.log(result)  // { double: { doubled: [2, 4, 6, 8, 10] } }
```

### 🔮 未来计划

- [ ] 支持异步流式数据处理
- [ ] 可视化图编辑器
- [ ] 更多内置验证器
- [ ] 性能优化和并行执行
- [ ] 持久化和序列化支持

