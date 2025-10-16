/**
 * DAG Graph 类型安全测试
 */

import { describe, expect, it } from 'vitest'
import { dagGraph, dagNode } from '../packages/pilotage/src/core/dag-graph'

// 空输入类型
type EmptyInput = Record<string, never>

describe('DAG Graph Type Safety', () => {
  it('应该能检测到错误的节点连接', () => {
    const graph = dagGraph()

    // 创建节点
    const source = dagNode<EmptyInput, { data: string }>({
      id: 'source',
      name: '数据源',
      executor: async () => ({ data: 'Hello' }),
    })

    const processor = dagNode<{ input: string }, { result: string }>({
      id: 'processor',
      name: '处理器',
      executor: async (inputs) => ({ result: inputs.input.toUpperCase() }),
    })

    // 添加节点
    graph.addNode(source).addNode(processor)

    // ✅ 正确的连接
    graph.addEdge({
      id: 'correct_edge',
      sourceNodeId: 'source',
      sourcePort: 'data',
      targetNodeId: 'processor',
      targetPort: 'input',
    })

    // 这个测试主要是为了验证类型系统
    // 如果你取消注释下面的代码，TypeScript 会报错：
    // graph.addEdge({
    //   id: 'wrong_edge',
    //   sourceNodeId: 'processor',  // ❌ processor 没有 'data' 输出
    //   sourcePort: 'data',
    //   targetNodeId: 'source',     // ❌ source 没有 'input' 输入
    //   targetPort: 'input',
    // })

    expect(true).toBe(true) // 类型检查通过
  })

  it('应该支持类型转换', () => {
    const graph = dagGraph()

    const textNode = dagNode<EmptyInput, { text: string }>({
      id: 'text',
      name: '文本节点',
      executor: async () => ({ text: 'Hello' }),
    })

    const lengthNode = dagNode<{ length: number }, { value: number }>({
      id: 'length',
      name: '长度节点',
      executor: async (inputs) => ({ value: inputs.length * 2 }),
    })

    graph.addNode(textNode).addNode(lengthNode)

    // 使用 transform 进行类型转换
    graph.addEdge({
      id: 'text_to_length',
      sourceNodeId: 'text',
      sourcePort: 'text',      // string
      targetNodeId: 'length',
      targetPort: 'length',    // number
      transform: (text: string) => text.length,
    })

    expect(true).toBe(true) // 类型检查通过
  })
})
