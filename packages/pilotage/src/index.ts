import packageJson from '../package.json'
import { renderBanner } from './ui/banner'

// 示例：如何传参给 Ink 组件
renderBanner({
  version: packageJson.version,
  title: 'Pilotage CLI',
  content: 'Spec-Driven Development workflow tool',
  width: 80,
})
