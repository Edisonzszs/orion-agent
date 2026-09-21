# Orion Agent 去标记（内部标识符去品牌化）设计

日期：2026-09-21
状态：待实施
前置：换牌项目 batches 1-5 已完成（`945a0e5..f5dd1d9`）；本 spec 的输入清单 = batch-5 handoff §5 的 29 行分类 + 全树实测（约 345 文件、440 非测试行）。

## 1. 目标与范围

把仓库内部标识符层的旧品牌（cc-haha / CC_HAHA / ccHaha / cchaha）清零到"可安全重命名层"，并把不可安全重命名层显式固化为永久保留清单。完成后，除保留清单外，全树 grep `cc-haha|CC_HAHA|ccHaha|cchaha` 与引擎用户可见字样 "Claude Code" 均为 0。

**三项锁定决策**（2026-09-21 用户确认）：

| 决策 | 结论 |
|---|---|
| 引擎层 "Claude Code" 字样 | 换**用户可见**的（--help、TUI 横幅、版本号后缀 `(Claude Code)`）；**模型读到的系统提示词/自述字串零改动**（改了会变模型行为，需独立评估） |
| 改名策略 | **原子全换，不留兼容别名**（产品未发布、无外部用户依赖旧名）；localStorage 例外——按仓库规矩写一次性前向迁移 |
| 永久保留清单 | 确认（见 §3），"完成"= 可安全重命名层清零 + 保留清单显式化 |

## 2. 命名映射（全项目单一约定）

| 类别 | 旧 | 新 | 说明 |
|---|---|---|---|
| 环境变量 | `CC_HAHA_*`（约 30 个名字 / ~300 行） | `ORION_*` | `CC_HAHA_SKIP_DOTENV`→`ORION_SKIP_DOTENV` 式直译；一次提交跨 src/desktop/scripts/workflows/docs 全量同步 |
| localStorage | `cc-haha-*`、`cc-haha.*`（约 15 个 key） | `orion-*`、`orion.*` | 一次性前向迁移挂 `desktop/src/lib/persistenceMigrations.ts`；行为约定（是否删旧值）随该基础设施既有惯例；旧夹具回归测试 + `check:persistence-upgrade` |
| 变量/函数名 | `ccHahaDir`、`readCcHahaSettings` 等（~60 处） | 领域命名：`productDataDir`、`readProductSettings` | 沿用 batch-1/2 确立的**领域命名而非品牌命名**惯例；不引入新的 orionXxx 品牌变量名 |
| 引擎用户可见字串 | `--help` 文案、TUI 横幅、`999.0.0-local (Claude Code)` 后缀 | `Orion Agent` | 仅用户可见；`MACRO.VERSION` 机制不变；系统提示词不动 |
| Electron partition | `cc-haha-pet`、`cc-haha-preview-*`、`persist:cc-haha-browser-app` | `orion-pet` 等 | partition 是 Chromium 存储隔离键，改名 = 该分区数据重置（宠物窗口状态/预览会话——均为可再生态，接受） |
| 临时/内部文件名 | `.cc-haha-write-test-*`、`cc-haha-processes.csv`、e2e/冒烟夹具名 | `orion-*` | |
| `.github` 根三件套 | CODEOWNERS 全 `@NanmiCoder`；FUNDING.yml（上游收款配置）；issue 模板 cchaha.ai 链接 | CODEOWNERS→`@Edisonzszs`；FUNDING.yml 删除；链接→仓库 docs URL | 上一批挂为"用户决策"，用户批准本设计即视为定案 |

## 3. 永久保留清单（"完成"的边界）

以下**不重命名、不删除**，并为每一项在代码注释或文档中标注保留原因（至少在终审残留清单中逐条列明）：

1. macOS TCC 身份 `dev.cchaha.cu-helper` 与 helper bundle/exec 名（`cc-haha-computer-use.app`）——改了丢用户辅助功能/录屏授权（OS 把授权绑在签名身份上）。
2. 安装器 legacy 恢复路径：`installer.nsh` :131/:140 双探测的旧分支、:229 `-UserDataDir/-RecoveryRoot` 旧串、ps1 :8 旧进程名兜底、smoke/恢复测试的旧安装夹具名——恢复旧安装的语义依赖。
3. 基准/确定性哈希命名空间 `cc-haha-local-index:`（scripts/perf）——改名使确定性夹具哈希全变。
4. 线上协议载荷名：requestIdentity 的 `['cc-haha', sessionId, agentId]`、WhatsApp browser 标识 `['cc-haha','desktop','1.0']`、desktopNotifications 的 `ccHahaTarget`——跨端兼容契约（改名 = 与既有部署会话断联）。
5. `claude-sidecar-*` 二进制/产物名——构建脚本、attestation 链与 CI 的跨边界契约（且 "claude" 而非 "cc-haha"）。
6. `docs/superpowers/` 历史档案（spec/plan/handoff）——项目自身的历史记录，改写即伪造。
7. git 历史中的旧提交署名/消息（含 `99527b3` 的错误署名）——历史不重写。
8. 系统提示词/模型自述中的 "Claude Code"（锁定决策 1 的另一面）。

## 4. 顺带收编的挂账项

- **B5-4（挂账）**：`desktop/scripts/windows-installer-smoke.ps1` `:16/:27/:28` 旧产物 glob/exe 名——首次 CI 的 smoke 必红项，本批修复。
- `native/cu-helper/INTEGRATION.md:301` 对已删 tauri.conf 的过时引用 → 修文本。
- 未引用死文件 `desktop/build/windows-installer-hooks.nsh`、`desktop/src-tauri/tauri.release-ci.json` → 删除（终审前 grep 确认零引用）。

## 5. 任务分期（5 个任务，一个批次）

| # | 任务 | 风险级 | 验证 |
|---|---|---|---|
| 1 | 纯机械重命名：变量/函数/注释 + 临时文件名 | 零行为 | 聚焦测试 + 车道按 impact |
| 2 | env 原子换名：`CC_HAHA_*`→`ORION_*` 全进程一次提交（含 workflows/docs/测试） | 漏改=静默失效 | 换名提交必须附全树 grep 零残留；policy/server/desktop 聚焦；冒烟 | 
| 3 | localStorage key + 前向迁移 + 旧夹具回归 | 规矩最重 | `check:persistence-upgrade` + renderer 聚焦 |
| 4 | 引擎用户可见字串（help/横幅/版本后缀） | 快照类测试可能需同步 | CLI `--version`/`--help` 冒烟 + 车道 |
| 5 | 挂账收编（§4）+ 全树终审：非保留类 grep 归零、保留清单逐条标注、Handoff | 收尾 | 全部按名对账基线 |

任务内 TDD 适用处（迁移、行为）先红后绿；纯改名以 grep+测试同步为证。

## 6. 验证与完成判据

- 每任务按 `PR_BASE_REF=<batch-base> ALLOW_CLI_CORE_CHANGE=1 bun run check:impact` 选道；本机通过标准沿用"失败集 ⊆ 已知基线（按名）"。
- **完成判据**（任务 5 终审输出）：
  1. `grep -rE "cc-haha|CC_HAHA|ccHaha|cchaha"` 全树命中**仅**保留清单 §3 中的类别 + docs/superpowers 档案；
  2. 引擎用户可见面（--help/--version/TUI 横幅）无 "Claude Code"；系统提示词零改动（diff 证明）；
  3. `.github` 根三件套处置落地；B5-4 修复落地；
  4. Handoff 交付终版保留清单（替代 batch-5 的 29 行类别图，成为事实档案）。

## 7. 风险

| 风险 | 缓解 |
|---|---|
| env 换名漏改某消费方 → 功能静默失效 | 原子提交 + 全树 grep 零残留作为提交前置；车道 + 冒烟（server /health、CLI --version、electron 构建） |
| localStorage 迁移 bug 丢 UI 状态 | 现有 persistenceMigrations 基础设施惯例 + 旧夹具回归 + persistence-upgrade 门禁 |
| partition 改名重置宠物/预览状态 | 均为可再生态，接受（§2 已注明） |
| 引擎字串改动破坏快照/文案测试 | 任务 4 内同步；终审含 CLI 冒烟 |
| grep 清零误伤保留类 | 保留清单先行（§3），终审逐条对照而非一刀切 |
