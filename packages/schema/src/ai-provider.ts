import z from 'zod'
import { HttpUrlSchema } from './common'

export const AIProviderFormSchema = z.object({
  icon: z.string().max(64).optional().nullable(),
  name: z.string().min(1).max(64),
  baseUrl: HttpUrlSchema,
  apiKeysText: z.string().optional().nullable(),
})
