import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  pgTable,
  text,
  integer,
  numeric,
  smallint,
  uniqueIndex,
  varchar,
  index,
  timestamp,
  jsonb,
  primaryKey,
  bigint,
  unique,
} from 'drizzle-orm/pg-core'
import {
  generateDBId,
  generateInviteCode,
  generateUserName,
} from '@server/lib/generate'

export const users = pgTable(
  'users',
  {
    id: varchar('id')
      .primaryKey()
      .$defaultFn(() => generateDBId()),
    name: varchar('name')
      .notNull()
      .$defaultFn(() => generateUserName()),
    email: varchar('email'),
    emailVerified: boolean('email_verified').default(false).notNull(),
    phoneNumber: varchar('phone_number'),
    phoneNumberVerified: boolean('phone_number_verified')
      .default(false)
      .notNull(),
    image: varchar('image'),
    role: text('role').$type<'admin' | 'tenant'>().notNull().default('tenant'),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('users_phone_unique')
      .on(table.phoneNumber)
      .where(sql`phone_number IS NOT NULL`),

    uniqueIndex('users_email_unique')
      .on(table.email)
      .where(sql`email IS NOT NULL`),
  ]
)

export const usersRelations = relations(users, ({ one, many }) => ({
  config: one(userConfigs),
  teams: many(teamUsers),
}))

export type User = typeof users.$inferSelect

export const sessions = pgTable(
  'sessions',
  {
    id: varchar('id')
      .primaryKey()
      .$defaultFn(() => generateDBId()),
    expiresAt: timestamp('expires_at', {
      mode: 'date',
      withTimezone: true,
    }).notNull(),
    token: varchar('token').notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
    ipAddress: varchar('ip_address'),
    userAgent: varchar('user_agent'),
    teamId: varchar('team_id').references(() => teams.id, {
      onDelete: 'cascade',
    }),
    userId: varchar('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('sessions_token_unique').on(table.token),
    index('sessions_user_id_idx').on(table.userId),
  ]
)

export const accounts = pgTable(
  'accounts',
  {
    id: varchar('id')
      .primaryKey()
      .$defaultFn(() => generateDBId()),
    accountId: varchar('account_id').notNull(),
    providerId: varchar('provider_id').notNull(),
    userId: varchar('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      mode: 'date',
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      mode: 'date',
      withTimezone: true,
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('accounts_user_id_idx').on(table.userId)]
)

export const verifications = pgTable('verifications', {
  id: varchar('id')
    .primaryKey()
    .$defaultFn(() => generateDBId()),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', {
    mode: 'date',
    withTimezone: true,
  }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }),
})

export const userConfigs = pgTable('user_configs', {
  userId: varchar('user_id')
    .notNull()
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  inviteCode: varchar('invite_code', { length: 8 })
    .notNull()
    .$defaultFn(() => generateInviteCode()),
  totalTokenUsage: bigint('total_token_usage', { mode: 'number' })
    .notNull()
    .default(0),
  amount: numeric('amount', { precision: 20, scale: 2 })
    .notNull()
    .default('0.00'),
  cost: numeric('cost', { precision: 20, scale: 10 }).notNull().default('0'),
  monthlyFreeAllowance: numeric('monthly_free_allowance', {
    precision: 20,
    scale: 10,
  })
    .notNull()
    .default('0'),
  monthlyFreeUsed: numeric('monthly_free_used', { precision: 20, scale: 10 })
    .notNull()
    .default('0'),
  monthlyFreeLastResetAt: timestamp('monthly_free_last_reset_at', {
    mode: 'date',
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', {
    mode: 'date',
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
})

export const userConfigRelations = relations(userConfigs, ({ one }) => ({
  user: one(users, {
    references: [users.id],
    fields: [userConfigs.userId],
  }),
}))

export const invitations = pgTable('invitations', {
  id: varchar('id')
    .notNull()
    .$defaultFn(() => generateDBId())
    .primaryKey(),
  userId: varchar('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  type: smallint('type').notNull().default(0),
  inviteUserId: varchar('invite_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', {
    mode: 'date',
    withTimezone: true,
  }).defaultNow(),
})

export const apiKeys = pgTable(
  'api_keys',
  {
    id: varchar('id')
      .notNull()
      .$defaultFn(() => generateDBId())
      .primaryKey(),
    userId: varchar('user_id')
      .notNull()
      .references(() => teamUsers.id, { onDelete: 'cascade' }),
    teamId: varchar('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    apiKey: varchar('api_key').notNull(),
    apiKeyHash: varchar('api_key_hash').notNull(),
    status: smallint('status').notNull().default(1),
    expiresAt: timestamp('expires_at', {
      mode: 'date',
      withTimezone: true,
    }),
    maxRequests: integer('max_requests').notNull().default(0),
    maxQuota: numeric('max_quota', { precision: 20, scale: 10 })
      .notNull()
      .default('0'),
    totalRequests: integer('total_requests').notNull().default(0),
    totalQuota: numeric('total_quota', { precision: 20, scale: 10 })
      .notNull()
      .default('0'),
    createdAt: timestamp('created_at', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    lastUsedAt: timestamp('last_used_at', {
      mode: 'date',
      withTimezone: true,
    }).defaultNow(),
  },
  (table) => [
    index('api_keys_status_index').on(table.status),
    index('api_keys_hash_index').on(table.apiKeyHash),
    index('api_keys_team_id_index').on(table.teamId),
  ]
)

export const apiKeysRelations = relations(apiKeys, ({ many, one }) => ({
  usages: many(usages),
  team: one(teams, {
    fields: [apiKeys.teamId],
    references: [teams.id],
  }),
  apiKeysToModels: many(apiKeysToModels),
}))

export const apiKeysToModels = pgTable(
  'api_keys_to_models',
  {
    apiKeyId: varchar('api_key_id')
      .notNull()
      .references(() => apiKeys.id, { onDelete: 'cascade' }),
    modelId: text('model_id')
      .notNull()
      .references(() => models.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.apiKeyId, table.modelId] })]
)

export const apiKeysToModelsRelations = relations(
  apiKeysToModels,
  ({ one }) => ({
    apiKey: one(apiKeys, {
      fields: [apiKeysToModels.apiKeyId],
      references: [apiKeys.id],
    }),
    model: one(models, {
      fields: [apiKeysToModels.modelId],
      references: [models.id],
    }),
  })
)

export const usages = pgTable(
  'usages',
  {
    id: varchar('id')
      .notNull()
      .$defaultFn(() => generateDBId())
      .primaryKey(),
    teamId: varchar('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    apiKeyId: varchar('api_key_id').notNull().default(''),
    modelId: varchar('model_id').notNull().default(''),
    modelName: text('model_name').notNull().default(''),
    modelOwnedBy: text('model_owned_by').notNull().default(''),
    aiProviderId: varchar('ai_provider_id').notNull().default(''),
    isStream: boolean('is_stream').notNull().default(false),
    responseTime: integer('response_time').notNull(),
    completedTime: integer('completed_time').notNull().default(0),
    cost: numeric('cost', { precision: 20, scale: 10 }).notNull(),
    tokensPrompt: integer('tokens_prompt').notNull(),
    tokensCompletion: integer('tokens_completion').notNull(),
    createdAt: timestamp('created_at', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('usages_team_id_index').on(table.teamId)]
)

export const usagesRelations = relations(usages, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [usages.apiKeyId],
    references: [apiKeys.id],
  }),
  team: one(teams, {
    fields: [usages.teamId],
    references: [teams.id],
  }),
}))

export const orders = pgTable(
  'orders',
  {
    orderId: varchar('order_id', { length: 20 }).notNull().primaryKey(),
    userId: varchar('user_id')
      .notNull()
      .references(() => teamUsers.id, { onDelete: 'cascade' }),
    teamId: varchar('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    tradeNo: varchar('trade_no').notNull().default(''),
    type: smallint('type').notNull(),
    amount: numeric('amount', { precision: 20, scale: 2 }).notNull(),
    status: smallint('status').notNull().default(0),
    usageStatus: smallint('usage_status').notNull().default(0),
    createdAt: timestamp('created_at', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('orders_status_index').on(table.status),
    index('orders_usage_status_index').on(table.usageStatus),
    index('orders_team_id_index').on(table.teamId),
  ]
)

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(teamUsers, {
    fields: [orders.userId],
    references: [teamUsers.id],
  }),
  team: one(teams, {
    fields: [orders.teamId],
    references: [teams.id],
  }),
}))

export const models = pgTable(
  'models',
  {
    id: varchar('id')
      .notNull()
      .$defaultFn(() => generateDBId())
      .primaryKey(),

    isPublic: boolean('is_public').default(true).notNull(),

    name: text('name').notNull(),
    description: text('description').notNull(),
    model: text('model').notNull(),
    ownedBy: text('owned_by').notNull(),

    contextWindow: integer('context_window').default(0).notNull(),
    maxTokens: integer('max_tokens').default(0).notNull(),

    type: text('type').$type<'language' | 'image' | 'embedding'>().notNull(),
    styles: text('styles').array().notNull().default([]),
    tags: text('tags').array().notNull().default([]),
    pricing: jsonb('pricing')
      .$type<{
        input: string
        output: string
        input_cache_read: string
      }>()
      .notNull(),
    metadata: jsonb('metadata').default({}).notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('models_owned_by_index').on(table.ownedBy),
    index('models_type_index').on(table.type),
    index('models_is_public_index').on(table.isPublic),
  ]
)

export type ModelInstance = typeof models.$inferSelect

export const modelsRelations = relations(models, ({ many, one }) => ({
  apiKeysToModels: many(apiKeysToModels),
  modelsToAIProviders: many(modelsToAIProviders),
}))

export const aiProviders = pgTable(
  'ai_providers',
  {
    id: varchar('id')
      .notNull()
      .$defaultFn(() => generateDBId())
      .primaryKey(),
    name: text('name').notNull(),
    baseUrl: text('base_url').notNull(),
    apiKey: text('api_key').notNull(),
    apiKeyHash: varchar('api_key_hash').notNull(),
    icon: text('icon').notNull().default(''),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique('ai_providers_name_unique').on(table.name)]
)

export const aiProvidersRelations = relations(aiProviders, ({ many }) => ({
  aiProviderAPIKeys: many(aiProviderAPIKeys),
  modelsToAIProviders: many(modelsToAIProviders),
}))

export const aiProviderAPIKeys = pgTable(
  'ai_provider_api_keys',
  {
    id: varchar('id')
      .notNull()
      .$defaultFn(() => generateDBId())
      .primaryKey(),
    aiProviderId: varchar('ai_provider_id')
      .notNull()
      .references(() => aiProviders.id, { onDelete: 'cascade' }),
    apiKey: text('api_key').notNull(),
    apiKeyHash: varchar('api_key_hash').notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('ai_provider_api_keys_ai_provider_id_index').on(table.aiProviderId),
    index('ai_provider_api_keys_hash_index').on(table.apiKeyHash),
  ]
)

export const aiProviderAPIKeysRelations = relations(
  aiProviderAPIKeys,
  ({ one }) => ({
    aiProvider: one(aiProviders, {
      fields: [aiProviderAPIKeys.aiProviderId],
      references: [aiProviders.id],
    }),
  })
)

export const modelsToAIProviders = pgTable(
  'models_to_ai_providers',
  {
    id: varchar('id')
      .notNull()
      .$defaultFn(() => generateDBId())
      .primaryKey(),
    modelId: varchar('model_id')
      .notNull()
      .references(() => models.id, { onDelete: 'cascade' }),
    aiProviderId: varchar('ai_provider_id')
      .notNull()
      .references(() => aiProviders.id, { onDelete: 'cascade' }),
    status: smallint('status').notNull().default(0),
    model: text('model').notNull().default(''),
    weight: integer('weight').notNull().default(0),
  },
  (table) => [index('models_to_ai_providers_model_id_index').on(table.modelId)]
)

export const modelsToAIProvidersRelations = relations(
  modelsToAIProviders,
  ({ one }) => ({
    provider: one(aiProviders, {
      fields: [modelsToAIProviders.aiProviderId],
      references: [aiProviders.id],
    }),
    model: one(models, {
      fields: [modelsToAIProviders.modelId],
      references: [models.id],
    }),
  })
)

export const teams = pgTable('teams', {
  id: varchar('id')
    .notNull()
    .$defaultFn(() => generateDBId(10))
    .primaryKey(),
  name: varchar('name').notNull(),
  logo: text('logo'),
  inviteCode: varchar('invite_code')
    .notNull()
    .$defaultFn(() => generateInviteCode()),
  amount: numeric('amount', { precision: 20, scale: 10 })
    .notNull()
    .default('0.00'),
  apiKeyLimit: integer('api_key_limit').notNull().default(20),
  usersLimit: integer('users_limit').notNull().default(1),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull(),
  metadata: text('metadata'),
})

export const teamsRelations = relations(teams, ({ many }) => ({
  users: many(teamUsers),
  orders: many(orders),
  usages: many(usages),
  apiKeys: many(apiKeys),
}))

export const teamUsers = pgTable('team_users', {
  id: varchar('id')
    .notNull()
    .$defaultFn(() => generateDBId())
    .primaryKey(),
  teamId: varchar('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  userId: varchar('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role').notNull(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const teamUsersRelations = relations(teamUsers, ({ one }) => ({
  team: one(teams, {
    references: [teams.id],
    fields: [teamUsers.teamId],
  }),
  user: one(users, {
    references: [users.id],
    fields: [teamUsers.userId],
  }),
}))
