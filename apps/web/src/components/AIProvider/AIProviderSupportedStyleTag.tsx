import { Tag } from '@openproxy/ui'

const supportedStyleTagColors = {
  openai_chat: 'blue',
  anthropic_messages: 'purple',
  openai_responses: 'green',
  embeddings: 'orange',
} as const

const getSupportedStyleTagColor = (style: string) => {
  return (
    supportedStyleTagColors[style as keyof typeof supportedStyleTagColors] ??
    'gray'
  )
}

interface AIProviderSupportedStyleTagProps {
  style: string
}

export const AIProviderSupportedStyleTag: React.FC<
  AIProviderSupportedStyleTagProps
> = ({ style }) => {
  return <Tag color={getSupportedStyleTagColor(style)}>{style}</Tag>
}
