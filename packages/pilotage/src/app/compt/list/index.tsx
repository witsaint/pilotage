import type React from 'react'
import type { ComponentPropBase, MessageType } from '@/types/message'
import { List, type ListProps } from '@/ui/list'

interface ListComponentProps extends ComponentPropBase<MessageType.List>, ListProps {
}

export function ListComponent(props: ListComponentProps): React.JSX.Element {
  const { content, items, ...listProps } = props
  return <List items={content} {...listProps} />
}
