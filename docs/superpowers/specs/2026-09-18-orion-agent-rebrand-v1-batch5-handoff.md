# Orion Agent v0.1 Rebrand — Batch 5 Handoff (docs, CI, final audit — closing)

**Batch verdict: DONE_WITH_CONCERNS** — all six tasks landed and individually reviewed; the whole-repo audit found the user-visible layer clean outside classified residuals, **plus one genuine lane regression that this audit caught and closed** (T4's ps1 rebrand desynced a content pin in `release-workflow.test.ts`, putting policy at 12 failing names — one outside baseline; repaired in `5fcb21a`, policy back to **329 pass / 11 fail across 27 files with exactly the known 11 names**). The rebrand project (batches 1–5) is complete; §5 is the final residual list and the input for the future 去标记 (internal-identifier de-branding) phase.

Base `f85f8d4` (batch 4 close) → HEAD. Batch scope per spec §7 + §8 + §9 batch-5 row and the four handoff §7 backlogs: README×2/License/THIRD_PARTY (Task 1), docs/ + site/ rebrand (Task 2), release-notes reset + v0.1.0 + CI workflows incl. optional signing and pr-triage removal (Task 3), installer dual-path + dead-config cleanup + legacy launcher-wrapper cleanup (Task 4), twin-binding hardening tests (Task 5), and this whole-repo audit + handoff (Task 6).

## 1. Scope landed

| Commit | Subject | Files | Content |
|---|---|---|---|
| `ae68c52` | docs: batch 5 implementation plan (docs, CI, final audit) | 1 | plan doc |
| `bd7138a` | docs: use four-backtick fences for the README contents in the batch 5 plan | 1 | plan defect fix (preflight) |
| `361f4bb` | docs: rewrite the READMEs for Orion Agent and dual-license the notice | 4 (+70/−395) | README ×2 full rewrite (sponsors/cover/badges removed, cc-haha MIT acknowledgement kept), LICENSE dual copyright, THIRD_PARTY cc-haha block |
| `b16ecbf` | docs: rebrand the documentation tree and docs site | 61 (+204/−245) | 35 docs md, 13 sponsor/donate/community images + CNAME + ads.txt deleted, site/ rebrand + domain optional (`DOCS_CUSTOM_DOMAIN`/`VITE_BASE`), banner.svg |
| `ab94bc9` | fix(docs): align installer filenames and stray old-brand prose | 11 (+29/−29) | review fixes: `Claude-Code-Haha-` artifact prefix, bare "Haha", `ClaudeCodeHaha` bot example, SVG "Haha" wordmarks |
| `1bbec2e` | docs: clear upstream release notes and add Orion Agent v0.1.0 | 46 (+13/−3473) | 45 upstream notes removed; `release-notes/v0.1.0.md` added |
| `171e5d1` | ci: point the workflows at Edisonzszs/orion-agent and make signing optional | 9 (+91/−423) | release-desktop.yml + build-desktop-dev.yml rebrand; signing warn-and-skip instead of refuse; SignPath XML pe-file names synced; pr-triage lane + test deleted; check:policy list → 27 files |
| `235ed17` | feat(packaging): dual-path legacy recovery and dead-config cleanup | 29 (+92/−180) | installer.nsh dual probe (Orion Agent first, Claude Code Haha fallback) + visible copy rebrand; ps1 message rebrand + self-test sync; tauri.conf ×3 + icons/ios/ deleted; `LEGACY_DESKTOP_CLI_NAME` launcher cleanup (win+unix) |
| `4ff371b` | test(brand): pin the twin bindings and author email; true up the batch 4 lane note | 2 (+12/−1) | twin-guard structural import test + `author.email` noreply assertion; batch-4 handoff lane-note prefix |
| `5fcb21a` | test(packaging): sync the workflow pin to the rebranded recovery message | 1 (+1/−1) | **audit-caused repair** (§3): `release-workflow.test.ts` NSIS-recovery pin synced to `managed outside Orion Agent` |
| (this commit) | docs: batch 5 handoff and final residual audit | 1 | this document |

Diff totals `f85f8d4..5fcb21a`: **157 files, +940/−4747** (impact report's "Changed files: 157" matches exactly).

## 2. Tests added/changed in the batch

- `src/server/__tests__/desktop-cli-launcher.test.ts` — `windowsOnly` legacy-cleanup case (`claude-haha.exe`/`.cmd` removed, `orion.exe`+`orion.cmd` survive) + `unixOnly` full-flow case (first executes on CI/Linux; skipped on this win32 machine).
- `desktop/src-tauri/tauri-config.test.ts` — CSP case removed (guarded the deleted dead conf), Cargo.toml case kept.
- `scripts/pr/release-workflow.test.ts` — T3: asset/name assertions synced to `Orion-Agent-*`/`Orion Agent.exe|app`, signing-optional behavior re-pinned; T6 repair: recovery-message pin synced (`5fcb21a`).
- `scripts/pr/change-policy.test.ts` — pr-triage rows removed with the lane.
- `scripts/pr/product-identity.test.ts` — T5: `every boundary module binds product.json directly` + `author email is the noreply address` (6 tests total, 42 expects).

## 3. Task 6 verification — commands actually run and observed results

Windows 11, Git Bash, bun 1.3.11, at `5fcb21a` (post-repair) unless noted. Batch-diff impact: `PR_BASE_REF=f85f8d4 ALLOW_CLI_CORE_CHANGE=1 bun run check:impact` → **157 changed files, areas `desktop, docs, release, server`, label `allow-cli-core-change`, Blocked: no**; selected: policy, server, chat-contract, native, docs, coverage.

| Command | Observed | Verdict |
|---|---|---|
| `bun run check:policy` (fresh, first run at `4ff371b`) | **328 pass / 12 fail across 27 files** — 11 names within the known baseline **plus one new name**: `release desktop workflow > Windows NSIS installer recovers only registered legacy install-directory data`, failing on `toContain('Active CLAUDE_CONFIG_DIR is managed outside Claude Code Haha')` | **failed the bar by exactly 1 name** — T4-caused pin desync; root cause + repair below |
| `bun test ./scripts/pr/release-workflow.test.ts --timeout 60000` (after `5fcb21a` repair) | **27 pass / 0 fail**, 433 expect() calls | **passed** |
| `bun run check:policy` (fresh, at `5fcb21a`) | **329 pass / 11 fail across 27 files** (340 tests, 41.5 s). Failure set = exactly the known 11 by name: `evaluateChangePolicy > plan-only mode…` ×1 (5 s-timeout pool), macOS helper cursor ×4, packaged-artifact inspection ×3, coverage-gate transcript-classifier ×1, computer-use `/tmp` confinement ×2 | **passed per environment bar** (reconciles with T3's 327/11: T3's run predated T4's ps1 edit so the NSIS test was passing then; +2 = T5's new product-identity tests → 329) |
| `bun test src/server/__tests__/desktop-cli-launcher.test.ts --timeout 60000` | **4 pass / 3 skip / 0 fail**, 12 expects. Skips = `unixOnly`/nix-only cases owed to CI/Linux | **passed** |
| `bun run check:chat-contract` (fresh) | Suite 1 (websocket-handler): **passed** 1.6 s. Suite 2 (conversations): **113 pass / 2 fail** — `keep a long desktop session alive in a /tmp project…` + `persist a completed turn before a runtime restart… (#1033)`; both names are the batch-3-proven pre-existing win32 baseline (proven at pristine base `d899fa8` in a worktree, twice — batch-3 handoff §"Step 2"). Lane aborts at suite 2 | **passed per environment bar** (suite-level FAIL recorded for the lane; failure set ⊆ recorded baseline by name) |
| chat-contract suite 3 standalone (`cd desktop && bun run test -- --run src/api/websocket.test.ts src/stores/chatStore.test.ts src/pages/EmptySession.test.tsx`) | **3 files, 352/352 passed** | **passed** (fresh; covers the lane's un-reached third suite) |
| `bun run check:docs` | **Not run fresh — reused.** T2 recorded the full chain green twice (`npm --prefix site ci` + build + check + node --test): "Documentation check passed: 96 pages, 337 local links and images, 25 bilingual app screenshot pairs", site tests 12/12 — initial and post-review-fix runs. Nothing after T2 (`b16ecbf`/`ab94bc9`) touched `docs/` outside `superpowers/` (manifest-excluded), `site/`, or README | **passed (reused evidence, cited)** — rerun advisable on a machine with clean npm network if the docs tree moves again |
| `bun run check:server` (full lane) | Not run fresh — standing win32 blocked-infra/baseline ruling (batch-3 handoff: focused server group 158/3/9, all in baseline). The batch's only `src/` runtime change (`desktopCliLauncherService.ts`) is covered by the focused launcher test above; the server suites most coupled to the diff (websocket-handler, conversations) ran fresh green/under chat-contract | **not run** (standing ruling cited) |
| `bun run check:native` | Blocked on this machine — requires swift checks + sidecar build + electron packaging + macOS signing chain (win32). Batch 5 changed no native/ code | **blocked** (platform) |
| `bun run check:coverage` | Not run fresh — full-suite quality-gate lane; no coverage-relevant production code changed in the batch (docs/config/tests only + one service whose focused lane is green). The coverage-gate unit test inside policy runs in the 11-name baseline | **not run** (recorded reason) |
| Audit greps (§4) + supplementary sweeps | see §4 | **passed** (all hits classified) |

**The `5fcb21a` repair (why this audit changed a file):** Task 4 rebranded the recovery helper's user-visible message at `desktop/build/recover-legacy-install-data.ps1:379` (`managed outside Claude Code Haha` → `managed outside Orion Agent`) and synced the ps1's internal self-test mirror (`:888`) — but `scripts/pr/release-workflow.test.ts:764` also pins that string externally, and the pin was missed (it was outside T4's brief file list, the same class as T4's accepted `tauri-config.test.ts` deviation). No task in the batch ran the full policy lane after T4, so the desync surfaced only in this final audit. Per AGENTS.md ("repair of failures caused by the change") and the task's own bar ("the SAME 11 failure names"), the one-line lockstep sync was committed separately rather than leaving `main` red by one name at project close. No behavior changed; the test pins the string the ps1 has actually shipped since `235ed17`.

## 4. Step 1 — whole-repo residual audit (the two greps, verbatim, plus sweeps)

```text
== user-visible layer (must be empty or justified) ==
61 hits total; after excluding docs/superpowers/ (59 hits, 9 files — SDD history corpus):
  .github/FUNDING.yml:1:github: NanmiCoder
  .github/ISSUE_TEMPLATE/feature_request.md:12:- …[现有功能文档](https://cchaha.ai)…
== internal keeper layer (expected: env/localStorage/partitions/engine) ==
309 files (src 179, desktop 88, scripts 32, adapters 10; 183 of them test files)
```

Supplementary sweeps (bare `cchaha`, `cc-haha`, `claude-haha`, `Claude-Code-Haha`, extensionless `.github` files) added only already-classified items: CODEOWNERS (38 `@NanmiCoder` lines), the QA-doc live identifiers, the codex-redesign provenance path, and the mandated v0.1.0 provenance lines. **No unclassified user-visible old-brand string remains.**

## 5. FINAL residual list — the 去标记 phase's input

Class: **K** = permanent keeper · **I** = internal identifier (de-branding phase scope; rename needs coordinated migration) · **L** = legacy-data probe (keeper until legacy recovery retires) · **D** = deferred (decision/work pending) · **H** = history (recorded, never rewritten) · **C** = cosmetic.

| # | Residual | Where (representative) | Class | Reason / de-branding note |
|---|---|---|---|---|
| 1 | Engine-layer "Claude Code" wording — help text, TUI banner, version suffix (`999.0.0-local (Claude Code)`), system prompts, `Claude Code` GitHub-workflow content | 241 non-test files across `src/`, `desktop/`, `adapters/` (e.g. `src/constants/github-app.ts`, `src/constants/claudeCodeCompatibility.ts`) | K | Spec §10-2: engine is built from Claude Code sources; wording changes can alter model behavior — separate evaluation, never mechanical |
| 2 | `CC_HAHA_*` env vars — ~80 distinct names, ~700 occurrences (`CC_HAHA_LOCAL_ACCESS_TOKEN`, `CC_HAHA_LOCAL_INDEX`, `CC_HAHA_TRACE_API_CALLS`, `CC_HAHA_SIGN_IDENTITY`, `CC_HAHA_CI_KEYCHAIN`, `CC_HAHA_APP_PORTABLE_DIR`, …) | `src/`, `desktop/`, `scripts/`, `native/` (build.sh), `.github/workflows/` | I | Cross-boundary contracts (build scripts, CI, sidecars, quality gates). Rename = one coordinated sweep + doc sync (`docs/cli/env.md` documents many) |
| 3 | `cc-haha-*` localStorage keys — 16+ (`cc-haha-computer-use`, `-open-tabs`, `-theme`, `-app-zoom`, `-locale`, `-session-runtime`, `-light-theme`, `-dark-theme`, `-task-notification`, `-data`, `-ui-zoom`, `-output-budget-source`, `-provider`, `-backup-*`, `-follow-system-theme`) | `desktop/src/**` stores/settings | I | Persisted user state. Rename requires forward migration + old-fixture regression + `bun run check:persistence-upgrade` (AGENTS.md rule) |
| 4 | Electron partitions: `cc-haha-pet`, `cc-haha-preview-<id>`, `persist:cc-haha-browser-app` | `desktop/electron/services/petWindow.ts:24`, `previewSession.ts:4`, `workspaceBrowser.ts:36` | I | Session-storage identity; renaming orphans existing sessions/cookies |
| 5 | requestIdentity tuple first element `'cc-haha'` | `src/services/openaiAuth/requestIdentity.ts:20` (`JSON.stringify(['cc-haha', sessionId, agentId])`) | I | Identity derivation input; renaming changes derived ids |
| 6 | WhatsApp bridge browser id `['cc-haha','desktop','1.0']` | `adapters/whatsapp/session.ts:60` | I | Client identity sent to the bridge server protocol |
| 7 | Notification extras key `ccHahaTarget` | `desktop/src/lib/desktopNotifications.ts:32` | I | Windows toast extras key; safe only with a read-old/write-new shim |
| 8 | CSS class `brand-seal-glow` | `desktop/src/pages/ActiveSession.tsx:809`, `EmptySession.tsx:669` (+ styles) | C/I | Pure class name; rename is a two-file + CSS mechanical change |
| 9 | Hash namespace `cc-haha-local-index:` + `cc-haha-local-index-*` temp prefixes | `scripts/perf/local-index-corpus.ts:103`, `local-index-benchmark.ts:1229/1637`; also `cc-haha-chat-contract-` temp prefix (`scripts/pr/run-chat-contract-tests.ts:66`) | I | Internal perf/tool namespaces; no persistence coupling |
| 10 | macOS helper names: bundle `cc-haha-computer-use.app` + signing identity `dev.cchaha.cu-helper` + sidecar identifier `com.claude-code-haha.desktop.sidecar` | `src/utils/computerUse/cuHelperBridge.ts:77/105`, `cuHelperInstall.ts:50`, `native/cu-helper/{build.sh,Info.plist,ClientAttestation.swift:26}`, `desktop/scripts/sign-identity.ts:41`, `scripts/quality-gate/computer-use-live-smoke.ts:43` | I (TCC-locked) | macOS ties users' Accessibility/Screen-Recording TCC grants to the stable identity; renaming drops every existing user's grants. Cross-layer chain (build.sh + Info.plist + bridge + tests + TCC continuity) — the single most expensive de-branding item |
| 11 | `claude-sidecar-<triple>` sidecar binary names | `desktop/electron/services/sidecarManager.ts:81`, `desktop/package.json` (signIgnore), `scripts/quality-gate/computer-use-signed-chain.ts:237`, `package-smoke/index.ts:965` | I | Real produced binary names; renaming couples to build output + attestation chain |
| 12 | Installer legacy strings: `Claude Code Haha\app-mode.json` probes (nsh `:131`/`:140`), `nsExec … -UserDataDir "$2\Claude Code Haha" -RecoveryRoot "$3\Claude Code Haha Data\Recovered"` (nsh `:229`), ps1 `:8` `'Claude Code Haha.exe'` fallback default | `desktop/build/installer.nsh`, `desktop/build/recover-legacy-install-data.ps1` | L | Legacy-install data recovery plumbing — renaming breaks recovery of pre-rename installs. **Future note:** when Orion-era installs themselves need recovery, add a dual-`UserDataDir` candidate (`Orion Agent` alongside the legacy path) mirroring the `:131/:140` dual probe |
| 13 | Feishu registration app name `FEISHU_REGISTRATION_APP_NAME = 'Claude Code Haha'` | `src/server/api/adapters.ts:398` (used `:599`) | I/D | B2-5 deferred: external API payload to the Feishu open platform; renaming likely requires re-registering the Feishu app — user decision |
| 14 | `docs/superpowers/` SDD history corpus — 9 files (plans batch 1/2/3/5, design, handoffs 1–4) carrying ~268 old-brand lines | `docs/superpowers/plans|specs/**` | H | The rebrand's own before/after record (embedded perl scripts, diffs); rewriting would falsify history and self-pollute the embedded scripts. Site manifest excludes `superpowers/`; never机械替换 |
| 15 | `NanmiCoder/cc-haha` attribution URLs + cc-haha copyright/provenance lines | `README.md:48`, `README.zh-CN.md:48`, `LICENSE` (dual copyright), `THIRD_PARTY_LICENSES.md`, `release-notes/v0.1.0.md` (cc-haha v0.6.4 provenance ×5) | K | MIT obligation — permanent, non-negotiable |
| 16 | Commit `99527b3` trailer `Co-Authored-By: Claude Haiku 4.5` (wrong model) | git history | H | Recorded, not rewritten; merged history, rebase not authorized |
| 17 | Example bot username `jiang_cc_hah_bot` | `docs/im/telegram.md:25`, `docs/en/im/telegram.md:17` | C | Cosmetic example string in user docs; one-line rename when convenient |
| 18 | Stale imagery: `docs/images/app/**` screenshots show the pre-rebrand UI; `banner.png` + `logo-horizontal*.png/svg` placeholder wordmarks read "Claude Code Agent" | `docs/images/` | D | Spec §10-3: retake after new-UI screenshots / brand assets; `og:image` already removed so no preview leak |
| 19 | `check:policy` hand-maintained 27-file explicit list | `package.json:18` | D | Glob/wiring-test candidate — a new test file is invisible to the lane unless added by hand (bit us twice: batch 4 icons test, batch 5 pr-triage removal) |
| 20 | `.github/CODEOWNERS` — all 38 ownership lines `@NanmiCoder` | `.github/CODEOWNERS` (pinned by `scripts/pr/quality-contract.test.ts:63-64`) | D | **User decision**: reassign to `@Edisonzszs` (or team) + sync the two pinned assertions. Governance, not branding — flagged by T3, confirmed by this audit |
| 21 | `.github/FUNDING.yml` — `github: NanmiCoder` | `.github/FUNDING.yml:1` | D | **User decision**: point at the new owner's GitHub Sponsors or delete the file; leaving it routes the repo's "Sponsor" button to the old owner |
| 22 | `.github/ISSUE_TEMPLATE/feature_request.md:12` — link to `https://cchaha.ai` | feature-request checklist | D | Stale link; one-line fix to the repo docs URL (`https://github.com/Edisonzszs/orion-agent/tree/main/docs`) — safe immediate candidate |
| 23 | `native/cu-helper/INTEGRATION.md:301` (§3.5) documents wiring cu-helper into `desktop/src-tauri/tauri.conf.json` `externalBin` — conf deleted in `235ed17` | `native/cu-helper/INTEGRATION.md` | D | Minor doc staleness (historical integration doc, not a build input); update §3.5 to the Electron path or mark historical |
| 24 | `desktop/src-tauri/windows-installer-hooks.nsh` — referenced by nothing | verified: `git grep` zero hits repo-wide; electron-builder uses `build/installer.nsh` via `nsis.include` | D | Dead Tauri-era file — **safe future deletion candidate** |
| 25 | `desktop/src-tauri/tauri.release-ci.json` — referenced by nothing | verified: `git grep` zero hits; `tauri-config.test.ts` reads only `Cargo.toml` | D | Dead Tauri-era config — **safe future deletion candidate** |
| 26 | QA-doc live identifiers mirroring #10/#11 | `docs/internals/computer-use-native-manual-qa.md:30/34/39/45/177/179` | K(while #10 lives) | The manual-QA doc must keep naming the real bundle/signing identifiers; moves together with #10/#11 only |
| 27 | Codex evidence-source anchor path `…/claude-code-haha/.claude/worktrees/…` | `docs/internals/computer-use-codex-redesign.md:426` | H | Provenance of the analysis (analyst's original machine path); rewriting falsifies the evidence chain |
| 28 | Site-internal names: npm package `claude-code-haha-site` (`site/package.json:2` + lockfile), vite plugin `claude-code-haha-docs-manifest` (`site/vite.config.js:19`), locale key `cch-locale` (`site/index.html:26`, `site/src/lib/locale.js:15`, drift-pinned by check-docs) | `site/` | I | Internal identifiers (plan Global Constraints); locale key is check-docs-pinned — rename touches the drift guard |

Everything in §4's greps maps to a row above; rows 1–28 are the complete 去标记 backlog input.

## 6. Remaining risk

1. **CI has never run.** All workflow edits (T3) were validated locally only (YAML parse + test-level assertions). First real execution happens on the user's push (§7 ①); treat the first run as the CI debt settlement (symlink/POSIX coverage, `unixOnly` launcher tests — 3 skips in today's fresh run, win32 doctor test ownership).
2. **The `5fcb21a` lesson:** content-pinning tests must move in lockstep with rebrand edits; a lane skipped after an edit is where desyncs hide. If policy ever shows a 12th name again, diff the two newest message-bearing edits against their pins first.
3. **Standing 11-name policy baseline** (macOS helper ×4, packaged-artifact ×3, coverage-gate ×1, computer-use `/tmp` ×2, `evaluateChangePolicy` plan-only timeout ×1) — pre-existing platform/infra; ownership moves to CI. Same for the chat-contract pair and the renderer/electron baselines carried from batches 2–4 (incl. `MessageList` chat-timing and `MermaidRenderer` load flakes — treat full-lane failures of those names as flakes).
4. **check:docs is reused, not fresh** (§3): valid because nothing docs-relevant changed after T2, but rerun the chain if `docs/`/`site/` moves again.
5. **SignPath server-side coupling:** the rebranded `windows-application.xml`/`windows-installer.xml` pe-file names must match the SignPath project's artifact configuration; provable only in a real signed release run. Signing itself is now warn-and-skip, so the unsigned first release is not blocked.
6. **v0.1.0 compare link** `main@{2026-09-17}...v0.1.0` resolves against the baseline snapshot date; verify once after tagging (T3 rationale).
7. **FUNDING/CODEOWNERS (§5 rows 20–21) still name the old owner** — until decided, the repo's sponsor button and review ownership point at `NanmiCoder`. Cosmetic-plus-governance, but user-visible on GitHub.
8. Spec §10 backlog beyond branding: app screenshots, code signing, docs-site domain/`docsUrl`, telemetry audit (Statsig/GrowthBook), 137 ant-only stubs.

## 7. User next actions

1. **Push `main` to `Edisonzszs/orion-agent`** → first real CI run. This clears the accumulated POSIX/symlink debt: the `unixOnly` launcher-cleanup tests execute for the first time, Linux-path lanes (computer-use `/tmp` pair, chat-contract `/tmp` case) get a native host, and the win32 doctor test's ownership settles. Watch the first run of `release-desktop.yml`'s signing preflight — expect `::warning::Missing … secrets` and unsigned artifacts unless secrets are configured.
2. **Manual `electron:dev` visual pass** if not yet done (batch-4 §6 checklist: taskbar/window icon, About page + empty-session heroes rendering the official mark across themes, sidebar wordmark `orion agent` with accent).
3. **Tag `v0.1.0`** when ready to release — `scripts/release.ts` will pick up `release-notes/v0.1.0.md` (desktop version is 0.1.0). Decide FUNDING/CODEOWNERS (§5 rows 20–21) before publicizing.
