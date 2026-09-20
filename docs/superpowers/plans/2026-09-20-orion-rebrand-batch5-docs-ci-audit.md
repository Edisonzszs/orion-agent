# Orion Agent 品牌化 · 第 5 批（终批）：文档、CI 与全仓审计 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成换牌的最后一层——README×2/License、docs/ 104 篇 + site/、release-notes 清零 + v0.1.0、CI 工作流（含签名可选化与 pr-triage 删除）、打包层双路径决策与遗留清理——然后做全仓最终残留审计。

**Architecture:** 纯文本/配置批次，无运行时代码改动（除 launcher 的 LEGACY 名清理常量）。机械替换用行寻址 perl + 验证 grep；两处需要判断的地方（installer.nsh 双路径、release-desktop.yml 签名可选化）以明确规则给出。CI/Linux 实际运行依赖首次 push（用户动作），本批把一切准备到位并在 Handoff 标注。

**Tech Stack:** Markdown、GitHub Actions YAML、NSIS（installer.nsh）、PowerShell（recover ps1）、bun:test。

**Spec:** `docs/superpowers/specs/2026-09-18-orion-agent-rebrand-v1-design.md` §7（文档/许可/发版说明）+ §8（CI 工作流）+ §9 第 5 批行；并入 4 份 Handoff §7 积压的全部第 5 批项。

## Global Constraints

- **逐字替换值**：产品名 `Orion Agent`；仓库 `Edisonzszs/orion-agent`（URL 形式 `https://github.com/Edisonzszs/orion-agent`）；命令 `orion`；数据目录 `~/.claude/orion/`；文档 URL `https://github.com/Edisonzszs/orion-agent/tree/main/docs`。
- **删除**：README 的赞助表/打赏/用户群/Star History/封面图；`docs/images/sponsors|donate|community/` 目录及其引用；全部 46 份 release-notes；`.github/workflows/pr-triage.yml` + `scripts/pr/pr-triage-workflow.test.ts`（并从 check:policy 清单移除）。
- **保留（legacy 语义，不得机械改名）**：installer.nsh 与 recover-legacy-install-data.ps1 中作为**旧安装数据路径**的 `Claude Code Haha` 字串（:130/:136/:221 的 app-mode.json 探测、ps1 的恢复源路径）——改为**双路径**（新增 `Orion Agent` 探测点，保留旧路径）；仅**用户可见**文案（MessageBox :275、DetailPrint :220/:280、ps1 输出消息）换牌。
- **签名可选化**（release-desktop.yml）：无 macOS 证书 → 跳过签名/公证并告警（不再拒绝）；无 SignPath → 未签名 Windows 包 + 告警；**删除**"非草稿版本未签名即失败"的拒绝逻辑。
- 引擎层 "Claude Code" 字样、`CC_HAHA_*` env、localStorage keys、Feishu 注册名（B2-5）、其余内部标识——**不动**；Feishu 名记入最终残留清单。
- 提交在 `main`；Conventional Commit + `Co-Authored-By: Claude Code <noreply@anthropic.com>`（ASCII 连字符，逐字）。
- 本机车道通过标准 = 失败集 ⊆ 已知基线（按名；policy 现 330/11@28 文件——T3 移除 pr-triage 测试后 27 文件预期 ~305/11）。慢跑 `--timeout 15000`。
- 工作目录：`E:\claude\ORION AGENT\orion-agent`。

## 预置裁定（偏差与决策）

1. **tauri.conf.\* 三个文件删除**（死配置：Electron 是宿主，tauri.conf 无人读取；package.json 引用的是 `src-tauri/icons/**` 与 `src-tauri/resources/preview-agent.js`，不引用 conf）。`desktop/README.md` 重写为两行 Electron 说明。
2. **ios/ 图标删除**（18 个 Tauri 遗留；`src-tauri/icons/**` glob 收缩，安装包变小；electron-builder 不用 ios 目录）。
3. **stale 启动器包装清理**：`desktopCliLauncherService.ts` 增 `const LEGACY_DESKTOP_CLI_NAME = 'claude-haha'`，`removeLegacyWindowsBinaryLauncher` 同时清理 `claude-haha.exe`；新增 unix `claude-haha` / `claude-haha.cmd` 包装文件的清理（若既有清理函数结构允许——以现有代码结构为准，最小实现 + 测试）。
4. **CI 实际运行 = push 后**：本批所有 workflow 改动在本地只能 YAML 校验（`node -e` 粗校验或 actionlint 若可用）；首次真实运行发生在用户 push 到 Edisonzszs/orion-agent 后，Handoff 记为用户动作。
5. **README 语言对**：英文为主、中文镜像，内容一致；封面图不放（品牌截图后续补）；致谢一句话注明基于 cc-haha（MIT）且引擎源自 Claude Code 源码——事实陈述，履行 MIT 义务。

## 文件结构

| 文件 | 动作 |
|---|---|
| `README.md` / `README.zh-CN.md` | 重写 |
| `LICENSE` | 版权行改双版权 |
| `THIRD_PARTY_LICENSES.md` | 头部加 cc-haha 条目 |
| `docs/**/*.md`（39 篇有品牌引用；路径/命令全量核对） | 机械换牌 |
| `docs/images/{sponsors,donate,community}/` + `docs/images/readme-cover-*.jpg` | 删除 |
| `site/index.html`、`site/scripts/prepare-static-output.mjs` | 换牌 + 域名可选化 |
| `release-notes/*`（46 份删）→ `release-notes/v0.1.0.md` | 删 + 新建 |
| `.github/workflows/{release-desktop,build-desktop-dev}.yml` | 换牌 + 签名可选化 |
| `.github/workflows/pr-triage.yml` + `scripts/pr/pr-triage-workflow.test.ts` | 删除 |
| `package.json`（check:policy 移除 pr-triage 测试） | 修改 |
| `desktop/build/installer.nsh`、`recover-legacy-install-data.ps1` | 双路径 + 用户可见换牌 |
| `desktop/src-tauri/tauri.conf.json`、`tauri.windows.conf.json`、`tauri.macos.conf.json`、`icons/ios/`、`desktop/README.md`、`desktop/scripts/build-*.sh` ×2 | 删/改 |
| `src/server/services/desktopCliLauncherService.ts` + 测试 | LEGACY 包装清理 |
| `scripts/pr/product-identity.test.ts` | twin-guard 结构断言 + author.email |
| `docs/superpowers/specs/…-batch4-handoff.md` | §3 lane-note 一行 true-up |
| `docs/superpowers/specs/…-batch5-handoff.md` | 新建（T6） |

---

### Task 1: README ×2 + LICENSE + THIRD_PARTY

**Files:** 重写 `README.md`、`README.zh-CN.md`；改 `LICENSE`、`THIRD_PARTY_LICENSES.md`。

- [ ] **Step 1: 重写 README.md**（全文替换为下述内容，逐字）

````markdown
# Orion Agent

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[简体中文](README.zh-CN.md) · **English**

</div>

Orion Agent is a **local-first desktop AI agent workbench** for macOS, Windows, and Linux: multi-session workspaces, diff review, subagents and Agent Teams, scheduled tasks, IM and phone access — with your own model keys and every change awaiting your approval.

> The engine is a CLI built from Claude Code sources; the desktop app is the shell around it. Nothing leaves your machine except the model traffic you configure.

## Install

Download the installer for your platform from [Releases](https://github.com/Edisonzszs/orion-agent/releases). On first launch, configure a model provider (Claude, ChatGPT, Grok, a preset, or a local endpoint) in Settings.

## Run the CLI from source

```bash
bun install
cp .env.example .env   # fill in a provider
bun run orion
```

Requires [Bun](https://bun.sh) 1.3+.

## Highlights

- **Multi-session workspace** with per-project history, global search (Ctrl+K), and branch/worktree launch
- **Review every edit** — file-by-file diffs, undo a whole turn
- **Bring your own model** — official accounts, third-party APIs, or LM Studio / Ollama locally
- **Subagents & Agent Teams** — parallel workers, visual orchestration
- **MCP, Skills, and a skill marketplace**
- **Runs on a schedule**, reachable from your phone (H5) and IM (Telegram / Feishu / WeChat / …)
- **Computer Use** with explicit authorization, and local model-request traces

## Documentation

Full docs live in [docs/](docs/) — start with [docs/en/start/index.md](docs/en/start/index.md). Internals: [architecture](docs/en/internals/desktop.md), [multi-agent](docs/en/internals/agent.md), [server](docs/en/internals/server.md).

## Tech Stack

TypeScript · Electron + React · Bun · Ink · MCP

## Acknowledgements

Orion Agent is based on [cc-haha](https://github.com/NanmiCoder/cc-haha) (MIT), whose engine was built from Claude Code sources. See [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).

## License

[MIT](LICENSE)
````

- [ ] **Step 2: 重写 README.zh-CN.md**（同结构中文镜像，逐字）

````markdown
# Orion Agent

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
**简体中文** · [English](README.md)

</div>

Orion Agent 是一个**本地优先的桌面 AI 智能体工作台**，支持 macOS / Windows / Linux：多会话工作区、逐文件 diff 审查、子智能体与 Agent Teams、定时任务、IM 与手机接入——用你自己的模型密钥，每一次改动都等你批准。

> 引擎是由 Claude Code 源码构建的 CLI，桌面端是它的外壳。除你配置的模型流量外，任何数据都不离开你的机器。

## 安装

从 [Releases](https://github.com/Edisonzszs/orion-agent/releases) 下载对应平台的安装包。首次启动后在设置里配置模型供应商（Claude / ChatGPT / Grok / 预设 / 本地端点）。

## 从源码运行 CLI

```bash
bun install
cp .env.example .env   # 填入供应商
bun run orion
```

需要 [Bun](https://bun.sh) 1.3+。

## 功能亮点

- **多会话工作区**：项目历史、全局搜索（Ctrl+K）、分支 / Worktree 启动
- **逐文件审查每次编辑**，可整轮撤销
- **自带模型**：官方账号、第三方 API、或本地 LM Studio / Ollama
- **子智能体与 Agent Teams**：并行工作、可视化编排
- **MCP、Skills 与技能市场**
- **定时任务**，手机 H5 与 IM（Telegram / 飞书 / 微信 / …）远程接入
- **Computer Use**（需显式授权）与本地模型请求追踪

## 文档

完整文档见 [docs/](docs/)，从 [docs/en/start/index.md](docs/en/start/index.md) 开始。内部架构：[桌面架构](docs/en/internals/desktop.md)、[多智能体](docs/en/internals/agent.md)、[本地服务](docs/en/internals/server.md)。

## 技术栈

TypeScript · Electron + React · Bun · Ink · MCP

## 致谢

Orion Agent 基于 [cc-haha](https://github.com/NanmiCoder/cc-haha)（MIT）构建，其引擎源自 Claude Code 源码。见 [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md)。

## 许可

[MIT](LICENSE)
````

- [ ] **Step 3: LICENSE 双版权 + THIRD_PARTY 条目**

LICENSE 第 3 行 `Copyright (c) 2026 cc-haha` 改为：
```
Copyright (c) 2026 Edisonzszs
Copyright (c) 2026 cc-haha contributors (https://github.com/NanmiCoder/cc-haha)
```
THIRD_PARTY_LICENSES.md 的 `## ripgrep` 之前插入：
```markdown
## cc-haha

- Project: cc-haha (https://github.com/NanmiCoder/cc-haha)
- Relation: this repository is a derivative work of cc-haha (MIT), rebranded and modified as Orion Agent
- License: MIT — see LICENSE
```

- [ ] **Step 4: 验证 + 提交**

```bash
grep -n "NanmiCoder\|cchaha\|Claude Code Haha\|donate\|Sponsor\|Star History\|User Group" README.md README.zh-CN.md || echo "readmes clean"
git add README.md README.zh-CN.md LICENSE THIRD_PARTY_LICENSES.md
git commit -m "docs: rewrite the READMEs for Orion Agent and dual-license the notice

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 2: docs/ 与 site/ 换牌

**Files:** `docs/**/*.md`（39 篇含品牌引用，实际全量处理）、`site/index.html`、`site/scripts/prepare-static-output.mjs`；删除 `docs/images/{sponsors,donate,community}/` 与 `docs/images/readme-cover-*.jpg`。

- [ ] **Step 1: 机械替换（对全部 docs/**/*.md）**

```bash
FILES=$(grep -rl "Claude Code Haha\|cc-haha\|cchaha\|NanmiCoder\|claude-haha\|relakkes" docs --include='*.md')
for f in $FILES; do
  perl -pi -e '
    s{Claude Code Haha}{Orion Agent}g;
    s{(?<!/)cc-haha/}{orion/}g;                     # path segments ~/.claude/cc-haha/…
    s{\./bin/claude-haha}{./bin/orion}g;
    s{(?<![a-zA-Z-])claude-haha(?![a-zA-Z-])}{orion}g;  # bare command mentions
    s{NanmiCoder/cc-haha}{Edisonzszs/orion-agent}g;
    s{https://cchaha\.ai}{https://github.com/Edisonzszs/orion-agent/tree/main/docs}g;
    s{relakkes\@gmail\.com}{}g;
  ' "$f"
done
echo "$FILES" | wc -l
```
**逐文件人工核对**（机械替换的已知盲区，实现者必须过一遍）：
- `cc-haha` 出现在**非路径/非命令**语境（如"cc-haha 的设计"）→ 改为 "Orion Agent" 或按句子改写；
- 中文 docs 里的 `cc-haha 用户` 等 → "Orion Agent 用户"；
- `docs/en/cli/*.md` 与 `docs/cli/*.md` 的 `./bin/claude-haha`/PATH 安装说明 → `orion`（命令名）；
- 残余 `cc-haha`（作为历史指称合理的，如 internals/contributing 讲上游历史的段落）→ 保留但逐条列出。

- [ ] **Step 2: 删除赞助/打赏/社群内容**

```bash
git rm -r docs/images/sponsors docs/images/donate docs/images/community 2>/dev/null
git rm docs/images/readme-cover-en.jpg docs/images/readme-cover-zh.jpg 2>/dev/null || true
grep -rln "sponsors/\|donate/\|community/\|readme-cover" docs --include='*.md' || echo "no dangling refs"
```
若有 md 引用这些图（ sponsors/donate/community 段落）——删除对应段落（各 docs 里若有"赞助/捐赠/加群"小节整体删除）。

- [ ] **Step 3: site/ 换牌**

- `site/index.html`：`:8` description、`:13-14` og、`:16` og:image 改为 `/images/banner.png`（相对路径，图不存在时不致命）或直接删 og:image 行、`:18` title → `Orion Agent — 本地优先的桌面 AI 智能体工作台`（中英各一处按现状改）。
- `site/scripts/prepare-static-output.mjs`：`:7` `const expectedCustomDomain = 'cchaha.ai'` → 改为 `const expectedCustomDomain = process.env.DOCS_CUSTOM_DOMAIN ?? ''` 且当为空串时跳过域名校验（找到使用处按空值短路）；`:236` `` `${record.title} · Claude Code Haha` `` → `` `${record.title} · Orion Agent` ``；`:244` 同理改 `Orion Agent — a local-first desktop AI agent workbench`。
- `site/vite.config.js`：在 `defineConfig(({ ... })`（若为对象则直接加字段）加 `base: process.env.VITE_BASE ?? '/'`——GitHub Pages 子路径部署时 CI 传 `VITE_BASE=/orion-agent/`（spec §8）。

- [ ] **Step 4: 验证 + 提交**

```bash
grep -rn "cchaha\|NanmiCoder\|relakkes" docs site --include='*.md' --include='*.html' --include='*.mjs' | grep -v "NanmiCoder/cc-haha" | head || true   # 上游致谢链接允许保留
bun run check:docs 2>&1 | tail -6     # site 构建 + check（需 npm 联网；失败记 blocked）
git add -A docs site
git commit -m "docs: rebrand the documentation tree and docs site

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 3: release-notes 清零 + v0.1.0 + CI 工作流

**Files:** 删 `release-notes/*`（46 份）新建 `release-notes/v0.1.0.md`；改 `.github/workflows/release-desktop.yml`、`build-desktop-dev.yml`；删 `pr-triage.yml` + `scripts/pr/pr-triage-workflow.test.ts`；改 `package.json`。

- [ ] **Step 1: v0.1.0.md（先写，删后建避免目录空窗）**

```markdown
# Orion Agent v0.1.0

首个 Orion Agent 版本，基于 cc-haha v0.6.4（MIT）完整换牌而来。

## 与 cc-haha v0.6.4 的差异

- 品牌：产品名 Orion Agent、图标与应用内标记、桌面端全部用户可见文案（5 种语言）
- 身份：打包名 `Orion-Agent-*`、appId `com.orion-agent.desktop`、自动更新源指向本仓库
- CLI：命令从 `claude-haha` 改为 `orion`（含 shell PATH 托管块自动迁移）
- 数据目录：`~/.claude/orion/`（首次启动自动从 `~/.claude/cc-haha/` 复制导入，原目录不动）
- 文档与 CI 面向本仓库重写

## 安装

在下方 Assets 下载对应平台安装包。Windows 包暂未签名（SmartScreen 提示选"仍要运行"）。

**完整变更：**[cc-haha v0.6.4...v0.1.0](https://github.com/Edisonzszs/orion-agent/compare/main@{2026-09-17}...v0.1.0)
```
（compare 链接写不准则实现者改为固定 tag 对比或删掉该行。）

- [ ] **Step 2: 清空 + 提交一次**

```bash
git rm release-notes/*.md && git add release-notes/v0.1.0.md
git commit -m "docs: clear upstream release notes and add Orion Agent v0.1.0

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

- [ ] **Step 3: workflows**

(a) `release-desktop.yml`（45 处品牌引用）：
- 全部 `Claude-Code-Haha-` 资产前缀 → `Orion-Agent-`（含 release-workflow.test 若断言 yml 内资产名——grep 确认后同步）；
- `NanmiCoder`/`cc-haha` 仓库引用 → `Edisonzszs`/`orion-agent`；
- 签名可选化：macOS 缺 `MACOS_CERTIFICATE*` 时告警跳过（去掉 notarize 硬依赖与 fail 分支）；Windows 缺 SignPath 变量时告警产出未签名包；**删除**"非草稿 + 未签名 = error 拒绝"逻辑（约 :99 一带）；
- `Claude Code Haha.app` 之类进程/窗口名 → `Orion Agent`。

(b) `build-desktop-dev.yml`：2 处品牌 → Orion Agent。

(c) 删除 pr-triage：
```bash
git rm .github/workflows/pr-triage.yml scripts/pr/pr-triage-workflow.test.ts
```
`package.json` check:policy 清单移除 ` ./scripts/pr/pr-triage-workflow.test.ts`；检查 `scripts/pr/change-policy.ts` 是否引用 pr-triage（releaseExactPaths 里有 `.github/workflows/pr-triage.yml`——从集合中删除）+ change-policy.test 如有对应断言同步。

- [ ] **Step 4: 验证 + 提交**

```bash
grep -rn "NanmiCoder\|cc-haha\|Claude Code Haha\|Claude-Code-Haha" .github/workflows/ || echo "workflows clean"
bun test ./scripts/pr/change-policy.test.ts ./scripts/pr/release-workflow.test.ts ./scripts/pr/product-identity.test.ts --timeout 15000 2>&1 | tail -4
bun run check:policy 2>&1 | tail -4   # 预期 27 文件；失败集仍 ⊆ 已知 11
git add -A .github package.json scripts/pr
git commit -m "ci: point the workflows at Edisonzszs/orion-agent and make signing optional

The release workflow follows the Orion-Agent artifact prefix, drops the
unsigned-release refusal, and the maintainer-only pr-triage lane is
removed along with its test.

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 4: 打包层——installer 双路径、遗留清理、tauri 死配置

**Files:** `desktop/build/installer.nsh`、`desktop/build/recover-legacy-install-data.ps1`、`desktop/src-tauri/tauri.conf.json`（+win/mac 变体，删）、`desktop/src-tauri/icons/ios/`（删）、`desktop/README.md`（重写 3 行）、`desktop/scripts/build-macos-arm64.sh`/`build-linux.sh`（各 1 行）、`src/server/services/desktopCliLauncherService.ts` + `desktop-cli-launcher.test.ts`。

- [ ] **Step 1: installer.nsh 双路径 + 可见文案**

规则（不是机械替换）：
- **保留** `Claude Code Haha` 作为**旧数据路径**的探测串（:130/:136 的 `$R1\Claude Code Haha\app-mode.json`、:221 的 `-UserDataDir "$2\Claude Code Haha"` 与 `Claude Code Haha Data\Recovered`）——这些在找**旧安装**的数据，改名会断恢复；
- **新增**：对 `app-mode.json` 的探测改为**先试 `Orion Agent` 再试 `Claude Code Haha`**（IfFileExists 两连跳转，保持既有 label 结构最小改动）；
- **换牌**用户可见文案：:275 双语 MessageBox 中两处 `Claude Code Haha` → `Orion Agent`（其余句子不动）、:220/:280 DetailPrint 的 `legacy Claude Code Haha data` → `legacy cc-haha data`（描述历史事实，用上游名）；
- ps1：用户输出消息中的产品名 → `Orion Agent`（描述当前安装器）；其内部恢复源路径探测若硬编码 `Claude Code Haha` 目录，**追加** `Orion Agent` 候选目录（保留旧候选）。

- [ ] **Step 2: 删除死配置与遗留**

```bash
git rm desktop/src-tauri/tauri.conf.json desktop/src-tauri/tauri.windows.conf.json desktop/src-tauri/tauri.macos.conf.json
git rm -r desktop/src-tauri/icons/ios
```
`desktop/README.md` 全文替换：
```markdown
# Orion Agent Desktop

Electron + React desktop client for Orion Agent. Build and packaging scripts live in `scripts/`; the shared icon sources are generated into `src-tauri/icons/` by `bun run branding:icons` at the repository root.
```
两个 build 脚本的 `Claude Code Haha` → `Orion Agent`（各 1 行注释/echo）。

- [ ] **Step 3: stale 启动器包装清理（LEGACY_DESKTOP_CLI_NAME）**

`desktopCliLauncherService.ts`：
```ts
const DESKTOP_CLI_NAME = 'orion'
// Pre-rename installs wrote claude-haha wrappers; cleanup must target both names.
const LEGACY_DESKTOP_CLI_NAME = 'claude-haha'
```
`removeLegacyWindowsBinaryLauncher`（~:382-410）在现有删除目标之外同时删除 `${LEGACY_DESKTOP_CLI_NAME}.exe`；若该函数所在结构便于扩展，同样清理 unix 包装 `claude-haha` 与 `claude-haha.cmd`（以现有代码形态最小实现；若 unix 清理无既有挂载点，只做 `.exe` 并在测试与报告注明）。
测试（先红后绿）：`desktop-cli-launcher.test.ts` 追加一例——预置 `claude-haha.exe` 存在的场景，断言清理后不存在且 `orion.exe` 不受影响。

- [ ] **Step 4: 验证 + 提交**

```bash
grep -n "Claude Code Haha" desktop/build/installer.nsh desktop/build/recover-legacy-install-data.ps1 | head   # 剩余应全为 legacy 路径探测或上游历史描述
bun test src/server/__tests__/desktop-cli-launcher.test.ts --timeout 15000 2>&1 | tail -3
grep -rn "src-tauri/icons/ios\|tauri.conf" desktop/package.json desktop/scripts scripts 2>/dev/null | head -3 || echo "no dangling refs"
git add -A desktop src/server
git commit -m "feat(packaging): dual-path legacy recovery and dead-config cleanup

The NSIS recovery probes Orion Agent before the legacy Claude Code Haha
locations, user-facing installer copy is rebranded, the dead Tauri
configs and iOS icon leftovers are removed, and pre-rename launcher
wrappers are cleaned up on install.

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 5: 测试加固与文档 true-up

**Files:** `scripts/pr/product-identity.test.ts`、`docs/superpowers/specs/2026-09-18-orion-agent-rebrand-v1-batch4-handoff.md`（1 行）。

- [ ] **Step 1: product-identity 追加（先红——加断言后应仍绿或揭示缺口）**

在 desktop/package.json describe 内追加：
```ts
  test('every boundary module binds product.json directly', () => {
    const read = (p: string) => readFileSync(join(root, p), 'utf8')
    expect(read('src/constants/orionProduct.ts')).toMatch(/import product from '\.\.\/\.\.\/product\.json'/)
    expect(read('desktop/electron/services/appIdentity.ts')).toMatch(/import product from '\.\.\/\.\.\/\.\.\/product\.json'/)
    expect(read('desktop/src/lib/product.ts')).toMatch(/import product from '\.\.\/\.\.\/\.\.\/product\.json'/)
  })

  test('author email is the noreply address', () => {
    expect(desktop.author.email).toBe(`${product.github.owner}@users.noreply.github.com`)
  })
```
- [ ] **Step 2: batch4 handoff §3 lane-note 一行 true-up**（:39 的"27-file list / not picked up"现在时态 → 加前缀 "Pre-fix lane note (since wired as the 28th file — see §5):"，一行编辑）。
- [ ] **Step 3: 跑测试 + 提交**

```bash
bun test ./scripts/pr/product-identity.test.ts --timeout 15000 2>&1 | tail -3
git add scripts/pr/product-identity.test.ts docs/superpowers/specs/2026-09-18-orion-agent-rebrand-v1-batch4-handoff.md
git commit -m "test(brand): pin the twin bindings and author email; true up the batch 4 lane note

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 6: 全仓最终审计 + Handoff

**Files:** 新建 `docs/superpowers/specs/2026-09-18-orion-agent-rebrand-v1-batch5-handoff.md`。

- [ ] **Step 1: 全仓残留审计（分允许类别输出清单）**

```bash
echo "== user-visible layer (must be empty or justified) =="
grep -rn "Claude Code Haha\|cchaha\.ai\|NanmiCoder\|relakkes" --include='*.md' --include='*.html' --include='*.mjs' --include='*.yml' README.md docs site .github release-notes 2>/dev/null | grep -v "NanmiCoder/cc-haha" | head -20
echo "== internal keeper layer (expected: env/localStorage/partitions/engine) =="
grep -rln "cc-haha\|CC_HAHA" src desktop/src desktop/electron adapters scripts --include='*.ts' --include='*.tsx' | wc -l
```
逐条分类成**允许残留清单**（文件+类别+原因），Feishu 名、引擎 "Claude Code"、`CC_HAHA_*`、localStorage keys、`brand-seal-glow`、哈希命名空间、installer legacy 路径、`NanmiCoder/cc-haha` 致谢链接、99527b3 历史署名——全部列入。
- [ ] **Step 2: 影响面 + 车道**（`PR_BASE_REF=f85f8d4 ALLOW_CLI_CORE_CHANGE=1 bun run check:impact` → 按选择跑：policy（27 文件新基线）、server 聚焦（launcher 测试）、check:docs 若 T2 blocked 此时补跑；desktop/electron 本批无 desktop/src 代码改动则按 impact 选择）。
- [ ] **Step 3: CI 就绪说明 + Handoff 提交**——Handoff 含：改动汇总、车道结果、允许残留清单（终版"去标记"输入）、**用户后续动作**清单：① push 到 Edisonzszs/orion-agent 触发首次 CI（符号链接/POSIX 覆盖欠账在此清偿；win32 doctor 测试归 CI）② electron:dev 人工目检（若仍未做）③ 正式发布时打 v0.1.0 tag。提交 `docs: batch 5 handoff and final residual audit`。
