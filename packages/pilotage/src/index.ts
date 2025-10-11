import packageJson from '../package.json'
import { renderBanner } from './ui/banner'
import { sizeManager } from './utils/size-manager'

// 初始化全局尺寸管理器
sizeManager.init({
  maxWidth: 120,
  minWidth: 40,
  width: 80, // 使用终端宽度的 80%
  usePercentage: true, // 使用百分比模式
})

// 示例：如何传参给 Ink 组件
renderBanner({
  version: packageJson.version,
  title: 'Pilotage CLI',
  content: 'Spec-Driven Development workflow tool',
  // width 参数现在从全局尺寸管理器获取
})
