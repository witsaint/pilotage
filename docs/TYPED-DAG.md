# 类型安全的 DAG 构建器

## 概述

`TypedDAGBuilder` 是一个支持完整类型推导的 DAG（有向无环图）构建器，它能够在编译时提供类型安全保障，让你在编写流程时就能获得完整的类型提示和错误检查。

## 主要特性

✅ **完整的类型推导** - 每个节点的输入类型自动推导自上一个节点的输出类型  
✅ **编译时类型检查** - TypeScript 会在编译时捕获类型错误  
✅ **智能代码提示** - IDE 提供完整的类型提示和自动完成  
✅ **零运行时开销** - 类型信息在编译后被擦除  
✅ **链式 API** - 流畅的 API 设计，易于使用  

## 快速开始

### 基础示例

```typescript
import { typedDag } from 'pilotage'

// 创建一个简单的类型安全流程
const pipeline = typedDag()
  .id('my-pipeline')
  .name('My Typed Pipeline')
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

### 并行处理

```typescript
const pipeline = typedDag()
  .task('prepare', async () => {
    return [1, 2, 3, 4, 5]
  })
  // 两个并行分支，都接收相同的输入类型
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
    const [sum, max] = inputs  // 类型安全的解构
    return { sum, max, avg: sum / 5 }
  })
  .then('report', async (result) => {
    // result 类型被自动推导
    return `Sum: ${result.sum}, Max: ${result.max}, Avg: ${result.avg}`
  })
  .build()
```

## 类型推导工作原理

### 链式类型传递

`TypedDAGBuilder` 使用 TypeScript 的泛型来跟踪每个节点的输出类型：

```typescript
// TypedDAGBuilder<TLastOutput>
// TLastOutput 表示上一个节点的输出类型

class TypedDAGBuilder<TLastOutput = void> {
  // task() 返回新的 TypedDAGBuilder，其中 TLastOutput 更新为任务的输出类型
  task<TOutput>(
    id: string,
    executor: (input: void) => TOutput
  ): TypedDAGBuilder<TOutput>

  // then() 的输入类型是上一个节点的输出类型
  then<TOutput>(
    id: string,
    executor: (input: TLastOutput) => TOutput
  ): TypedDAGBuilder<TOutput>
}
```

### 并行分支类型推导

并行分支会收集所有分支的输出类型，并生成一个元组类型：

```typescript
// 两个分支的输出类型
.parallel([
  { id: 'branch1', executor: async (input) => 10 },      // 返回 number
  { id: 'branch2', executor: async (input) => 'hello' }, // 返回 string
])
// merge 的输入类型自动推导为 [number, string]
.merge('combine', (inputs) => {
  const [num, str] = inputs  // num: number, str: string
  return { num, str }
})
```

## 高级用法

### 复杂类型转换

```typescript
interface User {
  id: number
  name: string
  age: number
}

interface ProcessedUser {
  userId: number
  displayName: string
  isAdult: boolean
}

const pipeline = typedDag()
  .task('fetchUser', async (): Promise<User> => {
    return { id: 1, name: 'John', age: 25 }
  })
  .then('processUser', async (user): Promise<ProcessedUser> => {
    // user 的类型是 User
    return {
      userId: user.id,
      displayName: user.name.toUpperCase(),
      isAdult: user.age >= 18,
    }
  })
  .then('formatOutput', async (processed) => {
    // processed 的类型是 ProcessedUser
    return {
      ...processed,
      message: `User ${processed.displayName} (${processed.userId})`,
    }
  })
  .build()
```

### 条件分支

```typescript
const pipeline = typedDag()
  .task('checkValue', async () => {
    return { value: 10 }
  })
  .condition(
    'validate',
    (data) => data.value > 5
  )
  .onTrue('success', async (data) => {
    return { ...data, status: 'success' as const }
  })
  .onFalse('failure', async (data) => {
    return { ...data, status: 'failure' as const }
  })
  .endCondition()
  // result 的类型是两个分支的联合类型
  .then('finalize', async (result) => {
    // result.status 的类型是 'success' | 'failure'
    return { ...result, processed: true }
  })
  .build()
```

### 三个或更多并行分支

```typescript
const pipeline = typedDag()
  .task('start', async () => {
    return { query: 'SELECT * FROM users' }
  })
  .parallel([
    {
      id: 'api',
      executor: async (_input) => ({ source: 'api', count: 10 }),
    },
    {
      id: 'db',
      executor: async (_input) => ({ source: 'db', count: 20 }),
    },
    {
      id: 'cache',
      executor: async (_input) => ({ source: 'cache', count: 5 }),
    },
  ])
  // inputs 的类型是元组
  .merge('aggregate', (inputs) => {
    const [api, db, cache] = inputs
    return {
      total: api.count + db.count + cache.count,
      sources: [api.source, db.source, cache.source],
    }
  })
  .build()
```

## API 参考

### TypedDAGBuilder

#### 基础配置方法

- **`.id(id: string)`** - 设置流程 ID
- **`.name(name: string)`** - 设置流程名称
- **`.description(description: string)`** - 设置流程描述

#### 节点添加方法

- **`.task<TOutput>(id, executor, name?)`** - 添加第一个任务节点
- **`.then<TOutput>(id, executor, name?)`** - 添加下一个任务节点（类型安全）
- **`.parallel(branches)`** - 添加并行分支
- **`.condition(id, condition, name?)`** - 添加条件分支

#### 构建方法

- **`.build()`** - 构建并返回 DAG 流程实例

### TypedParallelBuilder

- **`.merge<TMergeOutput>(id, mergeFunction, name?)`** - 合并并行分支结果

### TypedConditionalBuilder

- **`.onTrue<TOutput>(id, executor, name?)`** - 添加条件为真的分支
- **`.onFalse<TOutput>(id, executor, name?)`** - 添加条件为假的分支
- **`.endCondition()`** - 结束条件分支配置

## 与普通 DAGBuilder 的区别

| 特性 | DAGBuilder | TypedDAGBuilder |
|------|------------|-----------------|
| 类型推导 | ❌ 无 | ✅ 完整 |
| 编译时检查 | ❌ 无 | ✅ 有 |
| 代码提示 | ⚠️ 基础 | ✅ 完整 |
| API 复杂度 | 简单 | 略复杂 |
| 运行时开销 | 无 | 无 |

## 最佳实践

### 1. 使用明确的类型注解

当 TypeScript 无法自动推导类型时，显式地标注返回类型：

```typescript
.task('fetchData', async (): Promise<UserData> => {
  // 明确的返回类型有助于类型推导
  return await fetchUserData()
})
```

### 2. 避免使用 `any`

使用 `unknown` 或具体类型代替 `any`：

```typescript
// ❌ 不推荐
.then('process', async (input: any) => { })

// ✅ 推荐
.then('process', async (input) => {  // 自动推导
  // 或者
.then('process', async (input: UserData) => {  // 明确类型
})
```

### 3. 利用类型守卫

在条件分支中使用类型守卫来缩小类型范围：

```typescript
.then('handle', async (result) => {
  if ('error' in result) {
    // TypeScript 知道这里 result 有 error 属性
    return handleError(result.error)
  }
  return handleSuccess(result.data)
})
```

### 4. 使用接口定义复杂类型

为复杂的数据结构定义接口：

```typescript
interface ApiResponse {
  data: User[]
  meta: {
    total: number
    page: number
  }
}

const pipeline = typedDag()
  .task('fetch', async (): Promise<ApiResponse> => {
    // ...
  })
```

## 示例项目

查看 `typed-dag-examples.ts` 文件以获取更多完整示例：

- 基础类型推导示例
- 并行处理示例
- 条件分支示例
- 复杂数据转换示例
- 多分支并行示例

## 故障排除

### 类型推导不正确

如果 TypeScript 无法正确推导类型：

1. 检查是否有循环引用
2. 为函数添加明确的返回类型注解
3. 确保所有泛型参数都被正确传递

### 类型错误

如果遇到类型错误：

1. 检查输入输出类型是否匹配
2. 确保并行分支的输入类型一致
3. 验证 merge 函数的输入类型是否正确

## 总结

`TypedDAGBuilder` 提供了一个类型安全的方式来构建 DAG 流程，让你能够在编写代码时就发现类型错误，而不是等到运行时。通过完整的类型推导，你可以享受到 TypeScript 带来的所有好处，包括智能提示、重构安全和编译时错误检查。

开始使用 `typedDag()` 来构建你的类型安全流程吧！🎉

