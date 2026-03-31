import { Elysia } from 'elysia'
import { betterAuthPlugin } from '@server/plugins/better-auth'
import {
  getAnnouncement,
  setAnnouncement,
  deleteAnnouncement,
} from '@server/services/announcement'
import { AnnouncementBodySchema } from '@server/schemas'

export const announcementRouter = new Elysia()
  .use(betterAuthPlugin)
  .get('announcement', async () => {
    return await getAnnouncement()
  })
  .put(
    'admin/announcement',
    async ({ body }) => {
      return await setAnnouncement(body.title, body.description)
    },
    {
      body: AnnouncementBodySchema,
      auth: { role: 'admin' },
    }
  )
  .delete(
    'admin/announcement',
    async () => {
      await deleteAnnouncement()
      return { success: true }
    },
    {
      auth: { role: 'admin' },
    }
  )
