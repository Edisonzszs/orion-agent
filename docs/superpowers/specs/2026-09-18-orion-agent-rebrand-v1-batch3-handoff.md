# Orion Agent v0.1 Rebrand — Batch 3 Handoff (CLI rename; pre-move verification)

Base `d899fa8` (batch 2 handoff) → HEAD `f4a3ccc`. Four code commits from tasks 1-3 (each individually reviewed), the plan doc commit, and this task's ruling-1 hygiene commit. Batch scope: spec §5 — launcher rename `bin/claude-haha` → `bin/orion` (bin/package/lock/references), desktop launcher installs `orion` with PATH-marker legacy migration, five locales point terminal help at `orion` (Korean particle corrected).

**This handoff is the pre-move record.** Task 5 (next) relocates the repo directory; everything below was verified at the OLD path `E:\claude\ORION AGENT\cc-haha-main\cc-haha-main`.

## 1. Scope landed

| Commit | Subject | Files | Content |
|---|---|---|---|
| `1bb1585` | docs: batch 3 implementation plan (CLI rename + repo layout) | 1 | `.superpowers/sdd/2026-09-19-orion-rebrand-batch3-cli-rename.md` plan |
| `bb84981` | feat(cli): rename the launcher to orion | 8 | `bin/claude-haha` → `bin/orion` (git rename, content 0-changed); root `package.json` name `claude-code-local` → `orion-agent` + bin `orion` + scripts `orion`/`start`; `bun.lock` bin stanza; `scripts/cli-launcher.test.ts`, `desktop/scripts/build-sidecars.test.ts`, `src/cli/print.partialOutput.test.ts` fixture names; `src/localRecoveryCli.ts` usage text; `src/server/services/conversationService.ts` dev-mode bin path |
| `79b858e` | feat(launcher): install the orion command with PATH marker migration | 6 | `desktopCliLauncherService.ts`: writes `# >>> Orion Agent PATH >>>` markers and migrates legacy `# >>> Claude Code Haha PATH >>>` blocks (regex-matched, so old blocks are cleaned up, not stranded); `desktop/sidecars/launcherRouting.ts` command name + test; 3 test files synced (incl. `desktop-cli-launcher.test.ts` +19 lines of migration coverage) |
| `cdc82e9` | feat(i18n): point the terminal help at the orion command | 8 | 5 locale files `settings.terminal.description` → `orion`; `TerminalSettings.test.tsx` synced; also removes stale root `issue-triage-after-v0.5.5.md` (−252) |
| `6de2f74` | fix(i18n): correct the Korean particle after orion | 1 | `kr.ts`: particle form for `orion` (은/는) |
| `f4a3ccc` | chore: remove the stale root package-lock.json | 1 | Ruling 1, task 4 — see §4 |

## 2. Tests added/changed in the batch

- `src/server/__tests__/desktop-cli-launcher.test.ts` (+19 net) — PATH-marker legacy migration coverage: finds/migrates `# >>> Claude Code Haha PATH >>>` blocks, writes new `# >>> Orion Agent PATH >>>` markers.
- Companion fixture renames (assert the new bin name, no new behavior): `scripts/cli-launcher.test.ts`, `desktop/scripts/build-sidecars.test.ts`, `src/cli/print.partialOutput.test.ts`, `desktop/sidecars/launcherRouting.test.ts`, `src/server/__tests__/conversation-service.test.ts`, `src/server/__tests__/settings.test.ts`, `desktop/src/pages/TerminalSettings.test.tsx`.

## 3. Task 4 verification — commands actually run and observed results

All lanes at HEAD (task 1-3 merge `6de2f74` first, then re-run where marked after `f4a3ccc`). Windows 11, Git Bash, bun 1.3.

### Step 1 — residual greps (passed)

| Grep | Scope | Result |
|---|---|---|
| `claude-haha\|claude-code-local`, non-test code | `src desktop/electron desktop/src desktop/scripts desktop/sidecars scripts package.json bin adapters` (`*.ts/tsx/json`) | **clean** (0 hits) |
| `claude-haha\|claude-code-local`, tests | `src desktop scripts` (`*.test.ts/tsx`) | **clean** (0 hits) |
| `claude-haha\|Claude Code Haha PATH`, docs/site | `docs site README.md README.zh-CN.md release-notes` | **94 matching lines across 22 files** — allowed non-zero, batch 5 scope (see §5) |

### Step 2 — impact and lanes

- `PR_BASE_REF=d899fa8 ALLOW_CLI_CORE_CHANGE=1 bun run check:impact` (at `6de2f74`): 22 changed files, areas `cli-core, desktop, docs, server`, label `allow-cli-core-change` accepted, **Blocked: no** — passed. Re-run after `f4a3ccc` (final state): 23 files, same areas, **Blocked: no** — passed.
- `bun run check:policy`: **325 pass / 11 fail** — count exactly the known lane baseline (325/11). Names: macOS helper ×4, packaged-artifact inspection ×3, coverage-gate build ×1, computer-use `/tmp` confinement ×2 (all platform/infra), plus `evaluateChangePolicy > plan-only mode…` ×1 at 5015 ms — a 5 s timeout flake on this machine, observed pre-lockfile-removal, in place of one packaged-artifact name that passed this run. 10/11 names identical to batch 2's recorded composition; the variance is within the same pre-existing Windows-infra pool. No failure touches a CLI/launcher/i18n surface the batch changed. **passed per environment bar** (failure set reconciles to baseline).
- Focused server group (`bun test conversation-service desktop-cli-launcher settings print.partialOutput --timeout 15000`): **158 pass / 3 skip / 9 fail** — all 9 by name within baseline: 7 "Models" family (6 × `Model Options`, 1 × `Models API GET /api/models`) stash-proven pre-existing at Task 2, plus the 2 `print mode partial output` fails (Windows `uv_spawn` ENOENT on the extensionless script, proven identical on pristine main under the old name — controller ruling 2). conversation-service and desktop-cli-launcher (incl. the new migration tests) fully green. **passed per environment bar.**
- `bun run check:chat-contract`: **113 pass / 2 fail** — no recorded baseline existed for this lane, so both names were proven pre-existing fresh at pristine base `d899fa8` (worktree + `bun install --frozen-lockfile`, two runs, identical results):
  - `WebSocket Chat Integration > should keep a long desktop session alive in a /tmp project across engineering turns`
  - `WebSocket Chat Integration > should persist a completed turn before a runtime restart resumes the next turn (#1033)`

  Both `/tmp`-path-flavored (same Windows infra family as the policy lane's computer-use pair). A flaky pair (`runtime-only model switch`, `OpenAI runtime validation pending`) appeared once at HEAD and passed on in-run retry; the stable failure set is name-identical at base and HEAD. **passed per environment bar.**
- Desktop focused substitute (ruling 3 — desktop area selected by impact): `cd desktop && bun run test -- --run src/pages/TerminalSettings.test.tsx src/i18n` → **3 files, 41/41 passed** — passed.

### Step 3 — pre-move smoke at the old path (passed)

- `bun --no-env-file ./bin/orion --version` → `999.0.0-local (Claude Code)` — exactly the expected line.
- `CLAUDE_CONFIG_DIR=/tmp/orion-b3-smoke bun --no-env-file run src/server/index.ts --port 3459` — booted; `curl http://127.0.0.1:3459/health` → `{"status":"ok","timestamp":"2026-09-19T15:36:31.430Z"}`; server log confirms listening on 3459. Real `~/.claude` never touched (temp config dir only).
- Teardown: server PID killed, port 3459 verified clear via netstat, smoke dir removed.

### Checks not run fresh, and why

- `check:server` (full lane) — **blocked-infra** (standing EBUSY sandbox crash ruling, pre-existing on this machine); the focused 4-file group stands in.
- `check:desktop` (full lane) — **not run fresh** per controller ruling 3: the desktop area was selected only by the `desktop/src` locale changes, so the mandated substitute is the focused TerminalSettings+i18n run (41/41); full-lane evidence remains batch 2's name-reconciled 5856/17; batch 5's audit re-runs it.
- `check:electron`, `check:desktop-ui-smoke` — **not run**: not selected as lane mandates for this batch (no `desktop/electron` changes in the diff); batch 2 evidence stands.
- `check:agent-flow`, `check:native`, `check:docs`, `check:coverage` — selected by impact's required list but **not run fresh**: outside the task brief's Step 2 mandate (impact/policy/focused-group/chat-contract) and the batch's 22-file diff touches none of their surfaces (bin script, package metadata, launcher service, locales, tests). Batch 2 set the same precedent for batches 3-5 ownership; batch 5 runs the final repo-wide audit.
- `check:provider-contract`, `check:persistence-upgrade` — not in this batch's impact-required list (batch 2's diff differed); not run.

## 4. Ruling 1 executed — root `package-lock.json` removed (`f4a3ccc`)

**Decision: delete.** Evidence gathered before touching it:

- Root installs via bun: `bun.lock` tracked, current (updated by `bb84981` to the new bin stanza).
- No consumer of the root npm lock: all three workflows reference `site/package-lock.json` explicitly (`cache-dependency-path`, `npm --prefix site ci`); `scripts/pr/change-policy.ts:187` and the inlined copy in `pr-triage.yml` list `'package-lock.json'` only as a path→area classifier (`docsExactPaths`) — inert on deletion, no test asserts the file's existence; remaining code hits are generic filename patterns (`exampleCommands.ts` regex, `generatedFiles.ts` list, `nativeInstaller/download.ts` creates its own staging-dir lock).
- **Staleness was brand-relevant:** the lock still carried 1 × `claude-haha` (the old bin name) and 0 × `orion` — a stray `npm ci` at repo root would have reinstalled the pre-rename launcher name. Removal closes that trap.
- Guardrails honored: `desktop/package-lock.json` does not exist (`desktop/bun.lock` is the tracked lock; `.gitignore:36` already covers the npm name there) — untouched; `site/package-lock.json` is tracked and CI-consumed — untouched.

## 5. Residual list (whole-batch, final)

Class K = keeper (deliberate), F = fixture (test data, not brand), D = deferred to a later batch/ruling.

| Residual | Class | Why |
|---|---|---|
| docs/site old-brand count: **94 lines / 22 files** (`docs` 18 files, `site` 1, `release-notes` 1, `README.md` 1, `README.zh-CN.md` 1) for `claude-haha\|Claude Code Haha PATH` | D — batch 5 | Docs/site/README sweeps are batch 5 scope per spec; count recorded here as the batch 5 entry point |
| Bin-name + test-ref layers (code) | — | **Clean** — both greps 0 hits (§3 Step 1) |
| Server startup log `[Server] Claude Code API server running at …` (`src/server/index.ts:646`) | K (leaning) / batch 5 confirm | Dev-mode console line; consistent with the expected `--version` suffix `(Claude Code)` (upstream-compat naming). Not a bin-name residual; recorded for the batch 5 audit |
| `settings.terminal.description` legacy `claude-haha` mention (batch 2 keeper list) | K → now superseded | Batch 3 re-pointed the terminal help at `orion` in all 5 locales (`cdc82e9`); the batch 2 keeper entry is closed |
| Baseline failure sets: policy 325/11; chat-contract 113/2 (`/tmp` pair, base-proven); focused group 7 Models + 2 print partialOutput; renderer 5856/17 + electron 9 (batch 2, not re-run) | K | Pre-existing platform/flaky infra, proven at base by name; not re-litigated here |
| Feishu `FEISHU_REGISTRATION_APP_NAME` `'Claude Code Haha'` (`src/server/api/adapters.ts:398`) | D — still needs ruling | Carried from batch 2 checklist; externally visible registration pre-fill; controller decision pending |
| Installer layer (`installer.nsh`, `recover-legacy-install-data.ps1`, src-tauri conf) old-brand strings | D — batch 5 | Carried from batch 2 §4: legacy data locations the recovery logic must keep finding; dual-path decision is batch 5 |

## 6. Remaining risk

1. **The directory move is the next task and the main risk.** Everything in §3 was verified at the old path; after the move, re-run at minimum: `bun install`, `./bin/orion --version`, the server `/health` smoke, and a focused test spot-check. PATH-marker migration logic assumes the repo can be at a different path than when `orion` was installed — the launcher's marker cleanup must not depend on the old install path.
2. **Smoke covered dev-mode only** (`bun run src/server/index.ts`); the packaged-installer path (NSIS install of `orion` + migration on upgrade) is verified by unit tests, not exercised end-to-end on this machine.
3. **chat-contract flakiness**: the 2-name stable failure set is base-proven, but the lane flaked to 2 additional names once; if CI reports >2 fails there, treat the extras as the same infra pool before investigating brand causes.
4. **Stale npm lock removed but `docsExactPaths` entry retained**: `change-policy.ts` still lists `'package-lock.json'` — harmless (site's lock never matches the root-relative exact path), cleanup optional in a later policy tidy.
5. **Known pre-existing failures carried, not fixed** (§5 baseline row) — unchanged ownership, CI owner still pending.

## 7. Batch 4/5 checklist (accumulated)

- [ ] Task 5 (next): directory move per plan §repo-layout; post-move re-verification list in §6.1.
- [ ] Batch 5: docs/site/README sweep — 94 lines / 22 files counted in §5 (plus the `Claude Code Haha PATH` marker prose variants in docs).
- [ ] Batch 5: installer-layer dual-path decision (`installer.nsh`, `recover-legacy-install-data.ps1`), `tauri.conf.json` updater URL/product fields (or delete with batch 4 src-tauri work), `build-macos-arm64.sh:17`, `build-linux.sh:32`, `desktop/README.md:1`.
- [ ] Ruling still needed: Feishu registration app name (adapters.ts:398).
- [ ] Batch 5: unify `release-desktop.yml` asset-prefix assertions (`Orion-Agent-`); final repo-wide old-brand audit; decide `src/server/index.ts:646` log line (§5).
- [ ] Carried from batch 2: twin-guard structural import check + direct `author.email` assertion; OrionMark `flex-shrink-0`; win32 doctor path-separator CI item; ui-smoke substantive run before release.
