import process from 'node:process'
import gradient from 'gradient-string'

function getLogoStr(): string {
  return `                       
 _|_|_|    _|  _|              _|                                    
 _|    _|      _|    _|_|    _|_|_|_|    _|_|_|    _|_|_|    _|_|    
 _|_|_|    _|  _|  _|    _|    _|      _|    _|  _|    _|  _|_|_|_|  
 _|        _|  _|  _|    _|    _|      _|    _|  _|    _|  _|        
 _|        _|  _|    _|_|        _|_|    _|_|_|    _|_|_|    _|_|_|  
                                                       _|            
                                                   _|_|`
}

function padText(originStr: string, totalLen: number, splitStr: string): string {
  const startStr = splitStr.padStart(totalLen, ' ')

  return startStr + originStr
}

function getLogo(version: string): string {
  const logo = getLogoStr()

  const _logoStrs = logo.split('\n')
  const maxLen = 70

  const welLine = _logoStrs.length - 2
  const versionLine = _logoStrs.length - 1

  const versionStr = `Version: ${version}`

  const logoStrs = _logoStrs.map((item, idx) => {
    let curLenStr = item.padEnd(maxLen, ' ')
    if (idx === welLine) {
      curLenStr = curLenStr.slice(19)
    }
    if (idx === versionLine) {
      curLenStr = curLenStr.slice(versionStr.length)
    }
    return gradient(['cyan', '#255B53']).multiline(curLenStr)
  })

  const infoColors = ['#0087FF', 'pink']
  logoStrs[welLine] = padText(logoStrs[welLine], 19, gradient(infoColors)('Welcome to Politage'))
  logoStrs[versionLine] = padText(logoStrs[versionLine], 5, gradient(infoColors)(versionStr))
  return logoStrs.join('\n')
}

interface BannerProps {
  version?: string
}

export function renderBanner(props: BannerProps = {}): void {
  const {
    version = '0.0.2',
  } = props

  try {
    const shell = getLogo(version)
    // Print ASCII art first
    process.stdout.write(shell)
    process.stdout.write('\n')

    // Clean up on exit
  }
  catch (error) {
    console.error('Error rendering banner:', error)
    // Fallback to simple text output
    process.stdout.write(`Welcome to Pilotage v${version}\n`)
  }
}
