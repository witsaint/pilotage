/**
 * DAG Graph 测试
 */

import { describe, expect, it } from 'vitest'
import { runDAGGraphExamples } from '../packages/pilotage/src/core/dag-graph-examples'

describe('DAG Graph', () => {
  it('应该成功运行所有示例', async () => {
    await expect(runDAGGraphExamples()).resolves.not.toThrow()
  })
})

