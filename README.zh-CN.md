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
