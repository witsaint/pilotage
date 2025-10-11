import { getScreenSizeCategory, getSmartResponsiveSize, getTerminalSize, isLargeScreen, isSmallScreen, type ResponsiveConfig, type ScreenSize, type TerminalSize } from './screen'

/**
 * 全局尺寸管理器
 * 在应用启动时初始化，提供全局的尺寸信息
 */
class SizeManager {
  private screenSize: ScreenSize = 'md'
  private terminalSize: TerminalSize = {
    width: 0,
    height: 0,
    columns: 0,
    rows: 0,
  }

  private responsiveSize: TerminalSize = {
    width: 0,
    height: 0,
    columns: 0,
    rows: 0,
  }

  private isInitialized = false

  /**
   * 初始化尺寸管理器
   */
  init(defaultConfig?: ResponsiveConfig): void {
    if (this.isInitialized) {
      return
    }

    // 获取屏幕尺寸类别
    this.screenSize = getScreenSizeCategory()

    // 获取终端尺寸
    this.terminalSize = getTerminalSize()

    // 计算响应式尺寸
    this.responsiveSize = getSmartResponsiveSize(defaultConfig, this.screenSize)

    this.isInitialized = true
  }

  /**
   * 获取屏幕尺寸类别
   */
  getScreenSize(): ScreenSize {
    this.ensureInitialized()
    return this.screenSize
  }

  /**
   * 获取终端尺寸
   */
  getTerminalSize(): TerminalSize {
    this.ensureInitialized()
    return this.terminalSize
  }

  /**
   * 获取响应式尺寸
   */
  getResponsiveSize(): TerminalSize {
    this.ensureInitialized()
    return this.responsiveSize
  }

  /**
   * 获取响应式宽度
   */
  getWidth(): number {
    return this.getResponsiveSize().width
  }

  /**
   * 获取响应式高度
   */
  getHeight(): number {
    return this.getResponsiveSize().height
  }

  /**
   * 检查是否为小屏幕
   */
  isSmall(): boolean {
    this.ensureInitialized()
    return isSmallScreen(this.terminalSize.width)
  }

  /**
   * 检查是否为大屏幕
   */
  isLarge(): boolean {
    this.ensureInitialized()
    return isLargeScreen(this.terminalSize.width)
  }

  /**
   * 更新响应式尺寸（当配置改变时）
   */
  updateResponsiveSize(config: ResponsiveConfig): void {
    this.ensureInitialized()
    this.responsiveSize = getSmartResponsiveSize(config, this.screenSize)
  }

  /**
   * 重新初始化（当终端尺寸改变时）
   */
  reinit(defaultConfig?: ResponsiveConfig): void {
    this.isInitialized = false
    this.init(defaultConfig)
  }

  /**
   * 确保已初始化
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('SizeManager not initialized. Call init() first.')
    }
  }

  /**
   * 获取所有尺寸信息
   */
  getAllSizes(): { screenSize: ScreenSize, terminalSize: TerminalSize, responsiveSize: TerminalSize } {
    this.ensureInitialized()
    return {
      screenSize: this.screenSize,
      terminalSize: this.terminalSize,
      responsiveSize: this.responsiveSize,
    }
  }
}

// 创建全局实例
export const sizeManager = new SizeManager()

// 导出类型
export type { ResponsiveConfig, ScreenSize, TerminalSize }
