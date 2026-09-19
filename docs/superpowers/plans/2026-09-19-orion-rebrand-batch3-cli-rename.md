# Orion Agent 品牌化 · 第 3 批：CLI 启动器与仓库布局 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CLI 命令从 `claude-haha` 变为 `orion`（bin、根 package.json、启动器服务、PATH 标记含旧块迁移、sidecar 路由、错误/用法文本、语言包命令提及），删除维护者遗留文档，最后把仓库目录迁到 `E:\claude\ORION AGENT\orion-agent`。

**Architecture:** 二进制名是跨边界的单一事实：bin 脚本文件名、根 package.json 的 name/bin/scripts、server 的 dev 模式 CLI 解析路径、desktop 启动器安装的命令名与其写入 shell rc 的 PATH 标记块、打包 sidecar 的路由名单。PATH 标记改名必须带**旧块剥离迁移**（`upsertManagedPathBlock` 先按旧标记剥块、再写新块），否则已装用户的 rc 里会滞留孤儿块。目录迁移放最后，单独成任务。

**Tech Stack:** Bun 1.3、TypeScript ESM（2 空格、无分号）、bun:test（src/、scripts/）、Vitest（desktop/src）、git mv。

**Spec:** `docs/superpowers/specs/2026-09-18-orion-agent-rebrand-v1-design.md` §5（本批主体）+ §9 第 3 批行；并入第 2 批 Handoff §7 的 `settings.terminal.description` 与 PATH 标记两项。

## Global Constraints

- **逐字值**：CLI 命令 `orion`；根 package.json `name` = `orion-agent`、`bin` = `{ "orion": "./bin/orion" }`、脚本名 `orion`；`version` 保持 `999.0.0-local`（引擎 `MACRO.VERSION` 本地构建标记，spec §5 明文）；PATH 标记 `# >>> Orion Agent PATH >>>` / `# <<< Orion Agent PATH <<<`，旧标记作为 LEGACY 常量保留用于剥离。
- **迁移语义**：`upsertManagedPathBlock` 必须"先剥旧块（旧标记正则）、再 upsert 新块"——旧安装 rc 中的 `# >>> Claude Code Haha PATH >>>…<<<` 块在下次写入时被清除替换，不能出现双块。
- **本批不动**：`CC_HAHA_*` 环境变量名（含 bin 启动器内容里的 `CC_HAHA_SKIP_DOTENV`——bin 文件改名但内容零改动）、引擎层 "Claude Code" 字样（`--help`、TUI 横幅，spec §10）、`docs/` 与 `site/` 里的命令引用（第 5 批）、Feishu 注册名（B2-5）、其余内部标识（localStorage、partition、`ccHahaTarget`、哈希命名空间、macOS helper 名）。
- `bin/claude-haha` 用 `git mv` 改名（保留历史）；内容不变。
- 根 bun.lock 的 name 元数据用**外科手术式单行编辑** + `bun install --frozen-lockfile`（exit 0）验证——bun 1.3.11 的 no-op install 不重写 lock 元数据，全量重生成会带 2000+ 行注册表漂移（第 2 批已验证的方法）。
- 代码风格：ESM、2 空格、无分号；src/ 相对导入 `.js`。
- 本机车道通过标准 = **失败集 ⊆ 已知基线（按名比较）**（check:policy 325/11；renderer ~17-18 已证类；electron 566/1/9；server lane blocked-infra 用聚焦文件集；1 个已知 win32 doctor 路径失败）。慢跑加 `--timeout 15000`。
- 仓库在 `main` 直接提交；Conventional Commit + `Co-Authored-By: Claude Code <noreply@anthropic.com>`。
- **目录迁移前工作目录**：`E:\claude\ORION AGENT\cc-haha-main\cc-haha-main`；**迁移后**（仅 Task 5 起）：`E:\claude\ORION AGENT\orion-agent`。

## 与 spec 的偏差（调研后裁定）

1. **AGENTS.md / CONTRIBUTING.md 是验证性 no-op**：spec §5 要求"只替换产品名与命令名"，但调研显示两文件（及全部嵌套 AGENTS.md）**零**品牌提及（它们以泛称"the CLI"行文）。计划保留该检查步骤以证明确实无改动需要，并记录结论。
2. **`.gitignore` 的 `docs/superpowers/` 移除已在第 1 批 spec 提交时完成**（spec §5 自己注明"已完成"）——本批无动作。
3. **`settings.test.ts:686` 的 command 期望**属启动器面（Task 2），随 `DESKTOP_CLI_NAME` 同步。

## 文件结构

| 文件 | 职责 | 动作 |
|---|---|---|
| `bin/claude-haha` → `bin/orion` | CLI 启动器 | git mv（内容不变） |
| `package.json` + `bun.lock` | 根包名/bin/脚本 + lock 元数据 | 修改 |
| `src/localRecoveryCli.ts:12` | usage 文本 | 修改 |
| `src/server/services/conversationService.ts:2001,2053` | dev 模式 bin 路径 + 认证错误提示 | 修改 |
| `src/server/services/desktopCliLauncherService.ts` | DESKTOP_CLI_NAME、PATH 标记 + 旧块剥离迁移、echo ×2 | 修改 |
| `desktop/sidecars/launcherRouting.ts` | DESKTOP_CLI_NAMES | 修改 |
| `desktop/src/i18n/locales/*.ts` | `settings.terminal.description` 命令提及 | 修改 |
| `issue-triage-after-v0.5.5.md` | 维护者内部记录 | 删除 |
| 测试 ×7（print.partialOutput / cli-launcher / build-sidecars / conversation-service / desktop-cli-launcher / launcherRouting / settings / TerminalSettings） | 断言同步 + 新增旧块迁移用例 | 修改 |
| `docs/superpowers/specs/…-batch3-handoff.md` | Handoff | 新建（Task 4） |

---

### Task 1: `orion` 命令落地——bin、根 package.json、根 bun.lock、名引用

**Files:**
- Rename: `bin/claude-haha` → `bin/orion`（`git mv`，内容零改动）
- Modify: `package.json:2,7-12`（name / bin / scripts）
- Modify: `bun.lock:6`（name 元数据单行）
- Modify: `src/localRecoveryCli.ts:12`
- Modify: `src/server/services/conversationService.ts:2001,2053`
- Test: `src/cli/print.partialOutput.test.ts`、`scripts/cli-launcher.test.ts`、`desktop/scripts/build-sidecars.test.ts`

**Interfaces:**
- Produces（后续任务与运行时依赖）：可执行入口 `bin/orion`；`bun run orion` 脚本；根包名 `orion-agent`；`conversationService` dev 模式解析 `../../../bin/orion`。

- [ ] **Step 1: 先改测试（RED）**

```bash
perl -pi -e "s#\./bin/claude-haha#./bin/orion#g" src/cli/print.partialOutput.test.ts
perl -pi -e "s/'claude-haha'/'orion'/g" scripts/cli-launcher.test.ts
perl -pi -e "s#bin/claude-haha#bin/orion#g" desktop/scripts/build-sidecars.test.ts
bun test src/cli/print.partialOutput.test.ts scripts/cli-launcher.test.ts --timeout 15000 2>&1 | tail -4
cd desktop && bun test ./scripts/build-sidecars.test.ts 2>&1 | tail -4; cd ..
```
预期：三组 FAIL（引用的 bin/脚本名还不存在）。

- [ ] **Step 2: 改名与引用**

```bash
git mv bin/claude-haha bin/orion
```
`package.json` 三处：
```json
  "name": "orion-agent",
  "bin": {
    "orion": "./bin/orion"
  },
  "scripts": {
    "orion": "bun --no-env-file run ./bin/orion",
    "start": "bun --no-env-file run ./bin/orion",
```
（`version` 保持 `999.0.0-local`；其余不动。）

`bun.lock:6`：`"name": "claude-code-local",` → `"name": "orion-agent",`（仅此一行；随后验证）：
```bash
bun install --frozen-lockfile 2>&1 | tail -2
```
预期：exit 0（lock 与改名后的 package.json 同步）。若 bun 全量重写 lock（diff 巨大），`git checkout -- bun.lock` 后仅手工改第 6 行再验证。

`src/localRecoveryCli.ts:12`：`'Usage: claude-haha [options] [prompt]',` → `'Usage: orion [options] [prompt]',`

`src/server/services/conversationService.ts`：
- `:2001`：`'../../../bin/claude-haha'` → `'../../../bin/orion'`
- `:2053`：`` `./bin/claude-haha /login` `` → `` `./bin/orion /login` ``（错误提示整句里只换这一处命令）

- [ ] **Step 3: 运行，确认 GREEN**

```bash
bun test src/cli/print.partialOutput.test.ts scripts/cli-launcher.test.ts --timeout 15000 2>&1 | tail -4
cd desktop && bun test ./scripts/build-sidecars.test.ts 2>&1 | tail -4; cd ..
bun -e "import { execFileSync } from 'child_process'; console.log(execFileSync('bun', ['--no-env-file', './bin/orion', '--version'], { encoding: 'utf8' }).trim())"
```
预期：三组测试全绿；`bin/orion --version` 打印 `999.0.0-local (Claude Code)`（引擎字样属保留层）。

- [ ] **Step 4: 提交**

```bash
git add -A bin package.json bun.lock src/cli/print.partialOutput.test.ts scripts/cli-launcher.test.ts desktop/scripts/build-sidecars.test.ts src/localRecoveryCli.ts src/server/services/conversationService.ts
git commit -m "feat(cli): rename the launcher to orion

bin/claude-haha becomes bin/orion (content unchanged), the root package
is orion-agent with an orion bin/script, and the dev-mode CLI path,
recovery usage text, and auth error message follow.

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 2: 桌面启动器——命令名、PATH 标记改名与旧块迁移、sidecar 路由

**Files:**
- Modify: `src/server/services/desktopCliLauncherService.ts:18-21,285,333`（+ 迁移逻辑与 LEGACY 常量）
- Modify: `desktop/sidecars/launcherRouting.ts:6`
- Test: `src/server/__tests__/desktop-cli-launcher.test.ts`、`src/server/__tests__/settings.test.ts:686`、`desktop/sidecars/launcherRouting.test.ts`

**Interfaces:**
- Consumes: Task 1 的 `bin/orion`。
- Produces: 启动器安装命令 `orion`（Windows legacy exe 名 `orion.exe`）；新 PATH 标记 `# >>> Orion Agent PATH >>>`；`upsertManagedPathBlock` 具备旧块剥离语义（若该函数当前未导出而新测试需要，给它加 `export`——对既有调用方无影响，属本任务接口产出）。

- [ ] **Step 1: 先写/改测试（RED）**

(a) `src/server/__tests__/desktop-cli-launcher.test.ts`：
```bash
perl -pi -e "s/claude-haha/orion/g; s/# >>> Claude Code Haha PATH >>>/# >>> Orion Agent PATH >>>/g; s/# <<< Claude Code Haha PATH <<</# <<< Orion Agent PATH <<</g" src/server/__tests__/desktop-cli-launcher.test.ts
```
并在该文件的 PATH 块相关 describe 内**追加**旧块迁移用例（与文件内既有 upsert 用例同风格）：
```ts
test('upserting replaces a legacy Claude Code Haha PATH block instead of stranding it', async () => {
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
```
（import 名 `upsertManagedPathBlock` 按该测试文件既有导入；若未导入则补。若该函数尚未导出，本用例先因导入失败而红——正是 RED。）

(b) `src/server/__tests__/settings.test.ts:686`：`expect(body.command).toBe('claude-haha')` → `'orion'`。

(c) `desktop/sidecars/launcherRouting.test.ts`：`claude-haha` → `orion`（含 `/Users/demo/.local/bin/claude-haha` 路径与用例标题）。

```bash
bun test src/server/__tests__/desktop-cli-launcher.test.ts src/server/__tests__/settings.test.ts --timeout 15000 2>&1 | tail -4
cd desktop && bun test ./sidecars/launcherRouting.test.ts 2>&1 | tail -4; cd ..
```
预期：全部 RED。

- [ ] **Step 2: 改实现**

`desktopCliLauncherService.ts`：
```ts
const DESKTOP_CLI_NAME = 'orion'
const DESKTOP_CLI_WINDOWS_LEGACY_EXE = `${DESKTOP_CLI_NAME}.exe`
const PATH_BLOCK_START = '# >>> Orion Agent PATH >>>'
const PATH_BLOCK_END = '# <<< Orion Agent PATH <<<'
// Blocks written before the Orion rename still carry the Claude Code Haha
// markers; upsert must strip them or they strand as duplicate PATH exports.
const LEGACY_PATH_BLOCK_START = '# >>> Claude Code Haha PATH >>>'
const LEGACY_PATH_BLOCK_END = '# <<< Claude Code Haha PATH <<<'
```
`upsertManagedPathBlock`（约 :85 起；先看该函数实际参数名与签名）在计算现有 `escapedStart`/`pattern` **之前**先剥旧块：
```ts
  const escape = (marker: string) => marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const legacyPattern = new RegExp(`${escape(LEGACY_PATH_BLOCK_START)}[\\s\\S]*?${escape(LEGACY_PATH_BLOCK_END)}\\n?`, 'm')
  const existingContent = <原参数名>.replace(legacyPattern, '')
```
（此后所有原先直接用参数内容的地方改用 `existingContent`；既有 upsert 逻辑不变。若该函数尚未 `export` 而新测试需要，加上 `export`。）
`:285` 与 `:333` 的两处 echo：`claude-haha launcher` → `orion launcher`。

`desktop/sidecars/launcherRouting.ts:6`：
```ts
const DESKTOP_CLI_NAMES = new Set(['orion', 'orion.exe'])
```

- [ ] **Step 3: 运行，确认 GREEN**

```bash
bun test src/server/__tests__/desktop-cli-launcher.test.ts src/server/__tests__/settings.test.ts --timeout 15000 2>&1 | tail -4
cd desktop && bun test ./sidecars/launcherRouting.test.ts 2>&1 | tail -4; cd ..
```
预期：全部 pass（含新迁移用例）。

- [ ] **Step 4: 提交**

```bash
git add src/server/services/desktopCliLauncherService.ts src/server/__tests__/desktop-cli-launcher.test.ts src/server/__tests__/settings.test.ts desktop/sidecars/launcherRouting.ts desktop/sidecars/launcherRouting.test.ts
git commit -m "feat(launcher): install the orion command with PATH marker migration

The managed PATH block is renamed to Orion Agent markers and the
upsert strips legacy Claude Code Haha blocks first, so existing
installs swap cleanly instead of accumulating duplicate exports.

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 3: 语言包命令提及 + 维护者遗留文档清理

**Files:**
- Modify: `desktop/src/i18n/locales/{en,zh,zh-TW,jp,kr}.ts`（各 1 键：`settings.terminal.description`）
- Modify: `desktop/src/pages/TerminalSettings.test.tsx:311`
- Delete: `issue-triage-after-v0.5.5.md`
- 验证性 no-op：`AGENTS.md`、`CONTRIBUTING.md`、嵌套 AGENTS.md（记录"零品牌提及"结论于报告）

**Interfaces:** 无新接口。

- [ ] **Step 1: 先改测试（RED）**

```bash
perl -pi -e "s/claude-haha plugin install/orion plugin install/" desktop/src/pages/TerminalSettings.test.tsx
cd desktop && bun run test -- --run src/pages/TerminalSettings.test.tsx 2>&1 | tail -4; cd ..
```
预期：RED（locale 值还是 claude-haha）。

- [ ] **Step 2: 改语言包（行寻址全局替换，每语言 4 处命令提及）**

```bash
for f in desktop/src/i18n/locales/*.ts; do
  perl -pi -e "if (/settings\\.terminal\\.description/) { s/claude-haha/orion/g }" "$f"
done
grep -n "claude-haha" desktop/src/i18n/locales/*.ts || echo "locales clean"
```
预期：`locales clean`（terminal.description 是最后一个含该命令名的键）。

- [ ] **Step 3: 运行，确认 GREEN；删遗留文档；验证 AGENTS no-op**

```bash
cd desktop && bun run test -- --run src/pages/TerminalSettings.test.tsx src/i18n 2>&1 | tail -4; cd ..
git rm issue-triage-after-v0.5.5.md
grep -rn "claude-haha\|cc-haha\|Claude Code Haha" AGENTS.md CONTRIBUTING.md $(git ls-files '*AGENTS.md') || echo "AGENTS clean (no-op confirmed)"
```
预期：测试绿；`AGENTS clean`。

- [ ] **Step 4: 提交**

```bash
git add desktop/src/i18n/locales desktop/src/pages/TerminalSettings.test.tsx
git commit -m "feat(i18n): point the terminal help at the orion command

Locale terminal descriptions now name orion; the upstream maintainer's
issue-triage notes are removed.

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 4: 整批验证 + Handoff（迁移前）

**Files:**
- Create: `docs/superpowers/specs/2026-09-18-orion-agent-rebrand-v1-batch3-handoff.md`

- [ ] **Step 1: 残留核对（bin 名与包名层面）**

```bash
grep -rn "claude-haha\|claude-code-local" src desktop/electron desktop/src desktop/scripts desktop/sidecars scripts package.json bin adapters --include='*.ts' --include='*.tsx' --include='*.json' | grep -v "\.test\." || echo "bin-name layer clean"
grep -rn "claude-haha\|claude-code-local" src desktop scripts --include='*.test.ts' --include='*.test.tsx' || echo "test refs clean"
grep -rn "claude-haha\|Claude Code Haha PATH" docs site README.md README.zh-CN.md release-notes 2>/dev/null | wc -l
```
预期：前两条 clean；第三条**允许非零**（docs/site/README 属第 5 批——记录数量即可）。逐条分类任何意外命中：批内→补改；保留清单→记录。

- [ ] **Step 2: 影响面与车道**

```bash
PR_BASE_REF=d899fa8 ALLOW_CLI_CORE_CHANGE=1 bun run check:impact 2>&1 | tail -30
bun run check:policy 2>&1 | tail -6
bun test src/server/__tests__/conversation-service.test.ts src/server/__tests__/desktop-cli-launcher.test.ts src/server/__tests__/settings.test.ts src/cli/print.partialOutput.test.ts --timeout 15000 2>&1 | tail -4
bun run check:chat-contract 2>&1 | tail -6
```
预期：impact `Blocked: no`；policy 失败集 ⊆ 已知 11；聚焦组全绿；chat-contract 按其基线（若有失败逐名对账基线）。server 全量 lane 依既定裁定记 blocked-infra，以聚焦集替代。

- [ ] **Step 3: 迁移前冒烟（旧路径的最后一次）**

```bash
bun --no-env-file ./bin/orion --version
SMOKE="/tmp/orion-b3-smoke"; rm -rf "$SMOKE"; mkdir -p "$SMOKE"
CLAUDE_CONFIG_DIR="$SMOKE" bun --no-env-file run src/server/index.ts --port 3459 > "$SMOKE/server.log" 2>&1 &
curl -s --retry 20 --retry-delay 1 --retry-connrefused --retry-all-errors -m 5 http://127.0.0.1:3459/health; echo
for pid in $(netstat -ano | grep ":3459" | grep LISTENING | awk '{print $5}' | sort -u); do taskkill //F //PID $pid >/dev/null 2>&1; done; rm -rf "$SMOKE"
```
预期：版本行 `999.0.0-local (Claude Code)`；`/health` ok；端口清空。

- [ ] **Step 4: Handoff 并提交**

按 AGENTS.md Handoff 格式写 `docs/superpowers/specs/2026-09-18-orion-agent-rebrand-v1-batch3-handoff.md`：改动文件、测试、命令与结果（passed/failed/blocked/not-run）、残留清单（docs/site 计数 + 保留类）、剩余风险（迁移是下一步）。
```bash
git add docs/superpowers/specs/2026-09-18-orion-agent-rebrand-v1-batch3-handoff.md
git commit -m "docs: batch 3 handoff report

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 5: 目录迁移 `cc-haha-main/cc-haha-main` → `orion-agent`（最后执行）

**Files:** 无代码改动；纯仓库布局操作。

- [ ] **Step 1: 前置检查**

```bash
cd "E:/claude/ORION AGENT/cc-haha-main/cc-haha-main" && git status --short && git log --oneline -1
```
预期：工作树干净（.superpowers/ 与 .env 是 ignored，不阻塞）。

- [ ] **Step 2: 迁移（同盘 rename，秒级）**

```bash
cd "E:/claude/ORION AGENT"
mv "cc-haha-main/cc-haha-main" "orion-agent"
rmdir "cc-haha-main"
ls -d orion-agent && ls orion-agent | head -5
```
预期：`orion-agent` 存在且内容完整（bin、src、desktop、.git、node_modules、.env 等）。`cc-haha-main.zip` 保留不动。

- [ ] **Step 3: 新路径验证（spec §9：迁移后 --version 与 /health 复验）**

```bash
cd "E:/claude/ORION AGENT/orion-agent"
git status --short | head -3; git log --oneline -1
bun --no-env-file ./bin/orion --version
bun test desktop/sidecars/launcherRouting.test.ts 2>&1 | tail -3
SMOKE="/tmp/orion-b3-moved"; rm -rf "$SMOKE"; mkdir -p "$SMOKE"
CLAUDE_CONFIG_DIR="$SMOKE" bun --no-env-file run src/server/index.ts --port 3460 > "$SMOKE/server.log" 2>&1 &
curl -s --retry 20 --retry-delay 1 --retry-connrefused --retry-all-errors -m 5 http://127.0.0.1:3460/health; echo
for pid in $(netstat -ano | grep ":3460" | grep LISTENING | awk '{print $5}' | sort -u); do taskkill //F //PID $pid >/dev/null 2>&1; done; rm -rf "$SMOKE"
```
预期：git 状态与迁移前一致（历史完整）；`bin/orion --version` 正常；聚焦测试绿；`/health` 返回 ok；端口清空。

- [ ] **Step 4: 汇报**

报告迁移结果与新绝对路径（`E:\claude\ORION AGENT\orion-agent`）——控制器据此更新后续会话路径与记忆。**无提交**（布局操作不产生 git 变更）。
