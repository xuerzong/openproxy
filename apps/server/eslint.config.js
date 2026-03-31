import { defineConfig } from 'eslint/config'
import { createServerConfig } from '@openproxy/eslint-config/server'

export default defineConfig(...createServerConfig())
