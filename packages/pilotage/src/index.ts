import packageJson from '../package.json'
import { bootstrap } from './core'
import { patchConsoleLog } from './core/console'
import { renderBanner } from './ui/banner'
import { sizeManager } from './utils/size-manager'

/**
 * initialize the size manager
 */
sizeManager.init({
  maxWidth: 120,
  minWidth: 40,
  width: 80, // use 80% of the terminal width
  usePercentage: true, // use percentage mode
})

renderBanner({
  version: packageJson.version,
})

/**
 * patch console.log method to ui
 */
patchConsoleLog()

/**
 * start the app
 */
bootstrap()
