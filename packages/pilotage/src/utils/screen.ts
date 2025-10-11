import process from 'node:process'

/**
 * 获取终端尺寸信息
 */
export interface TerminalSize {
  width: number
  height: number
  columns: number
  rows: number
}

/**
 * 响应式配置选项
 */
export interface ResponsiveConfig {
  maxWidth?: number
  minWidth?: number
  maxHeight?: number
  minHeight?: number
  fallbackWidth?: number
  fallbackHeight?: number
  usePercentage?: boolean
  width?: number // 直接指定宽度，如果是百分比模式则代表百分比值
  height?: number // 直接指定高度，如果是百分比模式则代表百分比值
}

/**
 * 获取当前终端尺寸
 */
export function getTerminalSize(): TerminalSize {
  const { stdout, stderr } = process

  // 尝试从 stdout 获取尺寸
  let width = 80
  let height = 24
  let columns = 80
  let rows = 24

  if (stdout.isTTY) {
    const size = stdout.getWindowSize?.()
    if (size) {
      [columns, rows] = size
      width = columns
      height = rows
    }
  }

  // 如果 stdout 不可用，尝试 stderr
  if (!stdout.isTTY && stderr.isTTY) {
    const size = stderr.getWindowSize?.()
    if (size) {
      [columns, rows] = size
      width = columns
      height = rows
    }
  }

  // 尝试从环境变量获取
  if (process.env.COLUMNS) {
    columns = Number.parseInt(process.env.COLUMNS, 10) || columns
    width = columns
  }

  if (process.env.LINES) {
    rows = Number.parseInt(process.env.LINES, 10) || rows
    height = rows
  }

  return {
    width: Math.max(1, width),
    height: Math.max(1, height),
    columns: Math.max(1, columns),
    rows: Math.max(1, rows),
  }
}

/**
 * 检测终端是否支持颜色
 */
export function supportsColor(): boolean {
  const { stdout, stderr } = process

  if (stdout.isTTY && stdout.hasColors?.()) {
    return true
  }

  if (stderr.isTTY && stderr.hasColors?.()) {
    return true
  }

  // 检查环境变量
  if (process.env.COLORTERM) {
    return true
  }

  if (process.env.TERM && ['xterm', 'xterm-256color', 'screen', 'screen-256color'].includes(process.env.TERM)) {
    return true
  }

  return false
}

/**
 * 响应式尺寸计算
 */
export function getResponsiveSize(config: ResponsiveConfig = {}): TerminalSize {
  const {
    maxWidth = 120,
    minWidth = 40,
    maxHeight = 50,
    minHeight = 10,
    fallbackWidth = 80,
    fallbackHeight = 24,
    usePercentage = false,
    width: configWidth,
    height: configHeight,
  } = config

  const terminalSize = getTerminalSize()
  let { width, height } = terminalSize

  // 如果指定了具体的宽度或高度
  if (configWidth !== undefined) {
    if (usePercentage) {
      // 百分比模式：configWidth 是百分比值 (0-100)
      width = Math.round((terminalSize.width * configWidth) / 100)
    }
    else {
      // 绝对模式：configWidth 是绝对像素值
      width = configWidth
    }
  }

  if (configHeight !== undefined) {
    if (usePercentage) {
      // 百分比模式：configHeight 是百分比值 (0-100)
      height = Math.round((terminalSize.height * configHeight) / 100)
    }
    else {
      // 绝对模式：configHeight 是绝对像素值
      height = configHeight
    }
  }

  // 应用最大最小值限制
  width = Math.max(minWidth, Math.min(maxWidth, width))
  height = Math.max(minHeight, Math.min(maxHeight, height))

  // 如果尺寸无效，使用回退值
  if (width <= 0 || height <= 0) {
    width = fallbackWidth
    height = fallbackHeight
  }

  return {
    width,
    height,
    columns: width,
    rows: height,
  }
}

/**
 * 检测屏幕尺寸类别
 */
export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

export function getScreenSizeCategory(width?: number): ScreenSize {
  const size = width || getTerminalSize().width

  if (size < 50)
    return 'xs'
  if (size < 70)
    return 'sm'
  if (size < 90)
    return 'md'
  if (size < 110)
    return 'lg'
  if (size < 130)
    return 'xl'
  return 'xxl'
}

/**
 * 根据屏幕尺寸获取推荐的配置
 */
export function getRecommendedConfig(screenSize?: ScreenSize): ResponsiveConfig {
  const size = screenSize || getScreenSizeCategory()

  const configs: Record<ScreenSize, ResponsiveConfig> = {
    xs: {
      maxWidth: 50,
      minWidth: 30,
      maxHeight: 20,
      minHeight: 8,
      fallbackWidth: 40,
      fallbackHeight: 15,
    },
    sm: {
      maxWidth: 70,
      minWidth: 40,
      maxHeight: 25,
      minHeight: 10,
      fallbackWidth: 60,
      fallbackHeight: 20,
    },
    md: {
      maxWidth: 90,
      minWidth: 50,
      maxHeight: 30,
      minHeight: 12,
      fallbackWidth: 80,
      fallbackHeight: 24,
    },
    lg: {
      maxWidth: 110,
      minWidth: 60,
      maxHeight: 35,
      minHeight: 15,
      fallbackWidth: 100,
      fallbackHeight: 30,
    },
    xl: {
      maxWidth: 130,
      minWidth: 70,
      maxHeight: 40,
      minHeight: 18,
      fallbackWidth: 120,
      fallbackHeight: 35,
    },
    xxl: {
      maxWidth: 150,
      minWidth: 80,
      maxHeight: 50,
      minHeight: 20,
      fallbackWidth: 140,
      fallbackHeight: 40,
    },
  }

  return configs[size]
}

/**
 * 智能响应式尺寸计算
 * 结合屏幕尺寸类别和用户配置
 */
export function getSmartResponsiveSize(
  userConfig: ResponsiveConfig = {},
  screenSize?: ScreenSize,
): TerminalSize {
  const recommendedConfig = getRecommendedConfig(screenSize)
  const mergedConfig = { ...recommendedConfig, ...userConfig }

  return getResponsiveSize(mergedConfig)
}

/**
 * 检测是否为小屏幕
 */
export function isSmallScreen(width?: number): boolean {
  const size = getScreenSizeCategory(width)
  return size === 'xs' || size === 'sm'
}

/**
 * 检测是否为大屏幕
 */
export function isLargeScreen(width?: number): boolean {
  const size = getScreenSizeCategory(width)
  return size === 'xl' || size === 'xxl'
}

/**
 * 获取适合当前屏幕的布局配置
 */
export interface LayoutConfig {
  columns: number
  padding: number
  margin: number
  fontSize: 'small' | 'medium' | 'large'
  compact: boolean
}

export function getLayoutConfig(width?: number): LayoutConfig {
  const size = getScreenSizeCategory(width)

  const configs: Record<ScreenSize, LayoutConfig> = {
    xs: {
      columns: 1,
      padding: 1,
      margin: 0,
      fontSize: 'small',
      compact: true,
    },
    sm: {
      columns: 1,
      padding: 1,
      margin: 1,
      fontSize: 'small',
      compact: true,
    },
    md: {
      columns: 2,
      padding: 2,
      margin: 1,
      fontSize: 'medium',
      compact: false,
    },
    lg: {
      columns: 2,
      padding: 2,
      margin: 2,
      fontSize: 'medium',
      compact: false,
    },
    xl: {
      columns: 3,
      padding: 3,
      margin: 2,
      fontSize: 'large',
      compact: false,
    },
    xxl: {
      columns: 3,
      padding: 4,
      margin: 3,
      fontSize: 'large',
      compact: false,
    },
  }

  return configs[size]
}

/**
 * 格式化尺寸信息为可读字符串
 */
export function formatSizeInfo(size: TerminalSize): string {
  return `${size.width}×${size.height} (${size.columns} cols × ${size.rows} rows)`
}

/**
 * 检测终端能力
 */
export interface TerminalCapabilities {
  hasColors: boolean
  hasUnicode: boolean
  hasCursor: boolean
  hasMouse: boolean
  isTTY: boolean
}

export function getTerminalCapabilities(): TerminalCapabilities {
  const { stdout, stderr } = process
  const isTTY = stdout.isTTY || stderr.isTTY

  return {
    hasColors: supportsColor(),
    hasUnicode: process.env.LANG?.includes('UTF-8') || process.env.LC_ALL?.includes('UTF-8') || false,
    hasCursor: isTTY,
    hasMouse: process.env.TERM?.includes('mouse') || false,
    isTTY,
  }
}

// 导出全局尺寸管理器，方便其他模块使用
export { sizeManager } from './size-manager'
