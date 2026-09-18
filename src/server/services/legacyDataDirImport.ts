import * as fs from 'fs/promises'
import { constants as fsConstants } from 'fs'
import * as path from 'path'
import {
  LEGACY_PRODUCT_DATA_DIR_NAME,
  PRODUCT_DATA_DIR_NAME,
} from '../../constants/orionProduct.js'

/**
 * One-time import of the previous product data directory
 * (`<configDir>/cc-haha/`) into the current one (`<configDir>/orion/`).
 *
 * Copy, never move: a cc-haha install on the same machine keeps working.
 * Never overwrite: the Electron host or a pet window may have created files
 * under the new directory before the server ran this, so existing targets
 * win and only the missing files are filled in. Completion is recorded by a
 * marker file; the marker is only written when every entry succeeded, so a
 * failed run is retried on the next start.
 */

export const LEGACY_IMPORT_MARKER_FILE = `.imported-from-${LEGACY_PRODUCT_DATA_DIR_NAME}`

/** Entries copied from the legacy directory. `db/`, `traces/` and `diagnostics/` regenerate themselves. */
export const LEGACY_IMPORT_ENTRIES: readonly string[] = [
  'settings.json',
  'providers.json',
  'desktop-ui.json',
  'oauth.json',
  'openai-oauth.json',
  'grok-oauth.json',
  'computer-use-config.json',
  'profile',
  'pets',
  'agent-teams',
  'public-access',
  'public-access-devices.json',
  'desktop',
]

export type LegacyImportStatus = 'skipped-marker' | 'skipped-no-legacy' | 'imported' | 'partial'

export type LegacyImportReport = {
  status: LegacyImportStatus
  copied: string[]
  skippedExisting: string[]
  skippedSymlinks: string[]
  failures: string[]
}

function errnoCode(error: unknown): string | undefined {
  return error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
    ? error.code
    : undefined
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.lstat(filePath)
    return true
  } catch (error) {
    if (errnoCode(error) === 'ENOENT') return false
    throw error
  }
}

function toPosix(relativePath: string): string {
  return relativePath.split(path.sep).join('/')
}

async function copyEntry(
  legacyRoot: string,
  targetRoot: string,
  relativePath: string,
  report: LegacyImportReport,
): Promise<void> {
  const source = path.join(legacyRoot, relativePath)
  const target = path.join(targetRoot, relativePath)
  const label = toPosix(relativePath)

  let stats
  try {
    stats = await fs.lstat(source)
  } catch (error) {
    if (errnoCode(error) === 'ENOENT') return
    report.failures.push(`${label}: ${describeError(error)}`)
    return
  }

  if (stats.isSymbolicLink()) {
    report.skippedSymlinks.push(label)
    return
  }

  if (stats.isDirectory()) {
    try {
      await fs.mkdir(target, { recursive: true })
    } catch (error) {
      report.failures.push(`${label}: ${describeError(error)}`)
      return
    }
    let children: string[]
    try {
      children = await fs.readdir(source)
    } catch (error) {
      report.failures.push(`${label}: ${describeError(error)}`)
      return
    }
    for (const child of children.sort()) {
      await copyEntry(legacyRoot, targetRoot, path.join(relativePath, child), report)
    }
    return
  }

  if (!stats.isFile()) return

  // Decide "exists" before copying: O_EXCL reports EEXIST for a directory at
  // the target path too, and that must count as a failure, not as "already
  // imported". A regular file at the target is the never-overwrite case.
  try {
    const existing = await fs.lstat(target)
    if (existing.isFile()) {
      report.skippedExisting.push(label)
      return
    }
    report.failures.push(`${label}: target exists and is not a regular file`)
    return
  } catch (error) {
    if (errnoCode(error) !== 'ENOENT') {
      report.failures.push(`${label}: ${describeError(error)}`)
      return
    }
  }

  try {
    await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.copyFile(source, target, fsConstants.COPYFILE_EXCL)
    report.copied.push(label)
  } catch (error) {
    if (errnoCode(error) === 'EEXIST') {
      // Lost a race with another writer between lstat and copy; their file wins.
      report.skippedExisting.push(label)
      return
    }
    report.failures.push(`${label}: ${describeError(error)}`)
  }
}

export async function importLegacyProductDataDir(configDir: string): Promise<LegacyImportReport> {
  const report: LegacyImportReport = {
    status: 'skipped-no-legacy',
    copied: [],
    skippedExisting: [],
    skippedSymlinks: [],
    failures: [],
  }
  const legacyRoot = path.join(configDir, LEGACY_PRODUCT_DATA_DIR_NAME)
  const targetRoot = path.join(configDir, PRODUCT_DATA_DIR_NAME)
  const markerPath = path.join(targetRoot, LEGACY_IMPORT_MARKER_FILE)

  if (await pathExists(markerPath)) {
    report.status = 'skipped-marker'
    return report
  }
  if (!(await pathExists(legacyRoot))) {
    return report
  }

  await fs.mkdir(targetRoot, { recursive: true })
  for (const entry of LEGACY_IMPORT_ENTRIES) {
    await copyEntry(legacyRoot, targetRoot, entry, report)
  }

  if (report.failures.length > 0) {
    report.status = 'partial'
    return report
  }

  await fs.writeFile(markerPath, `${new Date().toISOString()}\n`, 'utf-8')
  report.status = 'imported'
  return report
}
