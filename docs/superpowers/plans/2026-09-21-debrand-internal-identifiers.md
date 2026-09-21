# Orion Agent 去标记（内部标识符）— 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 内部标识层的旧品牌清零：`CC_HAHA_*`→`ORION_*`（~70 名）、`cc-haha-*` localStorage→`orion-*`（~50 key，用户态子集带前向迁移）、5 个 ccHaha 标识符领域化重命名、引擎用户可见字串（--help/横幅/版本后缀）→ Orion Agent、挂账收编（smoke glob、.github 三件套、死文件），终审后非保留类 grep 归零。

**Architecture:** 按风险类别分五任务：零行为机械 → env 原子换（一次提交全进程）→ localStorage+迁移（规矩最重）→ 引擎用户可见字串 → 收编+终审。保留清单（spec §3）在每一步作为 grep 排除项显式携带。

**Tech Stack:** TypeScript ESM、bun:test、Vitest、perl 行寻址替换、git grep。

**Spec:** `docs/superpowers/specs/2026-09-21-debrand-internal-identifiers-design.md`（§2 命名映射、§3 保留清单、§5 分期、§6 完成判据为约束权威）。

## Global Constraints

- **原子全换不留别名**（spec 锁定决策 2）；localStorage 用户态 key 例外——一次性前向迁移（挂 `desktop/src/lib/persistenceMigrations.ts`，行为约定随该文件既有惯例），配旧夹具回归 + `bun run check:persistence-upgrade`。
- **命名映射**：`CC_HAHA_`→`ORION_`（其余大写蛇形不变）；localStorage `cc-haha-`/`cc-haha.`→`orion-`/`orion.`；标识符用**领域命名**（`ccHahaDir`→`productDataDir`、`ccHahaSettings`→`productSettings`、`getCcHahaSettingsEnv`→`getProductSettingsEnv`、`readCcHahaSettings`→`readProductSettings`；`ccHahaTarget` 是**保留项** §3.4 协议载荷，不改）。
- **永久保留清单**（grep 排除项，逐条对照 spec §3）：`dev.cchaha.cu-helper`+helper bundle 名；installer legacy 路径（nsh :131/:140/:229、ps1 :8、smoke/恢复测试旧安装夹具）；`cc-haha-local-index:` 哈希命名空间；协议载荷 `['cc-haha', sessionId, agentId]`/WhatsApp `['cc-haha','desktop','1.0']`/`ccHahaTarget`；`claude-sidecar-*`；`docs/superpowers/**`；git 历史。
- **系统提示词/模型自述零改动**：`src/constants/prompts.ts` 及任何进入模型上下文的 "You are Claude Code" 类字串不在范围；`--version`/`--help`/TUI 欢迎横幅等**用户可见**字串换 `Orion Agent`。
- 主题色 token `color="claude"`/`--color-claude`：**保留**（引擎层设计系统命名，非 cc-haha 系；改名波及面大且非本 spec 对象）。
- 每任务 TDD 适用处先红后绿；纯改名以"全树 grep 归零（扣除保留清单）+ 相关测试同步绿"为证。
- 提交在 `main`；Conventional Commit + trailer 逐字 `Co-Authored-By: Claude Code <noreply@anthropic.com>`。
- 本机车道通过标准 = 失败集 ⊆ 已知基线（按名；policy 329/11@27+1 branding=28 文件、renderer 17-18 类、electron 566/9、server blocked-infra 用聚焦、chat-contract 2、print.partialOutput 2、windows-installer-recovery 1 本机预存在）。慢跑 `--timeout 60000`（spawn 密集）。
- 工作目录：`E:\claude\ORION AGENT\orion-agent`。grep 一律 `--exclude-dir=node_modules`（含 desktop/dist、site/node_modules 等）。

## 文件结构（按任务）

| 任务 | 触及面 |
|---|---|
| 1 机械重命名 | `src/`+`desktop/` 中 5 个标识符的定义与使用点（~59 处行）；同步测试 |
| 2 env 原子换 | 全树 `CC_HAHA_` 出现点：src、desktop/{src,electron,scripts,build,sidecars}、scripts、.github/workflows、docs（用户文档中的 env 说明）、bin |
| 3 localStorage+迁移 | `desktop/src/**`（key 常量）、`desktop/src/lib/persistenceMigrations.ts`（迁移）、旧夹具测试、desktop/electron 若有 host 侧 key |
| 4 引擎字串 | `src/entrypoints/cli.tsx:47`、`src/main.tsx:3886`（版本后缀）、`src/components/LogoV2/WelcomeV2.tsx`（3 处欢迎横幅）、`src/components/IdeOnboardingDialog.tsx:73`、main.tsx 中 commander 的 `Claude Code - starts an interactive...` 描述行；相关测试 |
| 5 收编+终审 | `desktop/scripts/windows-installer-smoke.ps1:16/:27/:28`、`.github/CODEOWNERS`、删 `.github/FUNDING.yml`、`.github/ISSUE_TEMPLATE/*` 的 cchaha.ai 链接、`native/cu-helper/INTEGRATION.md:301`、删 `desktop/build/windows-installer-hooks.nsh` + `desktop/src-tauri/tauri.release-ci.json`、新 Handoff |

---

### Task 1: 机械重命名——5 个 ccHaha 标识符领域化

**Files:** 定义与使用点（grep 定位）：`src/server/services/desktopUiPreferencesService.ts`（`ccHahaDir` 局部变量）、`src/utils/managedEnv.ts`（`ccHahaSettings`/`readCcHahaSettings`/`getCcHahaSettingsEnv`）、`src/services/api/traceCapture.ts`（`ccHahaDir`）、`conversationService.ts`/`cronScheduler.ts`（`ccHahaDir`）+ 各测试。

**Interfaces:** Produces：`readProductSettings`/`getCcHahaSettingsEnv`→`getProductSettingsEnv`（若为导出，消费方同改）。`ccHahaTarget` **不改**（保留清单）。

- [ ] **Step 1: 定位全部使用点**

```bash
grep -rn "ccHahaDir\|ccHahaSettings\|readCcHahaSettings\|getCcHahaSettingsEnv" src desktop --include='*.ts' --include='*.tsx' --exclude-dir=node_modules | grep -v ccHahaTarget
```
预期 ~59 行（含测试）；逐文件记录。

- [ ] **Step 2: 逐名替换（保留 ccHahaTarget）**

```bash
for f in $(grep -rl "ccHahaDir\|ccHahaSettings\|readCcHahaSettings\|getCcHahaSettingsEnv" src desktop --include='*.ts' --include='*.tsx' --exclude-dir=node_modules); do
  perl -pi -e 's/\bccHahaDir\b/productDataDir/g; s/\bccHahaSettings\b/productSettings/g; s/\breadCcHahaSettings\b/readProductSettings/g; s/\bgetCcHahaSettingsEnv\b/getProductSettingsEnv/g' "$f"
done
grep -rn "ccHahaDir\|ccHahaSettings\|readCcHahaSettings\|getCcHahaSettingsEnv" src desktop --include='*.ts' --include='*.tsx' --exclude-dir=node_modules || echo "identifiers clean"
```
预期 `identifiers clean`（`ccHahaTarget` 不匹配上述四个词边界模式，天然保留——验证：`grep -rn ccHahaTarget` 仍有命中）。

- [ ] **Step 3: 聚焦测试**

```bash
bun test src/utils/managedEnv.test.ts src/server/__tests__/desktop-ui-preferences.test.ts src/server/__tests__/trace-capture.test.ts src/server/__tests__/conversation-service.test.ts src/server/__tests__/cron-scheduler.test.ts --timeout 60000 2>&1 | tail -4
```
预期：全绿（纯重命名；若某测试断言旧标识符字符串则同步）。

- [ ] **Step 4: 提交**

```bash
git add -A src desktop
git commit -m "refactor: rename the remaining ccHaha identifiers to domain names

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 2: env 原子换名 `CC_HAHA_*` → `ORION_*`

**Files:** 全树出现点（Step 1 定位）：src、desktop/{src,electron,scripts,build,sidecars}、scripts、.github/workflows、docs（env 说明文档）、bin。

**Interfaces:** 无新接口；**原子性约束**：读方与写方必须同一提交（不留任何旧名读写点，含测试与 workflow 环境注入）。

- [ ] **Step 1: 建立清单并定位**

```bash
grep -rhoE "CC_HAHA_[A-Z_0-9]+" src desktop scripts .github bin docs --include='*.ts' --include='*.tsx' --include='*.yml' --include='*.yaml' --include='*.sh' --include='*.ps1' --include='*.md' --include='*.nsh' --exclude-dir=node_modules | sort -u > /tmp/env-names.txt
wc -l < /tmp/env-names.txt
grep -rl "CC_HAHA_" src desktop scripts .github bin docs --exclude-dir=node_modules > /tmp/env-files.txt
wc -l < /tmp/env-files.txt
```
预期 ~70 名（以 `CC_HAHA_BOOTSTRAPPED__`/`CC_HAHA_SHOW_STARTUP_ERROR__`/`CC_HAHA_TERMINAL_ENV_START__`/`CC_HAHA_DESCENDANT_DOTENV_SENTINEL` 等双下划线哨兵结尾的**一并直译**——哨兵语义不因前缀变化而变）。

- [ ] **Step 2: 全量替换（一个动作，原子性由同一提交保证）**

```bash
for f in $(cat /tmp/env-files.txt); do
  perl -pi -e 's/\bCC_HAHA_/ORION_/g' "$f"
done
grep -rn "CC_HAHA_" src desktop scripts .github bin docs --exclude-dir=node_modules || echo "env clean"
```
预期 `env clean`。**注意**：`docs/superpowers/**` 历史档案若被 grep 命中——**排除不改**（保留清单）：替换循环前从 env-files.txt 里 `grep -v '^docs/superpowers/'` 过滤。

- [ ] **Step 3: 验证（消费方完整性）**

```bash
bun run check:policy 2>&1 | tail -4
bun test scripts/quality-gate/sandbox.test.ts scripts/quality-gate/desktop-smoke/deterministic.test.ts scripts/pr/product-identity.test.ts --timeout 60000 2>&1 | tail -4
bun --no-env-file ./bin/orion --version
SMOKE="/tmp/orion-env-smoke"; rm -rf "$SMOKE"; mkdir -p "$SMOKE"
CLAUDE_CONFIG_DIR="$SMOKE" bun --no-env-file run src/server/index.ts --port 3461 > "$SMOKE/log" 2>&1 &
curl -s --retry 20 --retry-delay 1 --retry-connrefused --retry-all-errors -m 5 http://127.0.0.1:3461/health; echo
for pid in $(netstat -ano | grep ":3461" | grep LISTENING | awk '{print $5}' | sort -u); do taskkill //F //PID $pid >/dev/null 2>&1; done; rm -rf "$SMOKE"
```
预期：policy 失败集 ⊆ 已知基线按名（env 相关测试在 policy/聚焦内同步绿——凡测试断言旧名处 Step 2 已随文件替换）；版本输出正常；/health ok（server 用到 `ORION_*` 新名照常工作）。

- [ ] **Step 4: 提交**

```bash
git add -A src desktop scripts .github bin docs
git commit -m "refactor(env): rename CC_HAHA_* environment variables to ORION_*

Atomic rename across all processes, workflows, and docs — no aliases
(the product is unreleased; nothing external reads the old names).

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 3: localStorage key 换名 + 用户态前向迁移

**Files:** `desktop/src/**` 的 key 常量定义点、`desktop/src/lib/persistenceMigrations.ts`（+其测试）、受影响组件测试；`desktop/electron/` 的 host 侧 key 与 **Electron partition 常量**（`PET_WINDOW_PARTITION='cc-haha-pet'`、`PREVIEW_SESSION_PARTITION_PREFIX='cc-haha-preview-'`、`WORKSPACE_BROWSER_PARTITION='persist:cc-haha-browser-app'` → `orion-*` 等值——partition 改名 = 该分区数据重置，宠物/预览/浏览器态均可再生，spec §7 已接受）。

**Interfaces:** Produces：迁移函数（挂入 persistenceMigrations 既有链）；迁移映射 = **用户态 key**（见 Step 1 分类），ephemeral/smoke key 与 partition 值只改名不迁移。

- [ ] **Step 1: 分类清单（用户态 vs ephemeral）**

```bash
grep -rhoE "'cc-haha[-.][a-zA-Z0-9.-]+'|\`cc-haha[-.][^\`$\{]*\`" desktop/src desktop/electron --include='*.ts' --include='*.tsx' --exclude-dir=node_modules | tr -d "'\`" | sort -u > /tmp/ls-keys.txt
wc -l < /tmp/ls-keys.txt
```
分类规则（写入报告）：**用户态（迁移）**= 跨启动持久的首选项/状态：`orion-theme`、`orion-theme-value`、`orion-dark-theme`、`orion-light-theme`、`orion-follow-system-theme`、`orion-locale`、`orion-locale-preference-*`、`orion-app-zoom`、`orion-ui-zoom`、`orion-sidebar-{width,project-order,pinned-projects,hidden-projects,project-organization,project-sort}`、`orion-open-tabs`、`orion-session-runtime`、`orion-workspace`、`orion-dismissed-update-version`、`orion-provider`、`orion-provider-config`、`orion-persistence.schemaVersion`、`orion.notifiedDesktopTaskRuns.v1`、`orion.scheduledTaskNotificationScan.v1`、`orion-chat-history`、`orion-h5-server-url`、`orion-h5-token`、`orion-open-target-preferences`、`orion-active-settings-tab`、`orion-market-disclaimer-dismissed`。**ephemeral/smoke（仅改名）**= `*-smoke-*`、`orion-electron-host-*`（诊断临时）、`orion-notification-smoke-*`、`orion-diagnostics.tar.gz`（文件名）、`orion-pdf-*`、`orion-preview-*`、`orion-portable-diagnostics`、`orion-terminal-*`、`orion-pet*`（窗口态，重置可接受——与 partition 同理）、`orion-update-smoke-*`、`orion-updater-*`、`orion-window-smoke-*`、`orion-workspace-browser-*`、`orion-custom-ripgrep-*`、`orion-ripgrep-plan-*`、`orion-config-*`、`orion-app-mode-*`、`orion-electron-runtime-*`、`orion-electron-restart-*`。边界拿不准的（如 `orion-chat-history` 若实为会话缓存）——读定义点注释定夺并记录。

- [ ] **Step 2: 先写迁移测试（RED）**

`desktop/src/lib/persistenceMigrations.test.ts` 追加（沿用该文件既有测试形态——若迁移以版本号/schema 驱动则按其模式；若以逐 key 复制函数驱动则直接测函数。以下按"逐 key 复制"通用形给出，实现者按基础设施实情适配但断言语义不变）：

```ts
describe('cc-haha → orion localStorage migration', () => {
  const MIGRATED_KEYS = [
    'cc-haha-theme', 'cc-haha-locale', 'cc-haha-sidebar-width', 'cc-haha-open-tabs',
    'cc-haha.persistence.schemaVersion', 'cc-haha.workspace',
    // …Step 1 用户态全集，实现时全列
  ]
  beforeEach(() => window.localStorage.clear())
  it('copies user-state values to orion keys when orion key is absent', () => {
    for (const key of MIGRATED_KEYS) window.localStorage.setItem(key, `v:${key}`)
    runDebrandMigration() // 按基础设施实名
    for (const key of MIGRATED_KEYS) {
      expect(window.localStorage.getItem(key.replace(/^cc-haha/, 'orion'))).toBe(`v:${key}`)
    }
  })
  it('never overwrites an existing orion key', () => {
    window.localStorage.setItem('cc-haha-theme', 'old')
    window.localStorage.setItem('orion-theme', 'mine')
    runDebrandMigration()
    expect(window.localStorage.getItem('orion-theme')).toBe('mine')
  })
  it('is idempotent', () => {
    for (const key of MIGRATED_KEYS) window.localStorage.setItem(key, 'x')
    runDebrandMigration(); runDebrandMigration()
    expect(window.localStorage.getItem('orion-theme')).toBe('x')
  })
})
```
（旧值是否删除：**随 persistenceMigrations 既有惯例**——若既有迁移复制后删旧，则同；若保留旧值，则同。测试断言与所选惯例一致。）

- [ ] **Step 3: 运行 RED**

```bash
cd desktop && bun run test -- --run src/lib/persistenceMigrations.test.ts 2>&1 | tail -4; cd ..
```
预期：新用例 FAIL（迁移函数未实现）。

- [ ] **Step 4: 实现迁移 + 全量 key 改名**

(a) 迁移：在 `persistenceMigrations.ts` 按 Step 1 用户态全集实现（映射表驱动；挂入既有迁移链的恰当位置——schemaVersion key 自身也在改名集合内，注意与既有版本迁移的先后：**先跑本次 key 迁移再跑既有 schema 迁移**，以旧 key 里的版本号为输入，除非基础设施另有惯例——按实情并在报告记录决策）。
(b) 改名：

```bash
for f in $(grep -rl "cc-haha" desktop/src desktop/electron --include='*.ts' --include='*.tsx' --exclude-dir=node_modules); do
  perl -pi -e "s/cc-haha\./orion./g; s/cc-haha-/orion-/g" "$f"
done
grep -rn "cc-haha" desktop/src desktop/electron --include='*.ts' --include='*.tsx' --exclude-dir=node_modules || echo "lskeys clean"
```
（此替换会同时命中迁移函数里的**旧 key 字面量**——迁移映射表中的旧名必须豁免：实现顺序 = 先写迁移（持有旧名字面量于映射表常量），改名 perl 后手工把映射表内的旧名恢复为 `cc-haha` 字面量（用 `LEGACY_` 前缀常量承载），再跑测试。）

- [ ] **Step 5: GREEN + 门禁**

```bash
cd desktop && bun run test -- --run src/lib/persistenceMigrations.test.ts src/lib/persistenceMigrations.ts 2>&1 | tail -3; cd ..
bun run check:persistence-upgrade 2>&1 | tail -6
```
预期：迁移测试全绿；门禁全项过（含旧夹具——若夹具文件名/内容引用旧 key，按夹具语义同步：**用户态旧夹具保留**用于证明迁移，新断言指向新 key）。

- [ ] **Step 6: 提交**

```bash
git add -A desktop/src desktop/electron
git commit -m "feat(storage): migrate localStorage keys from cc-haha to orion

One-shot forward migration for user-state keys (never overwriting,
idempotent, old-value handling per the persistence infra's convention);
ephemeral and smoke keys are renamed only. Partitions reset is accepted
for regenerable pet/preview state.

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 4: 引擎用户可见字串 → Orion Agent

**Files:** `src/entrypoints/cli.tsx:47`、`src/main.tsx:3886`（版本后缀）、`src/main.tsx` commander 描述行（`# Claude Code - starts an interactive session...`/对应英文行）、`src/components/LogoV2/WelcomeV2.tsx`（3 处 `Welcome to Claude Code`，含 AppleTerminal ASCII 艺术版）、`src/components/IdeOnboardingDialog.tsx:73`（`Welcome to Claude Code for {ideName}`）；**排除**：`src/constants/prompts.ts` 与任何模型上下文自述、`color="claude"` 主题 token、`docs/superpowers/**`。

- [ ] **Step 1: 定位用户可见面全集**

```bash
grep -rn "Claude Code" src --include='*.ts' --include='*.tsx' --exclude-dir=node_modules | grep -v "\.test\.\|constants/prompts\|/superpowers/" > /tmp/engine-strings.txt
wc -l < /tmp/engine-strings.txt && cat /tmp/engine-strings.txt | head -30
```
人工分类每行：**用户可见**（banner/help/version/错误提示里直呼产品名）→ 换 `Orion Agent`；**历史/指称上游**（如 ccSwitchImport.ts:859 注释讲 Claude Code 兼容语义）→ 保留；**模型上下文** → 保留。分类表写入报告。

- [ ] **Step 2: 先改断言再改字串（有快照/文案测试处）**

对 Step 1 中被测试断言的字串（grep 对应 *.test.* 引用）：先同步测试期望为 `Orion Agent`，跑出 RED。

- [ ] **Step 3: 改字串**

按分类表逐处编辑（banner: `Welcome to Claude Code` → `Welcome to Orion Agent`；版本后缀 `${MACRO.VERSION} (Claude Code)` → `${MACRO.VERSION} (Orion Agent)` 两处；IDE 欢迎句、help 描述行同理）。ASCII 艺术横幅若为字面排版（WelcomeV2 的 AppleTerminal 版）——若字母排版难以等宽替换，允许改为非 ASCII 艺术的文本横幅（最小视觉变化），报告注明。

- [ ] **Step 4: 冒烟 + 车道**

```bash
bun --no-env-file ./bin/orion --version        # 999.0.0-local (Orion Agent)
bun --no-env-file ./src/entrypoints/cli.tsx --help 2>&1 | head -4
bun run check:policy 2>&1 | tail -4
```
预期：版本行/帮助文案显示 Orion Agent；policy 失败集 ⊆ 基线按名。

- [ ] **Step 5: 提交**

```bash
git add -A src
git commit -m "feat(cli): identify as Orion Agent in user-visible engine strings

Banner, help, and version suffix now say Orion Agent; system prompts
and model-facing self-descriptions are intentionally untouched, and the
'claude' theme color token keeps its name.

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 5: 挂账收编 + 全树终审 + Handoff

**Files:** `desktop/scripts/windows-installer-smoke.ps1`、`.github/CODEOWNERS`、删 `.github/FUNDING.yml`、`.github/ISSUE_TEMPLATE/*`（cchaha.ai 链接）、`native/cu-helper/INTEGRATION.md:301`、删 `desktop/build/windows-installer-hooks.nsh` + `desktop/src-tauri/tauri.release-ci.json`、新建 `docs/superpowers/specs/2026-09-21-debrand-handoff.md`。

- [ ] **Step 1: 挂账修复**

(a) smoke ps1：`:16` 产物 glob `Claude-Code-Haha-*-win-$Arch.exe` → `Orion-Agent-...`、`:27` `$appExe`、`:28` `$uninstaller` 同理（对照 desktop/package.json 产物名与 nsis 的卸载器命名——读上下文取准确值）；**不动**其旧安装恢复夹具语义的行。
(b) CODEOWNERS：全部 `@NanmiCoder` → `@Edisonzszs`（38 行，perl 全替换）；删除 `.github/FUNDING.yml`；Issue 模板中 `cchaha.ai` 链接 → `https://github.com/Edisonzszs/orion-agent/tree/main/docs`。
(c) `INTEGRATION.md:301`：删除或改写对已删 tauri.conf 的引用句。
(d) 删除两个零引用死文件（删除前各 grep 全树确认零引用）。

- [ ] **Step 2: 终审 grep（完成判据，spec §6）**

```bash
echo "== A. 旧品牌四模式（扣除保留清单）=="
grep -rn "cc-haha\|CC_HAHA\|ccHaha\|cchaha" src desktop scripts .github bin adapters native docs site README.md README.zh-CN.md --exclude-dir=node_modules --exclude-dir=superpowers | grep -v "dev\.cchaha\|cc-haha-computer-use\|cc-haha-local-index\|claude-sidecar\|'cc-haha', sessionId\|'cc-haha', 'desktop'" > /tmp/final-residual.txt
wc -l < /tmp/final-residual.txt && cat /tmp/final-residual.txt
echo "== B. 引擎用户可见 Claude Code =="
grep -rn "Claude Code" src --include='*.ts' --include='*.tsx' --exclude-dir=node_modules | grep -v "\.test\.\|constants/prompts" | head -10
echo "== C. 系统提示词零改动证明 =="
git diff <batch-base>..HEAD --stat -- src/constants/prompts.ts
```
判据：A 剩余行逐条归入保留清单或修复（installer legacy 行会命中——逐条对照 spec §3.2 保留）；B 剩余全为上游指称/模型上下文（逐条列出）；C 输出为空（零改动）。

- [ ] **Step 3: 车道**

```bash
PR_BASE_REF=45ef527 ALLOW_CLI_CORE_CHANGE=1 bun run check:impact 2>&1 | tail -25
bun run check:policy 2>&1 | tail -4
bun test src/server/__tests__/desktop-cli-launcher.test.ts scripts/pr/release-workflow.test.ts --timeout 60000 2>&1 | tail -3
```
预期：Blocked: no；各道失败集 ⊆ 基线按名。

- [ ] **Step 4: Handoff + 提交**

写 `docs/superpowers/specs/2026-09-21-debrand-handoff.md`：改动汇总、车道证据、**终版保留清单**（替代 batch-5 的 29 行类别图：每项 = 位置+保留原因）、残留分类表（Step 2 的 A/B 输出逐条归类）、用户动作（push→CI 现在应全绿——B5-4 已修；v0.1.0 tag）。

```bash
git add -A .github desktop/scripts desktop/build desktop/src-tauri native docs/superpowers/specs/2026-09-21-debrand-handoff.md
git commit -m "chore: sweep parked de-brand items and close with the final residual audit

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```
