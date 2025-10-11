import process from 'node:process'
import gradient from 'gradient-string'
import { render } from 'ink'
import React from 'react'
import { Level } from '@/config/level'
import { sizeManager } from '../utils/size-manager'
import { BoxTitle } from './box-title'

function getLogoStr(): string {
  return `                       
 _|_|_|    _|  _|              _|                                    
 _|    _|      _|    _|_|    _|_|_|_|    _|_|_|    _|_|_|    _|_|    
 _|_|_|    _|  _|  _|    _|    _|      _|    _|  _|    _|  _|_|_|_|  
 _|        _|  _|  _|    _|    _|      _|    _|  _|    _|  _|        
 _|        _|  _|    _|_|        _|_|    _|_|_|    _|_|_|    _|_|_|  
                                                       _|            
                                                   _|_|                                                                                                                   
`
}

function padText(originStr: string, totalLen: number, splitStr: string): string {
  const startStr = splitStr.padStart(totalLen, ' ')

  return startStr + originStr
}

function getLogo(version: string): string {
  const logo = getLogoStr()

  const _logoStrs = logo.split('\n')
  const maxLen = 70

  const welLine = _logoStrs.length - 3
  const versionLine = _logoStrs.length - 2

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
  title?: string
  content?: string
}

export function renderBanner(props: BannerProps = {}): void {
  const {
    version = '0.0.2',
    title = 'Welcome to Pilotage',
    content = 'A powerful SSD workflow tool',
  } = props

  try {
    // 从全局尺寸管理器获取响应式尺寸
    const responsiveSize = sizeManager.getResponsiveSize()

    // 根据屏幕尺寸调整内容
    let displayTitle = title
    let displayContent = content

    if (sizeManager.isSmall()) {
      // 小屏幕时简化内容
      displayTitle = title.length > 20 ? `${title.substring(0, 17)}...` : title
      displayContent = content.length > 30 ? `${content.substring(0, 27)}...` : content
    }

    const shell = getLogo(version)

    // Print ASCII art first
    process.stdout.write(shell)
    process.stdout.write('\n')

    // Render the Box component with responsive sizing
    render(
      <BoxTitle
        title={displayTitle}
        content={displayContent}
        width={responsiveSize.width}
        level={Level.PROCESS}
      />,
    )

    // Clean up on exit
  }
  catch (error) {
    console.error('Error rendering banner:', error)
    // Fallback to simple text output
    process.stdout.write(`Welcome to Pilotage v${version}\n`)
    process.stdout.write(`${title}: ${content}\n`)
  }
}
