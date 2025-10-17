// 电脑级别的配置路径是~/.pilotage/config.json

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export function getRootConfigPath(): string {
  return join(homedir(), '.pilotage', 'config.json')
}

export function hasInitialized(): boolean {
  return existsSync(getRootConfigPath())
}

export function initialize(): void {
  if (!hasInitialized()) {
    mkdirSync(getRootConfigPath(), { recursive: true })
    writeFileSync(getRootConfigPath(), '{}')
  }
}
