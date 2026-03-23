import z from './zod'

export const TeamNamePattern = /^[\u4e00-\u9fa5a-zA-Z0-9 ]+$/
export const TEAM_NAME_MIN = 1
export const TEAM_NAME_MAX = 50

export const TeamFormSchema = z.object({
  name: z
    .string()
    .min(TEAM_NAME_MIN)
    .max(TEAM_NAME_MAX)
    .regex(TeamNamePattern, {
      error: '仅支持中文、英文、数字和空格',
    }),
})
