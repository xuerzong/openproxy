export const queryKeys = {
  // Root
  listModels: 'listModels',
  consts: 'consts',
  loginMethods: 'loginMethods',
  model: 'model',
  aiProviders: 'aiProviders',

  // Tenant
  team: 'team',
  teams: 'teams',
  teamMembers: 'team-members',
  orders: 'orders',
  ordersCount: 'orders/count',
  orderStatus: 'orderStatus',
  userConfig: 'userConfig',
  usages: 'usages',
  usagesTotal: 'usagesTotal',
  usagesGrouped: 'usagesGrouped',
  apiKeys: 'apiKeys',
  apiKeyFolders: 'apiKeyFolders',

  // Admin
  adminTeams: 'admin/teams',
  adminTeamsCount: 'admin/teams/count',
  adminTeamsDetail: 'admin/teams/detail',
  adminTeamsMembers: 'admin/teams/members',
  adminApiKeyFolders: 'admin/apiKeyFolders',
  adminOrders: 'admin/orders',
  adminOrdersCount: 'admin/orders/count',
  adminDashboardStats: 'admin-dashboard-stats',
  adminDashboardUsagesGrouped: 'admin-dashboard-usages-grouped',
  adminDashboardUsagesByModelGroup: 'admin-dashboard-usages-by-model-group',
  adminDashboardUsagesByProvider: 'admin-dashboard-usages-by-provider',
  adminDashboardUsagesByModelGroupGrouped:
    'admin-dashboard-usages-by-model-group-grouped',
  adminDashboardUsagesByProviderGrouped:
    'admin-dashboard-usages-by-provider-grouped',
  users: 'users',
  usersCount: 'users/count',
} as const
