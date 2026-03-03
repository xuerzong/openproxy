import z from './zod'

const CharNamePattern = /^[a-zA-Z0-9/\._-]+$/

export const ModelFormSchema = z.object({
  id: z.string().min(1).max(64).regex(CharNamePattern, {
    error: '仅支持英文、数字、斜杠(/)、下划线(_)或连字符(-)或小数点(.)',
  }),
  name: z.string().min(1).max(64),
  model: z.string().min(1).max(64).regex(CharNamePattern, {
    error: '仅支持英文、数字、斜杠(/)、下划线(_)或连字符(-)或小数点(.)',
  }),
  styles: z.array(z.enum(['openai', 'anthropic'])).min(1),
  type: z.enum(['language', 'image', 'embedding']),
  ownedBy: z.string().min(1).max(64),
  contextWindow: z.number().int().min(0).optional(),
  maxTokens: z
    .number()
    .refine((value) => !isNaN(Number(value)), {
      error: '请输入数字类型',
    })
    .optional(),
  isPublic: z.boolean().optional(),
  pricing: z.object({
    input: z.string().refine((v) => !isNaN(Number(v))),
    output: z.string().refine((v) => !isNaN(Number(v))),
  }),
})
