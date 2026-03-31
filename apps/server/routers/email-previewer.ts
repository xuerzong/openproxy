import { Elysia } from 'elysia'
import { html } from '@elysiajs/html'
import { renderEmail } from '@server/lib/emails/render'
import { CLIENT_ORIGIN } from '@server/constants'

export const emailPreviewerRouter = new Elysia({
  prefix: '/emailPreviewer',
})
  .use(html())
  .get('/', async () => {
    return renderEmail('Verify', { url: CLIENT_ORIGIN })
  })
