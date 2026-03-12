import { Elysia } from 'elysia'
import omit from 'lodash/omit'
import { betterAuthPlugin } from '@server/routers/better-auth'
import { auth } from '@server/lib/auth'
import {
  getModelsWithPermission,
  createModel,
  updateModel,
  deleteModel,
  getModelById,
  insertModelProvider,
  updateModelProvider,
  delModelProvider,
} from '@server/services/model'
import { CreateModelBodySchema, UpdateModelBodySchema } from '@server/schemas'
import {
  DelModelBodySchema,
  DelModelProviderSchema,
  GetModelDetailQuerySchema,
  InsertModelProviderSchema,
  UpdateModelProviderSchema,
} from '@server/schemas/model'

export const modelsRouter = new Elysia()
  .use(betterAuthPlugin)
  .get(
    'listModels',
    async ({ headers }) => {
      // @ts-ignore
      const session = await auth.api.getSession({ headers })
      const user = session?.user
      const models = await getModelsWithPermission(user?.id)

      return models.map((model) => {
        if (user && user.role === 'admin') {
          return omit(model, 'apiKeyHash', 'userId')
        }
        return model.isPublic
          ? omit(model, 'apiKeyHash', 'userId', 'baseUrl', 'apiKey')
          : omit(model, 'apiKeyHash', 'userId')
      })
    },
    { auth: { role: false } }
  )
  .post(
    'models',
    async ({ body, user, status }) => {
      try {
        const result = await createModel({
          id: body.id,
          userId: user.id,
          isAdmin: true,
          name: body.name,
          description: body.description,
          model: body.model,
          ownedBy: body.ownedBy,
          isPublic: body.isPublic,
          type: body.type,
          contextWindow: body.contextWindow,
          maxTokens: body.maxTokens,
          styles: body.styles,
          pricing: body.pricing,
          tags: body.tags,
          metadata: body.metadata,
        })
        return result
      } catch (error: any) {
        if (error.message === '已达到模型数量限制') {
          return status(429)
        }
        throw error
      }
    },
    {
      auth: { role: 'admin' },
      body: CreateModelBodySchema,
    }
  )
  .put(
    'models',
    async ({ body, user }) => {
      const result = await updateModel({
        id: body.id,
        userId: user.id,
        isAdmin: true,
        name: body.name,
        description: body.description,
        model: body.model,
        ownedBy: body.ownedBy,
        isPublic: body.isPublic,
        type: body.type,
        contextWindow: body.contextWindow,
        maxTokens: body.maxTokens,
        styles: body.styles,
        pricing: body.pricing,
        tags: body.tags,
        metadata: body.metadata,
      })
      return result
    },
    {
      auth: { role: 'admin' },
      body: UpdateModelBodySchema,
    }
  )
  .delete(
    'models',
    async ({ body }) => {
      const id = body.id
      await deleteModel(id)
      return id
    },
    { auth: { role: 'admin' }, body: DelModelBodySchema }
  )
  .get(
    'models',
    async ({ query }) => {
      const model = await getModelById(query.id)
      return model ? omit(model, 'apiKeyHash') : model
    },
    { auth: { role: true }, query: GetModelDetailQuerySchema }
  )
  .post(
    'models/insertProvider',
    async ({ body }) => {
      await insertModelProvider(body.modelId, body.aiProviderId, body.provider)
    },
    {
      auth: { role: 'admin' },
      body: InsertModelProviderSchema,
    }
  )
  .post(
    'models/updateProvider',
    async ({ body }) => {
      await updateModelProvider(body.aiProviderId, body.provider)
    },
    {
      auth: { role: 'admin' },
      body: UpdateModelProviderSchema,
    }
  )
  .post(
    'models/delProvider',
    async ({ body }) => {
      await delModelProvider(body.provider)
    },
    {
      auth: { role: 'admin' },
      body: DelModelProviderSchema,
    }
  )
