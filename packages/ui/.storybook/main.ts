import path from 'node:path'
import type { StorybookConfig } from '@storybook/react-vite'
import tailwindcss from '@tailwindcss/vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-links',
    '@storybook/addon-themes',
    '@storybook/addon-vitest',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal(config) {
    config.plugins = config.plugins ?? []
    config.plugins.push(tailwindcss())
    config.css = {
      ...config.css,
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    }
    return config
  },
}

export default config
