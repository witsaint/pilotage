import packageJson from '../package.json'
import { startAutocompleteDemo } from './ui/autocomplete-example'
import { renderBanner } from './ui/banner'
import { sizeManager } from './utils/size-manager'

// 初始化全局尺寸管理器
sizeManager.init({
  maxWidth: 120,
  minWidth: 40,
  width: 80, // 使用终端宽度的 80%
  usePercentage: true, // 使用百分比模式
})

// 方案：banner 在主屏幕输出，Ink 在同一屏幕继续渲染
// 不使用 alternate screen，保持内容连续性
renderBanner({
  version: packageJson.version,
})
startAutocompleteDemo()
