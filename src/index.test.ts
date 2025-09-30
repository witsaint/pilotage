import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { main } from './index'

describe('main function', () => {
  it('should return "Hello, world!"', () => {
    const result = main()
    expect(result).toBe('Hello, world!')
  })

  it('should return a string', () => {
    const result = main()
    expect(typeof result).toBe('string')
  })

  it('should not be empty', () => {
    const result = main()
    expect(result.length).toBeGreaterThan(0)
  })
})
