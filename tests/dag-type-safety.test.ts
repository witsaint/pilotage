/**
 * DAG 构建器类型安全测试
 * 验证类型推导功能是否正常工作
 */

import { describe, expect, it } from 'vitest'
import { dag } from '../packages/pilotage/src/core/dag-builder'

describe('DAG Builder - Type Safety', () => {
  describe('Basic Type Inference', () => {
    it('should infer types correctly in a simple pipeline', async () => {
      const pipeline = dag()
        .id('test-basic')
        .name('Basic Type Test')
        .task('start', async () => {
          return 'Hello'
        })
        .then('transform', async (input) => {
          // input 应该被推导为 string
          const length = input.length
          return length
        })
        .then('format', async (input) => {
          // input 应该被推导为 number
          return { result: input }
        })
        .build()

      expect(pipeline).toBeDefined()
      expect(pipeline.config.id).toBe('test-basic')
    })

    it('should support execution with type-safe data flow', async () => {
      const results: string[] = []

      const pipeline = dag()
        .id('test-execution')
        .name('Execution Test')
        .task('start', async () => {
          results.push('start')
          return { value: 42 }
        })
        .then('double', async (input) => {
          results.push(`double:${input.value}`)
          return { value: input.value * 2 }
        })
        .then('stringify', async (input) => {
          results.push(`stringify:${input.value}`)
          return `Result: ${input.value}`
        })
        .build()

      await pipeline.execute()

      expect(results).toContain('start')
      expect(results).toContain('double:42')
      expect(results).toContain('stringify:84')
    })
  })

  describe('Parallel Processing with Type Inference', () => {
    it('should infer types in parallel branches', async () => {
      const pipeline = dag()
        .id('test-parallel')
        .name('Parallel Type Test')
        .task('prepare', async () => {
          return ['a', 'b', 'c']
        })
        .parallel([
          {
            id: 'branch1',
            executor: async (items) => {
              // items 应该被推导为 string[]
              return items.length
            },
          },
          {
            id: 'branch2',
            executor: async (items) => {
              // items 应该被推导为 string[]
              return items.join(',')
            },
          },
        ])
        .merge('combine', (inputs) => {
          // inputs 应该是 [number, string]
          const [count, joined] = inputs
          return { count, joined }
        })
        .then('finalize', async (input) => {
          // input 应该被推导为 { count: number, joined: string }
          return `Count: ${input.count}, Joined: ${input.joined}`
        })
        .build()

      expect(pipeline).toBeDefined()
      expect(pipeline.config.id).toBe('test-parallel')
    })

    it('should execute parallel pipeline correctly', async () => {
      const pipeline = dag()
        .id('test-parallel-exec')
        .name('Parallel Execution Test')
        .task('start', async () => {
          return [1, 2, 3, 4, 5]
        })
        .parallel([
          {
            id: 'sum',
            executor: async (numbers) => {
              return numbers.reduce((a, b) => a + b, 0)
            },
          },
          {
            id: 'max',
            executor: async (numbers) => {
              return Math.max(...numbers)
            },
          },
        ])
        .merge('stats', (inputs) => {
          const [sum, max] = inputs
          return { sum, max, avg: sum / 5 }
        })
        .build()

      const result = await pipeline.execute()
      expect(result).toBeDefined()
    })
  })

  describe('Complex Type Transformations', () => {
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

    it('should handle complex type transformations', async () => {
      const pipeline = dag()
        .id('test-complex')
        .name('Complex Type Test')
        .task('fetchUser', async (): Promise<User> => {
          return { id: 1, name: 'John', age: 25 }
        })
        .then('processUser', async (user): Promise<ProcessedUser> => {
          return {
            userId: user.id,
            displayName: user.name.toUpperCase(),
            isAdult: user.age >= 18,
          }
        })
        .then('format', async (processed) => {
          return {
            ...processed,
            message: `User ${processed.displayName} (ID: ${processed.userId})`,
          }
        })
        .build()

      await pipeline.execute()
      expect(pipeline.state.status).toBeDefined()
    })
  })

  describe('Conditional Branches', () => {
    it('should support conditional type inference', async () => {
      const pipeline = dag()
        .id('test-conditional')
        .name('Conditional Test')
        .task('check', async () => {
          return { value: 10 }
        })
        .condition(
          'validate',
          (data) => data.value > 5,
        )
        .onTrue('success', async (data) => {
          return { ...data, status: 'success' as const }
        })
        .onFalse('failure', async (data) => {
          return { ...data, status: 'failure' as const }
        })
        .endCondition()
        .then('finalize', async (result) => {
          // result 应该是包含 status: 'success' | 'failure' 的对象
          return { ...result, processed: true }
        })
        .build()

      expect(pipeline).toBeDefined()
    })
  })

  describe('Three Parallel Branches', () => {
    it('should handle three parallel branches with correct types', async () => {
      const pipeline = dag()
        .id('test-three-parallel')
        .name('Three Parallel Test')
        .task('start', async () => {
          return { query: 'test' }
        })
        .parallel([
          {
            id: 'api',
            executor: async (_input) => {
              return { source: 'api', count: 10 }
            },
          },
          {
            id: 'db',
            executor: async (_input) => {
              return { source: 'db', count: 20 }
            },
          },
          {
            id: 'cache',
            executor: async (_input) => {
              return { source: 'cache', count: 5 }
            },
          },
        ])
        .merge('aggregate', (inputs) => {
          const [api, db, cache] = inputs
          return {
            total: api.count + db.count + cache.count,
            sources: [api.source, db.source, cache.source],
          }
        })
        .then('report', async (agg) => {
          return {
            totalCount: agg.total,
            sourceList: agg.sources.join(', '),
          }
        })
        .build()

      expect(pipeline).toBeDefined()
    })
  })

  describe('Type Safety Checks', () => {
    it('should maintain type safety through the entire pipeline', () => {
      // 这个测试主要用于编译时类型检查
      // 如果类型不正确，TypeScript 会在编译时报错

      const _pipeline = dag()
        .task('step1', async () => {
          return { value: 'test' }
        })
        .then('step2', async (input) => {
          // TypeScript 应该知道 input 有 value 属性
          expect(input.value).toBeDefined()
          return input.value.length
        })
        .then('step3', async (input) => {
          // TypeScript 应该知道 input 是 number
          expect(typeof input).toBe('number')
          return input * 2
        })
        .build()

      expect(_pipeline).toBeDefined()
    })
  })
})

