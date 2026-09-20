import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const currentDir = dirname(fileURLToPath(import.meta.url))

describe('tauri security config', () => {
  it('enables OS proxy discovery for updater downloads', () => {
    const cargoToml = readFileSync(join(currentDir, 'Cargo.toml'), 'utf8')

    expect(cargoToml).toContain('reqwest = { version = "0.13"')
    expect(cargoToml).toContain('features = ["system-proxy"]')
  })
})
