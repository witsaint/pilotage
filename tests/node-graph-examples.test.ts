/**
 * NodeGraph 示例测试
 * 验证直接使用 NodeGraph 的示例功能
 */

import { describe, expect, it } from 'vitest'
import { directNodeGraphExample, nodeGraphAdvancedExample, nodeGraphConditionalExample } from '../packages/pilotage/src/core/dag-examples'

describe('nodeGraph 示例测试', () => {
  it('应该成功执行直接 NodeGraph 示例', async () => {
    await expect(directNodeGraphExample()).resolves.not.toThrow()
  })

  it('应该成功执行 NodeGraph 条件分支示例', async () => {
    await expect(nodeGraphConditionalExample()).resolves.not.toThrow()
  })

  it('应该成功执行 NodeGraph 高级操作示例', async () => {
    await expect(nodeGraphAdvancedExample()).resolves.not.toThrow()
  })
})
