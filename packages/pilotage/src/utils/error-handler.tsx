import process from 'node:process'
import figures from 'figures'

export interface ErrorHandlerOptions {
  /**
   * 是否在打印错误后退出进程
   */
  exit?: boolean
  /**
   * 退出码，默认 1
   */
  exitCode?: number
  /**
   * 自定义错误格式化函数
   */
  formatError?: (error: unknown) => string
}

/**
 * 格式化错误信息
 */
function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}${error.stack ? `\n${error.stack}` : ''}`
  }
  if (typeof error === 'string') {
    return error
  }
  return String(error)
}

/**
 * 统一的错误处理和打印
 */
export function handleError(error: unknown, options: ErrorHandlerOptions = {}): void {
  const {
    exit = false,
    exitCode = 1,
    formatError: customFormat = formatError,
  } = options

  const errorMessage = customFormat(error)
  console.error(`\n ${figures.cross} Error: ${errorMessage}\n`)

  if (exit) {
    process.exit(exitCode)
  }
}

/**
 * 设置全局未捕获异常处理器
 */
export function setupGlobalErrorHandlers(options: ErrorHandlerOptions = {}): void {
  // 处理未捕获的同步异常
  process.on('uncaughtException', (error: Error) => {
    const shouldExit = options.exit ?? false
    handleError(error, { ...options, exit: shouldExit })
    // 如果设置不退出，确保不会因为未处理的异常导致进程退出
    // Node.js 在设置了 uncaughtException 监听器后，默认不会退出
    // 但为了明确，我们根据配置决定是否退出
  })

  // 处理未捕获的 Promise 拒绝
  process.on('unhandledRejection', (reason: unknown) => {
    const shouldExit = options.exit ?? false
    handleError(reason, { ...options, exit: shouldExit })
    // unhandledRejection 默认不会导致进程退出（Node 15+）
    // 但如果需要，可以根据配置退出
  })
}

/**
 * 包装异步函数，自动捕获异常并处理
 */
export function wrapAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: ErrorHandlerOptions,
): T {
  return ((...args: Parameters<T>) => {
    return fn(...args).catch((error: unknown) => {
      handleError(error, options)
      throw error // 重新抛出，让调用者决定是否继续处理
    })
  }) as T
}
