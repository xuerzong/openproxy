const PORT = process.env.PORT || 3888
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { router } from '@server/routers'
import { sentryPlugin } from '@server/plugins/sentry'
// import { axiomLoggerPlugin } from '@server/plugins/logger'

const app = new Elysia({})
  .use(cors())
  // .use(axiomLoggerPlugin)
  .use(sentryPlugin)
  .use(router)
  .listen(PORT)

export type App = typeof app

console.log(`🚀 The server is running at: ${app.server?.url}`)
