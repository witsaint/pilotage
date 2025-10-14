/**
 * 工厂模式实现
 * 统一创建和管理流程、任务、上下文等组件
 */

import type {
  ContextData,
  FactoryConfig,
  IContextManager,
  IEventEmitter,
  IStateManager,
  PipelineConfig,
  TaskConfig,
  TaskExecutor,
} from './types'

import { ContextManager } from './context'
import { DAGBuilder } from './dag-builder'
import { DAGPipeline, EventEmitter } from './dag-pipeline'
import { NodeGraph } from './graph-node'
import { FileStateManager, MemoryStateManager } from './state'

/**
 * 流程工厂实现
 */
export class PipelineFactory {
  private config: FactoryConfig
  private taskTemplates: Map<string, Partial<TaskConfig>> = new Map()
  private pipelineTemplates: Map<string, Partial<PipelineConfig>> = new Map()
  private instances: Map<string, DAGPipeline> = new Map()

  constructor(config: FactoryConfig = {}) {
    this.config = config
    this.registerBuiltinTemplates()
  }

  /**
   * 创建任务构建器（向后兼容）
   */
  createTaskBuilder<TInput = unknown, TOutput = unknown>(): {
    id: (id: string) => { id: string }
    name: (name: string) => { name: string }
    executor: (executor: TaskExecutor<TInput, TOutput>) => { executor: TaskExecutor<TInput, TOutput> }
    build: () => TaskConfig<TInput, TOutput>
  } {
    // 返回简单的任务配置构建器
    return {
      id: (id: string) => ({ id }),
      name: (name: string) => ({ name }),
      executor: (executor: TaskExecutor<TInput, TOutput>) => ({ executor }),
      build: () => ({
        id: 'task',
        name: 'Task',
        executor: () => Promise.resolve({} as TOutput),
        dependencies: [],
        tags: [],
        metadata: {},
      }),
    }
  }

  /**
   * 创建 DAG 构建器
   */
  createDAGBuilder(): DAGBuilder {
    return new DAGBuilder()
  }

  /**
   * 创建流程构建器（向后兼容）
   */
  createPipelineBuilder(): DAGBuilder {
    // 返回 DAGBuilder 作为兼容性实现
    return this.createDAGBuilder()
  }

  /**
   * 创建流程实例
   */
  createPipeline(config: PipelineConfig): DAGPipeline {
    const nodeGraph = new NodeGraph()
    const context = this.config.contextManager || new ContextManager()
    const events = this.config.eventEmitter

    const pipeline = new DAGPipeline(config, nodeGraph, context, events)

    // 缓存实例
    this.instances.set(config.id, pipeline)

    return pipeline
  }

  /**
   * 从模板创建流程
   */
  createPipelineFromTemplate(
    templateName: string,
    overrides: Partial<PipelineConfig> = {},
  ): DAGPipeline {
    const template = this.pipelineTemplates.get(templateName)
    if (!template) {
      throw new Error(`Pipeline template "${templateName}" not found`)
    }

    const config: PipelineConfig = {
      id: `${templateName}_${Date.now()}`,
      name: templateName,
      ...template,
      ...overrides,
    } as PipelineConfig

    return this.createPipeline(config)
  }

  /**
   * 注册任务模板
   */
  registerTaskTemplate<TInput = unknown, TOutput = unknown>(
    name: string,
    template: Partial<TaskConfig<TInput, TOutput>>,
  ): void {
    this.taskTemplates.set(name, template as Partial<TaskConfig>)
  }

  /**
   * 获取任务模板
   */
  getTaskTemplate<TInput = unknown, TOutput = unknown>(
    name: string,
  ): Partial<TaskConfig<TInput, TOutput>> | undefined {
    return this.taskTemplates.get(name) as Partial<TaskConfig<TInput, TOutput>> | undefined
  }

  /**
   * 从模板创建任务
   */
  createTaskFromTemplate<TInput = unknown, TOutput = unknown>(
    templateName: string,
    overrides: Partial<TaskConfig<TInput, TOutput>> = {},
  ): TaskConfig<TInput, TOutput> {
    const template = this.getTaskTemplate<TInput, TOutput>(templateName)
    if (!template) {
      throw new Error(`Task template "${templateName}" not found`)
    }

    // 合并模板和覆盖配置
    const config: TaskConfig<TInput, TOutput> = {
      id: overrides.id || `task_${Date.now()}`,
      name: overrides.name || template.name || 'Unnamed Task',
      executor: overrides.executor || (() => Promise.resolve({} as TOutput)),
      dependencies: overrides.dependencies || template.dependencies || [],
      tags: overrides.tags || template.tags || [],
      metadata: { ...template.metadata, ...overrides.metadata },
      description: overrides.description || template.description,
      retry: overrides.retry || template.retry,
      timeout: overrides.timeout || template.timeout,
      parallel: overrides.parallel !== undefined ? overrides.parallel : template.parallel,
    }

    return config
  }

  /**
   * 注册流程模板
   */
  registerPipelineTemplate(
    name: string,
    template: Partial<PipelineConfig>,
  ): void {
    this.pipelineTemplates.set(name, template)
  }

  /**
   * 获取流程模板
   */
  getPipelineTemplate(name: string): Partial<PipelineConfig> | undefined {
    return this.pipelineTemplates.get(name)
  }

  /**
   * 获取流程实例
   */
  getPipelineInstance(id: string): DAGPipeline | undefined {
    return this.instances.get(id)
  }

  /**
   * 获取所有流程实例
   */
  getAllPipelineInstances(): DAGPipeline[] {
    return Array.from(this.instances.values())
  }

  /**
   * 销毁流程实例
   */
  destroyPipelineInstance(id: string): boolean {
    return this.instances.delete(id)
  }

  /**
   * 清空所有实例
   */
  clearAllInstances(): void {
    this.instances.clear()
  }

  /**
   * 创建上下文管理器
   */
  createContextManager<T extends ContextData = ContextData>(
    initialData?: Partial<T>,
  ): IContextManager<T> {
    const context = new ContextManager<T>()
    if (initialData) {
      context.merge(initialData)
    }
    return context
  }

  /**
   * 创建状态管理器
   */
  createStateManager(type: 'file' | 'memory' = 'file', basePath?: string): IStateManager {
    if (type === 'memory') {
      return new MemoryStateManager()
    }
    else {
      return new FileStateManager(basePath)
    }
  }

  /**
   * 创建事件发射器
   */
  createEventEmitter(): EventEmitter {
    return new EventEmitter()
  }

  /**
   * 创建节点图
   */
  createNodeGraph(): NodeGraph {
    return new NodeGraph()
  }

  /**
   * 注册内置模板
   */
  private registerBuiltinTemplates(): void {
    // HTTP 请求任务模板
    this.registerTaskTemplate('http-request', {
      name: 'HTTP Request',
      retry: {
        maxAttempts: 3,
        delay: 1000,
        backoffMultiplier: 2,
        shouldRetry: error => error.message.includes('HTTP 5'),
      },
      timeout: 30000,
      tags: ['http', 'network'],
    })

    // 文件处理任务模板
    this.registerTaskTemplate('file-process', {
      name: 'File Process',
      timeout: 60000,
      tags: ['file', 'io'],
    })

    // 数据转换任务模板
    this.registerTaskTemplate('data-transform', {
      name: 'Data Transform',
      timeout: 10000,
      tags: ['transform', 'data'],
    })

    // 批处理任务模板
    this.registerTaskTemplate('batch-process', {
      name: 'Batch Process',
      parallel: true,
      timeout: 300000,
      tags: ['batch', 'parallel'],
    })

    // 验证任务模板
    this.registerTaskTemplate('validation', {
      name: 'Validation',
      timeout: 5000,
      tags: ['validation', 'check'],
    })

    // 通知任务模板
    this.registerTaskTemplate('notification', {
      name: 'Notification',
      retry: {
        maxAttempts: 2,
        delay: 500,
      },
      timeout: 10000,
      tags: ['notification', 'alert'],
    })

    // 数据处理流程模板
    this.registerPipelineTemplate('data-processing', {
      name: 'Data Processing Pipeline',
      maxConcurrency: 5,
      timeout: 600000,
      autoRetry: true,
      persistState: true,
    })

    // API 集成流程模板
    this.registerPipelineTemplate('api-integration', {
      name: 'API Integration Pipeline',
      maxConcurrency: 10,
      timeout: 300000,
      autoRetry: true,
    })

    // 批处理流程模板
    this.registerPipelineTemplate('batch-processing', {
      name: 'Batch Processing Pipeline',
      maxConcurrency: 20,
      timeout: 1800000,
      persistState: true,
    })
  }

  /**
   * 获取所有任务模板名称
   */
  getTaskTemplateNames(): string[] {
    return Array.from(this.taskTemplates.keys())
  }

  /**
   * 获取所有流程模板名称
   */
  getPipelineTemplateNames(): string[] {
    return Array.from(this.pipelineTemplates.keys())
  }

  /**
   * 导出配置
   */
  exportConfig(): {
    taskTemplates: Record<string, Partial<TaskConfig>>
    pipelineTemplates: Record<string, Partial<PipelineConfig>>
  } {
    return {
      taskTemplates: Object.fromEntries(this.taskTemplates),
      pipelineTemplates: Object.fromEntries(this.pipelineTemplates),
    }
  }

  /**
   * 导入配置
   */
  importConfig(config: {
    taskTemplates?: Record<string, Partial<TaskConfig>>
    pipelineTemplates?: Record<string, Partial<PipelineConfig>>
  }): void {
    if (config.taskTemplates) {
      for (const [name, template] of Object.entries(config.taskTemplates)) {
        this.registerTaskTemplate(name, template)
      }
    }

    if (config.pipelineTemplates) {
      for (const [name, template] of Object.entries(config.pipelineTemplates)) {
        this.registerPipelineTemplate(name, template)
      }
    }
  }

  /**
   * 克隆工厂
   */
  clone(): PipelineFactory {
    const cloned = new PipelineFactory(this.config)
    cloned.importConfig(this.exportConfig())
    return cloned
  }
}

/**
 * 单例工厂管理器
 */
export class FactoryManager {
  private static instance?: PipelineFactory
  private static instances: Map<string, PipelineFactory> = new Map()

  /**
   * 获取默认工厂实例
   */
  static getDefaultFactory(): PipelineFactory {
    if (!this.instance) {
      this.instance = new PipelineFactory()
    }
    return this.instance
  }

  /**
   * 设置默认工厂实例
   */
  static setDefaultFactory(factory: PipelineFactory): void {
    this.instance = factory
  }

  /**
   * 创建命名工厂实例
   */
  static createFactory(name: string, config?: FactoryConfig): PipelineFactory {
    const factory = new PipelineFactory(config)
    this.instances.set(name, factory)
    return factory
  }

  /**
   * 获取命名工厂实例
   */
  static getFactory(name: string): PipelineFactory | undefined {
    return this.instances.get(name)
  }

  /**
   * 销毁命名工厂实例
   */
  static destroyFactory(name: string): boolean {
    return this.instances.delete(name)
  }

  /**
   * 获取所有工厂实例名称
   */
  static getFactoryNames(): string[] {
    return Array.from(this.instances.keys())
  }

  /**
   * 清空所有工厂实例
   */
  static clearAllFactories(): void {
    this.instances.clear()
    this.instance = undefined
  }
}

/**
 * 快速创建工厂的辅助函数
 */
export function createFactory(config?: FactoryConfig): PipelineFactory {
  return new PipelineFactory(config)
}

/**
 * 获取默认工厂实例
 */
export function getDefaultFactory(): PipelineFactory {
  return FactoryManager.getDefaultFactory()
}

/**
 * 工厂构建器
 * 提供流畅的 API 来配置工厂
 */
export class FactoryBuilder {
  private config: FactoryConfig = {}
  private taskTemplates: Map<string, Partial<TaskConfig>> = new Map()
  private pipelineTemplates: Map<string, Partial<PipelineConfig>> = new Map()

  /**
   * 设置默认上下文管理器
   */
  withContextManager<T extends ContextData = ContextData>(
    contextManager: IContextManager<T>,
  ): FactoryBuilder {
    this.config.contextManager = contextManager
    return this
  }

  /**
   * 设置默认状态管理器
   */
  withStateManager(stateManager: IStateManager): FactoryBuilder {
    this.config.stateManager = stateManager
    return this
  }

  /**
   * 设置默认事件发射器
   */
  withEventEmitter(eventEmitter: IEventEmitter): FactoryBuilder {
    this.config.eventEmitter = eventEmitter
    return this
  }

  /**
   * 添加任务模板
   */
  addTaskTemplate(name: string, template: Partial<TaskConfig>): FactoryBuilder {
    this.taskTemplates.set(name, template)
    return this
  }

  /**
   * 添加流程模板
   */
  addPipelineTemplate(name: string, template: Partial<PipelineConfig>): FactoryBuilder {
    this.pipelineTemplates.set(name, template)
    return this
  }

  /**
   * 构建工厂
   */
  build(): PipelineFactory {
    const factory = new PipelineFactory(this.config)

    // 注册模板
    for (const [name, template] of this.taskTemplates) {
      factory.registerTaskTemplate(name, template)
    }

    for (const [name, template] of this.pipelineTemplates) {
      factory.registerPipelineTemplate(name, template)
    }

    return factory
  }
}

/**
 * 创建工厂构建器
 */
export function createFactoryBuilder(): FactoryBuilder {
  return new FactoryBuilder()
}

/**
 * 预配置的工厂创建函数
 */
export const FactoryPresets = {
  /**
   * 开发环境工厂
   */
  development(): PipelineFactory {
    return createFactoryBuilder()
      .withContextManager(new ContextManager())
      .withStateManager(new MemoryStateManager())
      .withEventEmitter(new EventEmitter() as IEventEmitter)
      .build()
  },

  /**
   * 生产环境工厂
   */
  production(stateBasePath?: string): PipelineFactory {
    return createFactoryBuilder()
      .withContextManager(new ContextManager())
      .withStateManager(new FileStateManager(stateBasePath))
      .withEventEmitter(new EventEmitter() as IEventEmitter)
      .build()
  },

  /**
   * 测试环境工厂
   */
  testing(): PipelineFactory {
    return createFactoryBuilder()
      .withContextManager(new ContextManager())
      .withStateManager(new MemoryStateManager())
      .withEventEmitter(new EventEmitter() as IEventEmitter)
      .build()
  },

  /**
   * 高性能工厂
   */
  highPerformance(): PipelineFactory {
    const contextManager = new ContextManager()
    const stateManager = new MemoryStateManager()
    const eventEmitter = new EventEmitter()

    return createFactoryBuilder()
      .withContextManager(contextManager)
      .withStateManager(stateManager)
      .withEventEmitter(eventEmitter as IEventEmitter)
      .addPipelineTemplate('high-performance', {
        maxConcurrency: 50,
        timeout: 60000,
        persistState: false,
      })
      .build()
  },
}
