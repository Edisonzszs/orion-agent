import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'

import { applyConfigEnvironmentVariables, applySafeConfigEnvironmentVariables } from './managedEnv.js'

let tmpDir: string
const originalEnv = {
  ORION_AGENT_TEAMS_ENABLED: process.env.ORION_AGENT_TEAMS_ENABLED,
  ORION_AGENT_TEAMS_DEFAULT: process.env.ORION_AGENT_TEAMS_DEFAULT,
  CLAUDE_CODE_ENTRYPOINT: process.env.CLAUDE_CODE_ENTRYPOINT,
  CLAUDE_CONFIG_DIR: process.env.CLAUDE_CONFIG_DIR,
  CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST: process.env.CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST,
  ORION_LOCAL_ACCESS_TOKEN: process.env.ORION_LOCAL_ACCESS_TOKEN,
  ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN,
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
  ORION_IMAGE_PROVIDER_KIND: process.env.ORION_IMAGE_PROVIDER_KIND,
  ORION_IMAGE_PROVIDER_ID: process.env.ORION_IMAGE_PROVIDER_ID,
  ORION_IMAGE_MODEL: process.env.ORION_IMAGE_MODEL,
  CLAUDE_CODE_PROVIDER_MAX_OUTPUT_TOKENS: process.env.CLAUDE_CODE_PROVIDER_MAX_OUTPUT_TOKENS,
}

function restoreEnv(key: keyof typeof originalEnv): void {
  const value = originalEnv[key]
  if (value === undefined) {
    delete process.env[key]
  } else {
    process.env[key] = value
  }
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf-8')
}

describe('managedEnv', () => {
  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'managed-env-'))
    process.env.CLAUDE_CONFIG_DIR = tmpDir
    delete process.env.CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST
    delete process.env.ORION_AGENT_TEAMS_ENABLED
    delete process.env.ORION_AGENT_TEAMS_DEFAULT
    process.env.CLAUDE_CODE_ENTRYPOINT = 'sdk-cli'
    delete process.env.ORION_LOCAL_ACCESS_TOKEN
    delete process.env.ANTHROPIC_BASE_URL
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.ANTHROPIC_AUTH_TOKEN
    delete process.env.ANTHROPIC_MODEL
    delete process.env.ORION_IMAGE_PROVIDER_KIND
    delete process.env.ORION_IMAGE_PROVIDER_ID
    delete process.env.ORION_IMAGE_MODEL
    delete process.env.CLAUDE_CODE_PROVIDER_MAX_OUTPUT_TOKENS
  })

  afterEach(async () => {
    await import('../server/proxy/standaloneProviderProxy.js')
      .then((mod) => mod.stopStandaloneProviderProxyForTests?.())
      .catch(() => {})
    await fs.rm(tmpDir, { recursive: true, force: true })
    restoreEnv('CLAUDE_CONFIG_DIR')
    restoreEnv('CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST')
    restoreEnv('ORION_LOCAL_ACCESS_TOKEN')
    restoreEnv('ORION_AGENT_TEAMS_ENABLED')
    restoreEnv('ORION_AGENT_TEAMS_DEFAULT')
    restoreEnv('CLAUDE_CODE_ENTRYPOINT')
    restoreEnv('ANTHROPIC_BASE_URL')
    restoreEnv('ANTHROPIC_API_KEY')
    restoreEnv('ANTHROPIC_AUTH_TOKEN')
    restoreEnv('ANTHROPIC_MODEL')
    restoreEnv('ORION_IMAGE_PROVIDER_KIND')
    restoreEnv('ORION_IMAGE_PROVIDER_ID')
    restoreEnv('ORION_IMAGE_MODEL')
    restoreEnv('CLAUDE_CODE_PROVIDER_MAX_OUTPUT_TOKENS')
  })

  test.each(['0', '1', undefined])('protects the General team preference %j through settings application', async (enabled) => {
    await writeJson(path.join(tmpDir, 'orion', 'settings.json'), {
      env: {
        ORION_AGENT_TEAMS_ENABLED: enabled === '1' ? '0' : '1',
        ORION_AGENT_TEAMS_DEFAULT: '0',
      },
    })
    if (enabled !== undefined) process.env.ORION_AGENT_TEAMS_ENABLED = enabled
    process.env.ORION_AGENT_TEAMS_DEFAULT = '1'

    // OAuth and cron sessions can use sdk-cli without host-owned provider routing.
    // Both the pre-trust and post-trust settings paths must preserve the choice.
    applySafeConfigEnvironmentVariables()
    expect(process.env.ORION_AGENT_TEAMS_ENABLED).toBe(enabled)
    expect(process.env.ORION_AGENT_TEAMS_DEFAULT).toBe('1')
    applyConfigEnvironmentVariables()
    expect(process.env.ORION_AGENT_TEAMS_ENABLED).toBe(enabled)
    expect(process.env.ORION_AGENT_TEAMS_DEFAULT).toBe('1')
  })

  test('starts a standalone provider proxy for CLI-only OpenAI-compatible providers', async () => {
    await writeJson(path.join(tmpDir, 'orion', 'providers.json'), {
      activeId: 'agnes-provider',
      providers: [
        {
          id: 'agnes-provider',
          presetId: 'custom',
          name: 'Agnes',
          apiKey: 'sk-agnes',
          authStrategy: 'api_key',
          baseUrl: 'https://apihub.agnes-ai.com',
          apiFormat: 'openai_chat',
          models: {
            main: 'agnes-2.0-flash',
            haiku: 'agnes-2.0-flash',
            sonnet: 'agnes-2.0-flash',
            opus: 'agnes-2.0-flash',
          },
        },
      ],
    })

    applySafeConfigEnvironmentVariables()

    const baseUrl = new URL(process.env.ANTHROPIC_BASE_URL!)
    expect(baseUrl.hostname).toBe('127.0.0.1')
    expect(baseUrl.port).not.toBe('3456')
    expect(baseUrl.pathname).toBe('/proxy')

    const health = await fetch(new URL('/health', baseUrl.origin))
    expect(health.status).toBe(200)
  })

  test('does not let settings replace host-owned provider routing credentials', async () => {
    await writeJson(path.join(tmpDir, 'orion', 'settings.json'), {
      env: {
        CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST: '0',
        ORION_LOCAL_ACCESS_TOKEN: 'stale-settings-token',
        ORION_IMAGE_PROVIDER_KIND: 'openai_oauth',
        ORION_IMAGE_PROVIDER_ID: 'openai-official',
        ORION_IMAGE_MODEL: 'gpt-image-2',
        CLAUDE_CODE_PROVIDER_MAX_OUTPUT_TOKENS: '32000',
      },
    })
    process.env.CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST = '1'
    process.env.ORION_LOCAL_ACCESS_TOKEN = 'desktop-local-secret'
    process.env.ORION_IMAGE_PROVIDER_KIND = 'grok_oauth'
    process.env.ORION_IMAGE_PROVIDER_ID = 'grok-official'
    process.env.ORION_IMAGE_MODEL = 'grok-imagine-image-quality'
    process.env.CLAUDE_CODE_PROVIDER_MAX_OUTPUT_TOKENS = '96000'

    applySafeConfigEnvironmentVariables()

    expect(process.env.CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST).toBe('1')
    expect(process.env.ORION_LOCAL_ACCESS_TOKEN).toBe('desktop-local-secret')
    expect(process.env.ORION_IMAGE_PROVIDER_KIND).toBe('grok_oauth')
    expect(process.env.ORION_IMAGE_PROVIDER_ID).toBe('grok-official')
    expect(process.env.ORION_IMAGE_MODEL).toBe('grok-imagine-image-quality')
    expect(process.env.CLAUDE_CODE_PROVIDER_MAX_OUTPUT_TOKENS).toBe('96000')
  })
})
