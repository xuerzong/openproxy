import { defineConfig } from 'stropress/runtime'

export default defineConfig({
  site: {
    title: 'OpenProxy',
    description:
      'OpenProxy documentation for deployment, development, architecture, and API usage.',
    favicon: '/favicon.svg',
  },
  home: {
    title: 'OpenProxy',
    tagline: '把多供应商 AI 能力收敛成一个稳定入口。',
    description:
      '一个面向自部署团队的 AI API 网关，在网关层完成鉴权、路由、额度控制与用量统计。',
    actions: [
      {
        text: '开始部署',
        link: '/getting-started',
        theme: 'brand',
      },
      {
        text: '查看架构',
        link: '/architecture',
        theme: 'alt',
      },
    ],
    features: [
      {
        icon: 'Waypoints',
        title: '统一代理接口',
        details: '统一代理 OpenAI / Anthropic 风格接口。',
      },
      {
        icon: 'ShieldCheck',
        title: '多供应商容灾',
        details: '对接多个模型供应商并自动故障切换。',
      },
      {
        icon: 'KeyRound',
        title: '集中权限控制',
        details: '集中管理 API Key、额度与访问权限。',
      },
      {
        icon: 'ChartColumnIncreasing',
        title: '完整用量统计',
        details: '统计 token 用量、响应时间与供应商归属。',
      },
    ],
  },
  nav: [
    {
      label: 'GitHub',
      link: 'https://github.com/xuerzong/openproxy',
      icon: 'Github',
    },
  ],
  sidebar: [
    {
      label: 'Documentation',
      items: [
        {
          label: '快速开始',
          link: '/getting-started',
        },
        {
          label: '本地开发',
          link: '/development',
        },
        {
          label: '系统架构',
          link: '/architecture',
        },
        {
          label: '部署指南',
          link: '/deployment',
        },
        {
          label: '定时任务',
          link: '/scheduled-jobs',
        },
        {
          label: 'API 参考',
          link: '/api-reference',
        },
      ],
    },
  ],
  search: {
    provider: 'local',
  },
  locales: {
    '/': {
      label: '中文',
      lang: 'zh-CN',
      site: {
        title: 'OpenProxy',
        description:
          'OpenProxy 中文文档，包含快速开始、部署、架构与 API 说明。',
      },
      home: {
        title: 'OpenProxy',
        tagline: '把多供应商 AI 能力收敛成一个稳定入口。',
        description:
          '一个面向自部署团队的 AI API 网关，在网关层完成鉴权、路由、额度控制与用量统计。',
        actions: [
          {
            text: '开始部署',
            link: '/getting-started',
            theme: 'brand',
          },
          {
            text: '查看架构',
            link: '/architecture',
            theme: 'alt',
          },
        ],
        features: [
          {
            icon: 'Waypoints',
            title: '统一代理接口',
            details: '统一代理 OpenAI / Anthropic 风格接口。',
          },
          {
            icon: 'ShieldCheck',
            title: '多供应商容灾',
            details: '对接多个模型供应商并自动故障切换。',
          },
          {
            icon: 'KeyRound',
            title: '集中权限控制',
            details: '集中管理 API Key、额度与访问权限。',
          },
          {
            icon: 'ChartColumnIncreasing',
            title: '完整用量统计',
            details: '统计 token 用量、响应时间与供应商归属。',
          },
        ],
      },
      sidebar: [
        {
          label: '文档',
          items: [
            {
              label: '快速开始',
              link: '/getting-started',
            },
            {
              label: '本地开发',
              link: '/development',
            },
            {
              label: '系统架构',
              link: '/architecture',
            },
            {
              label: '部署指南',
              link: '/deployment',
            },
            {
              label: '定时任务',
              link: '/scheduled-jobs',
            },
            {
              label: 'API 参考',
              link: '/api-reference',
            },
          ],
        },
      ],
    },
    en: {
      label: 'English',
      lang: 'en',
      site: {
        title: 'OpenProxy',
        description:
          'OpenProxy documentation covering setup, development, architecture, deployment, and API usage.',
      },
      home: {
        title: 'OpenProxy',
        tagline: 'One reliable gateway for all your AI providers.',
        description:
          'A self-hosted AI API layer that handles authentication, routing, quota control, and usage metering before requests ever reach upstream models.',
        actions: [
          {
            text: 'Start Setup',
            link: '/en/getting-started',
            theme: 'brand',
          },
          {
            text: 'View Architecture',
            link: '/en/architecture',
            theme: 'alt',
          },
        ],
        features: [
          {
            icon: 'Waypoints',
            title: 'Unified provider access',
            details: 'Expose multiple AI providers behind one gateway.',
          },
          {
            icon: 'Blocks',
            title: 'Compatible integrations',
            details: 'Support OpenAI and Anthropic style integrations.',
          },
          {
            icon: 'KeyRound',
            title: 'Centralized controls',
            details: 'Control API keys, quotas, and model access centrally.',
          },
          {
            icon: 'ChartColumnIncreasing',
            title: 'Usage visibility',
            details: 'Track token usage, latency, and provider attribution.',
          },
        ],
      },
      sidebar: [
        {
          label: 'Documentation',
          items: [
            {
              label: 'OpenProxy Documentation',
              link: '/en',
            },
            {
              label: 'Getting Started',
              link: '/en/getting-started',
            },
            {
              label: 'Development',
              link: '/en/development',
            },
            {
              label: 'Architecture',
              link: '/en/architecture',
            },
            {
              label: 'Deployment',
              link: '/en/deployment',
            },
            {
              label: 'Scheduled Jobs',
              link: '/en/scheduled-jobs',
            },
            {
              label: 'API Reference',
              link: '/en/api-reference',
            },
          ],
        },
      ],
    },
  },
  markdown: {
    codeTheme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },
})
