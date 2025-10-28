/**
 * 上下文管理系统
 * 提供类型安全的数据存储和传递机制
 */

import type { ContextData, IContextManager } from './types'

/**
 * 上下文管理器实现
 * 支持层级上下文和类型安全的数据访问
 */
export class ContextManager<T extends ContextData = ContextData> implements IContextManager<T> {
  private data: Map<keyof T, T[keyof T]> = new Map()
  private parent?: ContextManager<T>
  private children: Set<ContextManager<T>> = new Set()

  constructor(parent?: ContextManager<T>) {
    this.parent = parent
    if (parent) {
      parent.children.add(this)
    }
  }

  /**
   * 获取上下文数据
   * 支持向上查找父级上下文
   */
  get<K extends keyof T>(key: K): T[K] | undefined {
    // 先在当前上下文查找
    if (this.data.has(key)) {
      return this.data.get(key) as T[K]
    }

    // 向上查找父级上下文
    if (this.parent) {
      return this.parent.get(key)
    }

    return undefined
  }

  /**
   * 设置上下文数据
   * 只在当前上下文设置，不影响父级
   */
  set<K extends string | number>(key: K, value: unknown): void {
    this.data.set(key as keyof T, value as T[keyof T])
  }

  /**
   * 批量设置数据
   */
  merge(data: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        this.data.set(key as keyof T, value as T[keyof T])
      }
    }
  }

  /**
   * 清空当前上下文数据
   * 不影响父级和子级上下文
   */
  clear(): void {
    this.data.clear()
  }

  /**
   * 获取所有数据（包括继承的父级数据）
   */
  getAll(): T {
    const result = {} as T

    // 先收集父级数据
    if (this.parent) {
      Object.assign(result, this.parent.getAll())
    }

    // 再覆盖当前数据
    for (const [key, value] of this.data.entries()) {
      result[key] = value
    }

    return result
  }

  /**
   * 获取当前上下文的数据（不包括父级）
   */
  getOwn(): Partial<T> {
    const result = {} as Partial<T>
    for (const [key, value] of this.data.entries()) {
      result[key] = value
    }
    return result
  }

  /**
   * 创建子上下文
   */
  createChild(): ContextManager<T> {
    return new ContextManager<T>(this)
  }

  /**
   * 销毁上下文
   * 清理父子关系
   */
  destroy(): void {
    // 从父级移除引用
    if (this.parent) {
      this.parent.children.delete(this)
    }

    // 销毁所有子上下文
    for (const child of this.children) {
      child.destroy()
    }

    // 清空数据
    this.clear()
    this.children.clear()
  }

  /**
   * 检查是否存在指定键
   */
  has<K extends keyof T>(key: K): boolean {
    return this.data.has(key) || (this.parent?.has(key) ?? false)
  }

  /**
   * 删除指定键
   */
  delete<K extends keyof T>(key: K): boolean {
    return this.data.delete(key)
  }

  /**
   * 获取所有键
   */
  keys(): (keyof T)[] {
    const keys = new Set<keyof T>()

    // 收集父级键
    if (this.parent) {
      for (const key of this.parent.keys()) {
        keys.add(key)
      }
    }

    // 收集当前键
    for (const key of this.data.keys()) {
      keys.add(key)
    }

    return Array.from(keys)
  }

  /**
   * 获取数据条目数量
   */
  size(): number {
    return this.keys().length
  }

  /**
   * 检查上下文是否为空
   */
  isEmpty(): boolean {
    return this.size() === 0
  }

  /**
   * 克隆上下文（深拷贝）
   */
  clone(): ContextManager<T> {
    const cloned = new ContextManager<T>()
    const allData = this.getAll()

    // 深拷贝数据
    for (const [key, value] of Object.entries(allData)) {
      cloned.set(key as string, this.deepClone(value))
    }

    return cloned
  }

  /**
   * 深拷贝辅助函数
   */
  private deepClone(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime())
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item))
    }

    if (typeof obj === 'object') {
      const cloned = {} as Record<string, unknown>
      for (const [key, value] of Object.entries(obj)) {
        cloned[key] = this.deepClone(value)
      }
      return cloned
    }

    return obj
  }

  /**
   * 转换为 JSON 字符串
   */
  toJSON(): string {
    return JSON.stringify(this.getAll())
  }

  /**
   * 从 JSON 字符串恢复
   */
  static fromJSON<T extends ContextData>(json: string): ContextManager<T> {
    const data = JSON.parse(json) as T
    const context = new ContextManager<T>()
    context.merge(data)
    return context
  }

  /**
   * 监听数据变化（简单实现）
   */
  private listeners: Map<keyof T, Set<(value: T[keyof T]) => void>> = new Map()

  /**
   * 添加数据变化监听器
   */
  watch<K extends keyof T>(key: K, listener: (value: T[K]) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }

    const keyListeners = this.listeners.get(key)!
    keyListeners.add(listener as (value: T[keyof T]) => void)

    // 返回取消监听的函数
    return () => {
      keyListeners.delete(listener as (value: T[keyof T]) => void)
      if (keyListeners.size === 0) {
        this.listeners.delete(key)
      }
    }
  }

  /**
   * 触发数据变化事件
   */
  private notifyChange<K extends keyof T>(key: K, value: T[K]): void {
    const keyListeners = this.listeners.get(key)
    if (keyListeners) {
      for (const listener of keyListeners) {
        try {
          listener(value)
        }
        catch (error) {
          console.error(`Error in context listener for key "${String(key)}":`, error)
        }
      }
    }
  }

  /**
   * 重写 set 方法以支持监听
   */
  setWithNotify<K extends string | number>(key: K, value: unknown): void {
    const oldValue = this.get(key as keyof T)
    this.set(key, value)

    // 只有值真正改变时才触发事件
    if (oldValue !== value) {
      this.notifyChange(key as keyof T, value as T[keyof T])
    }
  }
}

/**
 * 创建全局上下文管理器
 */
export function createContextManager<T extends ContextData = ContextData>(
  initialData?: Partial<T>,
): ContextManager<T> {
  const context = new ContextManager<T>()
  if (initialData) {
    context.merge(initialData)
  }
  return context
}

/**
 * 上下文作用域管理器
 * 用于自动管理上下文的生命周期
 */
export class ContextScope<T extends ContextData = ContextData> {
  private context: ContextManager<T>
  private cleanupFunctions: (() => void)[] = []

  constructor(parent?: ContextManager<T>) {
    this.context = parent ? parent.createChild() : new ContextManager<T>()
  }

  /**
   * 获取上下文管理器
   */
  getContext(): ContextManager<T> {
    return this.context
  }

  /**
   * 添加清理函数
   */
  addCleanup(cleanup: () => void): void {
    this.cleanupFunctions.push(cleanup)
  }

  /**
   * 在作用域内执行函数
   */
  async run<R>(fn: (context: ContextManager<T>) => Promise<R> | R): Promise<R> {
    try {
      return await fn(this.context)
    }
    finally {
      this.dispose()
    }
  }

  /**
   * 销毁作用域
   */
  dispose(): void {
    // 执行清理函数
    for (const cleanup of this.cleanupFunctions) {
      try {
        cleanup()
      }
      catch (error) {
        console.error('Error during context cleanup:', error)
      }
    }

    // 销毁上下文
    this.context.destroy()
    this.cleanupFunctions.length = 0
  }
}

/**
 * 创建上下文作用域
 */
export function createContextScope<T extends ContextData = ContextData>(
  parent?: ContextManager<T>,
): ContextScope<T> {
  return new ContextScope<T>(parent)
}

/**
 * 上下文装饰器（用于类方法）
 */
export function withContext<T extends ContextData = ContextData>(
  contextKey?: keyof T,
) {
  return function <TTarget, TMethod extends (
    ...args: any[]
  ) => any>(
    target: TTarget,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<TMethod>,
  ): TypedPropertyDescriptor<TMethod> {
    const originalMethod = descriptor.value!

    descriptor.value = function (this: any, ...args: Parameters<TMethod>): ReturnType<TMethod> {
      const context = contextKey ? this[contextKey] : this.context
      if (!context || !(context instanceof ContextManager)) {
        throw new Error(`Context not found for method ${String(propertyKey)}`)
      }

      const scope = createContextScope(context)
      return scope.run(() => originalMethod.apply(this, args)) as ReturnType<TMethod>
    } as TMethod

    return descriptor
  }
}
