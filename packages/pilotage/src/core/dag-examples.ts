/**
 * DAG 流程系统使用示例
 * 展示如何使用现代化的 DAG 系统构建复杂流程
 */

import type { IDAGPipeline } from './dag-pipeline'
import { createDAGBuilder, dag } from './dag-builder'

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
      return {
        combined: { ...inputs.input1, ...inputs.input2 },
        totalItems: Object.values(inputs).flat().length,
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
      console.log('任务失败，进行重试')

      // 重试不稳定任务
      try {
        await pipeline.retryNode('unstable')
      }
      catch (retryError) {
        console.log('重试仍然失败，再次重试')
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
    await basicLinearFlowExample()
    await complexBranchMergeExample()
    await conditionalFlowExample()
    await parallelProcessingExample()
    await errorHandlingExample()

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

// 如果直接运行此文件，则执行所有示例
if (require.main === module) {
  runDAGExamples()
}
