export type ProviderStyle =
  | 'openai_chat'
  | 'anthropic_messages'
  | 'openai_responses'
  | 'embeddings'

export type ProviderBaseUrl = {
  style: ProviderStyle
  baseUrl: string
}

export type AIProvider = {
  id: string
  name: string
  baseUrl: string
  baseUrls: ProviderBaseUrl[]
  supportedStyles: ProviderStyle[]
  docsUrl: string
}
