import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, existsSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'

const repoRoot = path.resolve(import.meta.dir, '..', '..')
const script = path.join(repoRoot, 'scripts', 'branding', 'generate-icons.ts')
const srcDir = path.join(repoRoot, 'branding')

let outRoot: string

async function dims(file: string): Promise<{ width?: number; height?: number }> {
  return sharp(file).metadata()
}

beforeAll(() => {
  outRoot = mkdtempSync(path.join(tmpdir(), 'orion-icons-'))
  execFileSync(process.execPath, [script, '--src', srcDir, '--out', outRoot], {
    cwd: repoRoot,
    stdio: 'pipe',
  })
})

afterAll(() => {
  // temp artifacts cleaned by the OS; nothing to restore
})
const ICONS = (name: string) => path.join(outRoot, 'desktop', 'src-tauri', 'icons', name)

describe('branding icon generator', () => {
  test('produces every raster icon at its declared size', async () => {
    const squares: Array<[string, number]> = [
      ['32x32.png', 32], ['64x64.png', 64], ['128x128.png', 128],
      ['128x128@2x.png', 256], ['256x256.png', 256], ['512x512.png', 512],
      ['icon.png', 512],
      ['Square30x30Logo.png', 30], ['Square44x44Logo.png', 44],
      ['Square71x71Logo.png', 71], ['Square89x89Logo.png', 89],
      ['Square107x107Logo.png', 107], ['Square142x142Logo.png', 142],
      ['Square150x150Logo.png', 150], ['Square284x284Logo.png', 284],
      ['Square310x310Logo.png', 310], ['StoreLogo.png', 50],
    ]
    for (const [name, size] of squares) {
      const file = ICONS(name)
      expect(existsSync(file), name).toBe(true)
      const meta = await dims(file)
      expect(meta.width, name).toBe(size)
      expect(meta.height, name).toBe(size)
    }
  })

  test('embeds seven PNG entries in the ICO container', () => {
    const ico = readFileSync(ICONS('icon.ico'))
    expect(ico.readUInt16LE(0)).toBe(0)      // reserved
    expect(ico.readUInt16LE(2)).toBe(1)      // type: icon
    expect(ico.readUInt16LE(4)).toBe(7)      // entry count
    const sizes = [16, 24, 32, 48, 64, 128, 256]
    let offset = 6 + 16 * 7
    for (let i = 0; i < 7; i++) {
      const entry = 6 + 16 * i
      const declared = ico.readUInt8(entry) === 0 ? 256 : ico.readUInt8(entry)
      expect(declared).toBe(sizes[i])
      expect(ico.readUInt32LE(entry + 12)).toBe(offset) // imageOffset tiles right after the previous blob
      const blob = ico.subarray(ico.readUInt32LE(entry + 12), ico.readUInt32LE(entry + 12) + ico.readUInt32LE(entry + 8))
      expect(blob.readUInt32BE(0)).toBe(0x89504e47) // PNG magic
      offset += ico.readUInt32LE(entry + 8)
    }
    expect(offset).toBe(ico.length)          // entries tile the file exactly
  })

  test('builds the ICNS container with the eight declared types', () => {
    const icns = readFileSync(ICONS('icon.icns'))
    expect(icns.subarray(0, 4).toString('ascii')).toBe('icns')
    expect(icns.readUInt32BE(4)).toBe(icns.length)
    const types: string[] = []
    let offset = 8
    while (offset < icns.length) {
      const type = icns.subarray(offset, offset + 4).toString('ascii')
      const length = icns.readUInt32BE(offset + 4)
      expect(length).toBeGreaterThan(8)
      expect(icns.subarray(offset + 8, offset + 12).readUInt32BE(0)).toBe(0x89504e47)
      types.push(type)
      offset += length
    }
    expect(offset).toBe(icns.length)
    expect([...types].sort()).toEqual(
      ['ic07', 'ic08', 'ic09', 'ic10', 'ic11', 'ic12', 'ic13', 'ic14'],
    )
  })

  test('copies the vector assets and emits the 1024 raster sources', async () => {
    expect(existsSync(path.join(outRoot, 'desktop', 'public', 'app-icon.svg'))).toBe(true)
    expect(existsSync(path.join(outRoot, 'desktop', 'src', 'assets', 'brand', 'orion-mark.svg'))).toBe(true)
    const meta = await dims(path.join(outRoot, 'desktop', 'public', 'app-icon.png'))
    expect(meta.width).toBe(1024)
    const srcTauri = await dims(path.join(outRoot, 'desktop', 'src-tauri', 'app-icon.png'))
    expect(srcTauri.width).toBe(1024)
    const logo = await dims(path.join(srcDir, 'logo-1024.png'))
    expect(logo.width).toBe(1024)
  })

  test('is idempotent: a second run yields byte-identical outputs', () => {
    const first = readFileSync(ICONS('icon.ico'))
    execFileSync(process.execPath, [script, '--src', srcDir, '--out', outRoot], { cwd: repoRoot, stdio: 'pipe' })
    expect(readFileSync(ICONS('icon.ico')).equals(first)).toBe(true)
    expect(statSync(ICONS('icon.png')).isFile()).toBe(true)
  })
})
