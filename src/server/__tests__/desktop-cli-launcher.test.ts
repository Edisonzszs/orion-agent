import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import {
  buildWindowsLauncherWrapper,
  ensureDesktopCliLauncherInstalled,
  getDesktopCliCommandName,
  removeLegacyWindowsLaunchers,
  upsertManagedPathBlock,
} from '../services/desktopCliLauncherService.js'

const isWindows = process.platform === 'win32'
const unixOnly = isWindows ? it.skip : it
const windowsOnly = isWindows ? it : it.skip

async function pathExists(filePath: string) {
  try {
    await stat(filePath)
    return true
  } catch {
    return false
  }
}

const ORIGINAL_HOME = process.env.HOME
const ORIGINAL_USERPROFILE = process.env.USERPROFILE
const ORIGINAL_SHELL = process.env.SHELL
const ORIGINAL_PATH = process.env.PATH
const ORIGINAL_CLAUDE_CLI_PATH = process.env.CLAUDE_CLI_PATH
const ORIGINAL_CLAUDE_CONFIG_DIR = process.env.CLAUDE_CONFIG_DIR

describe('ensureDesktopCliLauncherInstalled', () => {
  let tempHome = ''
  let tempSourceDir = ''

  beforeEach(async () => {
    tempHome = await mkdtemp(join(tmpdir(), 'desktop-cli-home-'))
    tempSourceDir = await mkdtemp(join(tmpdir(), 'desktop-cli-source-'))
    process.env.HOME = tempHome
    process.env.USERPROFILE = tempHome
    process.env.SHELL = '/bin/zsh'
    process.env.PATH = ''
    delete process.env.CLAUDE_CONFIG_DIR
  })

  afterEach(async () => {
    if (ORIGINAL_HOME === undefined) {
      delete process.env.HOME
    } else {
      process.env.HOME = ORIGINAL_HOME
    }

    if (ORIGINAL_USERPROFILE === undefined) {
      delete process.env.USERPROFILE
    } else {
      process.env.USERPROFILE = ORIGINAL_USERPROFILE
    }

    if (ORIGINAL_SHELL === undefined) {
      delete process.env.SHELL
    } else {
      process.env.SHELL = ORIGINAL_SHELL
    }

    if (ORIGINAL_PATH === undefined) {
      delete process.env.PATH
    } else {
      process.env.PATH = ORIGINAL_PATH
    }

    if (ORIGINAL_CLAUDE_CLI_PATH === undefined) {
      delete process.env.CLAUDE_CLI_PATH
    } else {
      process.env.CLAUDE_CLI_PATH = ORIGINAL_CLAUDE_CLI_PATH
    }

    if (ORIGINAL_CLAUDE_CONFIG_DIR === undefined) {
      delete process.env.CLAUDE_CONFIG_DIR
    } else {
      process.env.CLAUDE_CONFIG_DIR = ORIGINAL_CLAUDE_CONFIG_DIR
    }

    await rm(tempHome, { recursive: true, force: true })
    await rm(tempSourceDir, { recursive: true, force: true })
  })

  unixOnly('installs a launcher wrapper in the user bin dir and configures PATH', async () => {
    const sourcePath = join(tempSourceDir, 'claude-sidecar')
    await writeFile(sourcePath, '#!/bin/sh\necho desktop-sidecar\n', 'utf8')
    await chmod(sourcePath, 0o755)
    process.env.CLAUDE_CLI_PATH = sourcePath

    const status = await ensureDesktopCliLauncherInstalled()
    const launcherPath = join(tempHome, '.local', 'bin', 'orion')
    const shellConfigPath = join(tempHome, '.zshrc')

    expect(status.supported).toBe(true)
    expect(status.installed).toBe(true)
    expect(status.command).toBe('orion')
    expect(status.launcherPath).toBe(launcherPath)
    expect(status.availableInNewTerminals).toBe(true)
    expect(status.needsTerminalRestart).toBe(true)
    expect(status.configTarget).toBe(shellConfigPath)

    const launcher = await readFile(launcherPath, 'utf8')
    expect(launcher).toContain(`SIDECAR='${sourcePath}'`)
    expect(launcher).toContain('cli --app-root "$APP_ROOT" "$@"')
    expect(launcher).toContain('/usr/bin/script -q /dev/null')
    expect(await readFile(shellConfigPath, 'utf8')).toContain(
      'export PATH="$HOME/.local/bin:$PATH"',
    )
  })

  unixOnly('pins portable config dir in the installed launcher wrapper', async () => {
    const sourcePath = join(tempSourceDir, 'claude-sidecar')
    const portableDir = join(tempHome, 'portable-config')
    await writeFile(sourcePath, '#!/bin/sh\necho desktop-sidecar\n', 'utf8')
    await chmod(sourcePath, 0o755)
    process.env.CLAUDE_CLI_PATH = sourcePath
    process.env.CLAUDE_CONFIG_DIR = portableDir

    await ensureDesktopCliLauncherInstalled()

    const launcher = await readFile(join(tempHome, '.local', 'bin', 'orion'), 'utf8')
    expect(launcher).toContain(`export CLAUDE_CONFIG_DIR='${portableDir}'`)
  })

  it('uses a Windows cmd launcher so portable env can be injected', () => {
    expect(getDesktopCliCommandName('win32')).toBe('orion.cmd')

    process.env.CLAUDE_CONFIG_DIR = 'C:\\Portable\\ClaudeConfig'
    const wrapper = buildWindowsLauncherWrapper('C:\\Apps\\cc-haha\\claude-sidecar.exe')

    expect(wrapper).toContain('set "CLAUDE_CONFIG_DIR=C:\\Portable\\ClaudeConfig"')
    expect(wrapper).toContain(
      '"%SIDECAR%" cli --app-root "%APP_ROOT%" %*',
    )
  })

  it('reports unsupported status when the current launcher is not a bundled sidecar', async () => {
    const sourcePath = join(tempSourceDir, 'claude')
    await writeFile(sourcePath, '#!/bin/sh\necho plain-cli\n', 'utf8')
    process.env.CLAUDE_CLI_PATH = sourcePath

    const status = await ensureDesktopCliLauncherInstalled()

    expect(status.supported).toBe(false)
    expect(status.installed).toBe(false)
    expect(status.command).toBe('orion')
  })

  it('upserting replaces a legacy Claude Code Haha PATH block instead of stranding it', async () => {
    const legacyBlock = [
      '# >>> Claude Code Haha PATH >>>',
      'export PATH="$HOME/.local/bin:$PATH"',
      '# <<< Claude Code Haha PATH <<<',
      '',
    ].join('\n')
    const updated = upsertManagedPathBlock(legacyBlock, '# >>> Orion Agent PATH >>>\nexport PATH="$HOME/.local/bin:$PATH"\n# <<< Orion Agent PATH <<<\n')
    expect(updated).not.toContain('Claude Code Haha')
    expect(updated.match(/>>> Orion Agent PATH >>>/g)).toHaveLength(1)
  })

  windowsOnly('removes stale pre-rename claude-haha launchers without touching orion ones', async () => {
    const binDir = join(tempHome, '.local', 'bin')
    await mkdir(binDir, { recursive: true })
    const targetPath = join(binDir, 'orion.cmd')
    await writeFile(targetPath, '@echo off\r\n', 'utf8')
    await writeFile(join(binDir, 'orion.exe'), 'unrelated-current-name-exe', 'utf8')
    await writeFile(join(binDir, 'claude-haha.exe'), 'stale-exe', 'utf8')
    await writeFile(join(binDir, 'claude-haha.cmd'), 'stale-cmd', 'utf8')

    await removeLegacyWindowsLaunchers(targetPath)

    expect(await pathExists(join(binDir, 'claude-haha.exe'))).toBe(false)
    expect(await pathExists(join(binDir, 'claude-haha.cmd'))).toBe(false)
    expect(await pathExists(join(binDir, 'orion.exe'))).toBe(true)
    expect(await pathExists(targetPath)).toBe(true)
  })

  unixOnly('removes the stale pre-rename claude-haha wrapper when installing', async () => {
    const sourcePath = join(tempSourceDir, 'claude-sidecar')
    await writeFile(sourcePath, '#!/bin/sh\necho desktop-sidecar\n', 'utf8')
    await chmod(sourcePath, 0o755)
    process.env.CLAUDE_CLI_PATH = sourcePath

    const binDir = join(tempHome, '.local', 'bin')
    await mkdir(binDir, { recursive: true })
    await writeFile(join(binDir, 'claude-haha'), '#!/bin/sh\nold wrapper\n', 'utf8')

    await ensureDesktopCliLauncherInstalled()

    expect(await pathExists(join(binDir, 'claude-haha'))).toBe(false)
    expect(await pathExists(join(binDir, 'orion'))).toBe(true)
  })
})
