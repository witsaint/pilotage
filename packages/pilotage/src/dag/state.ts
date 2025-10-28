/**
 * 状态管理系统
 * 提供状态持久化和恢复功能
 */

import type { IStateManager } from './types'
import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'

/**
 * 基于文件系统的状态管理器
 */
export class FileStateManager implements IStateManager {
  private basePath: string
  private cache: Map<string, unknown> = new Map()
  private cacheEnabled: boolean

  constructor(basePath: string = './.pilotage/state', cacheEnabled: boolean = true) {
    this.basePath = basePath
    this.cacheEnabled = cacheEnabled
  }

  /**
   * 保存状态到文件
   */
  async save(key: string, data: unknown): Promise<void> {
    const filePath = this.getFilePath(key)

    try {
      // 确保目录存在
      await this.ensureDirectory(dirname(filePath))

      // 序列化数据
      const serialized = JSON.stringify({
        key,
        data,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      }, null, 2)

      // 写入文件
      await fs.writeFile(filePath, serialized, 'utf-8')

      // 更新缓存
      if (this.cacheEnabled) {
        this.cache.set(key, data)
      }
    }
    catch (error) {
      throw new Error(`Failed to save state for key "${key}": ${error}`)
    }
  }

  /**
   * 从文件加载状态
   */
  async load<T>(key: string): Promise<T | undefined> {
    // 先检查缓存
    if (this.cacheEnabled && this.cache.has(key)) {
      return this.cache.get(key) as T
    }

    const filePath = this.getFilePath(key)

    try {
      // 检查文件是否存在
      await fs.access(filePath)

      // 读取文件内容
      const content = await fs.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(content)

      // 验证数据格式
      if (!parsed || typeof parsed !== 'object' || parsed.key !== key) {
        throw new Error('Invalid state file format')
      }

      const data = parsed.data as T

      // 更新缓存
      if (this.cacheEnabled) {
        this.cache.set(key, data)
      }

      return data
    }
    catch (error: any) {
      if (error.code === 'ENOENT') {
        // 文件不存在，返回 undefined
        return undefined
      }
      throw new Error(`Failed to load state for key "${key}": ${error}`)
    }
  }

  /**
   * 删除状态文件
   */
  async remove(key: string): Promise<void> {
    const filePath = this.getFilePath(key)

    try {
      await fs.unlink(filePath)

      // 从缓存中移除
      if (this.cacheEnabled) {
        this.cache.delete(key)
      }
    }
    catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw new Error(`Failed to remove state for key "${key}": ${error}`)
      }
    }
  }

  /**
   * 清空所有状态
   */
  async clear(): Promise<void> {
    try {
      // 清空缓存
      if (this.cacheEnabled) {
        this.cache.clear()
      }

      // 删除状态目录
      await fs.rm(this.basePath, { recursive: true, force: true })
    }
    catch (error) {
      throw new Error(`Failed to clear all states: ${error}`)
    }
  }

  /**
   * 获取所有状态键
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.basePath, { recursive: true })
      return files
        .filter(file => typeof file === 'string' && file.endsWith('.json'))
        .map(file => file.replace('.json', ''))
    }
    catch (error: any) {
      if (error.code === 'ENOENT') {
        return []
      }
      throw new Error(`Failed to get all keys: ${error}`)
    }
  }

  /**
   * 检查状态是否存在
   */
  async exists(key: string): Promise<boolean> {
    if (this.cacheEnabled && this.cache.has(key)) {
      return true
    }

    const filePath = this.getFilePath(key)
    try {
      await fs.access(filePath)
      return true
    }
    catch {
      return false
    }
  }

  /**
   * 获取状态文件信息
   */
  async getInfo(key: string): Promise<{
    exists: boolean
    size?: number
    modifiedTime?: Date
    version?: string
  }> {
    const filePath = this.getFilePath(key)

    try {
      const stats = await fs.stat(filePath)
      const content = await fs.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(content)

      return {
        exists: true,
        size: stats.size,
        modifiedTime: stats.mtime,
        version: parsed.version,
      }
    }
    catch {
      return { exists: false }
    }
  }

  /**
   * 批量保存状态
   */
  async saveBatch(states: Record<string, unknown>): Promise<void> {
    const promises = Object.entries(states).map(([key, data]) =>
      this.save(key, data))

    await Promise.all(promises)
  }

  /**
   * 批量加载状态
   */
  async loadBatch<T>(keys: string[]): Promise<Record<string, T | undefined>> {
    const promises = keys.map(async key => ({
      key,
      data: await this.load<T>(key),
    }))

    const results = await Promise.all(promises)

    return results.reduce((acc, { key, data }) => {
      acc[key] = data
      return acc
    }, {} as Record<string, T | undefined>)
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * 获取缓存大小
   */
  getCacheSize(): number {
    return this.cache.size
  }

  /**
   * 获取文件路径
   */
  private getFilePath(key: string): string {
    // 清理键名，确保文件系统安全
    const safeKey = key.replace(/[^\w-]/g, '_')
    return join(this.basePath, `${safeKey}.json`)
  }

  /**
   * 确保目录存在
   */
  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true })
    }
    catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw error
      }
    }
  }
}

/**
 * 基于内存的状态管理器（用于测试或临时存储）
 */
export class MemoryStateManager implements IStateManager {
  private storage: Map<string, {
    data: unknown
    timestamp: Date
  }> = new Map()

  async save(key: string, data: unknown): Promise<void> {
    this.storage.set(key, {
      data: this.deepClone(data),
      timestamp: new Date(),
    })
  }

  async load<T>(key: string): Promise<T | undefined> {
    const item = this.storage.get(key)
    return item ? this.deepClone(item.data) as T : undefined
  }

  async remove(key: string): Promise<void> {
    this.storage.delete(key)
  }

  async clear(): Promise<void> {
    this.storage.clear()
  }

  /**
   * 获取所有键
   */
  getAllKeys(): string[] {
    return Array.from(this.storage.keys())
  }

  /**
   * 检查是否存在
   */
  exists(key: string): boolean {
    return this.storage.has(key)
  }

  /**
   * 获取存储大小
   */
  size(): number {
    return this.storage.size
  }

  /**
   * 深拷贝数据
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
}

/**
 * 状态管理器装饰器
 * 自动保存和恢复方法的状态
 */
export function stateful<T>(
  stateManager: IStateManager,
  keyGenerator?: (target: any, propertyKey: string, args: any[]) => string,
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<T>>,
  ): TypedPropertyDescriptor<(...args: any[]) => Promise<T>> {
    const originalMethod = descriptor.value!

    descriptor.value = async function (this: any, ...args: any[]): Promise<T> {
      const stateKey = keyGenerator
        ? keyGenerator(this, propertyKey, args)
        : `${target.constructor.name}.${propertyKey}.${JSON.stringify(args)}`

      try {
        // 尝试从状态恢复
        const savedState = await stateManager.load<T>(stateKey)
        if (savedState !== undefined) {
          return savedState
        }

        // 执行原方法
        const result = await originalMethod.apply(this, args)

        // 保存状态
        await stateManager.save(stateKey, result)

        return result
      }
      catch (error) {
        // 清理可能损坏的状态
        await stateManager.remove(stateKey)
        throw error
      }
    }

    return descriptor
  }
}

/**
 * 状态快照管理器
 * 支持创建和恢复状态快照
 */
export class StateSnapshotManager {
  private stateManager: IStateManager
  private snapshots: Map<string, string[]> = new Map()

  constructor(stateManager: IStateManager) {
    this.stateManager = stateManager
  }

  /**
   * 创建状态快照
   */
  async createSnapshot(snapshotId: string, keys?: string[]): Promise<void> {
    const keysToSnapshot = keys || (
      this.stateManager instanceof FileStateManager
        ? await this.stateManager.getAllKeys()
        : this.stateManager instanceof MemoryStateManager
          ? this.stateManager.getAllKeys()
          : []
    )

    // 保存快照元数据
    this.snapshots.set(snapshotId, keysToSnapshot)
    await this.stateManager.save(`__snapshot_${snapshotId}`, {
      id: snapshotId,
      keys: keysToSnapshot,
      timestamp: new Date().toISOString(),
    })

    // 复制状态数据
    for (const key of keysToSnapshot) {
      const data = await this.stateManager.load(key)
      if (data !== undefined) {
        await this.stateManager.save(`__snapshot_${snapshotId}_${key}`, data)
      }
    }
  }

  /**
   * 恢复状态快照
   */
  async restoreSnapshot(snapshotId: string): Promise<void> {
    const snapshotMeta = await this.stateManager.load<{
      id: string
      keys: string[]
      timestamp: string
    }>(`__snapshot_${snapshotId}`)

    if (!snapshotMeta) {
      throw new Error(`Snapshot "${snapshotId}" not found`)
    }

    // 恢复状态数据
    for (const key of snapshotMeta.keys) {
      const data = await this.stateManager.load(`__snapshot_${snapshotId}_${key}`)
      if (data !== undefined) {
        await this.stateManager.save(key, data)
      }
    }
  }

  /**
   * 删除状态快照
   */
  async deleteSnapshot(snapshotId: string): Promise<void> {
    const snapshotMeta = await this.stateManager.load<{
      keys: string[]
    }>(`__snapshot_${snapshotId}`)

    if (snapshotMeta) {
      // 删除快照数据
      for (const key of snapshotMeta.keys) {
        await this.stateManager.remove(`__snapshot_${snapshotId}_${key}`)
      }
    }

    // 删除快照元数据
    await this.stateManager.remove(`__snapshot_${snapshotId}`)
    this.snapshots.delete(snapshotId)
  }

  /**
   * 列出所有快照
   */
  async listSnapshots(): Promise<Array<{
    id: string
    timestamp: string
    keyCount: number
  }>> {
    const snapshots: Array<{
      id: string
      timestamp: string
      keyCount: number
    }> = []

    // 这里需要根据具体的状态管理器实现来获取所有快照
    // 简化实现，实际使用时可能需要更复杂的逻辑
    for (const [snapshotId] of this.snapshots) {
      const meta = await this.stateManager.load<{
        timestamp: string
        keys: string[]
      }>(`__snapshot_${snapshotId}`)

      if (meta) {
        snapshots.push({
          id: snapshotId,
          timestamp: meta.timestamp,
          keyCount: meta.keys.length,
        })
      }
    }

    return snapshots.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }
}

/**
 * 创建文件状态管理器
 */
export function createFileStateManager(
  basePath?: string,
  cacheEnabled?: boolean,
): FileStateManager {
  return new FileStateManager(basePath, cacheEnabled)
}

/**
 * 创建内存状态管理器
 */
export function createMemoryStateManager(): MemoryStateManager {
  return new MemoryStateManager()
}

/**
 * 创建状态快照管理器
 */
export function createStateSnapshotManager(
  stateManager: IStateManager,
): StateSnapshotManager {
  return new StateSnapshotManager(stateManager)
}
