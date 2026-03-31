import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { createBaseTypeScriptConfig } from './base.js'

const webQualityRules = {
  '@typescript-eslint/no-unused-vars': 'error',
}

const webTypeCompatibilityRules = {
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-empty-object-type': 'off',
  'no-empty-pattern': 'off',
}

const webReactCompatibilityRules = {
  'react-hooks/immutability': 'off',
  'react-hooks/preserve-manual-memoization': 'off',
  'react-hooks/set-state-in-effect': 'off',
  'react-refresh/only-export-components': 'off',
}

export const createWebConfig = ({
  ignores = ['dist'],
  overrides = [],
} = {}) => {
  return createBaseTypeScriptConfig({
    ignores,
    runtimeGlobals: globals.browser,
    extraExtends: [
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    rules: {
      ...webQualityRules,
      ...webTypeCompatibilityRules,
      ...webReactCompatibilityRules,
    },
    overrides,
  })
}
