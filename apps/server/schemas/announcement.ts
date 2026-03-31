import { t } from 'elysia'

export const AnnouncementBodySchema = t.Object({
  title: t.String({ minLength: 1, maxLength: 200 }),
  description: t.String({ minLength: 1, maxLength: 2000 }),
})
