import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'
import {
  LEGACY_IMPORT_ENTRIES,
  LEGACY_IMPORT_MARKER_FILE,
  importLegacyProductDataDir,
} from '../services/legacyDataDirImport.js'
import {
  ensurePersistentStorageUpgraded,
  resetPersistentStorageMigrationsForTests,
} from '../services/persistentStorageMigrations.js'

let tempDir: string
let legacyDir: string
let targetDir: string

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.lstat(filePath)
    return true
  } catch {
    return false
  }
}

async function writeLegacyFixture(): Promise<void> {
  await fs.mkdir(path.join(legacyDir, 'profile'), { recursive: true })
  await fs.mkdir(path.join(legacyDir, 'pets', 'dada'), { recursive: true })
  await fs.mkdir(path.join(legacyDir, 'db'), { recursive: true })
  await fs.mkdir(path.join(legacyDir, 'traces'), { recursive: true })
  await fs.writeFile(path.join(legacyDir, 'settings.json'), '{"env":{"A":"1"}}\n')
  await fs.writeFile(path.join(legacyDir, 'providers.json'), '{"providers":[],"activeId":null}\n')
  await fs.writeFile(path.join(legacyDir, 'desktop-ui.json'), '{"theme":"paper"}\n')
  await fs.writeFile(path.join(legacyDir, 'profile', 'avatar.png'), 'png-bytes')
  await fs.writeFile(path.join(legacyDir, 'pets', 'dada', 'manifest.json'), '{"name":"dada"}\n')
  await fs.writeFile(path.join(legacyDir, 'db', 'index-v1.sqlite'), 'sqlite-bytes')
  await fs.writeFile(path.join(legacyDir, 'traces', 'abc.jsonl'), '{}\n')
}

describe('legacy data dir import', () => {
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orion-legacy-import-'))
    legacyDir = path.join(tempDir, 'cc-haha')
    targetDir = path.join(tempDir, 'orion')
    process.env.CLAUDE_CONFIG_DIR = tempDir
    resetPersistentStorageMigrationsForTests()
  })

  afterEach(async () => {
    resetPersistentStorageMigrationsForTests()
    delete process.env.CLAUDE_CONFIG_DIR
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  test('copies the allow-listed entries, skips regenerable ones, and writes the marker', async () => {
    await writeLegacyFixture()

    const report = await importLegacyProductDataDir(tempDir)

    expect(report.status).toBe('imported')
    expect(report.failures).toEqual([])
    expect(await fs.readFile(path.join(targetDir, 'settings.json'), 'utf-8')).toBe('{"env":{"A":"1"}}\n')
    expect(await fs.readFile(path.join(targetDir, 'providers.json'), 'utf-8')).toBe('{"providers":[],"activeId":null}\n')
    expect(await fs.readFile(path.join(targetDir, 'profile', 'avatar.png'), 'utf-8')).toBe('png-bytes')
    expect(await fs.readFile(path.join(targetDir, 'pets', 'dada', 'manifest.json'), 'utf-8')).toBe('{"name":"dada"}\n')
    expect(await exists(path.join(targetDir, 'db'))).toBe(false)
    expect(await exists(path.join(targetDir, 'traces'))).toBe(false)
    expect(report.copied.sort()).toEqual([
      'desktop-ui.json',
      'pets/dada/manifest.json',
      'profile/avatar.png',
      'providers.json',
      'settings.json',
    ])
    const marker = await fs.readFile(path.join(targetDir, LEGACY_IMPORT_MARKER_FILE), 'utf-8')
    expect(Number.isNaN(Date.parse(marker.trim()))).toBe(false)
    // The legacy directory is left untouched so a co-installed cc-haha keeps working.
    expect(await fs.readFile(path.join(legacyDir, 'settings.json'), 'utf-8')).toBe('{"env":{"A":"1"}}\n')
  })

  test('is a no-op once the marker exists', async () => {
    await writeLegacyFixture()
    await importLegacyProductDataDir(tempDir)
    await fs.writeFile(path.join(legacyDir, 'settings.json'), '{"env":{"A":"changed"}}\n')

    const report = await importLegacyProductDataDir(tempDir)

    expect(report.status).toBe('skipped-marker')
    expect(report.copied).toEqual([])
    expect(await fs.readFile(path.join(targetDir, 'settings.json'), 'utf-8')).toBe('{"env":{"A":"1"}}\n')
  })

  test('does nothing for a fresh user without a legacy directory', async () => {
    const report = await importLegacyProductDataDir(tempDir)

    expect(report.status).toBe('skipped-no-legacy')
    expect(await exists(targetDir)).toBe(false)
  })

  test('never overwrites files that already exist in the new directory', async () => {
    await writeLegacyFixture()
    await fs.mkdir(path.join(targetDir, 'public-access'), { recursive: true })
    await fs.writeFile(path.join(targetDir, 'settings.json'), '{"env":{"A":"host-wrote-first"}}\n')

    const report = await importLegacyProductDataDir(tempDir)

    expect(report.status).toBe('imported')
    expect(report.skippedExisting).toEqual(['settings.json'])
    expect(await fs.readFile(path.join(targetDir, 'settings.json'), 'utf-8')).toBe('{"env":{"A":"host-wrote-first"}}\n')
    expect(await fs.readFile(path.join(targetDir, 'providers.json'), 'utf-8')).toBe('{"providers":[],"activeId":null}\n')
    expect(await exists(path.join(targetDir, LEGACY_IMPORT_MARKER_FILE))).toBe(true)
  })

  test('records a failure, keeps copying the rest, and withholds the marker', async () => {
    await writeLegacyFixture()
    // A directory where a file must land makes copyFile fail deterministically on every platform.
    await fs.mkdir(path.join(targetDir, 'providers.json'), { recursive: true })

    const report = await importLegacyProductDataDir(tempDir)

    expect(report.status).toBe('partial')
    expect(report.failures.length).toBe(1)
    expect(report.failures[0]!.startsWith('providers.json: ')).toBe(true)
    expect(await fs.readFile(path.join(targetDir, 'settings.json'), 'utf-8')).toBe('{"env":{"A":"1"}}\n')
    expect(await exists(path.join(targetDir, LEGACY_IMPORT_MARKER_FILE))).toBe(false)
  })

  test('skips symlinked sources instead of following them', async () => {
    await writeLegacyFixture()
    const outside = path.join(tempDir, 'outside.json')
    await fs.writeFile(outside, '{"secret":true}\n')
    try {
      await fs.symlink(outside, path.join(legacyDir, 'oauth.json'))
    } catch {
      // Symlink creation needs privileges on some Windows setups; nothing to verify then.
      return
    }

    const report = await importLegacyProductDataDir(tempDir)

    expect(report.skippedSymlinks).toEqual(['oauth.json'])
    expect(await exists(path.join(targetDir, 'oauth.json'))).toBe(false)
    expect(report.status).toBe('imported')
  })

  test('runs before the JSON upgrades so imported providers.json gets upgraded in place', async () => {
    await fs.mkdir(legacyDir, { recursive: true })
    await fs.writeFile(
      path.join(legacyDir, 'providers.json'),
      JSON.stringify({
        activeProviderId: 'provider-1',
        providers: [{
          id: 'provider-1',
          presetId: 'custom',
          name: 'Legacy Provider',
          apiKey: 'token',
          baseUrl: 'https://example.test',
          models: { main: 'model-main', haiku: '', sonnet: '', opus: '' },
        }],
      }),
    )

    const report = await ensurePersistentStorageUpgraded()

    expect(report.failures).toEqual([])
    expect(report.migratedEntries.some((entry) => entry.startsWith('legacy-import:'))).toBe(true)
    const upgraded = JSON.parse(await fs.readFile(path.join(targetDir, 'providers.json'), 'utf-8')) as { schemaVersion?: number }
    expect(typeof upgraded.schemaVersion).toBe('number')
    expect(await exists(path.join(targetDir, LEGACY_IMPORT_MARKER_FILE))).toBe(true)
  })

  test('the allow-list is exactly the spec list', () => {
    expect([...LEGACY_IMPORT_ENTRIES].sort()).toEqual([
      'agent-teams',
      'computer-use-config.json',
      'desktop',
      'desktop-ui.json',
      'grok-oauth.json',
      'oauth.json',
      'openai-oauth.json',
      'pets',
      'profile',
      'providers.json',
      'public-access',
      'public-access-devices.json',
      'settings.json',
    ])
  })
})
