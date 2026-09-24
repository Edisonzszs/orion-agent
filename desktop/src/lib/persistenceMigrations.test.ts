import { beforeEach, describe, expect, it, test } from 'vitest'
import {
  CURRENT_DESKTOP_PERSISTENCE_SCHEMA_VERSION,
  DESKTOP_PERSISTENCE_VERSION_KEY,
  migrateLegacyDesktopStorageKeys,
  runDesktopPersistenceMigrations,
} from './persistenceMigrations'
import { WORKSPACE_STORAGE_VERSION } from './workspace/storageKey'

describe('desktop persistence migrations', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  test('migrates legacy open-tab arrays into the current tab persistence shape', () => {
    window.localStorage.setItem('cc-haha-open-tabs', JSON.stringify([
      { sessionId: 'session-1', title: 'Old tab' },
      { sessionId: '__terminal__legacy', title: 'Terminal 1', type: 'terminal' },
      { sessionId: 123, title: 'bad' },
    ]))

    const report = runDesktopPersistenceMigrations()

    expect(report.migratedKeys).toContain('orion-open-tabs')
    expect(JSON.parse(window.localStorage.getItem('orion-open-tabs') || '{}')).toEqual({
      openTabs: [{ sessionId: 'session-1', title: 'Old tab', type: 'session' }],
      activeTabId: 'session-1',
    })
    expect(window.localStorage.getItem(DESKTOP_PERSISTENCE_VERSION_KEY)).toBe(String(CURRENT_DESKTOP_PERSISTENCE_SCHEMA_VERSION))
  })

  test.each([undefined, 'session', 'connectors'])('preserves connector identities from legacy startup fixtures with type %s', (type) => {
    window.localStorage.setItem('cc-haha-open-tabs', JSON.stringify({
      openTabs: [
        { sessionId: 'session-1', title: 'Task' },
        { sessionId: '__connectors__', title: 'Connectors', ...(type ? { type } : {}) },
      ],
      activeTabId: '__connectors__',
    }))
    runDesktopPersistenceMigrations()
    const expected = {
      openTabs: [
        { sessionId: 'session-1', title: 'Task', type: 'session' },
        { sessionId: '__market__', title: 'Connectors', type: 'market' },
      ],
      activeTabId: '__market__',
    }
    expect(JSON.parse(window.localStorage.getItem('orion-open-tabs')!)).toEqual(expected)
    runDesktopPersistenceMigrations()
    expect(JSON.parse(window.localStorage.getItem('orion-open-tabs')!)).toEqual(expected)
  })

  test('preserves persisted market tabs during startup migration', () => {
    window.localStorage.setItem('cc-haha-open-tabs', JSON.stringify({
      openTabs: [
        { sessionId: '__market__', title: 'Market', type: 'market' },
        { sessionId: '__traces__', title: 'Traces', type: 'traces' },
      ],
      activeTabId: '__market__',
    }))

    const report = runDesktopPersistenceMigrations()

    expect(report.migratedKeys).toContain('orion-open-tabs')
    expect(JSON.parse(window.localStorage.getItem('orion-open-tabs') || '{}')).toEqual({
      openTabs: [
        { sessionId: '__market__', title: 'Market', type: 'market' },
        { sessionId: '__traces__', title: 'Traces', type: 'traces' },
      ],
      activeTabId: '__market__',
    })
  })

  test('canonicalizes mismatched persisted special tab ids and types during startup migration', () => {
    window.localStorage.setItem('cc-haha-open-tabs', JSON.stringify({
      openTabs: [
        { sessionId: '__settings__', title: 'Settings', type: 'market' },
        { sessionId: '__market__', title: 'Skills', type: 'settings' },
      ],
      activeTabId: '__settings__',
    }))

    runDesktopPersistenceMigrations()

    expect(JSON.parse(window.localStorage.getItem('orion-open-tabs') || '{}')).toEqual({
      openTabs: [
        { sessionId: '__settings__', title: 'Settings', type: 'settings' },
        { sessionId: '__market__', title: 'Skills', type: 'market' },
      ],
      activeTabId: '__settings__',
    })
  })

  test('filters stale session runtime selections without clearing unrelated keys', () => {
    window.localStorage.setItem('unrelated-user-key', 'keep')
    window.localStorage.setItem('cc-haha-session-runtime', JSON.stringify({
      good: { providerId: null, modelId: 'claude-sonnet' },
      alsoGood: { providerId: 'openai-official', modelId: 'gpt-5.6-sol', effortLevel: 'xhigh' },
      bad: { providerId: 'provider-2' },
    }))

    runDesktopPersistenceMigrations()

    expect(JSON.parse(window.localStorage.getItem('orion-session-runtime') || '{}')).toEqual({
      alsoGood: { providerId: 'openai-official', modelId: 'gpt-5.6-sol', effortLevel: 'xhigh' },
      good: { providerId: null, modelId: 'claude-sonnet' },
    })
    expect(window.localStorage.getItem('unrelated-user-key')).toBe('keep')
  })

  test('removes malformed known keys without throwing during startup', () => {
    window.localStorage.setItem('cc-haha-open-tabs', '{"openTabs":')
    window.localStorage.setItem('cc-haha-theme', 'sepia')

    const report = runDesktopPersistenceMigrations()

    expect(report.migratedKeys).toContain('orion-open-tabs')
    expect(report.migratedKeys).toContain('orion-theme')
    expect(window.localStorage.getItem('orion-open-tabs')).toBeNull()
    expect(window.localStorage.getItem('orion-theme')).toBeNull()
  })

  test('preserves the pure white theme as a valid persisted theme', () => {
    window.localStorage.setItem('cc-haha-theme', 'white')

    const report = runDesktopPersistenceMigrations()

    expect(report.migratedKeys).not.toContain('orion-theme')
    expect(window.localStorage.getItem('orion-theme')).toBe('white')
  })

  test('renames the retired light theme to warm-classic instead of resetting it', () => {
    // `light` was the warm workspace, labelled 经典暖色 in the picker. Falling
    // through to the enum check would drop it and silently reset those
    // installs to pure white, which reads as the app forgetting the setting.
    window.localStorage.setItem('cc-haha-theme', 'light')

    const report = runDesktopPersistenceMigrations()

    expect(report.migratedKeys).toContain('orion-theme')
    expect(window.localStorage.getItem('orion-theme')).toBe('warm-classic')
  })

  test('applies the same rename to the light half of follow-the-system', () => {
    // The preference holds a theme name too, so a rename that only reached the
    // applied theme would silently reset which palette daytime returns to.
    window.localStorage.setItem('cc-haha-light-theme', 'light')

    const report = runDesktopPersistenceMigrations()

    expect(report.migratedKeys).toContain('orion-light-theme')
    expect(window.localStorage.getItem('orion-light-theme')).toBe('warm-classic')
  })

  test('preserves every palette introduced by the redesign', () => {
    // Later iterations write the live orion key directly: the never-overwrite
    // migration keeps the first iteration's copied value, so re-seeding the
    // legacy key would leave a stale palette under the orion name.
    for (const theme of ['white', 'paper', 'warm-classic', 'celadon', 'dark', 'ink-blue']) {
      window.localStorage.setItem('orion-theme', theme)

      const report = runDesktopPersistenceMigrations()

      expect(report.migratedKeys, `${theme} should survive startup migration`).not.toContain('orion-theme')
      expect(window.localStorage.getItem('orion-theme')).toBe(theme)
    }
  })

  test('drops a malformed follow-the-system flag rather than reading it as opted in', () => {
    // Anything but 0/1 has to go: an unset flag is how a fresh install is
    // recognised, and a junk value would make that inference unpredictable.
    window.localStorage.setItem('cc-haha-follow-system-theme', 'yes')
    // A dark palette is not a valid light half, and vice versa.
    window.localStorage.setItem('cc-haha-light-theme', 'ink-blue')
    window.localStorage.setItem('cc-haha-dark-theme', 'celadon')

    const report = runDesktopPersistenceMigrations()

    expect(report.migratedKeys).toContain('orion-follow-system-theme')
    expect(report.migratedKeys).toContain('orion-light-theme')
    expect(report.migratedKeys).toContain('orion-dark-theme')
    expect(window.localStorage.getItem('orion-follow-system-theme')).toBeNull()
    expect(window.localStorage.getItem('orion-light-theme')).toBeNull()
    expect(window.localStorage.getItem('orion-dark-theme')).toBeNull()
  })

  test('preserves a valid follow-the-system flag and both ground preferences', () => {
    window.localStorage.setItem('cc-haha-follow-system-theme', '1')
    window.localStorage.setItem('cc-haha-light-theme', 'celadon')
    window.localStorage.setItem('cc-haha-dark-theme', 'ink-blue')

    const report = runDesktopPersistenceMigrations()

    expect(report.migratedKeys).not.toContain('orion-follow-system-theme')
    expect(report.migratedKeys).not.toContain('orion-light-theme')
    expect(report.migratedKeys).not.toContain('orion-dark-theme')
    expect(window.localStorage.getItem('orion-follow-system-theme')).toBe('1')
    expect(window.localStorage.getItem('orion-light-theme')).toBe('celadon')
    expect(window.localStorage.getItem('orion-dark-theme')).toBe('ink-blue')
  })

  test('preserves every supported locale during startup migration', () => {
    // Later iterations write the live orion key directly, matching the
    // palette loop above: the copied value from iteration one wins otherwise.
    for (const locale of ['en', 'zh', 'zh-TW', 'jp', 'kr']) {
      window.localStorage.setItem('orion-locale', locale)

      const report = runDesktopPersistenceMigrations()

      expect(report.migratedKeys).not.toContain('orion-locale')
      expect(window.localStorage.getItem('orion-locale')).toBe(locale)
    }
  })

  test('preserves valid app zoom and removes invalid app zoom values', () => {
    window.localStorage.setItem('cc-haha-app-zoom', '1.2')

    const validReport = runDesktopPersistenceMigrations()

    expect(validReport.migratedKeys).not.toContain('orion-app-zoom')
    expect(window.localStorage.getItem('orion-app-zoom')).toBe('1.2')

    // The invalid value is what a post-migration install holds on the live
    // key; the never-overwrite copy would keep '1.2' if this re-seeded the
    // legacy key instead.
    window.localStorage.setItem('orion-app-zoom', '4')

    const invalidReport = runDesktopPersistenceMigrations()

    expect(invalidReport.migratedKeys).toContain('orion-app-zoom')
    expect(window.localStorage.getItem('orion-app-zoom')).toBeNull()
  })

  test('migrates the legacy UI zoom key into app zoom storage', () => {
    window.localStorage.setItem('cc-haha-ui-zoom', '1.25')

    const report = runDesktopPersistenceMigrations()

    expect(report.migratedKeys).toEqual(expect.arrayContaining([
      'orion-app-zoom',
      'orion-ui-zoom',
    ]))
    expect(window.localStorage.getItem('orion-app-zoom')).toBe('1.25')
    expect(window.localStorage.getItem('orion-ui-zoom')).toBeNull()
  })

  test('does not throw if schema version persistence is blocked', () => {
    const storage = {
      getItem: window.localStorage.getItem.bind(window.localStorage),
      removeItem: window.localStorage.removeItem.bind(window.localStorage),
      setItem: (key: string, value: string) => {
        if (key === DESKTOP_PERSISTENCE_VERSION_KEY) {
          throw new Error('storage blocked')
        }
        window.localStorage.setItem(key, value)
      },
    }

    expect(() => runDesktopPersistenceMigrations(storage)).not.toThrow()
    expect(runDesktopPersistenceMigrations(storage).migratedKeys).toContain(DESKTOP_PERSISTENCE_VERSION_KEY)
  })

  test('does not throw if storage reads and writes are blocked', () => {
    const storage = {
      getItem: () => {
        throw new Error('storage unavailable')
      },
      removeItem: () => {
        throw new Error('storage unavailable')
      },
      setItem: () => {
        throw new Error('storage unavailable')
      },
    }

    const report = runDesktopPersistenceMigrations(storage)

    expect(report.migratedKeys).toEqual(expect.arrayContaining([
      'orion-open-tabs',
      'orion-session-runtime',
      'orion-theme',
      'orion-locale',
      'orion-app-zoom',
      DESKTOP_PERSISTENCE_VERSION_KEY,
    ]))
  })
  test('keeps a schema-1 install usable: no workspace key means nothing to migrate', () => {
    window.localStorage.setItem('cc-haha-open-tabs', JSON.stringify({
      openTabs: [{ sessionId: 'session-1', title: 'Chat', type: 'session' }],
      activeTabId: 'session-1',
    }))
    window.localStorage.setItem('cc-haha-theme', 'ink-blue')

    const report = runDesktopPersistenceMigrations()

    expect(report.migratedKeys).not.toContain('orion.workspace')
    expect(window.localStorage.getItem('orion.workspace')).toBeNull()
    // The schema-1 keys a v0.6.2 install carries must survive the de-brand
    // copy — now under the orion names the app reads.
    expect(window.localStorage.getItem('orion-theme')).toBe('ink-blue')
    expect(JSON.parse(window.localStorage.getItem('orion-open-tabs')!).openTabs).toHaveLength(1)
    expect(window.localStorage.getItem(DESKTOP_PERSISTENCE_VERSION_KEY)).toBe(String(CURRENT_DESKTOP_PERSISTENCE_SCHEMA_VERSION))
  })

  test('leaves a workspace entry written by a newer schema untouched', () => {
    const future = JSON.stringify({
      version: WORKSPACE_STORAGE_VERSION + 1,
      sessions: { s1: { tabs: [{ kind: 'file', id: 'f1', path: 'a.ts' }] } },
    })
    window.localStorage.setItem('cc-haha.workspace', future)

    const report = runDesktopPersistenceMigrations()

    // The hydrator already refuses an unknown version. Deleting it here would
    // mean a single downgrade launch permanently discards the workspace the
    // newer build is still using. The de-brand copy moves the value verbatim,
    // so "untouched" still holds under the orion key.
    expect(report.migratedKeys).not.toContain('orion.workspace')
    expect(window.localStorage.getItem('orion.workspace')).toBe(future)
  })

  test('upgrades workspace v1 without losing the Files launcher, turns, or unknown metadata', () => {
    window.localStorage.setItem(DESKTOP_PERSISTENCE_VERSION_KEY, '2')
    window.localStorage.setItem('cc-haha.workspace', JSON.stringify({
      version: 1,
      futureMetadata: { keep: true },
      sessions: {
        s1: {
          layout: 'full',
          activeSideTabId: 'files',
          futureSetting: 42,
          tabs: [
            { kind: 'file', id: 'files', path: '', preview: true },
            { kind: 'review', id: 'review', source: { kind: 'turn', turnKey: 'message-1' }, selectedPath: 'a.ts' },
          ],
        },
      },
    }))

    runDesktopPersistenceMigrations()
    const stored = JSON.parse(window.localStorage.getItem('orion.workspace')!)
    expect(stored).toMatchObject({
      version: WORKSPACE_STORAGE_VERSION,
      futureMetadata: { keep: true },
      sessions: {
        s1: {
          layout: 'full',
          activeSideTabId: 'files',
          futureSetting: 42,
          tabs: [
            { id: 'files', path: '', preview: true },
            { id: 'review', source: { kind: 'turn', turnKey: 'message-1' }, viewedPaths: [] },
          ],
        },
      },
    })
    expect(window.localStorage.getItem(DESKTOP_PERSISTENCE_VERSION_KEY))
      .toBe(String(CURRENT_DESKTOP_PERSISTENCE_SCHEMA_VERSION))
    const once = window.localStorage.getItem('orion.workspace')
    runDesktopPersistenceMigrations()
    expect(window.localStorage.getItem('orion.workspace')).toBe(once)
  })

  test('strips tab entries that name a host resource the previous run owned', () => {
    window.localStorage.setItem('cc-haha.workspace', JSON.stringify({
      version: 1,
      sideWidth: 860,
      bottomHeight: 420,
      sessions: {
        s1: {
          layout: 'split',
          bottomOpen: false,
          activeSideTabId: 'f1',
          activeBottomTabId: null,
          nextTerminalOrdinal: 2,
          tabs: [
            { kind: 'file', id: 'f1', preview: false, path: 'a.ts' },
            { kind: 'terminal', id: 't1', dock: 'side', cwd: '/repo', ordinal: 1, runtimeId: 'stale-pty' },
            { kind: 'browser', id: 'b1', preview: false, storageId: 'p1', restoreUrl: null, title: null, browserTabId: 'stale-view' },
          ],
        },
      },
    }))

    const report = runDesktopPersistenceMigrations()

    expect(report.migratedKeys).toContain('orion.workspace')
    const stored = JSON.parse(window.localStorage.getItem('orion.workspace')!)
    expect(stored.sessions.s1.tabs.map((tab: { id: string }) => tab.id)).toEqual(['f1'])
  })

  test('removes a corrupt workspace entry rather than throwing at startup', () => {
    window.localStorage.setItem('cc-haha.workspace', '{not json')

    const report = runDesktopPersistenceMigrations()

    expect(report.migratedKeys).toContain('orion.workspace')
    expect(window.localStorage.getItem('orion.workspace')).toBeNull()
  })

})

describe('cc-haha → orion localStorage migration', () => {
  // The pre-rebrand user-state keys. Ephemeral window/smoke keys and Electron
  // partition values were renamed without migration, so they stay absent here.
  const MIGRATED_KEYS = [
    'cc-haha-active-settings-tab',
    'cc-haha-app-zoom',
    'cc-haha-dark-theme',
    'cc-haha-dismissed-update-version',
    'cc-haha-follow-system-theme',
    'cc-haha-h5-server-url',
    'cc-haha-h5-token',
    'cc-haha-light-theme',
    'cc-haha-locale',
    'cc-haha-market-disclaimer-dismissed',
    'cc-haha-open-tabs',
    'cc-haha-open-target-preferences',
    'cc-haha-session-runtime',
    'cc-haha-sidebar-hidden-projects',
    'cc-haha-sidebar-pinned-projects',
    'cc-haha-sidebar-project-order',
    'cc-haha-sidebar-project-organization',
    'cc-haha-sidebar-project-sort',
    'cc-haha-sidebar-width',
    'cc-haha-theme',
    'cc-haha-ui-zoom',
    'cc-haha.notifiedDesktopTaskRuns.v1',
    'cc-haha.persistence.schemaVersion',
    'cc-haha.scheduledTaskNotificationScan.v1',
    'cc-haha.workspace',
  ]

  beforeEach(() => {
    window.localStorage.clear()
  })

  it('copies user-state values to orion keys when the orion key is absent', () => {
    for (const key of MIGRATED_KEYS) window.localStorage.setItem(key, `v:${key}`)

    const migrated = migrateLegacyDesktopStorageKeys(window.localStorage)

    for (const key of MIGRATED_KEYS) {
      expect(window.localStorage.getItem(key.replace(/^cc-haha/, 'orion'))).toBe(`v:${key}`)
      // Legacy keys are removed after the copy, matching the infra's
      // legacy-key convention (see normalizeAppZoomKey).
      expect(window.localStorage.getItem(key)).toBeNull()
    }
    expect(migrated).toEqual(MIGRATED_KEYS)
  })

  it('never overwrites an existing orion key', () => {
    window.localStorage.setItem('cc-haha-theme', 'old')
    window.localStorage.setItem('orion-theme', 'mine')

    migrateLegacyDesktopStorageKeys(window.localStorage)

    expect(window.localStorage.getItem('orion-theme')).toBe('mine')
    expect(window.localStorage.getItem('cc-haha-theme')).toBeNull()
  })

  it('is idempotent', () => {
    for (const key of MIGRATED_KEYS) window.localStorage.setItem(key, 'x')

    migrateLegacyDesktopStorageKeys(window.localStorage)
    migrateLegacyDesktopStorageKeys(window.localStorage)

    expect(window.localStorage.getItem('orion-theme')).toBe('x')
    expect(migrateLegacyDesktopStorageKeys(window.localStorage)).toEqual([])
  })

  it('runs before the schema chain so legacy values still drive it', () => {
    window.localStorage.setItem('cc-haha-theme', 'light')
    window.localStorage.setItem('cc-haha.persistence.schemaVersion', '2')

    const report = runDesktopPersistenceMigrations()

    // The de-brand copy lands first, then the theme-rename schema step below
    // consumes the copied value — proof of the ordering, not just the copy.
    expect(window.localStorage.getItem('orion-theme')).toBe('warm-classic')
    expect(window.localStorage.getItem('cc-haha-theme')).toBeNull()
    expect(report.migratedKeys).toContain('cc-haha-theme')
    expect(window.localStorage.getItem(DESKTOP_PERSISTENCE_VERSION_KEY))
      .toBe(String(CURRENT_DESKTOP_PERSISTENCE_SCHEMA_VERSION))
  })
})

test('merges legacy connector and skill market tabs while preserving the active market and unrelated user state', () => {
  localStorage.clear()
  localStorage.setItem(DESKTOP_PERSISTENCE_VERSION_KEY, '3')
  localStorage.setItem('custom-user-state', JSON.stringify({ selectedSkill: 'my-skill' }))
  localStorage.setItem('cc-haha-open-tabs', JSON.stringify({ openTabs: [
    { sessionId: 'session-1', title: 'Work', type: 'session' },
    { sessionId: '__market__', title: 'Skills', type: 'market' },
    { sessionId: '__connectors__', title: 'Connectors', type: 'connectors' },
  ], activeTabId: '__connectors__' }))
  runDesktopPersistenceMigrations()
  expect(JSON.parse(localStorage.getItem('orion-open-tabs')!)).toEqual({ openTabs: [
    { sessionId: 'session-1', title: 'Work', type: 'session' },
    { sessionId: '__market__', title: 'Skills', type: 'market' },
  ], activeTabId: '__market__' })
  expect(JSON.parse(localStorage.getItem('custom-user-state')!)).toEqual({ selectedSkill: 'my-skill' })
})
