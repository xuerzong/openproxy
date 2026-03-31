import globals from 'globals'
import { createBaseTypeScriptConfig } from './base.js'

export const createServerConfig = ({
  ignores = ['dist', 'drizzle', 'sql'],
  overrides = [],
} = {}) => {
  return createBaseTypeScriptConfig({
    ignores,
    runtimeGlobals: globals.node,
    overrides,
  })
}
