#!/usr/bin/env bun
/**
 * Generates every Orion Agent icon from the branding/ source pair.
 * Sources: branding/logo-src.png (1254x1254 raster, gradients pre-rendered)
 * and branding/logo.svg (vector reference). Rerun after replacing either:
 *   bun run branding:icons
 */
import { copyFileSync, mkdirSync, existsSync, rmSync, writeFileSync, statSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

function parseArgs(argv: string[]): { src: string; out: string } {
  const repoRoot = path.resolve(import.meta.dir, '..', '..')
  const opts = { src: path.join(repoRoot, 'branding'), out: repoRoot }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--src') opts.src = path.resolve(argv[++i])
    else if (argv[i] === '--out') opts.out = path.resolve(argv[++i])
  }
  return opts
}

const SQUARE_PNGS: Array<[string, number]> = [
  ['32x32.png', 32], ['64x64.png', 64], ['128x128.png', 128],
  ['128x128@2x.png', 256], ['256x256.png', 256], ['512x512.png', 512],
  ['icon.png', 512],
  ['Square30x30Logo.png', 30], ['Square44x44Logo.png', 44],
  ['Square71x71Logo.png', 71], ['Square89x89Logo.png', 89],
  ['Square107x107Logo.png', 107], ['Square142x142Logo.png', 142],
  ['Square150x150Logo.png', 150], ['Square284x284Logo.png', 284],
  ['Square310x310Logo.png', 310], ['StoreLogo.png', 50],
]

const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]
const ICNS_ENTRIES: Array<[string, number]> = [
  ['ic11', 32], ['ic12', 64], ['ic07', 128], ['ic08', 256],
  ['ic13', 256], ['ic09', 512], ['ic14', 512], ['ic10', 1024],
]

async function png(src: string, size: number): Promise<Buffer> {
  return sharp(src).resize(size, size, { fit: 'contain' }).png().toBuffer()
}

function buildIco(entries: Array<{ size: number; data: Buffer }>): Buffer {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(entries.length, 4)
  const dir = Buffer.alloc(16 * entries.length)
  let offset = 6 + 16 * entries.length
  entries.forEach((entry, i) => {
    const base = 16 * i
    dir.writeUInt8(entry.size === 256 ? 0 : entry.size, base)
    dir.writeUInt8(entry.size === 256 ? 0 : entry.size, base + 1)
    dir.writeUInt8(0, base + 2)
    dir.writeUInt8(0, base + 3)
    dir.writeUInt16LE(1, base + 4)
    dir.writeUInt16LE(32, base + 6)
    dir.writeUInt32LE(entry.data.length, base + 8)
    dir.writeUInt32LE(offset, base + 12)
    offset += entry.data.length
  })
  return Buffer.concat([header, dir, ...entries.map((e) => e.data)])
}

function buildIcns(entries: Array<[string, Buffer]>): Buffer {
  const chunks: Buffer[] = []
  let total = 8
  for (const [type, data] of entries) {
    const head = Buffer.alloc(8)
    head.write(type, 0, 'ascii')
    head.writeUInt32BE(8 + data.length, 4)
    chunks.push(head, data)
    total += 8 + data.length
  }
  const header = Buffer.alloc(8)
  header.write('icns', 0, 'ascii')
  header.writeUInt32BE(total, 4)
  return Buffer.concat([header, ...chunks])
}

async function main() {
  const { src, out } = parseArgs(process.argv.slice(2))
  const srcPng = path.join(src, 'logo-src.png')
  const srcSvg = path.join(src, 'logo.svg')
  const srcAppSvg = path.join(src, 'app-icon.svg')
  for (const file of [srcPng, srcSvg, srcAppSvg]) {
    if (!existsSync(file)) throw new Error(`missing branding source: ${file}`)
  }

  const srcTauriDir = path.join(out, 'desktop', 'src-tauri')
  const iconsDir = path.join(srcTauriDir, 'icons')
  const publicDir = path.join(out, 'desktop', 'public')
  const markDir = path.join(out, 'desktop', 'src', 'assets', 'brand')
  for (const dir of [srcTauriDir, iconsDir, publicDir, markDir]) mkdirSync(dir, { recursive: true })

  const written: string[] = []
  for (const [name, size] of SQUARE_PNGS) {
    await sharp(srcPng).resize(size, size, { fit: 'contain' }).png().toFile(path.join(iconsDir, name))
    written.push(`desktop/src-tauri/icons/${name}`)
  }

  const ico = buildIco(
    await Promise.all(ICO_SIZES.map(async (size) => ({ size, data: await png(srcPng, size) }))),
  )
  writeFileSync(path.join(iconsDir, 'icon.ico'), ico)
  written.push('desktop/src-tauri/icons/icon.ico')

  const icnsCache = new Map<number, Buffer>()
  const icnsPng = async (size: number) => {
    if (!icnsCache.has(size)) icnsCache.set(size, await png(srcPng, size))
    return icnsCache.get(size)!
  }
  const icns = buildIcns(
    await Promise.all(ICNS_ENTRIES.map(async ([type, size]) => [type, await icnsPng(size)] as [string, Buffer])),
  )
  writeFileSync(path.join(iconsDir, 'icon.icns'), icns)
  written.push('desktop/src-tauri/icons/icon.icns')

  // One buffer feeds both copies so the canonical source pair can never drift
  // (desktop/icon-assets.test.ts pins them byte-identical).
  const appIconPng = await sharp(srcPng).resize(1024, 1024, { fit: 'contain' }).png().toBuffer()
  writeFileSync(path.join(publicDir, 'app-icon.png'), appIconPng)
  writeFileSync(path.join(srcTauriDir, 'app-icon.png'), appIconPng)
  copyFileSync(srcAppSvg, path.join(publicDir, 'app-icon.svg'))
  copyFileSync(srcSvg, path.join(markDir, 'orion-mark.svg'))
  await sharp(srcPng).resize(1024, 1024, { fit: 'contain' }).png().toFile(path.join(src, 'logo-1024.png'))
  written.push('desktop/public/app-icon.png', 'desktop/src-tauri/app-icon.png', 'desktop/public/app-icon.svg', 'desktop/src/assets/brand/orion-mark.svg', 'branding/logo-1024.png')

  // The Tauri-era Android mipmaps are dead weight in the Electron build.
  const androidDir = path.join(iconsDir, 'android')
  const isRepoRoot = path.resolve(out) === path.resolve(import.meta.dir, '..', '..')
  if (isRepoRoot && existsSync(androidDir) && statSync(androidDir).isDirectory()) {
    rmSync(androidDir, { recursive: true, force: true })
    written.push('desktop/src-tauri/icons/android/ (deleted)')
  }

  console.log(`[branding] generated ${written.length} outputs under ${path.resolve(out)}`)
  for (const line of written) console.log(`  ${line}`)
}

await main()
