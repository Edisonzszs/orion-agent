# Orion Agent 品牌化 · 第 4 批：图标与品牌资源 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用正式品牌包（`E:\claude\ORION AGENT\orion_agent_brand_kit\orion_agent_brand_kit`）替换全部图标尺寸与应用内品牌标记：`branding/` 源资产 + 一键生成器（sharp + 手写 ICO/ICNS 容器）+ OrionMark 换真实三模块单色标记 + 侧栏 wordmark 按品牌规则改小写。

**Architecture:** 位图源 = 品牌包的 `app-icon.png`（1254×1254，渐变已预渲染——比 SVG 实时渲染更保真），sharp 统一缩放出全部 PNG；ICO/ICNS 用手写容器内嵌 PNG（不新增依赖，根 package.json 已有 sharp 0.34.5）。应用内 OrionMark 采用品牌包**单色变体的三条路径** + `var(--color-text-primary)` 填充——品牌指南"小尺寸优先单色"，同时保留六主题换肤架构与无 hex 测试。生成器带 `--src/--out` 参数，测试打到临时目录，真实运行替换 `desktop/src-tauri/icons` 等处。

**Tech Stack:** Bun 1.3、TypeScript ESM（2 空格、无分号）、sharp（根依赖）、bun:test（scripts/）、Vitest（desktop/src）。

**Spec:** `docs/superpowers/specs/2026-09-18-orion-agent-rebrand-v1-design.md` §6（本批主体）+ §9 第 4 批行；并入第 2 批 Handoff §7 的 OrionMark `flex-shrink-0` 补回项。

## Global Constraints

- **品牌包事实**（唯一来源，不得改动作画几何）：App Icon = 1024 viewBox 圆角方形炭黑底（#1E1E1E, rx 220）+ 三模块渐变标记；symbol 单色变体 = 同三条路径纯色填充（黑 #171717 / 白 #FFFFFF）；`viewBox="0 0 512 512"`；色板 Charcoal #1E1E1E / Graphite #4A4A4A / Warm Gray #A7A39A / Stone #D9D6D1 / Off White #FAF9F7。
- **品牌规则**（QUICK_USAGE.txt，本批执行两条）：小尺寸优先单色标记（→ OrionMark 用单色路径）；wordmark 全小写 "orion agent"（→ 侧栏 wordmark）。
- **输出清单**（生成器必须完整产出，`desktop/src-tauri/icons/` 下）：`32x32.png`、`64x64.png`、`128x128.png`、`128x128@2x.png`(=256)、`256x256.png`、`512x512.png`、`icon.png`(512)、`Square30x30Logo.png`…`Square310x310Logo.png`（30/44/71/89/107/142/150/284/310 共 9 个，尺寸=文件名数字）、`StoreLogo.png`(50)、`icon.ico`（内嵌 16/24/32/48/64/128/256 七档 PNG）、`icon.icns`（ic11=32、ic12=64、ic07=128、ic08=256、ic13=256、ic09=512、ic14=512、ic10=1024 共 8 条目）；`desktop/public/app-icon.svg`（品牌包 app-icon.svg 原样）与 `app-icon.png`(1024)；`desktop/src/assets/brand/orion-mark.svg`（symbol.svg 原样）；`branding/logo.svg`（symbol.svg 原样）与 `branding/logo-1024.png`(1024)。**删除** `desktop/src-tauri/icons/android/`（Tauri 遗留，不生成替代）。
- **不新增 npm 依赖**（sharp 用根 node_modules）。生成器幂等：重复运行输出逐字节等价（同源同参数）。
- 代码风格：ESM、2 空格、无分号；scripts/ 跑 bun。
- 本机车道通过标准 = 失败集 ⊆ 已知基线（按名）；慢跑 `--timeout 15000`。
- 仓库在 `E:\claude\ORION AGENT\orion-agent`（新路径），`main` 直接提交；Conventional Commit + `Co-Authored-By: Claude Code <noreply@anthropic.com>`。

## 与 spec 的偏差（品牌包到位后的裁定）

1. **位图源用 PNG 而非 SVG 实时渲染**（spec §6 原文"由 sharp 生成"未指明源形态）：1254² 的 `app-icon.png` 渐变已预渲染，避免 librsvg 渲染差异；SVG 原样复制为 `branding/logo.svg` 与 `desktop/public/app-icon.svg`。若未来改图，替换 `branding/` 两源重跑 `bun run branding:icons` 即可（spec 的可重生成承诺不变）。
2. **OrionMark 用单色三模块路径 + token 填充**（spec §4 原文"内联渲染 orion-mark.svg，用 currentColor"）：单色变体即品牌指南推荐的小尺寸形态，且保住六主题 recolor 与无 hex 断言；彩色 symbol.svg 仍作为 `orion-mark.svg` 资产落盘（spec §6 原文）。**取消占位标记的"随尺寸减件"**：真实标记是三条互锁路径构成的整体，减件会显破碎；四个尺寸渲染完整标记。
3. **侧栏 wordmark 改小写**（品牌规则 7）：`Or<span>ion</span>` → `orion <span className="text-[var(--color-brand)]">agent</span>`，Sidebar.test 同步。About 页 h1 的 `PRODUCT.name`（"Orion Agent"，产品名而非 wordmark lockup）不动。
4. **不生成 android/ 替代**（batch-1 spec 已定，此处执行删除）。

## 文件结构

| 文件 | 职责 | 动作 |
|---|---|---|
| `branding/logo.svg` / `branding/logo-1024.png` | 品牌单一源（正式 Logo 到位后只改这里） | 新建（复制/缩放自品牌包） |
| `scripts/branding/generate-icons.ts` | 生成器：sharp 缩放 + ICO/ICNS 容器 + 资产复制 | 新建 |
| `scripts/branding/generate-icons.test.ts` | 临时目录生成 → 清单/尺寸/容器头断言 | 新建 |
| `package.json` | `"branding:icons"` 脚本 | 修改 |
| `desktop/src-tauri/icons/**` | 全部图标（含删 android/） | 生成替换 |
| `desktop/public/app-icon.svg/png` | 公共资产 | 生成替换 |
| `desktop/src/assets/brand/orion-mark.svg` | 资产（组件不读，供他用） | 新建 |
| `desktop/src/components/composite/OrionMark.tsx` + `.test.tsx` | 真实单色标记 | 修改/重写 |
| `desktop/src/components/layout/Sidebar.tsx` + `.test.tsx` | wordmark 小写 | 修改 |
| `docs/superpowers/specs/…-batch4-handoff.md` | Handoff | 新建（Task 4） |

---

### Task 1: 品牌源就位 + 图标生成器 + 测试（TDD，打临时目录）

**Files:**
- Create: `branding/logo.svg`、`branding/logo-1024.png`（自品牌包复制/缩放）
- Create: `scripts/branding/generate-icons.ts`
- Create: `scripts/branding/generate-icons.test.ts`
- Modify: `package.json`（scripts 加 `"branding:icons": "bun run scripts/branding/generate-icons.ts"`）

**Interfaces:**
- Produces: CLI `bun run scripts/branding/generate-icons.ts [--src <brandingDir>] [--out <repoRoot>]`（默认 src=repoRoot/branding、out=repoRoot）；exit 0 且打印产出清单；对 `--out` 目录相对写出 `desktop/src-tauri/icons/*`、`desktop/public/app-icon.{svg,png}`、`desktop/src/assets/brand/orion-mark.svg`。android/ 删除仅在 out 为真实仓库根时执行（`--out` 指向临时目录时跳过——测试环境无该目录）。

- [ ] **Step 1: 品牌包源复制到位**

```bash
cd "E:/claude/ORION AGENT/orion-agent"
mkdir -p branding
cp "E:/claude/ORION AGENT/orion_agent_brand_kit/orion_agent_brand_kit/03_Logos_SVG/orion-agent_symbol.svg" branding/logo.svg
cp "E:/claude/ORION AGENT/orion_agent_brand_kit/orion_agent_brand_kit/04_App_Icon/orion-agent_app-icon.svg" branding/app-icon.svg
cp "E:/claude/ORION AGENT/orion_agent_brand_kit/orion_agent_brand_kit/04_App_Icon/orion-agent_app-icon.png" branding/logo-src.png
```
（`branding/logo-src.png` 为 1254² 位图源；`logo-1024.png` 由生成器从它缩放产出，对齐 spec 命名。）

- [ ] **Step 2: 写失败测试**

`scripts/branding/generate-icons.test.ts`：

```ts
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
      expect(ico.readUInt32LE(entry + 8)).toBe(ico.readUInt32LE(entry + 12)) // bytes == size
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
    const expectedTypes = ['ic07', 'ic08', 'ic09', 'ic10', 'ic11', 'ic12', 'ic13', 'ic14']
    let offset = 8
    for (const type of expectedTypes) {
      expect(icns.subarray(offset, offset + 4).toString('ascii')).toBe(type)
      const length = icns.readUInt32BE(offset + 4)
      expect(length).toBeGreaterThan(8)
      expect(icns.subarray(offset + 8, offset + 12).readUInt32BE(0)).toBe(0x89504e47)
      offset += length
    }
    expect(offset).toBe(icns.length)
  })

  test('copies the vector assets and emits the 1024 raster sources', async () => {
    expect(existsSync(path.join(outRoot, 'desktop', 'public', 'app-icon.svg'))).toBe(true)
    expect(existsSync(path.join(outRoot, 'desktop', 'src', 'assets', 'brand', 'orion-mark.svg'))).toBe(true)
    const meta = await dims(path.join(outRoot, 'desktop', 'public', 'app-icon.png'))
    expect(meta.width).toBe(1024)
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
```

（`beforeAll` 已含在顶部 import 中，无额外步骤。）

- [ ] **Step 3: 运行，确认失败**

```bash
bun test scripts/branding/generate-icons.test.ts --timeout 15000 2>&1 | tail -5
```
预期：FAIL（`generate-icons.ts` 不存在 / execFileSync ENOENT）。

- [ ] **Step 4: 实现生成器**

`scripts/branding/generate-icons.ts`：

```ts
#!/usr/bin/env bun
/**
 * Generates every Orion Agent icon from the branding/ source pair.
 * Sources: branding/logo-src.png (1254x1254 raster, gradients pre-rendered)
 * and branding/logo.svg (vector reference). Rerun after replacing either:
 *   bun run branding:icons
 */
import { copyFileSync, mkdirSync, existsSync, rmSync, readdirSync, statSync } from 'node:fs'
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

  const iconsDir = path.join(out, 'desktop', 'src-tauri', 'icons')
  const publicDir = path.join(out, 'desktop', 'public')
  const markDir = path.join(out, 'desktop', 'src', 'assets', 'brand')
  for (const dir of [iconsDir, publicDir, markDir]) mkdirSync(dir, { recursive: true })

  const written: string[] = []
  for (const [name, size] of SQUARE_PNGS) {
    await sharp(srcPng).resize(size, size, { fit: 'contain' }).png().toFile(path.join(iconsDir, name))
    written.push(`desktop/src-tauri/icons/${name}`)
  }

  const ico = buildIco(
    await Promise.all(ICO_SIZES.map(async (size) => ({ size, data: await png(srcPng, size) }))),
  )
  const { writeFileSync } = await import('node:fs')
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

  await sharp(srcPng).resize(1024, 1024, { fit: 'contain' }).png().toFile(path.join(publicDir, 'app-icon.png'))
  copyFileSync(srcAppSvg, path.join(publicDir, 'app-icon.svg'))
  copyFileSync(srcSvg, path.join(markDir, 'orion-mark.svg'))
  await sharp(srcPng).resize(1024, 1024, { fit: 'contain' }).png().toFile(path.join(src, 'logo-1024.png'))
  written.push('desktop/public/app-icon.png', 'desktop/public/app-icon.svg', 'desktop/src/assets/brand/orion-mark.svg', 'branding/logo-1024.png')

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
```

实现细节：(a) `writeFileSync` 统一放到顶部 import（与 copyFileSync 等一起），不要中途 dynamic import；(b) `readdirSync` 若最终未用到则从 import 中删去。

- [ ] **Step 5: 运行，确认通过**

```bash
bun test scripts/branding/generate-icons.test.ts --timeout 15000 2>&1 | tail -4
```
预期：5 pass。

- [ ] **Step 6: 提交**

```bash
git add branding scripts/branding package.json
git commit -m "feat(branding): add the icon generator and brand sources

Everything derives from branding/logo-src.png and the packaged SVGs via
sharp; ICO and ICNS containers are written by hand so no new dependency
is needed. Tests generate into a temp directory and verify the file
list, raster sizes, container headers, and idempotency.

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 2: 真实生成替换全部图标

**Files:**
- 生成替换：`desktop/src-tauri/icons/*`（17 PNG + ico + icns），删除 `android/`
- 生成替换：`desktop/public/app-icon.png`(1024)、`app-icon.svg`
- 新建：`desktop/src/assets/brand/orion-mark.svg`
- 产出：`branding/logo-1024.png`

**Interfaces:**
- Consumes: Task 1 的生成器。

- [ ] **Step 1: 运行生成器（真实仓库）**

```bash
cd "E:/claude/ORION AGENT/orion-agent" && bun run branding:icons 2>&1 | tail -8
```
预期：产出清单打印；无 android/ 行若已删（首次运行应有 `(deleted)`）。

- [ ] **Step 2: 抽查尺寸与残留**

```bash
git status --short desktop/src-tauri/icons desktop/public desktop/src/assets | head -25
node -e "const s=require('fs').readFileSync('desktop/src-tauri/icons/StoreLogo.png'); console.log('StoreLogo', s.readUInt32BE(16)+'x'+s.readUInt32BE(20))"
ls desktop/src-tauri/icons/android 2>/dev/null || echo "android gone"
```
预期：改动清单 ≈ 20 文件（17 PNG 重写 + ico/icns 二进制变更 + 2 public + 1 新 svg）；StoreLogo 50×50；`android gone`。

- [ ] **Step 3: 提交（含二进制）**

```bash
git add desktop/src-tauri/icons desktop/public desktop/src/assets branding
git commit -m "feat(branding): ship the Orion Agent icon set

All raster sizes, the Windows ICO (7 entries), the macOS ICNS (8
types), and the public app icons now render the official mark; the
Tauri-era Android mipmaps are removed.

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 3: OrionMark 换真实标记 + 侧栏 wordmark 小写

**Files:**
- Modify: `desktop/src/components/composite/OrionMark.tsx`（整体重写内容）
- Modify: `desktop/src/components/composite/OrionMark.test.tsx`（重写断言）
- Modify: `desktop/src/components/layout/Sidebar.tsx:963`（wordmark）
- Test: `desktop/src/components/layout/Sidebar.test.tsx`（wordmark 断言同步）

**Interfaces:**
- Consumes: 品牌包 symbol-black.svg 的三条路径（几何常量，见下方代码）。
- Produces: `OrionMark({size?: 'sm'|'md'|'lg'|'xl', className?})` 接口不变（调用点零改动）。

- [ ] **Step 1: 重写组件测试（先红）**

`OrionMark.test.tsx` 全文替换：

```tsx
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, expect, it } from 'vitest'

import { OrionMark } from './OrionMark'

const SIZES = ['sm', 'md', 'lg', 'xl'] as const

// The official mark: three interlocked modules, rendered as a single
// monochrome unit (the brand guide's preferred form at UI sizes).
const MODULE_COUNT = 3

describe('OrionMark', () => {
  it('is decorative and hidden from assistive tech', () => {
    const { container } = render(<OrionMark />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders all three modules at every size', () => {
    for (const size of SIZES) {
      const { container, unmount } = render(<OrionMark size={size} />)
      expect(container.querySelectorAll('path').length, size).toBe(MODULE_COUNT)
      unmount()
    }
  })

  it('paints from the text token so all six palettes recolor it', () => {
    const { container } = render(<OrionMark size="xl" />)
    const svg = container.firstElementChild!
    const fills = [...svg.querySelectorAll('path')].map((p) => p.getAttribute('fill'))
    expect(fills.every((f) => f === 'var(--color-text-primary)')).toBe(true)
    expect(svg.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('does not shrink inside flex containers', () => {
    const { container } = render(<OrionMark />)
    expect(container.firstElementChild).toHaveClass('flex-shrink-0')
  })
})
```

- [ ] **Step 2: 运行，确认失败**

```bash
cd desktop && bun run test -- --run src/components/composite/OrionMark.test.tsx 2>&1 | tail -5; cd ..
```
预期：FAIL（占位标记是圆环+星，path 数与断言不符；无 flex-shrink-0）。

- [ ] **Step 3: 重写 OrionMark**

`OrionMark.tsx` 全文替换（路径几何逐字取自品牌包 `symbol-black.svg`，fill 改 token）：

```tsx
import { cx } from '@/lib/cx'

/**
 * The Orion Agent mark — three interlocked modules (orchestration,
 * autonomy, coordination) from the official brand kit, rendered as a
 * single monochrome unit: the brand guide's preferred form at UI sizes.
 * Geometry is the kit's symbol-black variant with fills re-bound to the
 * text token so each of the six palettes repaints it.
 */
export type OrionMarkSize = 'sm' | 'md' | 'lg' | 'xl'

export type OrionMarkProps = {
  size?: OrionMarkSize
  className?: string
}

const SIZES: Record<OrionMarkSize, { box: string }> = {
  sm: { box: 'h-6 w-6' },
  md: { box: 'h-8 w-8' },
  lg: { box: 'h-[38px] w-[38px]' },
  xl: { box: 'h-20 w-20' },
}

// Paths copied verbatim from orion-agent_symbol-black.svg (viewBox 0 0 512 512).
const MODULE_PATHS = [
  'M92 170 Q92 138 119 122 L178 88 Q198 76 219 88 L268 116 L214 148 L177 127 Q168 122 159 127 L132 143 Q123 149 123 160 L123 247 Q123 258 133 264 L163 281 L163 325 L119 300 Q92 284 92 252 Z',
  'M206 71 Q222 43 254 43 Q268 43 281 50 L393 115 Q421 131 421 163 L421 260 Q421 285 399 298 L374 313 Q357 323 341 313 Q326 304 326 285 L326 195 Q326 182 314 175 L238 131 Q226 124 214 131 L177 152 L157 117 Z',
  'M236 210 Q249 187 276 187 Q289 187 301 194 L326 208 L326 252 L300 237 Q289 231 279 237 L263 246 Q252 252 252 265 L252 300 Q252 313 263 319 L360 375 Q388 391 388 423 Q388 438 380 451 Q364 478 332 478 Q318 478 305 471 L210 416 Q182 400 182 368 L182 284 Q182 259 204 246 Z',
]

export function OrionMark({ size = 'md', className }: OrionMarkProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 512 512"
      className={cx('flex-shrink-0', SIZES[size].box, className)}
      role="presentation"
    >
      {MODULE_PATHS.map((d) => (
        <path key={d.slice(0, 24)} d={d} fill="var(--color-text-primary)" />
      ))}
    </svg>
  )
}
```

- [ ] **Step 4: 运行，确认通过**

同 Step 2 命令。预期：4 pass。

- [ ] **Step 5: 侧栏 wordmark 小写 + 测试同步**

`Sidebar.tsx:963`：`Or<span className="text-[var(--color-brand)]">haha…` 现为 `Or<span …>ion</span>`，替换为：
```tsx
orion <span className="text-[var(--color-brand)]">agent</span>
```
（保持外围元素与 className 不动；文字节点整体小写。）
`Sidebar.test.tsx` 中对 wordmark 的断言（grep `Orion`/`'ion'` 定位，batch 2 引入的 `Or`+`ion` 结构断言）：改为对 `orion` 与 `agent` 的断言。

```bash
cd desktop && bun run test -- --run src/components/layout/Sidebar.test.tsx src/components/composite 2>&1 | tail -5; cd ..
```
预期：全绿。

- [ ] **Step 6: 提交**

```bash
git add desktop/src/components
git commit -m "feat(brand): render the official mark in-app

OrionMark now inlines the kit's three-module monochrome geometry bound
to the text token (the guide's preferred small-size form) and stops
shedding parts; the sidebar wordmark follows the lowercase rule as
'orion agent'.

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 4: 整批验证 + Handoff

**Files:**
- Create: `docs/superpowers/specs/2026-09-18-orion-agent-rebrand-v1-batch4-handoff.md`

- [ ] **Step 1: 车道与聚焦**

```bash
bun test scripts/branding/generate-icons.test.ts --timeout 15000 2>&1 | tail -3
bun run check:policy 2>&1 | tail -6
cd desktop && bun run test -- --run src/components/composite/OrionMark.test.tsx src/components/layout/Sidebar.test.tsx 2>&1 | tail -4; cd ..
bun run check:desktop 2>&1 | tail -8
```
预期：生成器 5 pass；policy 失败集 ⊆ 已知 11（scripts/ 新增测试进 policy lane）；聚焦全绿；check:desktop 的 lint/tsc/build 全过、vitest 失败集 ⊆ 已知 renderer 基线。

- [ ] **Step 2: 视觉抽查（自动化部分）**

```bash
node -e "
const sharp = require('sharp');
(async () => {
  for (const f of ['desktop/src-tauri/icons/icon.png','desktop/public/app-icon.png','desktop/src-tauri/icons/512x512.png']) {
    const m = await sharp(f).metadata();
    console.log(f, m.width + 'x' + m.height, m.format);
  }
})()"
```
预期：icon.png 512 png、app-icon.png 1024 png、512x512 512 png。人工目检项（写进 Handoff 供用户执行）：`cd desktop && bun run electron:dev` 看任务栏图标、About/空会话页标记、侧栏 wordmark。

- [ ] **Step 3: Handoff 并提交**

按 AGENTS.md Handoff 格式写 `docs/superpowers/specs/2026-09-18-orion-agent-rebrand-v1-batch4-handoff.md`（改动文件、测试、命令与结果、残留、剩余风险——含"正式 Logo 已落位，占位说明全部作废"与人工目检清单）。
```bash
git add docs/superpowers/specs/2026-09-18-orion-agent-rebrand-v1-batch4-handoff.md
git commit -m "docs: batch 4 handoff report

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```
