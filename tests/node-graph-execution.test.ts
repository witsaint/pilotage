/**
 * NodeGraph 执行示例测试
 */

import { describe, expect, it } from 'vitest'
import { nodeGraphExecutionExample } from '../packages/pilotage/src/core/dag-examples'

describe('NodeGraph 执行示例', () => {
  it('应该成功执行 NodeGraph 并传递数据', async () => {
    await expect(nodeGraphExecutionExample()).resolves.not.toThrow()
  })
})

