# Orion Agent v0.1 Rebrand — Batch 2 Handoff (desktop visible layer + packaging)

Base `3d050a2` (plan commit, on batch 1's `f4a5846`) → HEAD `ad37469`. Seven code commits, each individually reviewed with a fix round where noted. Batch scope: spec §4 — packaging identity, renderer strings, five locales, OrionMark placeholder, Electron host strings, server-side user-visible strings, and the twin guard test.

## 1. Scope landed

| Commit | Subject | Files | Content |
|---|---|---|---|
| `fce971d` | feat(identity): adopt the Orion Agent packaging identity | 4 | `desktop/package.json` (name/version/description/homepage/author/build.productName/appId/artifactName/publish/linux maintainer), `appIdentity.ts` AUMID ← `appId`, `scripts/pr/product-identity.test.ts` + `release-workflow.test.ts` synced |
| `0001ec9` | feat(brand): replace the cc-haha mark with the OrionMark placeholder | 11 | `BrandSeal.tsx`/test deleted; `OrionMark.tsx`/test added (same `sm|md|lg|xl` interface); 6 call-site import swaps; components `AGENTS.md` row |
| `80bd849` | feat(brand): Orion Agent strings across the renderer | 16 | `index.html` title; About/Sidebar/Activity/Adapter pages + constants; 5 locale files (~8 brand strings each); `chatStore` titles; 4 companion test files |
| `46ae756` | fix(i18n): keep the notifications test title localized in CJK locales | 5 | Review round 1: 4 CJK locales re-localized (`Orion Agent 通知已启用` etc.); AboutSettings doc comment reword |
| `5a9d993` | feat(brand): host and server user-visible strings follow product.json | 7 | `menu.ts`/`notificationSmoke.ts` fallbacks ← `PRODUCT_NAME`; server `DEFAULT_PROFILE_SUBTITLE` ← `PRODUCT.homepage` derivation; doctor ids `cc-haha-providers|settings` → `orion-providers|settings` (+ branch); 3 test files synced |
| `a3df099` | test(brand): guard the renderer ProductIdentity twin against drift | 2 | `desktop/src/lib/product.test.ts` (twin vs `product.json`, field-for-field + rendered values); diagnosticsSettings doctor fixtures `~/.claude/cc-haha/providers.json` → `~/.claude/orion/providers.json` (2 fixtures + 4 coupled assertions) |
| `ad37469` | fix(brand): tray menu and OAuth success pages follow product.json | 6 | Task 5 residual sweep: `tray.ts` tooltip/Show/Quit ← `PRODUCT_NAME` (+ test labels); 4 OAuth success pages "return to …" ← `PRODUCT.name` (2 services extended import, 2 API routes gain it) |

Known consequence (accepted in spec): `productName` change moves Electron `userData` from `Claude Code Haha` to `Orion Agent` — window state and portable-mode config start fresh; no migration (new-product behavior).

## 2. Tests added/changed in the batch

- `scripts/pr/product-identity.test.ts` — asserts `desktop/package.json` builder fields match `product.json` (batch 1's describe hoisted to module scope; release-workflow expectations synced to new homepage/author/maintainer/`Orion-Agent-` prefix).
- `desktop/src/components/composite/OrionMark.test.tsx` — 4 tests, replaces BrandSeal's.
- `desktop/src/lib/product.test.ts` — 2 tests: twin identity (reads repo-root `product.json` at runtime, `toEqual` against `PRODUCT`) + the four values the UI renders.
- Changed companions (assert updated strings): `Sidebar.test.tsx`, `ActivitySettings.test.tsx`, `AdapterSettings.test.tsx`, `chatStore.test.ts`, `generalSettings.test.tsx`, `desktop-ui-preferences.test.ts`, `doctor-service.test.ts`, `diagnosticsSettings.test.tsx`, `tray.test.ts`.

## 3. Task 5 verification — commands actually run and observed results

All on HEAD content (`a3df099` tree for lanes, `ad37469` = same content for the brand fix; lanes ran after all edits, before commit).

### Step 1 — twin test (passed)
`cd desktop && bun run test -- --run src/lib/product.test.ts` → 1 file, **2 passed**.

### Step 2 — residual greps (classified; see §4)
Grep 1 (`Claude Code Haha|NanmiCoder|relakkes|cchaha.ai` over non-test `desktop/src desktop/index.html src/server desktop/electron`): 10 hits pre-fix → **4 remain post-fix**, all classified (1 external-API payload, 2 interop literals, 1 code comment — none user-visible UI strings).
Grep 2 (same patterns over `*.test.ts(x)` minus `menu.test`): hits are explicit-name fixtures testing parser/template behavior, allowed per the menu.test principle (full list in §4).
Post-fix focused runs: diagnosticsSettings **26/26 passed**; 6 oauth server suites **55/55 passed**; tray **4/4 passed**.

### Step 3 — impact + lanes
`PR_BASE_REF=f4a5846 ALLOW_CLI_CORE_CHANGE=1 bun run check:impact` → **Blocked: no**; selected: policy, desktop, server, provider-contract, chat-contract, agent-flow, native, persistence-upgrade, docs, coverage.

| Lane | Result | vs baseline |
|---|---|---|
| `check:desktop` | lint+tsc **passed** (chain reached tests); vitest **5856 pass / 17 fail / 6 skip** (first run; name-listing re-run showed 18 incl. `MessageList` chat-timing flake); build **passed** standalone (2.25 s) | All failure names ⊆ the stash-proven set (5 deterministic src: componentReachability, providerModels×1, paletteEscapes×2, tokenUsage×1; 12 platform: appMode×1, pets×7, serverRuntime×1, build-macos-arm64×1, image-processor-packaging×2; + documented chat flakes) — reconciled at `80bd849`/`46ae756` |
| `check:electron` | **566 pass / 1 skip / 9 fail** | Exact by name: 8 symlink/EPERM (appMode×1, pets×7) + 1 serverRuntime timing; `tray.test.ts` **passed** |
| `check:policy` | **325 pass / 11 fail** | Exact baseline set (macOS helper ×4, packaged-artifact ×4, coverage ×1, computer-use tmp ×2 — platform) |
| `check:desktop-ui-smoke` | **exit 0**; substantive run self-skipped (`agent-browser` not installed on this machine) | No known failures; skip is environmental, pre-existing (no prior batch ran it substantively either) |
| `check:server` | **not run — blocked-infra** (pre-existing EBUSY crash on this machine, standing ruling) | Verified instead via focused files: `desktop-ui-preferences` + `doctor-service` + `persistence-upgrade` + `legacy-data-dir-import` → **56 pass / 1 fail**; the 1 is the documented pre-existing win32 doctor path-separator failure (stash-proven at pristine `46ae756` in Task 4) |

Build-churn note: `desktop/src-tauri/resources/preview-agent.js` regenerated by the standalone build was restored to HEAD, not committed (same as Task 3).

### Steps 4-5 — commits + this report
`a3df099`, `ad37469` (above); working tree clean at `ad37469`.

### Checks not run, and why
- `check:server` lane — blocked-infra (EBUSY, above); focused-file verification stands in.
- `provider-contract`, `chat-contract`, `agent-flow`, `native`, `persistence-upgrade` (lane form), `docs`, `coverage` — selected by impact, but outside batch 2's mandated lane set (plan §9 row 2: desktop/electron/ui-smoke, plus policy from Task 1); owned by batches 3-5.
- Manual `electron:dev` smoke — user action, see §5.

## 4. Accepted-residual list (whole-batch, final)

Class K = keeper (deliberate), F = fixture (test data, not brand), D = deferred to a later batch/ruling.

| Residual | Class | Why |
|---|---|---|
| `localStorage` keys `cc-haha-*` (incl. index.html theme keys, project-order, market-dismissed), env names `CC_HAHA_*`, Electron partitions `cc-haha-pet`/`cc-haha-preview-*` | K | Spec §3: internal naming untouched (compat with existing installs) |
| `settings.terminal.description` `claude-haha`, `doctorSafeKeys` values | K | Spec keeper list |
| `cc-haha-computer-use.app`, hash namespaces, CSS `brand-seal-glow`, `ccHahaTarget` payload key | K | Internal identifiers |
| Feishu registration app name `'Claude Code Haha'` (`src/server/api/adapters.ts:398`) | D — **needs ruling** | Sent to Feishu's registration API as the consent-page pre-fill; renaming is externally visible and may affect registration continuity — controller decision, not a silent rename |
| PATH block markers `# >>> Claude Code Haha PATH >>>` (`desktopCliLauncherService.ts:20-21`) | D — batch 3 | Launcher file is batch 3 scope (spec §5); markers are regex-matched against existing shell rc blocks, renaming would strand them |
| `keychain.ts:9` code comment | D — batch 5 sweep | Not user-visible |
| Test fixtures with old-brand strings: `menu.test`, `tray.test` (`app.name` input), URL/repo parser fixtures (`MarkdownRenderer.filepaths`, `filePathBoundary`, `urlBoundary`), subtitle fixtures (`desktopUiPreferences.test`, `Sidebar.test`), release-notes markdown (`UpdateChecker`, `generalSettings`), `chatBlocks` allowed-apps message, `MessageList` path, `ActivitySettings` handle, `computer-use-api` mocked errors, `mac-installed-apps` inventory, `appMode` install path, `updater` 404 URLs | F | Explicit-name fixture data testing parser/template/render behavior, not brand (menu.test principle; T3/T4 reviews concurred) |
| diagnosticsSettings `/tmp/claude/cc-haha/diagnostics*` mock paths, `cc-haha-diagnostics.tar.gz` fixture name | F | Internally consistent mock data, no id/path mismatch (only the two id-mismatched fixtures were ruled fixed in `a3df099`) |
| Renderer lane 17-18 fails / electron 9 / policy 11 / doctor win32 ×1 | K | Pre-existing platform/deterministic failures, stash-proven at batch base by name |

## 5. Remaining risk

1. **Feishu name + PATH markers still carry the old brand** (§4, D items) — bounded by batch 3 / a controller ruling; the final batch-5 repo-wide audit will re-check.
2. **`release-desktop.yml` still asserts `Claude-Code-Haha-` asset prefixes** while electron-builder now emits `Orion-Agent-` (Task 1 deferral) — no release happens before batch 5 unifies them.
3. **author.email only transitively pinned** via maintainer string (Task 1 minor) — direct assertion is cheap hardening later.
4. **ui-smoke never substantively ran on this machine** (agent-browser absent) — the lane exits 0 on the skip, so its "fully green" bar is untested evidence-wise.
5. **Known pre-existing failures carried, not fixed** (§4 last row) — the win32 doctor path-separator test still needs a CI owner.

**Suggested manual check (user, ~2 min):** `cd desktop && bun run electron:dev` with a temporary `CLAUDE_CONFIG_DIR` — verify About page, sidebar mark + links, settings-page locale copy, new-session empty-state OrionMark, and (new this batch) the tray tooltip / Show-Quit menu reading "Orion Agent".

## 6. Batch 2 conclusion

Landed as planned: packaging identity, renderer + host + server user-visible strings, five locales, OrionMark, twin guard test. All mandated lanes reconcile to their baselines by name; every grep residual is classified in §4. Two in-batch misses found by the task-5 sweep (tray, OAuth pages) were fixed and committed (`ad37469`); the three deliberate leftovers carry explicit owners.

## 7. Batch 3 checklist (accumulated)

- [ ] Launcher rename: `bin/claude-haha` → `bin/orion`, root `package.json`, `DESKTOP_CLI_NAME`/`DESKTOP_CLI_NAMES`, `conversationService` dev-mode path, `localRecoveryCli` usage text (spec §5).
- [ ] **PATH block markers** (`desktopCliLauncherService.ts:20-21`): rename together with the launcher work, deciding how previously written `# >>> Claude Code Haha PATH >>>` blocks are migrated/cleaned.
- [ ] **Ruling needed:** Feishu `FEISHU_REGISTRATION_APP_NAME` (adapters.ts:398) — keep, rename, or make configurable.
- [ ] `keychain.ts:9` comment de-brand during a later sweep (batch 5).
- [ ] Batch 5 must also unify `release-desktop.yml` asset-prefix assertions (Task 1 deferral) and re-run the repo-wide final audit.
