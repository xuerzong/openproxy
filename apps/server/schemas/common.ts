import { t } from 'elysia'

// Pagination query parameters
export const PaginationQuerySchema = t.Object({
  limit: t.Numeric(),
  offset: t.Numeric(),
})

// Optional pagination query parameters
export const OptionalPaginationQuerySchema = t.Object({
  limit: t.Optional(t.Numeric()),
  offset: t.Optional(t.Numeric()),
})

export const UsageGroupedQuerySchema = t.Object({
  rangeHours: t.Optional(t.Numeric({ minimum: 1, maximum: 24 * 30 })),
  bucketCount: t.Optional(t.Numeric({ minimum: 1, maximum: 1000 })),
})
