# Orion Agent 去标记（内部标识符去品牌化）— 收尾 Handoff

日期：2026-09-21
批次：`45ef527`（design spec）→ 本提交。任务 1–4 已合入（identifiers / env / storage+迁移 / 引擎字串），本文件收编任务 5（挂账收编 + 全树终审 + 本 handoff）。
前置：换牌 batches 1–5 的 29 行残留图（`2026-09-18-orion-agent-rebrand-v1-batch5-handoff.md` §5）**由本文档的终版保留清单取代**；batches 1–5 的历史结论仍以该文档为准。

## 1. 任务 5 改动汇总（本提交）

| 类别 | 内容 |
|---|---|
| 线上契约值 | `'cc-haha-provider'` → `'orion-provider'` 原子全换：`desktop/src/api/providers.ts`（union+注释）、`src/server/services/providerService.ts:499,545`（+ :491 注释）、`src/server/publicAccess.ts:301`、`src/server/__tests__/providers.test.ts` ×2、`desktop/src/pages/EmptySession.test.tsx`、`scripts/pr/run-provider-contract-tests.ts`（sandbox 前缀） |
| B5-4 挂账 | `desktop/scripts/windows-installer-smoke.ps1`：`:16` 产物 glob → `Orion-Agent-*-win-$Arch.exe`（对照 `desktop/package.json` artifactName）、`:27` → `Orion Agent.exe`、`:28` → `Uninstall Orion Agent.exe`（electron-builder `UNINSTALL_FILENAME "Uninstall ${PRODUCT_FILENAME}.exe"` 实证）、`:22` tmp 前缀、`:23` 安装目录、`:256` 诊断目录 → `orion\diagnostics\electron-host.log`、`:341/:427/:447` 新装进程名 → `Orion Agent.exe`。**未动** `:382/:384/:386` legacy 恢复夹具（§3.2 保留） |
| `.github` 三件套 | CODEOWNERS 37 处 `@NanmiCoder` → `@Edisonzszs`（含 `scripts/pr/quality-contract.test.ts` 同步 pin）；`git rm .github/FUNDING.yml`；issue 模板链接重写：cchaha.ai → 仓库 docs URL、`NanmiCoder/cc-haha#常见问题` → docs 入口、issues 链接 → `Edisonzszs/orion-agent/issues`、third-party-models 旧文档 → 现存 `docs/start/models.md` |
| 文档修正 | `native/cu-helper/INTEGRATION.md` §3.5：已删 tauri.conf 的 `externalBin` 引用改写为现状（`desktop/scripts/build-sidecars.ts` 打包路径）+ 历史注记 |
| 死文件删除 | `git rm desktop/src-tauri/windows-installer-hooks.nsh`、`desktop/src-tauri/tauri.release-ci.json` —— 任务 5 报告与 handoff 原稿宣称已删但**实际未执行**（两文件此后仍被 git 跟踪），真实落地于其后的 final-review 修复提交；落地前全树 grep 复核零引用（仅 docs/superpowers 档案与任务简报提及）。路径勘误：原 spec 误写 `desktop/build/`，git 实际跟踪路径为 `desktop/src-tauri/` |
| T1 挂账收编 | src 内 "cc-haha" 注释/日志/标签 → orion：`managedEnv.ts`（含 "Haha-specific"→"Orion-specific"）、`providerService.ts` / `types/provider.ts` / `api/providers.ts` / `api/desktop-ui.ts` / `api/models.ts` / `api/computer-use.ts` / `ws/handler.ts` / `conversationService.ts` ×3 / `agentSwarmsEnabled.ts` / `usageAccounting.ts` / `Onboarding.tsx` / `ccSwitchImport.ts` ×4 / `settings/types.ts:468`（zod describe）/ `ProviderSettings.tsx:1527`；测试标题 ×3（settings.test ×2、agentSwarmsEnabled.test） |
| 运行时字串 | `diagnosticsService.ts`：导出文件名 `cc-haha-diagnostics-*.tar.gz` → `orion-diagnostics-*`、bundle README 标题、recent-errors 头（用户可见诊断包内容）→ Orion Agent；`desktopUiPreferencesService.ts` / `managedSettingsService.ts` 恢复日志 label → orion |
| 引擎内部标识 | `goalState.ts` `<cc-haha-goal-hook>` → `<orion-goal-hook>`（会话 hook 仅内存态，sessionHooks.ts 明证，零持久化）；HTTP 头 `x-cc-haha-output-budget-source` → `x-orion-output-budget-source`、`x-cc-haha-openai-codex-stream` → `x-orion-openai-codex-stream`（常量驱动，产消两侧全在库内）；`proxy/handler.ts` Symbol 描述；grok OAuth UA `cc-haha-grok-oauth/1.0` → `orion-agent-grok-oauth/1.0`；openaiAuth 浏览器 OAuth 成功/失败页 `<title>`；FTS 探针串；`providerPresets.json` 智谱 promoText "cc-haha 用户"→"Orion Agent 用户"、AtlasCloud `utm_campaign` → `orion-agent`（测试 pin 同步） |
| 测试/脚本脚手架 | ~90 个文件 tmp 前缀 `cc-haha-*` → `orion-*`（mkdtemp/tmpdir/`/tmp`、tmux 会话名、e2e artifact 目录）；e2e 与 desktop-smoke 脚手架改为直接播种现键名（`orion-locale`/`orion-open-tabs`/`orion-session-runtime`、`<configDir>/orion/providers.json`），不再依赖迁移/legacy-import 间接生效；`recover-legacy-install-data.ps1` 自测 tmp 前缀；`native/cu-helper` build.sh mktemp 探针 + Swift 测试 pasteboard UTI；测试路径夹具（诊断 `/tmp/claude/orion/diagnostics`、trace `/tmp/orion/traces`） |
| 测试 pin 同步（锁定步进） | release-workflow.test（smoke 安装目录/siblingProbe 名）、windows-installer-process-check.test（siblingProbe）、quality-contract.test（CODEOWNERS）、provider-presets.test ×2、outputBudget/sideQuery/claudeRequiredThinking/fetch（头名）、stopHooks/execPromptHook（goal marker）、deterministic.test（localStorage 键）、computer-use-live-smoke.test（run 目录）、build.test（cursor-probe） |
| 挂账修复（终审发现） | `scripts/pr/windows-installer-recovery.test.ts:66` 预存失败（batch-5 `235ed17` 双探测重构后 pin 未同步，等同于当年 `5fcb21a` 教训；本机 stash 于干净 HEAD 复现证实预存）→ pin 同步到双探测现实 |

## 2. 测试改动

仅内容 pin 同步（§1 末两行）+ windows-installer-recovery 预存修复。无新增测试；无生产行为改动（除 §1 列出的字串/文件名/注释）。

## 3. 车道证据（本机 Windows 11 / Git Bash / bun 1.3.11）

| 命令 | 结果 | 判定 |
|---|---|---|
| `PR_BASE_REF=45ef527 ALLOW_CLI_CORE_CHANGE=1 bun run check:impact` | 421 files, areas `adapters, cli-core, desktop, docs, release, server`, label `allow-cli-core-change`, **Blocked: no** | 通过 |
| `bun run check:policy` | **329 pass / 11 fail**（340 tests, 27 files），失败 11 名与 DB-1 基线**逐一同名**：packaged artifact ×3、macOS helper cursor ×4、evaluateChangePolicy ×1、coverage gate ×1、computer-use /tmp ×2 | 通过（环境基线） |
| `bun test src/server/__tests__/providers.test.ts src/server/publicAccess.test.ts` | 142 pass / 0 fail | 通过（wire 值两侧） |
| `bun test` workflow 批（release-workflow / windows-installer-process-check / windows-installer-recovery / quality-contract） | 43 pass / 0 fail（含修复后的 recovery 3/0） | 通过 |
| `bun test` presets/headers/marker 批（provider-presets / outputBudget / sideQuery / openaiAuth.fetch / stopHooks / execPromptHook） | 54 pass / 0 fail | 通过 |
| `bun test` keeper 批（teams / workflows-api / sessions / subagentRun / conversation-service / sourceFingerprint / legacy-data-dir-import） | 542 中 5 fail —— 全部在 sessions/workflows-api，**stash 干净 HEAD 复现同名 5 fail**（win32 路径/symlink 类） | 通过（预存，按名 ⊆ 基线） |
| `cd desktop && bun run test -- --run`（EmptySession / TraceList / SettingsNavigation / generalSettings / diagnosticsSettings / Sidebar） | 6 文件 299/299 | 通过 |
| `bun test desktop-cli-launcher / cli-launcher / release-workflow --timeout 60000` | 32 pass / 3 skip / 0 fail | 通过（brief 车道） |
| `bun test package-smoke/index.test.ts` | 7 fail —— 与干净 HEAD 完全同名（macOS helper ×4 + Windows/Linux 检查 ×3，win32/macOS-only 环境） | 通过（预存） |
| `bun test native/cu-helper/build.test.ts` | 2 fail —— 干净 HEAD 同名（win32 路径分隔符 echo 差异） | 通过（预存） |
| `bun test` cuHelper/buil-sidecars 批 | 8 fail —— 干净 HEAD 同名 8 fail（win32 symlink/锁语义） | 通过（预存） |
| `bun test src/utils/windowsShellPrompts.test.ts src/utils/teleport/api.test.ts` | 150s 超时未完成（模块图加载）—— T4 记录的同一环境 flake，两者均不 import 本次改动模块 | 记录（环境 flake，非回归） |
| `bun run check:server` / `check:native` / `check:coverage` / `check:docs` / `check:persistence-upgrade` | 未跑：沿 batch-5/task-2..4 的既有裁决（win32 blocked-infra / 平台受限 / 全量质量门 / docs 未动 / T3 已绿且本次未触 renderer 持久层——persistenceMigrations 零改动） | 未跑（引用既有裁决） |
| 冒烟 | `bun --no-env-file ./bin/orion --version` → `999.0.0-local (Orion Agent)`；`--help` → `Orion Agent - starts an interactive session...` | 通过 |
| smoke ps1 实跑 | **CI-only**（脚本自抛 `CI -ne 'true'` 守卫，mutates installer registry）—— lane = `build-desktop-dev.yml` / `release-desktop.yml` 的 windows job；本地不可验，pin 层已同步 | blocked（按设计） |

**过程事故（已闭环）**：批量 sed 一度误伤保留名 `cc-haha-computer-use`（grep A 的保留排除模式把它从残留清单里藏掉了）：`package-smoke/index.ts`、`cuHelperInstall.ts`、`native/cu-helper/build.sh` 等 9 文件被改成 `orion-computer-use`，policy 瞬时 21 fail。已全部回滚为 `cc-haha-computer-use` / `cu-helper_cc-haha-computer-use.bundle`，policy 回到 329/11 同名基线，并全树 grep 复核 `orion-computer-use`/`orion-local-index` 零残留。教训已写入 §6。

## 4. 终审输出（spec §6 完成判据）

**A. 旧品牌四模式** `grep -rn "cc-haha|CC_HAHA|ccHaha|cchaha"`（src/desktop/scripts/tests/.github/bin/adapters/native/docs/site/README×2，扣 node_modules/superpowers/dist/electron-dist；tests/ 为 final-review 修复时补入的审计范围——其 3 行命中见 §5 #18）：
- 原始命中 550 行（另：`desktop/dist`、`desktop/electron-dist` 为 gitignored 构建产物，非源树，审计范围外）。
- 修复后 **238 行，全部落入下表保留类**（逐文件核对：persistenceMigrations 88、installer.nsh 48、其余为分散 keeper，见 §5）。**零未归类行**。

**B. 引擎用户可见 Claude Code**：`grep -rn "Claude Code" src --include='*.ts' --include='*.tsx' | grep -v .test.|constants/prompts` → 254 行，与任务 4 终态**逐数吻合**，全部属于其分类表的 MC/UP/CMT/FUNC/LEGACY 类（`task-4-report.md` Step 1 表为逐行枚举，Ruling DB-4 接受，本文引用不重列）。冒烟证实用户可见面（--version/--help）为 Orion Agent。

**C. 系统提示词零改动**：`git diff 45ef527..HEAD --stat -- src/constants/prompts.ts` → **空**（工作区亦干净）。

**完成判据对账**：① grep A 仅保留清单 ✓ ② 用户可见面无 Claude Code、prompts 零改动 ✓ ③ `.github` 三件套落地、B5-4 落地 ✓ ④ 本 handoff 交付终版保留清单 ✓。

## 5. 终版保留清单（取代 batch-5 §5 的 29 行图）

原则：位置 + 保留原因。T4 的 254 行 "Claude Code" kept 分类（MC/UP/CMT/FUNC/LEGACY）整体引用不重列。

| # | 保留项 | 位置（代表） | 原因 |
|---|---|---|---|
| 1 | macOS TCC 身份链 | `dev.cchaha.cu-helper`（Info.plist/attestation/keychain）、bundle/exec `cc-haha-computer-use(.app)`、SwiftPM `cu-helper_cc-haha-computer-use.bundle`、`com.claude-code-haha.desktop.sidecar` | OS 授权绑定签名身份；改名即丢全部用户辅助功能/录屏授权（spec §3.1，最高成本项） |
| 2 | 安装器 legacy 恢复语义 | installer.nsh `:131/:140`（双探测旧分支）、`:229` `-UserDataDir "$2\Claude Code Haha" -RecoveryRoot`、`:228/:288` DetailPrint "legacy cc-haha data"、recover-legacy ps1 `:262` 子目录表、smoke ps1 `:382/:384/:386`、`windows-installer-recovery.test.ts` 对应 pin、`updater.test.ts` 旧 release URL 夹具 | 恢复**改名前安装**的数据所必需；字面量即旧数据路径（spec §3.2） |
| 3 | installer.nsh 内部 NSIS 符号 | `ccHaha*` Var、`CcHaha*` Function/!macro、`cc_haha_*` 标签、`$PLUGINSDIR\cc-haha-processes.csv`；`release-workflow.test.ts:798-800` pin | 编译期内部符号，无线上/持久化契约；编译路径仅 release CI 可验（本地无 makensis），收益纯装饰、风险不对称。**可选后续**：单独 PR 内改名并跑安装器 CI |
| 4 | 确定性哈希命名空间 | `cc-haha-local-index:`（scripts/perf）及其 tmp 前缀 | 改名使确定性夹具哈希全变（spec §3.3） |
| 5 | 线上协议载荷 | requestIdentity `['cc-haha', sessionId, agentId]`、WhatsApp `['cc-haha','desktop','1.0']`、`ccHahaTarget`（desktopNotifications.ts:32 + 两个测试 pin） | 跨端兼容契约（spec §3.4） |
| 6 | `claude-sidecar-*` 产物名 | sidecarManager/build/attestation/CI | 跨边界构建契约且品牌为 "claude" 非 "cc-haha"（spec §3.5） |
| 7 | localStorage 旧键迁移表 | persistenceMigrations.ts 全部 `cc-haha-*`/`cc-haha.*` 键 + 其测试旧夹具 | T3 交付物本体：旧键→新键的一次性前向迁移，旧键字面量即迁移输入（spec §2） |
| 8 | legacy 数据目录导入 | legacyDataDirImport.ts（`<configDir>/cc-haha/` → `orion/`）+ 测试夹具/注释 | 旧目录导入语义（与 #2 同类） |
| 9 | 旧生成图片路径识别 | attachmentImages.ts 双段（orion+legacy）+ MessageList/InlineImageGallery/attachmentImages 旧路径夹具 | 识别改名前会话里的受管图片（legacy 数据语义） |
| 10 | 持久化数据命名空间 | `cc-haha:openai-reasoning:v1:`（openAIReasoningEnvelope + 6 处测试夹具）、`cc-haha-source-fingerprint:v2:`（+pin）、`cc-haha-scheduled-run-fingerprint:v1:`、transcript 条目类型 `cc-haha-task-notification`（sessionService/teamService/workflowService + 8 处 pin） | 已写入用户数据/索引 DB/transcript 的版本化命名空间；改名 = 旧数据反序列化为 null（推理信封丢失、指纹重算、旧任务通知失识别）。与 #4 同类 |
| 11 | 死 Tauri 壳源码 | `desktop/src-tauri/src/{lib,main}.rs` 的 `dir.join("cc-haha")` 探测与注释 | tauri.conf 已删、该壳不可构建（遗留源码）；其读取的本就是 legacy 数据目录。整壳删除超出本批范围 |
| 12 | 仓库指称夹具 | `NanmiCoder/cc-haha` 引用（markdown/urlBoundary/filePathBoundary/MarkdownRenderer 解析测试）、repoName `'cc-haha'` 及 Location pill（RepositoryLaunchControls ×16）、Sidebar/sessionStore/conversation-service 的用户项目路径 `D:\...\cc-haha`、`cchaha.ai` 域名解析夹具 ×2、updater 旧 release URL | 上游真实仓库/域名/用户数据现实主义：解析器必须继续处理这些真实字符串（"repo URLs stay"） |
| 13 | MIT 署名 | README.md/README.zh-CN.md:48、LICENSE、THIRD_PARTY_LICENSES.md、release-notes v0.1.0 溯源 | MIT 义务，永久（batch-5 #15） |
| 14 | 设计文档溯源 | `desktop/docs/redesign-paper-ink-seal.md:63`（BrandSeal=cc-haha 印章矢量重建） | 描述资产本身的历史出处；改写即失真 |
| 15 | 引擎 "Claude Code" kept 类 | T4 分类表 254 行（MC 75 / UP 61 / CMT 46 / FUNC 10 / LEGACY 3） | 锁定决策 1 + Ruling DB-4；`task-4-report.md` Step 1 为逐行枚举 |
| 16 | docs/superpowers 档案 + git 历史 | SDD 语料、`99527b3` 错误署名等 | 历史不重写（spec §3.6/3.7） |
| 17 | `cc-haha-computer-use-api-` tmp 前缀 | `src/server/__tests__/computer-use-api.test.ts:50` | 测试 mkdtemp 夹具前缀，历史名；**刻意不**改为 `orion-computer-use-api-`——那会在源码树引入 `orion-computer-use` 子串、污染 TCC keeper 的前缀命名空间（§6.1 事故规则；keeper-pollution 守卫会将其判失败） |
| 18 | tests/manual 历史 QA 清单 | `tests/manual/v0.4.10-to-head-ui-*.md`（3 行：`cc-haha/pets` 路径 ×2、`cc-haha/diagnostics` 路径 ×1） | 冻结的历史 QA 记录，记录的是当时真实路径，与 #16 档案同理：历史不重写 |

## 6. 残留风险

1. **批量 sed 的盲区风险已实体化过一次**（§3 事故）：grep A 的保留排除模式会**隐藏**保留名，使保留名所在文件在残留清单里"消失"、从而被 blanket sed 误伤。本次已闭环并全树复核；任何后续批量替换必须先 `grep -rn "orion-<旧保留名前缀>"` 验证零污染。
2. **e2e/desktop-smoke 脚手架改为播种现键名**后，迁移路径（localStorage 前向迁移、legacy 目录导入）在 e2e 层不再被隐式覆盖——其单元级回归仍由 persistenceMigrations.test / legacy-data-dir-import.test / `check:persistence-upgrade` 承担（T3 绿）。
3. **测试 pin 同步共 12 处**：任何再触碰 smoke ps1 / installer.nsh / CODEOWNERS / presets / 头名的改动必须 lockstep 同步（batch-5 `5fcb21a` 教训的重申）。
4. smoke ps1 的真实执行仍是 CI-only（B5-4 修复在 pin 层可验，安装器行为本身待首次 CI 运行）；`INTEGRATION.md` §3.5 描述的 build-sidecars 路径同样只有 macOS 打包链可全验。
5. 本机无法验证的面：macOS helper/packaged-artifact 检查（policy 基线 7 名）、win32 sessions/workflows 路径语义 5 名、cuHelper 8 名、build.test 2 名 —— 全部 stash 干净 HEAD 复现同名，属平台/环境预存，CI 将给最终裁决。
6. Feishu 注册名（batch-5 #13，`FEISHU_REGISTRATION_APP_NAME`）等外部平台决策项不在本批范围，仍按 batch-5 记录挂起（注：其值已在更早批次处理，此处仅指该类外部决策流程）。

## 7. 用户下一步

1. **push `main` → `Edisonzszs/orion-agent` 跑 CI**。本批后应首次全绿可期：B5-4 的 smoke ps1 产物名已修（`Orion-Agent-*-win-x64.exe` 与 package.json artifactName 一致），`build-desktop-dev.yml` 的 windows-installer-smoke 首跑重点观察：no-CLR 回退镜像场景（现已镜像 `Orion Agent.exe`）与 legacy 恢复诊断阶段。policy 车道在 CI（Linux）上应只剩 evaluateChangePolicy 计时项以内的基线集。
2. **打 `v0.1.0` tag**（`scripts/release.ts` 拾取 `release-notes/v0.1.0.md`；desktop 版本 0.1.0）。tag 后核对 compare 链接 `main@{2026-09-17}...v0.1.0`。
3. （可选）installer.nsh 内部 NSIS 符号改名（§5.3）作为独立小 PR + 安装器 CI 验证；不影响任何行为面。
