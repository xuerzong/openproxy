import { defineConfig } from 'eslint/config'
import { createWebConfig } from '@openproxy/eslint-config/web'

export default defineConfig(
  ...createWebConfig({
    overrides: [
      {
        files: ['src/utils/qr/codegen.ts'],
        rules: {
          'no-restricted-syntax': 'off',
          '@typescript-eslint/no-namespace': 'off',
          'prefer-const': 'off',
          'no-useless-escape': 'off',
          '@typescript-eslint/no-unused-vars': 'off',
        },
      },
    ],
  })
)
