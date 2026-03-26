type ModelLike = Record<string, any>

const normalizeTierList = (tiers: unknown) => {
  if (!Array.isArray(tiers)) {
    return undefined
  }

  return tiers.map((tier) => ({
    cost: `${tier?.cost ?? 0}`,
    ...(tier?.min != null ? { min: tier.min } : {}),
    ...(tier?.max != null ? { max: tier.max } : {}),
  }))
}

export const getDuplicatedModelInitialValues = (model?: unknown) => {
  if (!model || typeof model !== 'object') {
    return {}
  }

  const source = model as ModelLike
  const outputTiers = normalizeTierList(source.pricing?.output_tiers)
  const inputCacheReadTiers = normalizeTierList(
    source.pricing?.input_cache_read_tiers
  )

  return {
    id: source.id ?? '',
    name: source.name ?? '',
    description: source.description ?? '',
    model: source.model ?? '',
    styles: Array.isArray(source.styles) ? [...source.styles] : [],
    type: source.type,
    ownedBy: source.ownedBy ?? '',
    contextWindow: source.contextWindow ?? undefined,
    maxTokens: source.maxTokens ?? undefined,
    isPublic: source.isPublic,
    pricing: {
      input: `${source.pricing?.input ?? 0}`,
      output: `${source.pricing?.output ?? 0}`,
      input_cache_read: `${source.pricing?.input_cache_read ?? 0}`,
      ...(outputTiers ? { output_tiers: outputTiers } : {}),
      ...(inputCacheReadTiers
        ? {
            input_cache_read_tiers: inputCacheReadTiers,
          }
        : {}),
    },
    metadata: source.metadata ?? {},
  }
}
