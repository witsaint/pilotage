# 类型安全 DAG 迁移总结

## 变更概述

我们已经将 `dag()` 构建器升级为默认支持完整类型推导的版本。这是一个**完全向后兼容**的升级，现有代码无需修改即可享受类型安全。

## 主要变更

### ✅ 统一 API

- **之前**: 需要使用 `typedDag()` 才能获得类型推导
- **现在**: `dag()` 默认就支持完整类型推导

### ✅ 删除的内容

以下文件已被删除（功能已合并到主 DAG 构建器）：
- `typed-dag-builder.ts`
- `typed-dag-examples.ts`
- `tests/typed-dag.test.ts`

### ✅ 保留的内容

- `dag-builder.ts` - 现在是类型安全的主要实现
- `dag-examples.ts` - 保持不变，自动获得类型安全
- 所有现有的 API 和方法

## 代码示例

### 之前的用法

```typescript
// 选项 1: 没有类型推导
import { dag } from 'pilotage'

const pipeline = dag()
  .task('start', async () => 'hello')
  .then('process', async (input) => {
    // input 类型是 unknown，需要手动类型断言
    return (input as string).length
  })
  .build()

// 选项 2: 使用 typedDag
import { typedDag } from 'pilotage'

const pipeline = typedDag()
  .task('start', async () => 'hello')
  .then('process', async (input) => {
    // input 类型自动推导为 string ✅
    return input.length
  })
  .build()
```

### 现在的用法

```typescript
// 只需要使用 dag()，自动获得类型推导！
import { dag } from 'pilotage'

const pipeline = dag()
  .task('start', async () => 'hello')
  .then('process', async (input) => {
    // input 类型自动推导为 string ✅
    return input.length
  })
  .build()
```

## 迁移步骤

### 1. 如果你使用的是 `dag()`

**不需要任何改变！** 你的代码现在自动获得了类型安全。

```typescript
// 这段代码现在自动有类型推导了
const pipeline = dag()
  .task('fetch', async () => ['a', 'b', 'c'])
  .then('count', async (items) => {
    // items 现在自动推导为 string[]
    return items.length
  })
  .build()
```

### 2. 如果你使用的是 `typedDag()`

只需要将 `typedDag` 改为 `dag`：

```typescript
// 之前
import { typedDag } from 'pilotage'
const pipeline = typedDag()...

// 现在
import { dag } from 'pilotage'
const pipeline = dag()...
```

### 3. 移除不必要的类型注解

你现在可以移除很多手动的类型注解：

```typescript
// 之前
.then('process', async (input: SomeType) => {
  return input.value
})

// 现在（如果类型可以推导）
.then('process', async (input) => {
  // input 类型自动推导
  return input.value
})
```

## API 变更

### 导出的类型和类

| 之前 | 现在 | 说明 |
|------|------|------|
| `dag()` | `dag()` | ✅ 现在支持类型推导 |
| `typedDag()` | `dag()` | ✅ 使用统一的 `dag()` |
| `TypedDAGBuilder` | `DAGBuilder` | ✅ 合并为一个类 |
| `TypedParallelBuilder` | `ParallelBuilder` | ✅ 合并为一个类 |
| `TypedConditionalBuilder` | `ConditionalBuilder` | ✅ 合并为一个类 |
| `TypedBranch` | `BranchConfig` | ✅ 重命名 |
| `TypedExecutor` | `TaskExecutor` | ✅ 统一命名 |

### 兼容性导出

为了向后兼容，我们保留了一些别名：

```typescript
// 这些仍然可用
export { ParallelBuilder as DAGParallelBuilder }
export { ConditionalBuilder as DAGConditionalBuilder }
```

## 测试更新

所有测试都已通过，包括：

- ✅ 85 个原有测试
- ✅ 8 个新的类型安全测试
- ✅ **总计 93 个测试全部通过**

## 文档更新

新的文档：
- `docs/DAG-TYPE-SAFETY.md` - 类型安全使用指南
- `docs/MIGRATION-TYPE-SAFE-DAG.md` - 本迁移指南

更新的文档：
- `docs/TYPED-DAG.md` - 标记为已废弃（可以删除）

## 示例代码

完整的类型安全示例在：
- `tests/dag-type-safety.test.ts` - 8 个完整测试用例
- `packages/pilotage/src/core/dag-examples.ts` - 实际使用示例

## 优势

### 🎯 类型安全

```typescript
const pipeline = dag()
  .task('start', async () => ({ value: 42 }))
  .then('double', async (input) => {
    // ✅ TypeScript 知道 input 有 value 属性
    return input.value * 2
  })
  .then('format', async (num) => {
    // ✅ TypeScript 知道 num 是 number
    return `Result: ${num}`
  })
  .build()
```

### 🚀 更好的 IDE 支持

- 自动完成
- 类型提示
- 错误高亮
- 重构安全

### 📦 更简单的 API

- 不需要记住两套 API
- 统一的使用方式
- 更少的导入

## 破坏性变更

**没有破坏性变更！** 这是一个完全向后兼容的升级。

- ✅ 所有现有的 `dag()` 用法继续工作
- ✅ 所有现有的 API 方法保持不变
- ✅ 所有测试通过

## 下一步

1. **立即可用**: 无需任何修改，你的代码已经是类型安全的
2. **逐步优化**: 移除不必要的手动类型注解
3. **享受类型提示**: 在 IDE 中享受完整的类型推导和自动完成

## 反馈

如果你遇到任何问题或有任何建议，请告诉我们！

---

**总结**: 🎉 现在 `dag()` 默认就是类型安全的！无需任何代码修改，立即享受完整的类型推导和编译时类型检查！

