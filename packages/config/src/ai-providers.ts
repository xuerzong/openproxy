export type ProviderStyle =
  | 'openai_chat'
  | 'anthropic_messages'
  | 'openai_responses'
  | 'embeddings'

export type ProviderBaseUrl = {
  style: ProviderStyle
  baseUrl: string
}

/**
 * Adapter kind that decides which `ProviderAdapter` impl in `apps/api/src/adapters/`
 * handles request-time tweaks for this provider. Omit (or use `'default'`) for
 * providers that need no special handling. Custom providers created via the
 * admin UI always behave as `'default'`.
 */
export type ProviderAdapterKind = 'default' | 'openai' | 'stream_usage'

export type AIProvider = {
  id: string
  name: string
  baseUrl: string
  baseUrls: ProviderBaseUrl[]
  supportedStyles: ProviderStyle[]
  docsUrl: string
  adapterKind?: ProviderAdapterKind
}
