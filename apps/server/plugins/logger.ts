import { Elysia } from 'elysia'
import { Axiom } from '@axiomhq/js'

const axiom = new Axiom({
  token: Bun.env.AXIOM_TOKEN!,
})

export const axiomLoggerPlugin = (app: Elysia) =>
  app
    .derive(() => ({ startTime: performance.now() }))
    .onAfterResponse({ as: 'global' }, ({ request, path, set, startTime }) => {
      const duration = performance.now() - (startTime || 0)
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] ${request.method} ${path} ${set.status}`)
      axiom.ingest(Bun.env.AXIOM_DATASET!, [
        {
          method: request.method,
          path,
          status: set.status,
          duration: `${duration.toFixed(2)}ms`,
          userAgent: request.headers.get('user-agent'),
          timestamp: timestamp,
        },
      ])
    })
