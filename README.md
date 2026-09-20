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

- **Multi-session workspace** with per-project history, global search (Cmd/Ctrl+K), and branch/worktree launch
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
