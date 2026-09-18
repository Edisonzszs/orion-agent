# Orion Agent 品牌化 · 第 1 批：品牌单一来源 + 数据目录 + 导入迁移 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 引入 `product.json` 作为品牌单一来源，把 cc-haha 的私有数据目录 `~/.claude/cc-haha/` 改为 `~/.claude/orion/`，并在 server 启动时从旧目录一次性、不覆盖地导入数据。

**Architecture:** 仓库根的 `product.json` 被三个互不 import 的代码边界（`src/`、`desktop/electron/`、`desktop/src/`）和 `scripts/` 各自通过薄模块读取；所有硬编码的 `'cc-haha'` 路径段改为引用常量。导入迁移是一个独立模块 `legacyDataDirImport.ts`，由已有的 `persistentStorageMigrations.ts` 在 server 启动时调用，以标记文件判断是否已导入，逐文件 `COPYFILE_EXCL` 保证不覆盖。

**Tech Stack:** Bun 1.3、TypeScript ESM（2 空格、无分号）、`bun:test`（`src/`、`scripts/`、`desktop/electron`）、Vitest（`desktop/src`）、Node `fs/promises`。

**Spec:** `docs/superpowers/specs/2026-09-18-orion-agent-rebrand-v1-design.md`（§2、§3、§9 第 1 批）

## Global Constraints

- 只改**文件系统路径段**与本批明确列出的默认值；`localStorage` key（`cc-haha-*`、`cc-haha.*`）、Electron partition（`cc-haha-pet`、`cc-haha-preview-*`）、环境变量名（`CC_HAHA_*`）、`requestIdentity.ts` 与 `adapters/whatsapp/session.ts` 里的身份字串一律**不动**。
- 测试绝不读写真实 `~/.claude`：所有测试用 `fs.mkdtemp` 临时目录并设置 `process.env.CLAUDE_CONFIG_DIR`，`afterEach` 恢复并删除。
- 代码风格：TypeScript ESM、2 空格缩进、无分号、`camelCase` 函数、`PascalCase` 类型。
- `product.json` 字段值（逐字）：`name` = `Orion Agent`，`shortName` = `Orion`，`cliName` = `orion`，`dataDirName` = `orion`，`legacyDataDirName` = `cc-haha`，`appId` = `com.orion-agent.desktop`，`github.owner` = `Edisonzszs`，`github.repo` = `orion-agent`，`homepage` = `https://github.com/Edisonzszs/orion-agent`，`docsUrl` = `https://github.com/Edisonzszs/orion-agent/tree/main/docs`，`artifactPrefix` = `Orion-Agent`。
- 本批**不改** `desktop/package.json`、`WINDOWS_APP_USER_MODEL_ID`、README、docs、i18n 中的产品名——那是第 2 批及以后。本批例外地改两类用户可见文案，因为它们描述的正是数据目录：默认 profile `displayName`（`'cc-haha'` → `Orion`）与 5 个语言包里两条含 `~/.claude/cc-haha/` 的路径提示。
- 仓库无 `origin` remote。`bun run check:impact` / `verify` 需要 `PR_BASE_REF=945a0e5`（基线提交）才能看到已提交的改动；触碰 `src/utils/` 时还需 `ALLOW_CLI_CORE_CHANGE=1`（这是上游给外部贡献者设的门，你是仓库所有者）。
- 每个 Task 结束在 `main` 上提交一次；提交信息用 Conventional Commit，末尾加 `Co-Authored-By: Claude Code <noreply@anthropic.com>`。
- 工作目录：`E:\claude\ORION AGENT\cc-haha-main\cc-haha-main`（第 3 批才迁目录）。Bash 命令在 Git Bash 下执行；`perl` 由 Git for Windows 自带。

---

## 与 spec 的两处偏差（调研后确定）

1. spec §2 列了 `adapters/common/product.ts`。调研发现 `adapters/` 不使用私有数据目录（它读 `<configDir>/adapters.json` 与 `whatsapp-auth/`，都在根目录），唯一的 `'cc-haha'` 是 WhatsApp browser 身份字串（内部标识层）。因此**不建**该模块，`check:adapters` 本批也不需要跑。
2. spec §2 的 `desktop/package.json` 一致性断言放到第 2 批（那时才改 `package.json` 的值，否则本批测试必红）。本批的 `scripts/pr/product-identity.test.ts` 先只校验 `product.json` 自身。

## 文件结构

| 文件 | 职责 | 动作 |
|---|---|---|
| `product.json` | 品牌单一来源 | 新建 |
| `src/constants/orionProduct.ts` | `src/` 边界读取 `product.json`，导出类型化常量 | 新建 |
| `scripts/pr/product-identity.test.ts` | 校验 `product.json` 形状与取值规则（第 2 批再加 `desktop/package.json` 一致性断言） | 新建 |
| `scripts/pr/change-policy.ts` / `.test.ts` | 让 `product.json` 与导入模块路由到正确的检查 lane | 修改 |
| `package.json` | `check:policy` 加入新测试 | 修改 |
| `src/utils/envUtils.ts` | `getCcHahaDir()` → `getProductDataDir()`，改用常量 | 修改 |
| `src/**`（约 20 个生产文件） | `'cc-haha'` 路径段 → `PRODUCT_DATA_DIR_NAME` | 修改 |
| `src/**/*.test.ts`（约 37 个） | 路径断言同步 | 修改 |
| `src/server/services/legacyDataDirImport.ts` | 一次性导入：条目清单、不覆盖复制、标记文件 | 新建 |
| `src/server/__tests__/legacy-data-dir-import.test.ts` | 导入模块 6 个用例 | 新建 |
| `src/server/services/persistentStorageMigrations.ts` | 启动时先调用导入，再做既有的 JSON 升级 | 修改 |
| `desktop/electron/services/appIdentity.ts` | 新增 `PRODUCT_NAME`、`PRODUCT_DATA_DIR_NAME` 导出 | 修改 |
| `desktop/electron/main.ts`、`services/{pets,petWindow,sidecarManager}.ts` + 测试 | 路径段替换 | 修改 |
| `desktop/src/lib/product.ts` | 渲染层读取 `product.json` | 新建 |
| `desktop/src/lib/attachmentImages.ts`、`pages/ActivitySettings.tsx`、`i18n/locales/*.ts` + 测试 | 路径判断兼容新旧目录；默认 displayName；两条路径提示 | 修改 |
| `scripts/quality-gate/sandbox.ts`、`desktop-smoke/deterministic.ts`、`providerTargets.ts`、`scripts/perf/local-index-benchmark.ts` + 测试 | 质量门禁沙箱复制的是新目录 | 修改 |

---

### Task 1: `product.json` 单一来源、`src/` 读取模块、形状测试与 lane 路由

**Files:**
- Create: `product.json`
- Create: `src/constants/orionProduct.ts`
- Create: `scripts/pr/product-identity.test.ts`
- Modify: `scripts/pr/change-policy.ts`（`desktopWebExactPaths` 约第 75 行、`desktopNativeExactPaths` 约第 63 行、`persistencePrefixes` 约第 145 行、`policyExactPaths` 约第 165 行、`checks.server` 约第 418 行）
- Modify: `scripts/pr/change-policy.test.ts`（在 `describe('evaluateChangePolicy')` 内追加一个用例）
- Modify: `package.json`（`scripts["check:policy"]`）

**Interfaces:**
- Produces（后续所有 Task 依赖）：
  ```ts
  // src/constants/orionProduct.ts
  export type ProductIdentity = {
    name: string; shortName: string; cliName: string
    dataDirName: string; legacyDataDirName: string; appId: string
    github: { owner: string; repo: string }
    homepage: string; docsUrl: string; artifactPrefix: string
  }
  export const PRODUCT: ProductIdentity
  export const PRODUCT_DATA_DIR_NAME: string        // 'orion'
  export const LEGACY_PRODUCT_DATA_DIR_NAME: string // 'cc-haha'
  ```

- [ ] **Step 1: 写形状测试（先失败）**

新建 `scripts/pr/product-identity.test.ts`：

```ts
import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(join(root, relativePath), 'utf8')) as T
}

type ProductJson = {
  name: string
  shortName: string
  cliName: string
  dataDirName: string
  legacyDataDirName: string
  appId: string
  github: { owner: string; repo: string }
  homepage: string
  docsUrl: string
  artifactPrefix: string
}

describe('product.json', () => {
  const product = readJson<ProductJson>('product.json')

  test('declares every identity field as a non-empty string', () => {
    for (const key of [
      'name', 'shortName', 'cliName', 'dataDirName', 'legacyDataDirName',
      'appId', 'homepage', 'docsUrl', 'artifactPrefix',
    ] as const) {
      expect(typeof product[key]).toBe('string')
      expect(product[key].trim().length).toBeGreaterThan(0)
    }
    expect(typeof product.github.owner).toBe('string')
    expect(typeof product.github.repo).toBe('string')
  })

  test('uses filesystem- and shell-safe identifiers', () => {
    expect(product.cliName).toMatch(/^[a-z][a-z0-9-]*$/)
    expect(product.dataDirName).toMatch(/^[a-z][a-z0-9-]*$/)
    expect(product.legacyDataDirName).toMatch(/^[a-z][a-z0-9-]*$/)
    expect(product.dataDirName).not.toBe(product.legacyDataDirName)
    expect(product.appId).toMatch(/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/)
    expect(product.artifactPrefix).toMatch(/^[A-Za-z0-9-]+$/)
  })

  test('points homepage and docs at the declared GitHub repository', () => {
    const repoUrl = `https://github.com/${product.github.owner}/${product.github.repo}`
    expect(product.homepage).toBe(repoUrl)
    expect(product.docsUrl.startsWith(repoUrl)).toBe(true)
  })
})
```

- [ ] **Step 2: 运行，确认因文件不存在而失败**

```bash
bun test ./scripts/pr/product-identity.test.ts
```
预期：FAIL，错误含 `ENOENT` / `no such file` `product.json`。

- [ ] **Step 3: 新建 `product.json`**

```json
{
  "name": "Orion Agent",
  "shortName": "Orion",
  "cliName": "orion",
  "dataDirName": "orion",
  "legacyDataDirName": "cc-haha",
  "appId": "com.orion-agent.desktop",
  "github": { "owner": "Edisonzszs", "repo": "orion-agent" },
  "homepage": "https://github.com/Edisonzszs/orion-agent",
  "docsUrl": "https://github.com/Edisonzszs/orion-agent/tree/main/docs",
  "artifactPrefix": "Orion-Agent"
}
```

- [ ] **Step 4: 运行，确认通过**

```bash
bun test ./scripts/pr/product-identity.test.ts
```
预期：3 pass。

- [ ] **Step 5: 新建 `src/constants/orionProduct.ts`**

```ts
import product from '../../product.json'

/**
 * Product identity shared by the CLI, the local server and the sidecars.
 * `product.json` at the repository root is the single source of truth; the
 * desktop renderer and the Electron host read the same file through their
 * own thin modules because those bundles cannot import from `src/`.
 */
export type ProductIdentity = {
  name: string
  shortName: string
  cliName: string
  dataDirName: string
  legacyDataDirName: string
  appId: string
  github: { owner: string; repo: string }
  homepage: string
  docsUrl: string
  artifactPrefix: string
}

export const PRODUCT: ProductIdentity = product

/** Sub-directory under the Claude config home that holds this product's own state. */
export const PRODUCT_DATA_DIR_NAME = PRODUCT.dataDirName

/** Previous name of that sub-directory; only read by the one-time import. */
export const LEGACY_PRODUCT_DATA_DIR_NAME = PRODUCT.legacyDataDirName
```

- [ ] **Step 6: 快速冒烟确认模块可加载**

```bash
bun -e "import { PRODUCT, PRODUCT_DATA_DIR_NAME } from './src/constants/orionProduct.ts'; console.log(PRODUCT.name, PRODUCT_DATA_DIR_NAME)"
```
预期输出：`Orion Agent orion`。

- [ ] **Step 7: 写 change-policy 路由测试（先失败）**

在 `scripts/pr/change-policy.test.ts` 的 `describe('evaluateChangePolicy', () => {` 内部末尾追加：

```ts
  test('routes product identity changes to every product surface', () => {
    const result = evaluateChangePolicy(['product.json'])

    expect(result.checks.server).toBe(true)
    expect(result.checks.desktop).toBe(true)
    expect(result.checks.desktopNative).toBe(true)
    expect(result.checks.policy).toBe(true)
  })

  test('routes the legacy data-dir import to the persistence check', () => {
    const result = evaluateChangePolicy([
      'src/server/services/legacyDataDirImport.ts',
      'src/server/__tests__/legacy-data-dir-import.test.ts',
    ])

    expect(result.checks.server).toBe(true)
    expect(result.checks.persistence).toBe(true)
  })
```

- [ ] **Step 8: 运行，确认失败**

```bash
bun test ./scripts/pr/change-policy.test.ts
```
预期：新增两个用例 FAIL（`expected false to be true`）。

- [ ] **Step 9: 修改 `scripts/pr/change-policy.ts`**

(a) `desktopNativeExactPaths` 集合首行前加：
```ts
  'product.json',
```
(b) `desktopWebExactPaths` 集合首行前加：
```ts
  'product.json',
```
(c) `persistencePrefixes` 数组末尾追加：
```ts
  'src/server/services/legacyDataDirImport',
  'src/server/__tests__/legacy-data-dir-import',
```
(d) `policyExactPaths` 集合中 `'package.json',` 之前加：
```ts
  'product.json',
```
(e) `checks.server` 一行改为：
```ts
      server: selectionFiles.some((file) => (
        (file.startsWith('src/') && !isAgentInstructionPath(file)) || file === 'product.json'
      )),
```

- [ ] **Step 10: 运行，确认通过**

```bash
bun test ./scripts/pr/change-policy.test.ts
```
预期：全部 pass（含原有用例）。

- [ ] **Step 11: 把新测试加入 `check:policy`**

编辑根 `package.json` 的 `"check:policy"` 脚本，在 `./scripts/pr/change-policy.test.ts` 之后插入 ` ./scripts/pr/product-identity.test.ts`（空格分隔）。然后运行：

```bash
bun run check:policy 2>&1 | tail -5
```
预期：末尾显示全部 pass、0 fail。

- [ ] **Step 12: 提交**

```bash
git add product.json src/constants/orionProduct.ts scripts/pr/product-identity.test.ts scripts/pr/change-policy.ts scripts/pr/change-policy.test.ts package.json
git commit -m "feat(identity): add product.json as the single brand source

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 2: `src/` 数据目录改名（生产代码 + 测试）

**Files:**
- Modify: `src/utils/envUtils.ts:16-18`（`getCcHahaDir` → `getProductDataDir`）
- Modify（生产，逐处把 `'cc-haha'` 路径段换成 `PRODUCT_DATA_DIR_NAME`）：
  `src/utils/managedEnv.ts:143`、`src/utils/computerUse/preauthorizedConfig.ts:48`、
  `src/services/api/traceCapture.ts:291,298,300,2032,2038,2359,2367`、`src/services/openaiAuth/storage.ts:29`、
  `src/server/publicAccess.ts:83`、`src/server/services/conversationService.ts:1893,1959`、
  `src/server/services/cronScheduler.ts:916,946`、`src/server/services/desktopUiPreferencesService.ts:81,363,367,375`、
  `src/server/services/diagnosticsService.ts:104,780`、`src/server/services/doctorService.ts:174,180,210,215,221`、
  `src/server/services/hahaGrokOAuthService.ts:72`、`src/server/services/hahaOAuthService.ts:85`、`src/server/services/hahaOpenAIOAuthService.ts:90`、
  `src/server/services/localIndex/managedDatabasePath.ts:96,107`、`src/server/services/localIndex/recovery.ts:88,112`、`src/server/services/localIndex/scheduledRunReadModel.ts:77`、
  `src/server/services/managedSettingsService.ts:17`、`src/server/services/persistentStorageMigrations.ts:346,361,376,389,395,401`、
  `src/server/services/providerRuntimeEnv.ts:501,525`、`src/server/services/providerService.ts:181`、`src/server/services/settingsService.ts:112`、`src/server/services/teamService.ts:1446`、
  `src/server/__fixtures__/remoteBrowserSettingsSmoke.ts:45`
- Modify: 约 37 个 `src/**/*.test.ts`（见 Step 6 的命令自动列出）

**Interfaces:**
- Consumes: `PRODUCT_DATA_DIR_NAME`、`PRODUCT`（Task 1）
- Produces: `src/utils/envUtils.ts` 导出 `getProductDataDir(): string`（原 `getCcHahaDir` 的 9 个调用点随之改名）

- [ ] **Step 1: 记录改名前的基线测试结果**

```bash
bun test src/server/__tests__/desktop-ui-preferences.test.ts src/server/__tests__/persistence-upgrade.test.ts src/utils/managedEnv.test.ts 2>&1 | tail -3
```
预期：全部 pass（这是改名前的绿色基线；若本就有失败，记录下来，不算本任务引入）。

- [ ] **Step 2: 改 `src/utils/envUtils.ts`**

把
```ts
export function getCcHahaDir(): string {
  return join(getClaudeConfigHomeDir(), 'cc-haha')
}
```
改为
```ts
export function getProductDataDir(): string {
  return join(getClaudeConfigHomeDir(), PRODUCT_DATA_DIR_NAME)
}
```
并在文件顶部 `import { join } from 'path'` 之后加：
```ts
import { PRODUCT_DATA_DIR_NAME } from '../constants/orionProduct.js'
```

- [ ] **Step 3: 全仓改名 `getCcHahaDir` → `getProductDataDir`**

```bash
grep -rl "getCcHahaDir" src --include='*.ts' --include='*.tsx' | xargs perl -pi -e 's/getCcHahaDir/getProductDataDir/g'
grep -rn "getCcHahaDir" src || echo "no leftovers"
```
预期：最后一行 `no leftovers`。受影响文件（9 个）：`src/server/services/localIndex/{config,scheduledRunIndex,searchContentDatabase,traceDatabase}.ts`、`src/server/services/{providerService,reviewService}.ts`、`src/services/openaiAuth/storage.ts`、`src/tools/ImageGenTool/backend.ts`、`src/utils/envUtils.ts`。

- [ ] **Step 4: 替换生产代码里的 `'cc-haha'` 路径段**

对上面 Files 列表中的每个生产文件（不含 `.test.ts`）：

(a) 在文件的 import 区末尾加一行（相对路径按文件所在目录调整；`src/server/services/` 下是 `'../../constants/orionProduct.js'`，`src/server/services/localIndex/` 下是 `'../../../constants/orionProduct.js'`，`src/server/` 下是 `'../constants/orionProduct.js'`，`src/utils/`、`src/services/api/`、`src/services/openaiAuth/`、`src/utils/computerUse/` 依此类推）：
```ts
import { PRODUCT_DATA_DIR_NAME } from '<相对路径>/constants/orionProduct.js'
```
(b) 把该文件里所有作为路径段出现的 `'cc-haha'` 换成 `PRODUCT_DATA_DIR_NAME`。例如：
```ts
// 之前
return path.join(this.getConfigDir(), 'cc-haha', 'desktop-ui.json')
// 之后
return path.join(this.getConfigDir(), PRODUCT_DATA_DIR_NAME, 'desktop-ui.json')
```
(c) `persistentStorageMigrations.ts` 里的报告字串也一起改：`'cc-haha/providers.json'` → `` `${PRODUCT_DATA_DIR_NAME}/providers.json` ``，`'providers.json -> cc-haha/providers.json'` → `` `providers.json -> ${PRODUCT_DATA_DIR_NAME}/providers.json` ``，`'cc-haha/settings.json'` 同理；局部变量 `ccHahaDir` 改名为 `productDataDir`（同文件 `migrateLegacyRootProviders` 的参数名一起改）。
(d) `desktopUiPreferencesService.ts:81` 的默认 profile：`displayName: 'cc-haha',` → `displayName: PRODUCT.shortName,`（该文件 import 改为 `import { PRODUCT, PRODUCT_DATA_DIR_NAME } from '../../constants/orionProduct.js'`）。**`subtitle` 保持不变**（第 2 批处理）。
(e) 只改路径段。以下**不要改**：`src/services/openaiAuth/requestIdentity.ts:20` 的 `['cc-haha', sessionId, agentId]`、任何 `'cc-haha-…'` 或 `'cc-haha.…'` 形式的 key、注释里的 `~/.claude/cc-haha/`（顺手改成 `~/.claude/orion/` 可以，但不是必须）。

可用下面的命令自动完成大部分，然后人工检查 diff：

```bash
FILES=$(grep -rlE "'cc-haha'" src --include='*.ts' --include='*.tsx' | grep -v "\.test\.\|requestIdentity.ts")
for f in $FILES; do
  perl -pi -e "s/'cc-haha'/PRODUCT_DATA_DIR_NAME/g" "$f"
done
echo "$FILES" | tee /tmp/orion-batch1-prod-files.txt
```
自动替换之后必须手工做三件事：
1. 对 `/tmp/orion-batch1-prod-files.txt` 里的每个文件补 import（脚本不加 import，因为相对路径深度不同）。
2. `persistentStorageMigrations.ts`：自动替换会把 `'cc-haha/providers.json'` 这类**含斜杠**的报告字串漏掉（正则只匹配整个 `'cc-haha'` 字面量），按 (c) 手工改成模板字串，并把变量 `ccHahaDir` 改名 `productDataDir`。
3. `desktopUiPreferencesService.ts:81`：自动替换会得到 `displayName: PRODUCT_DATA_DIR_NAME`，这是**错的**，按 (d) 改为 `displayName: PRODUCT.shortName`。

- [ ] **Step 5: 语法与加载检查**

```bash
bun -e "await import('./src/server/services/persistentStorageMigrations.ts'); await import('./src/server/services/desktopUiPreferencesService.ts'); await import('./src/services/api/traceCapture.ts'); await import('./src/utils/managedEnv.ts'); console.log('ok')"
grep -rnE "'cc-haha'" src --include='*.ts' --include='*.tsx' | grep -v "\.test\." 
```
预期：第一条输出 `ok`（没有 import 解析错误）；第二条只剩 `src/services/openaiAuth/requestIdentity.ts:20` 一行。

- [ ] **Step 6: 同步 `src/` 测试里的路径断言**

```bash
grep -rlE "'cc-haha'|cc-haha/" src --include='*.test.ts' --include='*.test.tsx' > /tmp/orion-batch1-tests.txt
for f in $(cat /tmp/orion-batch1-tests.txt); do
  perl -pi -e "s/'cc-haha'/'orion'/g; s#(?<!NanmiCoder/)cc-haha/#orion/#g" "$f"
done
wc -l < /tmp/orion-batch1-tests.txt
grep -n "cc-haha" $(cat /tmp/orion-batch1-tests.txt) | grep -v "mkdtemp\|github.com\|cchaha\|'cc-haha-\|\"cc-haha-\|cc-haha\.\|\`cc-haha-" || echo "only expected leftovers"
```
预期：约 37 个文件被改（清单保存在 `/tmp/orion-batch1-tests.txt`，后续步骤复用）；最后 grep 只剩 `mkdtemp` 前缀、URL、`cc-haha-*` / `cc-haha.*` key 之类的非路径用法（或输出 `only expected leftovers`）。

然后人工修三处默认 displayName 断言（它们现在是 `'orion'`，应为 `PRODUCT.shortName` 即 `'Orion'`）：
- `src/server/__tests__/desktop-ui-preferences.test.ts` 第 71、126、147 行附近：`displayName: 'orion'` → `displayName: 'Orion'`。

- [ ] **Step 7: 运行受影响的测试并修复**

```bash
bun test $(cat /tmp/orion-batch1-tests.txt) 2>&1 | tail -15
```
预期：全部 pass。若有失败，按失败信息逐个修（常见原因：某处断言写的是字串拼接 `tmpDir + '/cc-haha'` 未被正则覆盖；或期望值需为 `'Orion'`）。

- [ ] **Step 8: 跑完整 server lane**

```bash
bun run check:server 2>&1 | tail -20
```
预期：`passed` 数与基线一致、`failed 0`。耗时数分钟。

- [ ] **Step 9: 提交**

```bash
git add -A src package.json
git commit -m "refactor(data-dir): rename the product data directory to ~/.claude/orion

All hard-coded 'cc-haha' path segments in src/ now read
PRODUCT_DATA_DIR_NAME from product.json; getCcHahaDir() becomes
getProductDataDir(). Default profile displayName follows shortName.
Tests assert the new path. localStorage keys, partitions, env var names
and request identities are intentionally unchanged.

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 3: 从 `cc-haha/` 一次性导入到 `orion/`

**Files:**
- Create: `src/server/services/legacyDataDirImport.ts`
- Create: `src/server/__tests__/legacy-data-dir-import.test.ts`
- Modify: `src/server/services/persistentStorageMigrations.ts`（`runPersistentStorageMigrations` 开头）

**Interfaces:**
- Consumes: `PRODUCT_DATA_DIR_NAME`、`LEGACY_PRODUCT_DATA_DIR_NAME`（Task 1）
- Produces:
  ```ts
  export const LEGACY_IMPORT_MARKER_FILE: string   // '.imported-from-cc-haha'
  export const LEGACY_IMPORT_ENTRIES: readonly string[]
  export type LegacyImportStatus = 'skipped-marker' | 'skipped-no-legacy' | 'imported' | 'partial'
  export type LegacyImportReport = {
    status: LegacyImportStatus
    copied: string[]          // 相对 legacy 目录的文件路径
    skippedExisting: string[] // 目标已存在而未覆盖的文件
    skippedSymlinks: string[] // 源是符号链接，跳过
    failures: string[]        // `${relativePath}: ${message}`
  }
  export function importLegacyProductDataDir(configDir: string): Promise<LegacyImportReport>
  ```

- [ ] **Step 1: 写测试（先失败）**

新建 `src/server/__tests__/legacy-data-dir-import.test.ts`：

```ts
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
```

- [ ] **Step 2: 运行，确认失败**

```bash
bun test ./src/server/__tests__/legacy-data-dir-import.test.ts 2>&1 | tail -5
```
预期：FAIL，`Cannot find module '../services/legacyDataDirImport.js'`。

- [ ] **Step 3: 实现 `src/server/services/legacyDataDirImport.ts`**

```ts
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
```

- [ ] **Step 4: 运行，确认除最后的集成用例外全部通过**

```bash
bun test ./src/server/__tests__/legacy-data-dir-import.test.ts 2>&1 | tail -8
```
预期：7 pass，1 fail（`runs before the JSON upgrades …`，因为迁移流程还没调用导入）。

- [ ] **Step 5: 在 `persistentStorageMigrations.ts` 里接入**

顶部 import 区加：
```ts
import { importLegacyProductDataDir } from './legacyDataDirImport.js'
```
`runPersistentStorageMigrations` 整个函数改为（Task 2 已把变量改名为 `productDataDir`、报告字串改为模板字串；这里只是在最前面插入导入并把结果并入报告）：
```ts
async function runPersistentStorageMigrations(configDir: string): Promise<MigrationReport> {
  const report: MigrationReport = { migratedEntries: [], failures: [] }
  const productDataDir = path.join(configDir, PRODUCT_DATA_DIR_NAME)

  // Fill the new product directory from the previous one before upgrading
  // any JSON in it, so imported files go through the same schema upgrades.
  const legacyImport = await importLegacyProductDataDir(configDir)
  for (const copied of legacyImport.copied) {
    report.migratedEntries.push(`legacy-import: ${copied}`)
  }
  for (const failure of legacyImport.failures) {
    report.failures.push(`legacy-import: ${failure}`)
  }

  await migrateLegacyRootProviders(configDir, productDataDir, report)

  await migrateJsonEntry(
    path.join(productDataDir, 'providers.json'),
    `${PRODUCT_DATA_DIR_NAME}/providers.json`,
    report,
    migrateProvidersIndex,
  )
  await migrateJsonEntry(
    path.join(productDataDir, 'settings.json'),
    `${PRODUCT_DATA_DIR_NAME}/settings.json`,
    report,
    migrateManagedSettings,
  )

  return report
}
```

- [ ] **Step 6: 运行，确认全部通过**

```bash
bun test ./src/server/__tests__/legacy-data-dir-import.test.ts ./src/server/__tests__/persistence-upgrade.test.ts 2>&1 | tail -5
```
预期：全部 pass。

- [ ] **Step 7: 把新测试加入持久化升级门禁并运行**

`scripts/quality-gate/persistence-upgrade.ts` 按固定清单运行。在 `checks` 数组中 `title: 'Server persistent JSON migrations'` 那一项**之前**插入：

```ts
  {
    title: 'Legacy product data directory import',
    command: ['bun', 'test', './src/server/__tests__/legacy-data-dir-import.test.ts'],
  },
```

然后：

```bash
bun run check:persistence-upgrade 2>&1 | tail -12
```
预期：每一项 pass，含新加的 `Legacy product data directory import`。

- [ ] **Step 8: 提交**

```bash
git add src/server/services/legacyDataDirImport.ts src/server/__tests__/legacy-data-dir-import.test.ts src/server/services/persistentStorageMigrations.ts scripts/quality-gate/persistence-upgrade.ts
git commit -m "feat(data-dir): import cc-haha data into ~/.claude/orion once

Marker-gated, copy-only, never-overwrite import of the allow-listed
entries; regenerable db/, traces/ and diagnostics/ are skipped. Runs at
the start of the persistent storage migrations so imported JSON gets the
same schema upgrades.

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 4: Electron host 路径段

**Files:**
- Modify: `desktop/electron/services/appIdentity.ts`
- Modify: `desktop/electron/main.ts:263`
- Modify: `desktop/electron/services/pets.ts:258`
- Modify: `desktop/electron/services/petWindow.ts:155`
- Modify: `desktop/electron/services/sidecarManager.ts:206,227,403`
- Modify: `desktop/electron/services/appIdentity.test.ts`、`pets.test.ts`、`petWindow.test.ts`、`sidecarManager.test.ts`

**Interfaces:**
- Produces（`desktop/electron/services/appIdentity.ts`）：
  ```ts
  export const PRODUCT_NAME: string           // 'Orion Agent'（第 2 批菜单/通知使用）
  export const PRODUCT_DATA_DIR_NAME: string  // 'orion'
  // WINDOWS_APP_USER_MODEL_ID 本批不变（仍与 desktop/package.json 的 appId 同步）
  ```

- [ ] **Step 1: 写测试（先失败）**

在 `desktop/electron/services/appIdentity.test.ts` 顶部 import 改为：
```ts
import { applyWindowsAppUserModelId, PRODUCT_DATA_DIR_NAME, PRODUCT_NAME, WINDOWS_APP_USER_MODEL_ID } from './appIdentity'
```
并在 `describe` 内追加：
```ts
  it('reads the product identity from product.json', () => {
    const productPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'product.json')
    const product = JSON.parse(readFileSync(productPath, 'utf8')) as { name: string; dataDirName: string }
    expect(PRODUCT_NAME).toBe(product.name)
    expect(PRODUCT_DATA_DIR_NAME).toBe(product.dataDirName)
    expect(PRODUCT_DATA_DIR_NAME).toBe('orion')
  })
```

- [ ] **Step 2: 运行，确认失败**

```bash
cd desktop && bun test ./electron/services/appIdentity.test.ts 2>&1 | tail -5; cd ..
```
预期：FAIL（`PRODUCT_NAME` 未导出 / undefined）。

- [ ] **Step 3: 修改 `appIdentity.ts`**

在文件顶部加：
```ts
import product from '../../../product.json'

/** Display name from product.json; the Electron menu and notifications fall back to it. */
export const PRODUCT_NAME: string = product.name

/** Sub-directory of the Claude config root that holds this product's own state. */
export const PRODUCT_DATA_DIR_NAME: string = product.dataDirName
```
`WINDOWS_APP_USER_MODEL_ID` 保持原值与注释。

- [ ] **Step 4: 替换 6 处路径段**

- `main.ts:263`：`'cc-haha', 'public-access'` → `PRODUCT_DATA_DIR_NAME, 'public-access'`，并在 main.ts 的 import 区加 `import { PRODUCT_DATA_DIR_NAME } from './services/appIdentity'`（若已从该模块 import 其他符号，合并到同一行）。
- `services/pets.ts:258`：`path.join(claudeConfigDir, 'cc-haha', 'pets')` → `path.join(claudeConfigDir, PRODUCT_DATA_DIR_NAME, 'pets')`；import `./appIdentity`。
- `services/petWindow.ts:155`：同法。
- `services/sidecarManager.ts:206,227`：同法；第 403 行 `path.basename(parent) === 'cc-haha'` → `path.basename(parent) === PRODUCT_DATA_DIR_NAME`。

- [ ] **Step 5: 同步 Electron 测试的路径断言**

```bash
cd desktop
perl -pi -e "s/'cc-haha'/'orion'/g; s#(?<!NanmiCoder/)cc-haha/#orion/#g" electron/services/pets.test.ts electron/services/petWindow.test.ts electron/services/sidecarManager.test.ts
grep -n "cc-haha" electron/services/pets.test.ts electron/services/petWindow.test.ts electron/services/sidecarManager.test.ts
cd ..
```
预期 grep 只剩：`'cc-haha-portable-diagnostics'`（临时目录名）与 `partition: 'cc-haha-pet'`（partition 名，保留）；`petWindow.test.ts:181` 的用例标题里 `cc-haha config root` 可顺手改成 `product config root`。

- [ ] **Step 6: 跑 Electron lane**

```bash
bun run check:electron 2>&1 | tail -15
```
预期：`tsc` 无错误、bun test 全部 pass、`build:electron` 成功。

- [ ] **Step 7: 提交**

```bash
git add desktop/electron
git commit -m "refactor(electron): read the product data dir name from product.json

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 5: 渲染层：路径判断、默认 displayName、两条路径提示

**Files:**
- Create: `desktop/src/lib/product.ts`
- Modify: `desktop/src/lib/attachmentImages.ts:19-22`
- Modify: `desktop/src/pages/ActivitySettings.tsx:73-78`
- Modify: `desktop/src/i18n/locales/{en,zh,zh-TW,jp,kr}.ts`（键 `settings.pets.folderDescription`、`settings.providers.settingsJsonDesc`）
- Modify: `desktop/src/lib/attachmentImages.test.ts`（若存在；否则新建）、`desktop/src/pages/ActivitySettings.test.tsx`、`desktop/src/api/desktopUiPreferences.test.ts`、`desktop/src/features/pets/PetSettings.test.tsx`

**Interfaces:**
- Produces（`desktop/src/lib/product.ts`）：
  ```ts
  export type ProductIdentity = { /* 与 src/constants/orionProduct.ts 相同字段 */ }
  export const PRODUCT: ProductIdentity
  ```

- [ ] **Step 1: 新建 `desktop/src/lib/product.ts`**

```ts
import product from '../../../product.json'

/**
 * Product identity for the renderer. `product.json` at the repository root is
 * the single source of truth; the renderer bundle cannot import from `src/`,
 * so it reads the file directly (the same way providerPresets.json is read).
 */
export type ProductIdentity = {
  name: string
  shortName: string
  cliName: string
  dataDirName: string
  legacyDataDirName: string
  appId: string
  github: { owner: string; repo: string }
  homepage: string
  docsUrl: string
  artifactPrefix: string
}

export const PRODUCT: ProductIdentity = product
```

- [ ] **Step 2: 写 `attachmentImages` 测试（先失败）**

若 `desktop/src/lib/attachmentImages.test.ts` 不存在则新建；存在则追加下面的 `describe`：

```ts
import { describe, expect, it } from 'vitest'
import { isManagedGeneratedImagePath } from './attachmentImages'

describe('isManagedGeneratedImagePath', () => {
  it('recognises generated images under the current product data dir', () => {
    expect(isManagedGeneratedImagePath('/home/u/.claude/orion/generated-images/a.png')).toBe(true)
    expect(isManagedGeneratedImagePath('C:\\Users\\u\\.claude\\orion\\generated-images\\a.png')).toBe(true)
  })

  it('keeps recognising images generated before the rename', () => {
    expect(isManagedGeneratedImagePath('/home/u/.claude/cc-haha/generated-images/a.png')).toBe(true)
  })

  it('rejects other paths', () => {
    expect(isManagedGeneratedImagePath('/home/u/.claude/orion/pets/a.png')).toBe(false)
    expect(isManagedGeneratedImagePath('/tmp/generated-images/a.png')).toBe(false)
  })
})
```

- [ ] **Step 3: 运行，确认失败**

```bash
cd desktop && bun run test -- --run src/lib/attachmentImages.test.ts 2>&1 | tail -8; cd ..
```
预期：`orion` 用例 FAIL。

- [ ] **Step 4: 修改 `attachmentImages.ts`**

```ts
import { PRODUCT } from './product'

const MANAGED_GENERATED_IMAGE_SEGMENTS = [
  `/.claude/${PRODUCT.dataDirName}/generated-images/`,
  // Transcripts written before the rename still reference the old directory.
  `/.claude/${PRODUCT.legacyDataDirName}/generated-images/`,
]

/** Host-managed ImageGen results already render through their dedicated result card. */
export function isManagedGeneratedImagePath(filePath: string): boolean {
  const normalized = filePath.replaceAll('\\', '/')
  return MANAGED_GENERATED_IMAGE_SEGMENTS.some((segment) => normalized.includes(segment))
}
```

- [ ] **Step 5: 运行，确认通过**

同 Step 3 命令。预期：全部 pass。

- [ ] **Step 6: 默认 displayName 与两条路径提示**

- `desktop/src/pages/ActivitySettings.tsx`：`displayName: 'cc-haha',` → `displayName: PRODUCT.shortName,`；文件顶部加 `import { PRODUCT } from '@/lib/product'`（该文件若用相对路径风格，则用 `'../lib/product'`）。`subtitle` 保持不变（第 2 批）。
- 5 个语言包，每个文件两处，仅替换路径：
  - `settings.pets.folderDescription`：`${CLAUDE_CONFIG_DIR:-~/.claude}/cc-haha/pets` → `${CLAUDE_CONFIG_DIR:-~/.claude}/orion/pets`
  - `settings.providers.settingsJsonDesc`：`~/.claude/cc-haha/settings.json` → `~/.claude/orion/settings.json`

  ```bash
  perl -pi -e 's#/cc-haha/pets#/orion/pets#; s#~/\.claude/cc-haha/settings\.json#~/.claude/orion/settings.json#' desktop/src/i18n/locales/en.ts desktop/src/i18n/locales/zh.ts desktop/src/i18n/locales/zh-TW.ts desktop/src/i18n/locales/jp.ts desktop/src/i18n/locales/kr.ts
  grep -n "cc-haha/" desktop/src/i18n/locales/*.ts | grep -v github.com || echo "locales clean"
  ```
  预期：`locales clean`。

- [ ] **Step 7: 同步渲染层测试**

- `desktop/src/pages/ActivitySettings.test.tsx`：第 116、154、173 行 `displayName: 'cc-haha'` → `displayName: 'Orion'`；第 201–203 行 `'cc-haha'` / `'cc-haha avatar'` → `'Orion'` / `'Orion avatar'`。
- `desktop/src/api/desktopUiPreferences.test.ts:9`：`displayName: 'cc-haha'` → `displayName: 'Orion'`。
- `desktop/src/features/pets/PetSettings.test.tsx:92`：`displayName: 'cc-haha'` → `'Orion'`；第 156 行 `/cc-haha/pets` → `/orion/pets`。

```bash
cd desktop && bun run test -- --run src/pages/ActivitySettings.test.tsx src/api/desktopUiPreferences.test.ts src/features/pets/PetSettings.test.tsx src/lib/attachmentImages.test.ts src/i18n 2>&1 | tail -10; cd ..
```
预期：全部 pass（i18n 的键一致性测试也应通过，因为只改了值）。

- [ ] **Step 8: 跑 desktop lane**

```bash
bun run check:desktop 2>&1 | tail -20
```
预期：lint（eslint + tsc）无错误、vitest 全部 pass、vite build 成功。

- [ ] **Step 9: 提交**

```bash
git add desktop/src
git commit -m "refactor(renderer): follow the product data dir rename

Generated-image detection accepts both the new and the legacy directory
so older transcripts keep rendering; default profile name and the two
path hints in the locales point at ~/.claude/orion.

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 6: 质量门禁脚本与性能脚本

**Files:**
- Modify: `scripts/quality-gate/sandbox.ts:103-104,132-136`
- Modify: `scripts/quality-gate/desktop-smoke/deterministic.ts:74`
- Modify: `scripts/quality-gate/providerTargets.ts:29`
- Modify: `scripts/perf/local-index-benchmark.ts:1231,1639`
- Modify: `scripts/quality-gate/sandbox.test.ts`、`scripts/quality-gate/agent-flow/live.test.ts`、`scripts/quality-gate/providerTargets.test.ts`、`scripts/quality-gate/desktop-smoke/deterministic.test.ts`、`scripts/perf/local-index-corpus.test.ts`

**Interfaces:**
- Consumes: `product.json`（这些脚本直接 import JSON，不经 `src/`，避免把脚本层耦合到运行时模块）

- [ ] **Step 1: 替换生产脚本**

每个文件顶部加（相对路径按目录深度）：
```ts
import product from '../../product.json'          // scripts/quality-gate/*.ts, scripts/perf/*.ts
import product from '../../../product.json'       // scripts/quality-gate/desktop-smoke/*.ts
```
然后：
- `sandbox.ts:103-104`：`'cc-haha'` → `product.dataDirName`；第 132–136 行的五个字串 `'cc-haha/xxx.json'` → `` `${product.dataDirName}/xxx.json` ``。局部变量名 `ccHahaDir` 之类可改为 `productDataDir`。
- `desktop-smoke/deterministic.ts:74`、`providerTargets.ts:29`、`local-index-benchmark.ts:1231,1639`：`'cc-haha'` → `product.dataDirName`。

```bash
grep -rnE "'cc-haha'|'cc-haha/" scripts --include='*.ts' | grep -v "\.test\." || echo "scripts clean"
```
预期：`scripts clean`。

- [ ] **Step 2: 同步脚本测试**

```bash
perl -pi -e "s/'cc-haha'/'orion'/g; s#(?<!NanmiCoder/)cc-haha/#orion/#g" scripts/quality-gate/sandbox.test.ts scripts/quality-gate/agent-flow/live.test.ts scripts/quality-gate/providerTargets.test.ts scripts/quality-gate/desktop-smoke/deterministic.test.ts scripts/perf/local-index-corpus.test.ts
grep -n "cc-haha" scripts/quality-gate/sandbox.test.ts scripts/quality-gate/agent-flow/live.test.ts scripts/quality-gate/providerTargets.test.ts scripts/quality-gate/desktop-smoke/deterministic.test.ts scripts/perf/local-index-corpus.test.ts
```
预期 grep 只剩：`mkdtemp` 前缀（`'cc-haha-live-test-'` 等）与 `deterministic.test.ts` 第 18–22 行的 `localStorage` key（`'cc-haha-locale'`、`'cc-haha-open-tabs'`、`'cc-haha-session-runtime'` —— 这些是内部 key，**保留**）。

- [ ] **Step 3: 运行这些测试**

```bash
bun test scripts/quality-gate/sandbox.test.ts scripts/quality-gate/providerTargets.test.ts scripts/quality-gate/desktop-smoke/deterministic.test.ts scripts/quality-gate/agent-flow/live.test.ts scripts/perf/local-index-corpus.test.ts 2>&1 | tail -8
```
预期：全部 pass。

- [ ] **Step 4: 跑 policy lane**

```bash
bun run check:policy 2>&1 | tail -5
```
预期：全部 pass。

- [ ] **Step 5: 提交**

```bash
git add scripts
git commit -m "refactor(scripts): sandbox and smoke scripts use the product data dir

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 7: 第 1 批整体验证与残留核对

**Files:** 无新增；只读检查，必要时小修。

- [ ] **Step 1: 全仓残留核对**

```bash
grep -rnE "'cc-haha'|\"cc-haha\"|[^/A-Za-z-]cc-haha/" src desktop/electron desktop/src adapters scripts --include='*.ts' --include='*.tsx' | grep -v "\.test\.\|github.com\|cchaha"
```
预期只剩（都是**允许残留**，属内部标识层或注释）：
- `src/services/openaiAuth/requestIdentity.ts:20`（请求身份 JSON）
- `adapters/whatsapp/session.ts:60`（WhatsApp browser 标识）
- 注释行（`// … ~/.claude/cc-haha/…`）
若出现其它路径段残留，回到对应 Task 补改并重跑该 Task 的测试。

- [ ] **Step 2: 影响面报告**

```bash
PR_BASE_REF=945a0e5 ALLOW_CLI_CORE_CHANGE=1 bun run check:impact 2>&1 | tail -30
```
预期：`Blocked: no`；`checks` 中 server / desktop / desktopNative / persistence / policy 为选中。

- [ ] **Step 3: 跑选中的 lane（若前面各 Task 已分别跑过且其后无改动，可复用结果）**

```bash
bun run check:server 2>&1 | tail -5
bun run check:electron 2>&1 | tail -5
bun run check:desktop 2>&1 | tail -5
bun run check:persistence-upgrade 2>&1 | tail -5
bun run check:policy 2>&1 | tail -5
```
预期：每条 0 fail。

- [ ] **Step 4: 真实启动冒烟（临时配置目录，不碰真实 `~/.claude`）**

```bash
SMOKE="$TMPDIR/orion-smoke-$$"; [ -n "$TMPDIR" ] || SMOKE="/tmp/orion-smoke-$$"
mkdir -p "$SMOKE/cc-haha" && echo '{"providers":[],"activeId":null}' > "$SMOKE/cc-haha/providers.json"
CLAUDE_CONFIG_DIR="$SMOKE" bun --no-env-file run src/server/index.ts --port 3458 > "$SMOKE/server.log" 2>&1 &
curl -s --retry 20 --retry-delay 1 --retry-connrefused --retry-all-errors -m 5 http://127.0.0.1:3458/health; echo
ls -la "$SMOKE/orion"; cat "$SMOKE/orion/.imported-from-cc-haha"
for pid in $(netstat -ano | grep ":3458" | grep LISTENING | awk '{print $5}' | sort -u); do taskkill //F //PID $pid >/dev/null 2>&1; done
```
预期：`/health` 返回 `{"status":"ok",…}`；`$SMOKE/orion/` 下有 `providers.json`（已被升级、含 `schemaVersion`）与标记文件（一个 ISO 时间戳）；`$SMOKE/cc-haha/providers.json` 原样未动。

- [ ] **Step 5: 汇报**

按 AGENTS.md「Handoff」格式列出：改动文件、新增测试、实际运行的命令与结果（passed / failed / skipped / blocked / not run 区分）、允许残留清单、剩余风险。第 1 批到此结束；第 2 批（桌面可见层 + 打包/更新源）另写计划。
