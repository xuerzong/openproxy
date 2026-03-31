import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export const arrowFunctionOnlyRules = {
  'no-restricted-syntax': [
    'error',
    {
      selector: 'FunctionDeclaration',
      message: 'Use arrow functions instead of function declarations.',
    },
    {
      selector:
        "FunctionExpression:not([parent.type='Property']):not([parent.type='MethodDefinition'])",
      message: 'Use arrow functions instead of function expressions.',
    },
  ],
}

export const createBaseTypeScriptConfig = ({
  ignores = [],
  runtimeGlobals = {},
  extraExtends = [],
  rules = {},
  overrides = [],
} = {}) => {
  return [
    {
      ignores,
    },
    {
      files: ['**/*.{ts,tsx}'],
      extends: [
        js.configs.recommended,
        tseslint.configs.recommended,
        ...extraExtends,
      ],
      languageOptions: {
        ecmaVersion: 2020,
        globals: runtimeGlobals,
      },
      rules: {
        ...arrowFunctionOnlyRules,
        ...rules,
      },
    },
    ...overrides,
  ]
}
