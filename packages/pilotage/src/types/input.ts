import type { Suggestion } from '@/ui/box-input'

export interface InputInfo {
  placeholder: string
  suggestions: Suggestion[]
  hiddenInput?: boolean
}
