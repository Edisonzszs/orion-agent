# Orion Agent v0.1 — 品牌化设计（基于 cc-haha v0.6.4）

日期：2026-09-18
状态：待实施
基线：`945a0e5 chore: baseline snapshot of cc-haha v0.6.4`

## 1. 目标与边界

第一版目标：**保留 cc-haha 全部功能，把用户看到的一切换成 Orion Agent**，作为后续演进自有智能体的起点。

已确定的决策：

| 决策项 | 结论 |
|---|---|
| 产品形态 | 与 cc-haha 相同：Electron 桌面工作台 + 本地 server + CLI 引擎 + IM 适配器，功能不裁剪 |
| 产品名 | 显示名 `Orion Agent`，短名 `Orion`，CLI 命令 `orion` |
| 数据目录 | 全局仍用 `~/.claude/`（与 Claude Code 数据互通），私有子目录 `cc-haha/` → `orion/`，首次启动从 `cc-haha/` 一次性复制导入 |
| 换牌深度 | 只做**用户可见层**；内部标识层与引擎层留给后续「去标记」阶段（见 §10） |
| 分发 | 公开发布到 GitHub Releases：`Edisonzszs/orion-agent` |
| 图标 | 用户稍后提供正式 Logo；先用占位图标，一条命令可重新生成全部尺寸 |
| 文档 | `docs/` 与 `site/` 保留并换牌；删除赞助 / 打赏 / 社群内容；`release-notes/` 清空从 v0.1.0 重新开始 |
| 实施方式 | 方案 A：`product.json` 单一来源 + 5 批替换，每批用项目自带检查验证 |

**不在本次范围内**：功能裁剪、`CC_HAHA_*` 环境变量 / `localStorage` key / WebSocket partition / sidecar 名等内部标识、引擎层的 "Claude Code" 字样与系统提示词、代码签名、文档站域名、截图重拍、遥测审计。

## 2. 品牌单一来源：`product.json`

仓库根新增：

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

仓库内四个互不 import 的代码边界各自用一个薄模块读取它（JSON import，Bun / Vite / tsc 原生支持）：

| 边界 | 模块 | 消费内容 |
|---|---|---|
| `src/`（CLI + server） | `src/constants/orionProduct.ts` | `dataDirName`、`legacyDataDirName`、`cliName`、`homepage`（默认 profile 副标题）、错误提示中的命令名 |
| `desktop/electron/` | 并入现有 `desktop/electron/services/appIdentity.ts` | `appId`（Windows AppUserModelId）、`name`（菜单 / 通知回退名）、`dataDirName` |
| `desktop/src/`（渲染层） | `desktop/src/lib/product.ts` | About 页、侧边栏链接、市场免责声明、IM 文档链接、活动页默认 handle |
| `adapters/` | `adapters/common/product.ts` | `dataDirName` |

`desktop/package.json` 中 electron-builder 的静态字段（`productName`、`appId`、`artifactName`、`publish`、`homepage`、`author`、linux `maintainer`）无法读 JSON，**直接改值**；新增 `scripts/pr/product-identity.test.ts` 断言这些字段与 `product.json` 一致，并纳入 `check:policy`。以后改名只改 `product.json`，测试会指出哪里没跟上。

`docsUrl` 暂指向仓库内 `docs/`；文档站（GitHub Pages）可用后改这一处即可。

## 3. 数据目录 `~/.claude/orion/` 与一次性导入

**路径替换**：31 个源文件中硬编码的 `'cc-haha'` 路径段全部改为引用各边界的 `dataDirName` 常量。只改文件系统路径段；`localStorage` key（如 `cc-haha-dismissed-update-version`）、Electron partition（`cc-haha-pet`、`cc-haha-preview-*`）、环境变量名一律不动。

**导入迁移**（挂在 server 现有的 `src/server/services/persistentStorageMigrations.ts` 启动流程中，幂等）：

- 触发条件：标记文件 `<configDir>/orion/.imported-from-cc-haha` 不存在 **且** `<configDir>/cc-haha/` 存在。不以「`orion/` 目录是否存在」作为条件——Electron host 或宠物窗口可能在 server 导入前就创建了 `orion/` 下的子目录，若以目录存在与否判断会让导入被跳过。
- 动作：**复制**（不是移动，保证同机的 cc-haha 继续可用）以下条目，**目标已存在的文件一律不覆盖**：`settings.json`、`providers.json`、`desktop-ui.json`、`oauth.json`、`openai-oauth.json`、`grok-oauth.json`、`computer-use-config.json`、`profile/`、`pets/`、`agent-teams/`、`public-access/`、`public-access-devices.json`、`desktop/`。
- 跳过可再生内容：`db/`（本地索引自动重建）、`traces/`、`diagnostics/`。
- 全部条目处理完且无失败后写入标记（内容为 ISO 时间戳）；标记存在则不再执行。
- 任一条目复制失败：记录到迁移报告 `failures`，继续其余条目，不写标记（下次启动重试，已复制的文件因「不覆盖」规则不会重复写）。
- 无 `cc-haha/` 的全新用户：不做任何事、不写标记；每次启动只多一次 `stat`。

Electron host 与 adapters 只改路径常量，不做迁移：它们涉及的文件（宠物窗口状态、public-access 设备表、adapters 配置）缺失时本就按空状态处理，而「不覆盖」规则保证即使它们先于 server 写入，导入仍能补齐其余文件。

**测试**（临时 `CLAUDE_CONFIG_DIR`，不碰真实 `~/.claude`）：

1. 旧夹具含 `cc-haha/` 全套条目 → 启动导入 → 断言 `orion/` 内容、跳过项不存在、标记文件存在。
2. 再次运行 → 断言不重复写入（对比 mtime / 内容）。
3. 无 `cc-haha/` → 断言 `orion/` 不被创建、无标记。
4. `orion/` 已有部分文件（模拟 Electron 抢先写入）且无标记 → 断言已有文件内容不变、缺失文件被补齐、标记写入。
5. 某条目复制失败（只读目标） → 断言其余条目完成、报告含 `failures`、标记未写。
6. 按 AGENTS.md 要求跑 `bun run check:persistence-upgrade`。

## 4. 桌面可见层与打包 / 更新

**`desktop/package.json`**：`name` → `orion-agent-desktop`；`version` → `0.1.0`；`description`、`homepage`、`author`（`Edisonzszs <Edisonzszs@users.noreply.github.com>`，不放个人邮箱）；`build.productName` → `Orion Agent`；`build.appId` → `com.orion-agent.desktop`；`artifactName` → `Orion-Agent-${version}-${os}-${arch}.${ext}`；`publish` → `github / Edisonzszs / orion-agent`；linux `maintainer` 同步。

已知后果：Electron `userData` 目录由 `productName` 决定，会从 `Claude Code Haha` 变为 `Orion Agent`，窗口状态与便携模式配置从零开始。这是新产品的正常表现，不做迁移。

**自动更新**：electron-updater 的更新源来自 electron-builder 按 `publish` 生成的 `app-update.yml`，改 `publish` 即切换到 `Edisonzszs/orion-agent`。这是必须项——不改会把 Orion 更新回 cc-haha。

**渲染层**（`desktop/src/`）：

- `desktop/index.html` `<title>`。
- `pages/settings/AboutSettings.tsx`：产品名、仓库、作者链接读 `product.ts`。
- `components/layout/Sidebar.tsx` 仓库链接；`components/market/MarketDisclaimer.tsx`；`pages/AdapterSettings.tsx` 的 `IM_CONFIG_DOCS_URL` → `docsUrl` 下的 IM 页；`pages/ActivitySettings.tsx` 默认 handle → `homepage`。
- 5 个语言包（`en` / `zh` / `zh-TW` / `jp` / `kr`）各约 8 处品牌字串：产品名 → `Orion Agent`；`settings.terminal.description` 中的 `claude-haha` 命令 → `orion`；`settings.activity.defaultHandle` → 仓库地址。
- `components/composite/BrandSeal.tsx`（cc-haha 手绘矢量标）→ 新建 `OrionMark.tsx`，**保持相同的 `size: 'sm' | 'md' | 'lg' | 'xl'` 接口**，内联渲染 `desktop/src/assets/brand/orion-mark.svg`（用 `currentColor` 以适配六套主题）；所有调用点只改 import。`BrandSeal.tsx` 删除。
- `desktop/public/app-icon.svg` / `app-icon.png` 由图标脚本生成（§6）。

**Electron host**（`desktop/electron/`）：`appIdentity.ts` 的 `WINDOWS_APP_USER_MODEL_ID` ← `appId`；`menu.ts` 回退名、`notificationSmoke.ts` 标题 ← `name`；`main.ts` / `pets.ts` / `petWindow.ts` / `sidecarManager.ts` 中的 `'cc-haha'` 路径段 ← `dataDirName`。

**server 侧用户可见字串**（`src/server/`）：`desktopUiPreferencesService.ts` 的 `DEFAULT_PROFILE_SUBTITLE` ← `homepage`；`conversationService.ts` 等错误提示中的 `./bin/claude-haha` ← `cliName`。启动横幅（`serverBanner.ts`）不含品牌字样，日志前缀属内部层，均不动。

## 5. CLI 启动器与仓库布局

- `bin/claude-haha` → `bin/orion`（内容不变，仅改名与注释）；根 `package.json`：`name` → `orion-agent`，`bin` → `{ "orion": "./bin/orion" }`，脚本 `claude-haha` → `orion`，`start` 同步。`version` 保持 `999.0.0-local`（它是引擎 `MACRO.VERSION` 的本地构建标记，属引擎层）。
- `src/server/services/desktopCliLauncherService.ts` 的 `DESKTOP_CLI_NAME` 与 `desktop/sidecars/launcherRouting.ts` 的 `DESKTOP_CLI_NAMES` → `orion` / `orion.exe`（桌面端「终端」里给用户用的命令）。`conversationService.ts` 开发模式下的 `bin/claude-haha` 路径同步；`src/localRecoveryCli.ts` 的 usage 文本同步。
- 根目录 `AGENTS.md`、`CONTRIBUTING.md`、各级嵌套 `AGENTS.md`：只替换产品名与命令名，规则不改。删除 `issue-triage-after-v0.5.5.md`（cc-haha 维护者内部记录）。
- `.gitignore`：移除 `docs/superpowers/` 一行，让设计文档与实施计划随仓库版本化（随本设计文档一并提交，已完成）；`.superpowers/`（本地状态）继续忽略。
- 目录迁移：`E:\claude\ORION AGENT\cc-haha-main\cc-haha-main` → `E:\claude\ORION AGENT\orion-agent`（含 `.git`、`node_modules`），删除空的 `cc-haha-main/` 外壳，原始 `cc-haha-main.zip` 保留不动。此步在第 3 批末尾做，之后所有命令在新路径执行。

## 6. 图标与品牌资源

- 新增 `branding/` 目录：`logo.svg`（矢量源，用于应用内标记）与 `logo-1024.png`（位图源，用于所有图标尺寸）。在用户提供正式 Logo 前放**占位图**（深色圆底 + 「O」环 + 三颗星点，纯几何，与 cc-haha 无关）。
- 新增 `scripts/branding/generate-icons.ts`（Bun + 已有依赖 `sharp`，不新增 npm 依赖），`bun run branding:icons` 生成：
  - `desktop/src-tauri/icons/`：`32x32` / `64x64` / `128x128` / `128x128@2x` / `256x256` / `512x512` / `icon.png`、`Square30..310x*Logo.png` 与 `StoreLogo.png`；
  - `desktop/src-tauri/icons/android/`（Tauri 时代遗留的 Android mipmap，Electron 打包不使用）**删除**，不再生成；
  - `icon.ico`：手写 ICO 容器，内嵌 16 / 24 / 32 / 48 / 64 / 128 / 256 的 PNG；
  - `icon.icns`：手写 ICNS 容器，内嵌 `ic07`(128) / `ic08`(256) / `ic09`(512) / `ic10`(1024) / `ic11`(32) / `ic12`(64) / `ic13`(256) / `ic14`(512) 的 PNG；
  - `desktop/public/app-icon.svg`、`app-icon.png`；
  - `desktop/src/assets/brand/orion-mark.svg`（由 `logo.svg` 复制，供 `OrionMark.tsx` 内联）。
- 测试 `scripts/branding/generate-icons.test.ts`：向临时目录生成 → 断言文件清单完整、每个 PNG 尺寸正确（`sharp().metadata()`）、ICO / ICNS 头部与条目数可被解析。
- 正式 Logo 到位后：替换 `branding/` 两个源文件 → `bun run branding:icons` → 提交。不需要改代码。

## 7. 文档、README、文档站、发版说明、许可

- **README.md / README.zh-CN.md** 重写：产品简介、从 Releases 安装、从源码运行、功能亮点（沿用 cc-haha 列表）、文档索引表、技术栈、致谢、许可。**删除**：赞助与合作表、联系邮箱、企微群二维码、打赏、Star History、封面图（正式 Logo 到位前不放封面）。致谢中明确注明：基于 [cc-haha](https://github.com/NanmiCoder/cc-haha)（MIT），其引擎源自 Claude Code 源码——一句话，事实陈述。
- **docs/**（104 篇）：正文与链接中的 `Claude Code Haha` → `Orion Agent`，`cc-haha` / `claude-haha` 命令 → `orion`，`~/.claude/cc-haha/` → `~/.claude/orion/`，`cchaha.ai` → `docsUrl`，`NanmiCoder/cc-haha` → 新仓库；删除 `docs/images/sponsors/`、`docs/images/donate/`、`docs/images/community/` 与两张 README 封面图及其引用；删除文档中的赞助 / 打赏 / 社群段落。应用截图（`docs/images/app/`）仍是 cc-haha 界面，**保留并列入后续事项**。
- **site/**：`index.html` 的 title / description / og 标签；`scripts/prepare-static-output.mjs` 的页面标题与 `expectedCustomDomain`（改为可选：无 `CNAME` 时不校验）。构建保持可用（`check:docs` 门禁继续生效）。
- **release-notes/**：删除全部 46 份 cc-haha 发版说明；新增 `v0.1.0.md`（说明首个 Orion Agent 版本基于 cc-haha v0.6.4，列出本次品牌化改动）。`scripts/release.ts` 与 `release-desktop.yml` 都按 `release-notes/v<version>.md` 读取发版说明，因此该文件是 v0.1.0 发版的必要输入。
- **LICENSE**：MIT 不变，保留 NanmiCoder 版权行（MIT 要求），新增 `Copyright (c) 2026 Edisonzszs`。**THIRD_PARTY_LICENSES.md** 新增 cc-haha 条目（MIT，上游地址）。

## 8. CI 工作流

| 工作流 | 处理 |
|---|---|
| `pr-quality.yml`、`nightly-quality.yml` | 保留，换牌 |
| `build-desktop-dev.yml` | 保留，换牌 |
| `release-desktop.yml` | 换牌为 `Edisonzszs/orion-agent`；签名改为**可选**：无 macOS 证书则跳过签名 / 公证并告警，无 SignPath 配置则产出未签名 Windows 包并告警，**不再**因未签名拒绝发布非草稿版本 |
| `deploy-docs.yml` | 保留（本就发布到 GitHub Pages），换牌；`site/` 的 Vite `base` 支持从环境变量读取以适配 `/orion-agent/` 子路径 |
| `pr-triage.yml` | 删除（cc-haha 维护者专用的 AI 分诊，依赖其仓库 secrets）；同步删除 `scripts/pr/pr-triage-workflow.test.ts` 并从 `check:policy` 移除 |

## 9. 实施批次与验证

每批一次提交（`main` 分支，本仓库无上游），提交前跑该批对应检查；全部完成后跑 `bun run verify`。

| 批 | 内容 | 验证 |
|---|---|---|
| 1 | `product.json` + 四个边界模块 + 一致性测试；31 处路径段替换；导入迁移 + 5 个测试 | `check:server`、`check:electron`、`check:adapters`、`check:persistence-upgrade`、`check:policy` |
| 2 | `desktop/package.json` 打包 / 更新源；渲染层字串、5 个语言包、About / Sidebar / Market / Adapter / Activity；`OrionMark` 占位；Electron host 字串 | `check:desktop`、`check:electron`、`check:desktop-ui-smoke`；手工 `electron:dev` 冒烟（设置临时 `CLAUDE_CONFIG_DIR`）：启动、About 页、侧边栏、设置页、新建会话界面 |
| 3 | `bin/orion`、根 `package.json`、launcher 服务、错误提示、AGENTS / CONTRIBUTING、删除分诊记录、`.gitignore`；最后做目录迁移 | `check:server`、`check:chat-contract`；迁移后 `bun --no-env-file ./src/entrypoints/cli.tsx --version` 与 server `/health` 复验 |
| 4 | `branding/` 占位源 + 生成脚本 + 测试；生成全部图标；`OrionMark` 接入真实 SVG | 脚本测试、`check:desktop`、`electron:dev` 目测图标与标记 |
| 5 | README ×2、docs 换牌与资源删除、site、release-notes、LICENSE / THIRD_PARTY、workflows | `check:docs`（需 npm 联网）、`check:policy`；`grep` 全仓确认用户可见层无残留 `Claude Code Haha` / `cchaha.ai` / `NanmiCoder`（内部标识层的 `cc-haha` / `CC_HAHA_` 允许残留，逐项列入 §10） |

**残留核对口径**：第 5 批结束时输出一份「允许残留清单」（文件 + 原因：localStorage key / 环境变量 / partition / 引擎层字样 / 测试夹具），作为「去标记」阶段的输入。

## 10. 后续事项（不在本次范围）

1. 内部标识层：`CC_HAHA_*` 环境变量、`localStorage` key、Electron partition 名、`claude-sidecar` 二进制名、代码注释中的 cc-haha。
2. 引擎层："Claude Code" 字样（`--help`、TUI 横幅、`MACRO.VERSION` 后缀、系统提示词）——改动会影响模型行为，需单独评估。
3. 应用截图重拍（`docs/images/app/`）。
4. 代码签名（macOS 证书 / Windows SignPath 或自有证书）。
5. 文档站域名与 `docsUrl` 切换到 GitHub Pages 地址。
6. 遥测审计：上游 Claude Code 的分析 / 特性开关（Statsig / GrowthBook / 事件上报）在 `.env.example` 中靶向关闭，需要系统审计。
7. 137 个 ant-only stub 与 `feature()` 门控清理；功能裁剪；自有智能体演进。

## 11. 风险

- **来源与许可**：cc-haha 为 MIT，但 `src/` 引擎源自 Anthropic 的 Claude Code 源码。公开分发基于其构建的产品存在知识产权风险，由产品所有者自行评估；本设计只保证 MIT 义务（保留版权声明）被履行。
- `userData` 目录变更导致窗口状态重置（可接受，已说明）。
- 文档截图与新品牌不一致，直到重拍（已列入后续）。
- `check:docs` 依赖 `npm --prefix site ci` 联网，国内网络可能慢或失败；失败时记录为 `blocked` 而非跳过。
- 一次性导入复制 `providers.json` 等含 API key 的文件属预期行为（同一用户、同一机器、同一权限目录），不上传、不打印。
