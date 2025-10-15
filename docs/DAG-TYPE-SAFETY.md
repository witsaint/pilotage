# DAG 构建器 - 类型安全指南

## 概述

从现在开始，`dag()` 构建器默认支持完整的类型推导和类型安全。你不需要使用任何特殊的 API 或导入，所有的 DAG 流程都会自动获得类型安全保障。

## 主要特性

✅ **完整的类型推导** - 每个节点的输入类型自动推导自上一个节点的输出类型
✅ **编译时类型检查** - TypeScript 会在编译时捕获类型错误
✅ **智能代码提示** - IDE 提供完整的类型提示和自动完成
✅ **零运行时开销** - 类型信息在编译后被擦除
✅ **向后兼容** - 现有代码无需修改即可享受类型安全

## 快速开始

### 基础示例

```typescript
import { dag } from 'pilotage'

// 创建一个类型安全的流程
const pipeline = dag()
  .id('my-pipeline')
  .name('My Pipeline')
  // 第一个任务返回 string[]
  .task('fetchData', async () => {
    return ['apple', 'banana', 'cherry']
  })
  // then 自动推导输入类型为 string[]
  .then('processData', async (items) => {
    // items 的类型被自动推导为 string[]
    // 你会获得完整的类型提示！
    return items.length
  })
  // 输入类型自动推导为 number
  .then('formatResult', async (count) => {
    // count 的类型被自动推导为 number
    return { total: count, message: `处理了 ${count} 个项目` }
  })
  .build()

// 执行流程
await pipeline.execute()
```

## 类型推导示例

### 1. 基础链式调用

```typescript
const pipeline = dag()
  .task('start', async () => 'Hello') // 返回 string
  .then('length', async (str) => {
    // str 自动推导为 string
    return str.length // 返回 number
  })
  .then('double', async (num) => {
    // num 自动推导为 number
    return num * 2 // 返回 number
  })
  .build()
```

### 2. 并行处理

```typescript
const pipeline = dag()
  .task('prepare', async () => [1, 2, 3, 4, 5])
  .parallel([
    {
      id: 'sum',
      executor: async (numbers) => {
        // numbers 类型为 number[]
        return numbers.reduce((a, b) => a + b, 0)
      },
    },
    {
      id: 'max',
      executor: async (numbers) => {
        // numbers 类型为 number[]
        return Math.max(...numbers)
      },
    },
  ])
  // merge 的输入类型自动推导为 [number, number]
  .merge('combine', (inputs) => {
    const [sum, max] = inputs // 类型安全的解构
    return { sum, max }
  })
  .build()
```

### 3. 复杂类型转换

```typescript
interface User {
  id: number
  name: string
}

interface ProcessedUser {
  userId: number
  displayName: string
}

const pipeline = dag()
  .task('fetch', async (): Promise<User> => {
    return { id: 1, name: 'John' }
  })
  .then('process', async (user): Promise<ProcessedUser> => {
    // user 的类型是 User
    return {
      userId: user.id,
      displayName: user.name.toUpperCase(),
    }
  })
  .then('format', async (processed) => {
    // processed 的类型是 ProcessedUser
    return `User: ${processed.displayName}`
  })
  .build()
```

### 4. 条件分支

```typescript
const pipeline = dag()
  .task('check', async () => ({ value: 10 }))
  .condition('validate', data => data.value > 5)
  .onTrue('success', async (data) => {
    return { ...data, status: 'success' as const }
  })
  .onFalse('failure', async (data) => {
    return { ...data, status: 'failure' as const }
  })
  .endCondition()
  .then('finalize', async (result) => {
    // result.status 的类型是 'success' | 'failure'
    return result
  })
  .build()
```

## API 参考

### DAGBuilder<TLastOutput>

主要的构建器类，支持完整的类型推导。`TLastOutput` 表示上一个节点的输出类型。

#### 基础方法

- **`.id(id: string)`** - 设置流程 ID
- **`.name(name: string)`** - 设置流程名称
- **`.description(description: string)`** - 设置流程描述

#### 节点方法

- **`.task<TOutput>(id, executor, name?)`** - 添加第一个任务节点
  ```typescript
  .task('start', async () => 'hello')
  // 返回 DAGBuilder<string>
  ```

- **`.then<TOutput>(id, executor, name?)`** - 添加下一个任务（类型安全）
  ```typescript
  .then('process', async (input) => {
    // input 的类型自动推导
    return processed
  })
  ```

- **`.parallel(branches)`** - 添加并行分支
  ```typescript
  .parallel([
    { id: 'branch1', executor: async (input) => result1 },
    { id: 'branch2', executor: async (input) => result2 },
  ])
  ```

- **`.condition(id, condition, name?)`** - 添加条件分支
  ```typescript
  .condition('check', (data) => data.value > 0)
  ```

#### 构建方法

- **`.build()`** - 构建并返回 DAG 流程实例

### ParallelBuilder

并行构建器，处理并行分支的合并。

- **`.merge<TMergeOutput>(id, mergeFunction, name?)`** - 合并并行分支结果
  ```typescript
  .merge('combine', (inputs) => {
    // inputs 是所有分支输出的元组
    const [result1, result2] = inputs
    return combined
  })
  ```

### ConditionalBuilder

条件构建器，处理条件分支。

- **`.onTrue<TOutput>(id, executor, name?)`** - 条件为真的分支
- **`.onFalse<TOutput>(id, executor, name?)`** - 条件为假的分支
- **`.endCondition()`** - 结束条件配置

## 类型推导原理

### 泛型传递

DAGBuilder 使用 TypeScript 的泛型来追踪类型：

```typescript
class DAGBuilder<TLastOutput = void> {
  // task 返回新的类型
  task<TOutput>(id, executor): DAGBuilder<TOutput>

  // then 的输入是上一个节点的输出
  then<TOutput>(
    id,
    executor: (input: TLastOutput) => TOutput
  ): DAGBuilder<TOutput>
}
```

### 并行分支类型

并行分支收集所有输出类型并生成元组：

```typescript
.parallel([
  { executor: async () => 10 },     // number
  { executor: async () => 'hello' }, // string
])
.merge('combine', (inputs) => {
  // inputs: [number, string]
  const [num, str] = inputs
})
```

## 最佳实践

### 1. 使用明确的类型注解

当 TypeScript 无法推导时，添加返回类型：

```typescript
.task('fetch', async (): Promise<UserData> => {
  return await fetchData()
})
```

### 2. 定义接口

为复杂数据定义接口：

```typescript
interface ApiResponse {
  data: User[]
  meta: { total: number }
}
```

### 3. 避免使用 `any`

使用 `unknown` 或具体类型：

```typescript
// ❌ 不推荐
.then('process', async (input: any) => {})

// ✅ 推荐
.then('process', async (input) => {  // 自动推导
})
```

### 4. 利用类型守卫

在条件中使用类型守卫：

```typescript
.then('handle', async (result) => {
  if ('error' in result) {
    return handleError(result.error)
  }
  return handleSuccess(result.data)
})
```

## 迁移指南

### 从旧版本迁移

如果你之前使用的是没有类型推导的 `dag()`，好消息是你不需要做任何改变！

```typescript
// 旧代码 - 仍然有效
const pipeline = dag()
  .task('step1', async () => { /* ... */ })
  .then('step2', async (input) => { /* ... */ })
  .build()

// 现在这段代码自动获得了类型安全！
// input 的类型会自动推导
```

### 移除 any 类型

如果你之前使用了 `any` 类型，现在可以移除它们：

```typescript
// 之前
.then('process', async (input: any) => {
  return input.value
})

// 现在
.then('process', async (input) => {
  // input 类型自动推导，享受类型提示！
  return input.value
})
```

## 故障排除

### 类型推导不正确

1. 检查是否有循环引用
2. 为函数添加明确的返回类型
3. 确保泛型参数正确传递

### 类型错误

1. 验证输入输出类型是否匹配
2. 检查并行分支的输入类型是否一致
3. 确认 merge 函数的输入类型

## 示例代码

查看 `tests/dag-type-safety.test.ts` 获取更多完整示例：

- 基础类型推导
- 并行处理类型安全
- 复杂类型转换
- 条件分支
- 多分支并行

## 总结

现在 `dag()` 默认就是类型安全的！你不需要学习新的 API 或导入特殊的构建器。只需要像往常一样使用 `dag()`，就能享受完整的类型推导和类型安全保障。

开始使用类型安全的 `dag()` 构建你的流程吧！🎉
