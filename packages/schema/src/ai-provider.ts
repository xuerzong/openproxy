import z from 'zod'
import { HttpUrlSchema } from './common'

export const AIProviderFormSchema = z.object({
  icon: z.string().max(64).optional().nullable(),
  name: z.string().min(1).max(64),
  apiKey: z.string().min(1).max(128),
  baseUrl: HttpUrlSchema,
})
