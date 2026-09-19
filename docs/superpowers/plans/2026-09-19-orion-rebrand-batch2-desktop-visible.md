# Orion Agent 品牌化 · 第 2 批：桌面用户可见层 + 打包/更新源 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用户在桌面端看到的一切都变成 Orion Agent：打包身份（productName/appId/安装包名/更新源）、语言包品牌字串、About/侧边栏/市场/IM 链接、通知标题、品牌标记组件（OrionMark 占位），并补上 desktop/package.json 与 product.json 的一致性断言。

**Architecture:** `product.json`（第 1 批建立的单一来源）现在被真正消费：electron-builder 静态字段直接改值并由 `scripts/pr/product-identity.test.ts` 断言一致；渲染层经 `desktop/src/lib/product.ts`、Electron host 经 `appIdentity.ts` 读取。`BrandSeal`（cc-haha 手绘矢量标）整体替换为 `OrionMark`（占位几何标记，同样的 size 接口与 token 上色），全部 6 个调用点换 import。

**Tech Stack:** Bun 1.3、TypeScript ESM（2 空格、无分号）、bun:test（scripts/、desktop/electron）、Vitest（desktop/src）、electron-builder 配置（JSON）。

**Spec:** `docs/superpowers/specs/2026-09-18-orion-agent-rebrand-v1-design.md` §4（本批主体）、§9 第 2 批行；并入 `docs/superpowers/specs/2026-09-18-orion-agent-rebrand-v1-batch1-handoff.md` §7 清单中属本批的项（package.json 断言、renderer twin cross-check、traceHintOn、doctor ids）。

## Global Constraints

- **逐字值**（来自 product.json）：productName `Orion Agent`；appId `com.orion-agent.desktop`；artifactName `Orion-Agent-${version}-${os}-${arch}.${ext}`；publish `github / Edisonzszs / orion-agent`；homepage `https://github.com/Edisonzszs/orion-agent`；author `Edisonzszs <Edisonzszs@users.noreply.github.com>`（linux.maintainer 同）；desktop/package.json `name` = `orion-agent-desktop`、`version` = `0.1.0`、`description` = `Desktop coding agent workbench for Orion Agent.`。
- **userData 目录后果已知并接受**：productName 改变使 Electron userData 从 `Claude Code Haha` 变为 `Orion Agent`，窗口状态/便携模式配置重置，不做迁移（spec §4 明文）。
- **本批不动**（内部标识层，后续批次）：localStorage key（`cc-haha-*`、`cc-haha.*`，含 locale 键 `settings.diagnostics.doctorSafeKeys` 的字串值——它列举的就是这些 key）、`CC_HAHA_*` 环境变量名、Electron partition、`settings.terminal.description`（claude-haha 命令提及，随第 3 批二进制改名一起换，见偏差 1）、`scripts/perf` 哈希命名空间、macOS helper 二进制名（`cc-haha-computer-use.app`）、`MarketDisclaimer` 的 STORAGE_KEY。
- 代码风格：TypeScript ESM、2 空格、无分号；`desktop/electron` 本地导入无扩展名，`src/` 相对导入带 `.js`。
- 测试不读写真实 `~/.claude`；本机车道通过标准 = **失败集 ⊆ 已知基线（按名比较）**（check:policy 324/11；renderer vitest 5853/17；electron 566/1skip/9fail；慢跑加 `--timeout 15000`）。
- 仓库在 `main` 直接提交（无 remote，既定工作法）；Conventional Commit + `Co-Authored-By: Claude Code <noreply@anthropic.com>`。
- 工作目录：`E:\claude\ORION AGENT\cc-haha-main\cc-haha-main`（第 3 批才迁目录）。

## 与 spec 的偏差（调研后裁定）

1. **命令名字串移到第 3 批**：spec §4 把语言包 `settings.terminal.description` 的 `claude-haha` 命令提及列入本批，但二进制 `bin/orion` 在第 3 批才改名——先改文案会出现"UI 教用户敲一个还不存在的命令"的窗口期。移至第 3 批与二进制改名同步。（`conversationService` 错误提示里的 `./bin/claude-haha` 同理，本就在 §5。）
2. **OrionMark 用内联 JSX 路径**而非读取 svg 文件：BrandSeal 的架构就是内联路径 + CSS token 上色（六套主题 recolor 的关键），`?raw`+innerHTML 会丢掉这一能力。第 4 批的 branding 生成器仍会产出 `orion-mark.svg` 资产文件。
3. **删除 SOCIAL_LINKS**（About 页 B 站/抖音/小红书，上游作者个人账号）：spec 的去品牌化意图；locale 键 `settings.about.socialMedia` 保留为未使用（无害）。作者行显示名 `程序员阿江-Relakkes` → `Edisonzszs`，AUTHOR_GITHUB → `https://github.com/Edisonzszs`。
4. **IM 文档链接** `https://cchaha.ai/im/` → `${PRODUCT.docsUrl}/en/im/`（仓库内英文 IM 文档；cchaha.ai 在第 5 批文档批全面退场）。

## 文件结构

| 文件 | 职责 | 动作 |
|---|---|---|
| `desktop/package.json` | electron-builder 身份 + 更新源 | 修改 |
| `scripts/pr/product-identity.test.ts` | +desktop/package.json 一致性断言 | 修改 |
| `scripts/pr/release-workflow.test.ts` | publish 断言跟新值 | 修改 |
| `desktop/electron/services/appIdentity.ts` | `WINDOWS_APP_USER_MODEL_ID` ← `PRODUCT.appId` | 修改 |
| `desktop/src/components/composite/OrionMark.tsx` | 品牌标记（占位几何，token 上色） | 新建 |
| `desktop/src/components/composite/OrionMark.test.tsx` | 标记的行为测试 | 新建 |
| `desktop/src/components/composite/BrandSeal.tsx` + `.test.tsx` | 旧标记 | 删除 |
| 6 个 BrandSeal 调用点（About/Active/Empty/H5Connection/Sidebar/ComponentGallery） | import 换 OrionMark | 修改 |
| `desktop/src/i18n/locales/{en,zh,zh-TW,jp,kr}.ts` | 5 个键的品牌字串 | 修改 |
| `desktop/src/stores/chatStore.ts` | 3 处通知标题 | 修改 |
| `desktop/index.html` | `<title>` | 修改 |
| `desktop/src/pages/settings/AboutSettings.tsx` | 标题/仓库/作者/社交块 | 修改 |
| `desktop/src/components/layout/Sidebar.tsx:989` | 仓库链接 ← PRODUCT.homepage | 修改 |
| `desktop/src/pages/AdapterSettings.tsx` | IM 文档链接 | 修改 |
| `desktop/src/pages/ActivitySettings.tsx` | 默认 subtitle ← PRODUCT 派生 | 修改 |
| `desktop/src/lib/product.test.ts` | renderer twin cross-check | 新建 |
| `desktop/electron/services/{menu,notificationSmoke}.ts` | 回退名/标题 ← PRODUCT_NAME | 修改 |
| `src/server/services/desktopUiPreferencesService.ts:23` | DEFAULT_PROFILE_SUBTITLE ← PRODUCT 派生 | 修改 |
| `src/server/services/doctorService.ts` | 目标 id 改名 | 修改 |
| 相关测试（desktop-ui-preferences / doctor-service / diagnosticsSettings / ActivitySettings） | 断言同步 | 修改 |

---

### Task 1: desktop/package.json 身份 + 更新源 + 一致性断言

**Files:**
- Modify: `desktop/package.json`（name/version/description/homepage/author/build.productName/build.appId/build.artifactName/build.publish/linux.maintainer）
- Modify: `scripts/pr/product-identity.test.ts`（追加一个 describe）
- Modify: `scripts/pr/release-workflow.test.ts:655-665`（publish 断言）
- Modify: `desktop/electron/services/appIdentity.ts`（AUMID ← PRODUCT.appId）
- Test: 上述三个测试文件

**Interfaces:**
- Consumes: `PRODUCT`（`desktop/electron/services/appIdentity.ts` 已导出，来自 Task 4 of batch 1）；product.json 值见 Global Constraints。
- Produces: desktop/package.json 的新身份（后续所有打包/更新行为依赖）；`WINDOWS_APP_USER_MODEL_ID === 'com.orion-agent.desktop'`（appIdentity.test 的同步测试继续通过，因为两边同改）。

- [ ] **Step 1: 先写失败的一致性断言**

在 `scripts/pr/product-identity.test.ts` 末尾追加（import 区补 `readFileSync` 已有；再读一份 desktop/package.json）：

```ts
describe('desktop/package.json stays in sync with product.json', () => {
  const desktop = readJson<{
    name: string
    version: string
    description: string
    homepage: string
    author: { name: string; email?: string }
    build: {
      productName?: string
      appId?: string
      artifactName?: string
      publish?: Array<{ provider: string; owner: string; repo: string }>
      linux?: { maintainer?: string }
    }
  }>('desktop/package.json')

  test('identity fields mirror product.json', () => {
    expect(desktop.build.productName).toBe(product.name)
    expect(desktop.build.appId).toBe(product.appId)
    expect(desktop.build.artifactName).toBe(`${product.artifactPrefix}-\${version}-\${os}-\${arch}.\${ext}`)
    expect(desktop.build.publish).toEqual([
      { provider: 'github', owner: product.github.owner, repo: product.github.repo },
    ])
    expect(desktop.homepage).toBe(product.homepage)
    expect(desktop.author.name).toBe(product.github.owner)
    expect(desktop.build.linux?.maintainer).toBe(`${product.github.owner} <${product.github.owner}@users.noreply.github.com>`)
    expect(desktop.name).toBe('orion-agent-desktop')
    expect(desktop.version).toBe('0.1.0')
    expect(desktop.description).toBe('Desktop coding agent workbench for Orion Agent.')
  })
})
```

注意：`desktop/package.json` 的读取路径是仓库根的 `desktop/package.json`（脚本 cwd 为根）。

- [ ] **Step 2: 运行，确认失败**

```bash
bun test ./scripts/pr/product-identity.test.ts 2>&1 | tail -5
```
预期：新 describe FAIL（`Expected: "Orion Agent" Received: "Claude Code Haha"` 等），原有 3 个用例仍 pass。

- [ ] **Step 3: 改 desktop/package.json**

逐字改这 10 处（其余字段一律不动）：
- `"name": "orion-agent-desktop"`
- `"version": "0.1.0"`
- `"description": "Desktop coding agent workbench for Orion Agent."`
- `"homepage": "https://github.com/Edisonzszs/orion-agent"`
- `"author": { "name": "Edisonzszs", "email": "Edisonzszs@users.noreply.github.com" }`（保持现有 JSON 结构，只换两个值）
- `build.productName`: `"Orion Agent"`
- `build.appId`: `"com.orion-agent.desktop"`
- `build.artifactName`: `"Orion-Agent-${version}-${os}-${arch}.${ext}"`
- `build.publish`: `[ { "provider": "github", "owner": "Edisonzszs", "repo": "orion-agent" } ]`
- `build.linux.maintainer`: `"Edisonzszs <Edisonzszs@users.noreply.github.com>"`

同步改 `scripts/pr/release-workflow.test.ts` 中 `expect(desktopPackage.build.publish).toEqual([...])` 的期望为：
```ts
      {
        provider: 'github',
        owner: 'Edisonzszs',
        repo: 'orion-agent',
      },
```

再改 `desktop/electron/services/appIdentity.ts`：
```ts
import product from '../../../product.json'
// ...
// The Windows AppUserModelID must equal build.appId in desktop/package.json;
// scripts/pr/product-identity.test.ts asserts that sync at the repo root.
export const WINDOWS_APP_USER_MODEL_ID = product.appId
```
（替换原来的字面量 `'com.claude-code-haha.desktop'` 与其同步注释；PRODUCT_NAME/PRODUCT_DATA_DIR_NAME 导出保持不变。）

- [ ] **Step 4: 运行，确认通过**

```bash
bun test ./scripts/pr/product-identity.test.ts ./scripts/pr/release-workflow.test.ts 2>&1 | tail -4
cd desktop && bun test ./electron/services/appIdentity.test.ts 2>&1 | tail -4; cd ..
```
预期：全部 pass（appIdentity 的 AUMID↔package.json 同步测试两边同改，保持绿）。

- [ ] **Step 5: 跑 policy lane（按名比对失败集）**

```bash
bun run check:policy 2>&1 | tail -6
```
预期：324 pass / 11 fail，失败名与已知 11 个一致。

- [ ] **Step 6: 提交**

```bash
git add desktop/package.json scripts/pr/product-identity.test.ts scripts/pr/release-workflow.test.ts desktop/electron/services/appIdentity.ts
git commit -m "feat(identity): adopt the Orion Agent packaging identity

productName/appId/artifactName/publish/homepage/author now describe
Orion Agent and are asserted against product.json; the auto-update
source points at Edisonzszs/orion-agent.

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 2: OrionMark 占位组件替换 BrandSeal

**Files:**
- Create: `desktop/src/components/composite/OrionMark.tsx`
- Create: `desktop/src/components/composite/OrionMark.test.tsx`
- Delete: `desktop/src/components/composite/BrandSeal.tsx`、`BrandSeal.test.tsx`
- Modify（import 换名）: `desktop/src/pages/settings/AboutSettings.tsx:13`、`desktop/src/pages/ActiveSession.tsx:28`、`desktop/src/pages/EmptySession.tsx:3`、`desktop/src/components/layout/H5ConnectionView.tsx:7`、`desktop/src/components/layout/Sidebar.tsx`、`desktop/src/dev/ComponentGallery.tsx:26,641-646`
- Test: `OrionMark.test.tsx`

**Interfaces:**
- Produces（与 BrandSeal 完全同形，调用点零改动除 import）:
  ```ts
  export type OrionMarkSize = 'sm' | 'md' | 'lg' | 'xl'
  export type OrionMarkProps = { size?: OrionMarkSize; className?: string }
  export function OrionMark({ size = 'md', className }: OrionMarkProps): JSX.Element
  ```

- [ ] **Step 1: 先写组件测试（新文件即 RED）**

`desktop/src/components/composite/OrionMark.test.tsx`：

```tsx
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, expect, it } from 'vitest'

import { OrionMark } from './OrionMark'

const SIZES = ['sm', 'md', 'lg', 'xl'] as const

describe('OrionMark', () => {
  it('is decorative and hidden from assistive tech', () => {
    const { container } = render(<OrionMark />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders at every size with the ring intact', () => {
    for (const size of SIZES) {
      const { container, unmount } = render(<OrionMark size={size} />)
      const ring = container.querySelector('circle[stroke="var(--color-text-primary)"]')
      expect(ring).not.toBeNull()
      unmount()
    }
  })

  it('paints from tokens so all six palettes recolor it', () => {
    const { container } = render(<OrionMark size="xl" />)
    const svg = container.firstElementChild!
    expect(svg.querySelector('[stroke="var(--color-text-primary)"]')).not.toBeNull()
    expect(svg.querySelector('[fill="var(--color-brand)"]')).not.toBeNull()
    expect(svg.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('sheds the stars as it shrinks instead of turning to mush', () => {
    const starCount = (size: (typeof SIZES)[number]) => {
      const { container, unmount } = render(<OrionMark size={size} />)
      const filled = container.querySelectorAll('path[fill="var(--color-brand)"]').length
      unmount()
      return filled
    }
    expect(starCount('xl')).toBe(3) // Orion belt: three stars
    expect(starCount('lg')).toBe(0)
    expect(starCount('md')).toBe(0)
    expect(starCount('sm')).toBe(0) // ring only
  })
})
```

- [ ] **Step 2: 运行，确认失败**

```bash
cd desktop && bun run test -- --run src/components/composite/OrionMark.test.tsx 2>&1 | tail -5; cd ..
```
预期：FAIL（`Cannot find module './OrionMark'`）。

- [ ] **Step 3: 实现 OrionMark（占位几何：圆环 + 三星带）**

```tsx
import { cx } from '@/lib/cx'

/**
 * The Orion Agent mark — a ring (the "O") with Orion's three-star belt.
 *
 * Placeholder geometry until the official logo lands (branding/ in batch 4
 * regenerates all icon sizes from one source). Two rules carried over from
 * the mark it replaced:
 *
 * 1. Recolor. Every stroke takes `var(--color-text-primary)` and the stars
 *    take `var(--color-brand)`, so each of the six palettes repaints it.
 * 2. Shrink. Below ~38px a star is under 2px across and reads as dirt, so
 *    the stars only render at `xl`; the ring survives every size.
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

// A four-pointed star centered at (cx, cy) with radius r.
function star(cx: number, cy: number, r: number, key: string) {
  const inner = r * 0.28
  return (
    <path
      key={key}
      fill="var(--color-brand)"
      d={`M ${cx} ${cy - r} L ${cx + inner} ${cy - inner} L ${cx + r} ${cy} L ${cx + inner} ${cy + inner} L ${cx} ${cy + r} L ${cx - inner} ${cy + inner} L ${cx - r} ${cy} L ${cx - inner} ${cy - inner} Z`}
    />
  )
}

export function OrionMark({ size = 'md', className }: OrionMarkProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="96 96 832 832"
      className={cx(SIZES[size].box, className)}
      role="presentation"
    >
      <circle
        cx="512"
        cy="512"
        r="322"
        fill="none"
        stroke="var(--color-text-primary)"
        strokeWidth="96"
      />
      {size === 'xl' && (
        <>
          {star(512, 430, 44, 'belt-nw')}
          {star(586, 512, 36, 'belt-e')}
          {star(470, 596, 40, 'belt-sw')}
        </>
      )}
    </svg>
  )
}
```

（若 `@/lib/cx` 的 import 风格与 BrandSeal 原文件不一致，以 BrandSeal.tsx 第 1 行的原样为准——它就是 `import { cx } from '@/lib/cx'`。）

- [ ] **Step 4: 运行，确认通过**

```bash
cd desktop && bun run test -- --run src/components/composite/OrionMark.test.tsx 2>&1 | tail -4; cd ..
```
预期：4 pass。

- [ ] **Step 5: 替换 6 个调用点并删除 BrandSeal**

每个文件把 `import { BrandSeal } from '…/composite/BrandSeal'` 改为 `import { OrionMark } from '…/composite/OrionMark'`（保持各自的路径风格：`@/components/…` 或相对路径），`<BrandSeal …>` → `<OrionMark …>`（props 同形，仅换标签名）。具体行：
- `AboutSettings.tsx:13` 与 `:157`
- `ActiveSession.tsx:28` 与 `:814`
- `EmptySession.tsx:3` 与 `:675`
- `H5ConnectionView.tsx:7` 与 `:57`
- `Sidebar.tsx`（`:954` 一处）
- `ComponentGallery.tsx:26`、`:641-646`（Section 标题 `BrandSeal` → `OrionMark`，note 文案改为 `The Orion Agent placeholder mark — a ring with Orion's belt. Stars only render at xl.`）

然后：

```bash
git rm desktop/src/components/composite/BrandSeal.tsx desktop/src/components/composite/BrandSeal.test.tsx
grep -rn "BrandSeal" desktop/src || echo "no leftovers"
```
预期：`no leftovers`。

- [ ] **Step 6: 聚焦测试 + desktop lane**

```bash
cd desktop && bun run test -- --run src/components/composite src/pages/EmptySession.test.tsx src/pages/ActiveSession.test.tsx 2>&1 | tail -6; cd ..
bun run check:desktop 2>&1 | tail -6
```
预期：聚焦测试全绿；lane 结果的失败集 ⊆ 已知 17 个 renderer 失败（按名比对；`check:desktop` 里的 lint/tsc/build 部分必须全过）。

- [ ] **Step 7: 提交**

```bash
git add -A desktop/src/components/composite desktop/src/pages desktop/src/components/layout desktop/src/dev
git commit -m "feat(brand): replace the cc-haha mark with the OrionMark placeholder

Same size interface and token-based theming as the mark it replaces;
geometric ring + Orion belt placeholder until the official logo lands.

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 3: 语言包品牌字串 + 渲染层可见字串

**Files:**
- Modify: `desktop/src/i18n/locales/{en,zh,zh-TW,jp,kr}.ts`（5 个键/语言）
- Modify: `desktop/src/stores/chatStore.ts:1988,4779,4847`
- Modify: `desktop/index.html:33`
- Modify: `desktop/src/pages/settings/AboutSettings.tsx`（标题/常量/作者行/社交块）
- Modify: `desktop/src/components/layout/Sidebar.tsx:989`
- Modify: `desktop/src/pages/AdapterSettings.tsx:23`
- Modify: `desktop/src/pages/ActivitySettings.tsx:75`
- Test: `desktop/src/pages/ActivitySettings.test.tsx`（subtitle 断言）

**Interfaces:**
- Consumes: `PRODUCT`（`desktop/src/lib/product.ts`，batch 1 Task 5 已建）。
- Produces: 无新接口；用户可见字串全部指向新品牌。

- [ ] **Step 1: 语言包 5 键 × 5 语言**

操作表（"token 替换"= 在该键现有译文内把产品 token 原位替换，不重写句子；"整值替换"= 给定新值）：

| 键 | 操作 | 新值 / 规则 |
|---|---|---|
| `settings.activity.defaultHandle` | 整值替换 | `github.com/Edisonzszs/orion-agent` |
| `settings.general.notificationsTestTitle` | 整值替换 | `Orion Agent notifications are enabled` |
| `settings.providers.ccSwitch.unavailableSchema` | token 替换 | 译文内 `cc-haha` → `Orion Agent`（en 有 2 处） |
| `settings.general.storagePortableDirPlaceholder` | token 替换 | 译文内 `cc-haha` → `Orion` |
| `settings.general.traceHintOn` | token 替换 | 译文内 `cc-haha` → `Orion` |

**不动**：`settings.terminal.description`（第 3 批）、`settings.diagnostics.doctorSafeKeys`（localStorage key 名）。

```bash
# 机械部分（defaultHandle 与 notificationsTestTitle）：
perl -pi -e "s#'settings\\.activity\\.defaultHandle': '[^']*'#'settings.activity.defaultHandle': 'github.com/Edisonzszs/orion-agent'#; s#'settings\\.general\\.notificationsTestTitle': '[^']*'#'settings.general.notificationsTestTitle': 'Orion Agent notifications are enabled'#" desktop/src/i18n/locales/en.ts desktop/src/i18n/locales/zh.ts desktop/src/i18n/locales/zh-TW.ts desktop/src/i18n/locales/jp.ts desktop/src/i18n/locales/kr.ts
# token 部分（行寻址：仅命中这三个键的行内做全局替换，避免误伤 doctorSafeKeys/terminal.description）：
for f in desktop/src/i18n/locales/*.ts; do
  perl -pi -e "if (/unavailableSchema/) { s/cc-haha/Orion Agent/g } elsif (/storagePortableDirPlaceholder/) { s/cc-haha/Orion/g } elsif (/traceHintOn/) { s/cc-haha/Orion/g }" "$f"
done
grep -n "cc-haha" desktop/src/i18n/locales/en.ts
```
预期：en 剩余 2 行——`settings.terminal.description`（保留）与 `settings.diagnostics.doctorSafeKeys`（保留）；其余语言同样只剩这两键。若某语言的 token 替换因正则不匹配而漏掉，手工补。

- [ ] **Step 2: chatStore 通知标题与 index.html**

```bash
perl -pi -e "s/Claude Code Haha 已完成回复/Orion Agent 已完成回复/; s/Claude Code Haha 需要你的确认/Orion Agent 需要你的确认/g" desktop/src/stores/chatStore.ts
perl -pi -e "s#<title>Claude Code Haha</title>#<title>Orion Agent</title>#" desktop/index.html
grep -n "Claude Code Haha" desktop/src desktop/index.html -r | grep -v "\.test\." || echo "renderer brand clean"
```
预期：`renderer brand clean`。

- [ ] **Step 3: AboutSettings / Sidebar / AdapterSettings / ActivitySettings**

- `AboutSettings.tsx`：
  - import 区加 `import { PRODUCT } from '../lib/product'`（随该文件相对导入风格）。
  - 常量区替换为：
    ```ts
    const GITHUB_REPO = PRODUCT.homepage
    const GITHUB_ISSUES = `${GITHUB_REPO}/issues`
    const GITHUB_RELEASES = `${GITHUB_REPO}/releases`
    const AUTHOR_GITHUB = `https://github.com/${PRODUCT.github.owner}`
    ```
    并**整段删除** `const SOCIAL_LINKS = [...] as const`。
  - `:158` 的 `<h1 …>Claude Code Haha</h1>` → `{PRODUCT.name}`。
  - `:177` 的 `NanmiCoder/cc-haha` → `{PRODUCT.github.owner}/{PRODUCT.github.repo}`。
  - 作者行 `:381` 的 `程序员阿江-Relakkes` → `{PRODUCT.github.owner}`。
  - **删除** "Social Media" 渲染块（`{/* Social Media */}` 注释起到该 `<div>` 结束的整个块；SOCIAL_LINKS.map 部分）。locale 键 `settings.about.socialMedia` 保留不动。
- `Sidebar.tsx:989`：`href="https://github.com/NanmiCoder/cc-haha"` → `href={PRODUCT.homepage}`；文件顶部加 `import { PRODUCT } from '@/lib/product'`（Sidebar 现有别名风格若为相对路径则用 `'../lib/product'`）。
- `AdapterSettings.tsx:23`：`const IM_CONFIG_DOCS_URL = 'https://cchaha.ai/im/'` → `` const IM_CONFIG_DOCS_URL = `${PRODUCT.docsUrl}/en/im/` ``，import 加 `PRODUCT`。
- `ActivitySettings.tsx:75`：`subtitle: 'github.com/NanmiCoder/cc-haha',` → `subtitle: PRODUCT.homepage.replace(/^https?:\/\//, ''),`（PRODUCT 已在 batch 1 引入该文件）。

- [ ] **Step 4: 同步测试断言**

`desktop/src/pages/ActivitySettings.test.tsx`：3 处 fixture `subtitle: 'github.com/NanmiCoder/cc-haha'` → `subtitle: 'github.com/Edisonzszs/orion-agent'`；`:204-206` 的 link 断言 `github.com/NanmiCoder/cc-haha` → `github.com/Edisonzszs/orion-agent`、`https://github.com/NanmiCoder/cc-haha` → `https://github.com/Edisonzszs/orion-agent`。

```bash
perl -pi -e "s#github\\.com/NanmiCoder/cc-haha#github.com/Edisonzszs/orion-agent#g; s#https://github\\.com/NanmiCoder/cc-haha#https://github.com/Edisonzszs/orion-agent#g" desktop/src/pages/ActivitySettings.test.tsx
```

- [ ] **Step 5: 聚焦测试 + lane**

```bash
cd desktop && bun run test -- --run src/pages/ActivitySettings.test.tsx src/i18n src/stores 2>&1 | tail -6; cd ..
bun run check:desktop 2>&1 | tail -6
```
预期：聚焦全绿（i18n 的 removed-keys 测试不受影响——没删键）；lane 失败集 ⊆ 已知 17。

- [ ] **Step 6: 提交**

```bash
git add desktop/src desktop/index.html
git commit -m "feat(brand): Orion Agent strings across the renderer

Locale brand strings (5 keys x 5 languages), notification titles,
window title, About/Sidebar/Adapter links from product.json, and the
default profile handle. The upstream author's personal social links
are removed.

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 4: Electron host 与 server 侧可见字串、doctor 目标 id

**Files:**
- Modify: `desktop/electron/services/menu.ts:145`、`notificationSmoke.ts:101`
- Modify: `src/server/services/desktopUiPreferencesService.ts:23`
- Modify: `src/server/services/doctorService.ts:172,178,307`
- Test: `src/server/__tests__/desktop-ui-preferences.test.ts`（5 处 subtitle）、`src/server/__tests__/doctor-service.test.ts`（id 断言）、`desktop/src/__tests__/diagnosticsSettings.test.tsx`（2 处 id）

**Interfaces:**
- Consumes: `PRODUCT_NAME`（`desktop/electron/services/appIdentity.ts` 已导出）；`PRODUCT`（`src/constants/orionProduct.ts`）。

- [ ] **Step 1: 先改测试（RED）**

```bash
perl -pi -e "s#github\\.com/NanmiCoder/cc-haha#github.com/Edisonzszs/orion-agent#g" src/server/__tests__/desktop-ui-preferences.test.ts
perl -pi -e "s/cc-haha-providers/orion-providers/g; s/cc-haha-settings/orion-settings/g" src/server/__tests__/doctor-service.test.ts desktop/src/__tests__/diagnosticsSettings.test.tsx
cd desktop && bun run test -- --run src/__tests__/diagnosticsSettings.test.tsx 2>&1 | tail -4; cd ..
bun test src/server/__tests__/desktop-ui-preferences.test.ts src/server/__tests__/doctor-service.test.ts --timeout 15000 2>&1 | tail -4
```
预期：三组测试 FAIL（实现还没改）。

- [ ] **Step 2: 改实现**

- `menu.ts:145`：`app.name || 'Claude Code Haha'` → `app.name || PRODUCT_NAME`；文件顶部加 `import { PRODUCT_NAME } from './appIdentity'`（若已从该模块 import 则合并）。**menu.test.ts 不需要改**——它显式传入名字，测的是模板行为。
- `notificationSmoke.ts:101`：`|| 'Claude Code Haha notification smoke'` → `` || `${PRODUCT_NAME} notification smoke` ``；同样加 import。
- `desktopUiPreferencesService.ts:23`：
  ```ts
  const DEFAULT_PROFILE_SUBTITLE = PRODUCT.homepage.replace(/^https?:\/\//, '')
  ```
  （该文件 batch 1 已 import PRODUCT。）
- `doctorService.ts`：`:172` `'cc-haha-providers'` → `'orion-providers'`；`:178` `'cc-haha-settings'` → `'orion-settings'`；`:307` `target.id === 'cc-haha-providers'` → `target.id === 'orion-providers'`。

- [ ] **Step 3: 运行，确认 GREEN**

```bash
bun test src/server/__tests__/desktop-ui-preferences.test.ts src/server/__tests__/doctor-service.test.ts --timeout 15000 2>&1 | tail -4
cd desktop && bun run test -- --run src/__tests__/diagnosticsSettings.test.tsx electron/services/menu.test.ts electron/services/notificationSmoke.test.ts 2>&1 | tail -4; cd ..
```
预期：全部 pass。

- [ ] **Step 4: 提交**

```bash
git add desktop/electron/services src/server/services src/server/__tests__ desktop/src/__tests__
git commit -m "feat(brand): host and server user-visible strings follow product.json

Menu/notification fallbacks use PRODUCT_NAME; the default profile
handle derives from PRODUCT.homepage; doctor target ids drop the
cc-haha prefix.

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 5: renderer twin cross-check + 整批验证

**Files:**
- Create: `desktop/src/lib/product.test.ts`

**Interfaces:**
- Consumes: `PRODUCT`（`desktop/src/lib/product.ts`）与仓库根 `product.json`。

- [ ] **Step 1: 写 twin cross-check 测试（直接可绿，作为守卫）**

```ts
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { PRODUCT, type ProductIdentity } from './product'

describe('renderer ProductIdentity twin', () => {
  it('stays field-for-field identical to product.json', () => {
    const productPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'product.json')
    const source = JSON.parse(readFileSync(productPath, 'utf8')) as ProductIdentity
    expect(PRODUCT).toEqual(source)
  })

  it('exposes the values the UI renders', () => {
    expect(PRODUCT.name).toBe('Orion Agent')
    expect(PRODUCT.shortName).toBe('Orion')
    expect(PRODUCT.homepage).toBe('https://github.com/Edisonzszs/orion-agent')
    expect(PRODUCT.github).toEqual({ owner: 'Edisonzszs', repo: 'orion-agent' })
  })
})
```

```bash
cd desktop && bun run test -- --run src/lib/product.test.ts 2>&1 | tail -4; cd ..
```
预期：2 pass。

- [ ] **Step 2: 整批残留核对**

```bash
grep -rn "Claude Code Haha\|NanmiCoder\|relakkes\|cchaha\.ai" desktop/src desktop/index.html src/server desktop/electron --include='*.ts' --include='*.tsx' --include='*.html' | grep -v "\.test\.\|__tests__" || echo "user-visible layer clean"
grep -rn "Claude Code Haha\|NanmiCoder\|relakkes" desktop/src desktop/index.html src/server desktop/electron --include='*.test.ts' --include='*.test.tsx' | grep -v "menu.test" || echo "test refs clean"
```
预期：第一条 `user-visible layer clean`；第二条 `test refs clean`（menu.test.ts 的显式传名 fixture 允许保留——它们测试模板行为而非品牌）。若有其它残留，逐条判断：属本批范围的补改并重跑聚焦测试；属保留清单（doctorSafeKeys 值、terminal.description、localStorage/env 命名、`cc-haha-computer-use.app`、哈希命名空间）的记录下来。

- [ ] **Step 3: 跑车道**

```bash
bun run check:desktop 2>&1 | tail -8
bun run check:electron 2>&1 | tail -8
bun run check:policy 2>&1 | tail -6
bun run check:desktop-ui-smoke 2>&1 | tail -8
```
预期：每条的失败集 ⊆ 对应已知基线（renderer 17 / electron 9 / policy 11 / ui-smoke 无已知失败须全绿）；lint/tsc/build 部分必须全过。`check:server` 不在本批选择集（src/ 改动会选中它——若 `check:impact` 选中则跑：`PR_BASE_REF=f4a5846 ALLOW_CLI_CORE_CHANGE=1 bun run check:impact`，对选中的 lane 用聚焦文件集验证，server lane 本机阻塞按既定裁定处理）。

- [ ] **Step 4: 提交**

```bash
git add desktop/src/lib/product.test.ts
git commit -m "test(brand): guard the renderer ProductIdentity twin against drift

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

- [ ] **Step 5: 汇报**

按 AGENTS.md Handoff 格式报告：改动文件、测试、命令与结果（passed/failed/blocked/not run 区分）、残留清单、剩余风险；提示用户可做一次人工 `cd desktop && bun run electron:dev` 目检（临时 `CLAUDE_CONFIG_DIR`）：About 页、侧边栏标记与链接、设置页语言包文案、新建会话空态的 OrionMark。
