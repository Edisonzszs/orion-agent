# Orion Agent v0.1 Rebrand — Batch 1 Handoff (identity + data dir + legacy import)

Verification task (Task 7) executed 2026-09-18/19 on `main` at HEAD `9f7e8cf`, batch base `945a0e5`, working tree clean. All numbers below were either produced by fresh runs in this task or are task-level evidence reused per controller ruling 3 (no commits after `9f7e8cf`; `git log` confirmed).

Spec: `docs/superpowers/specs/2026-09-18-orion-agent-rebrand-v1-design.md`. Plan: `docs/superpowers/plans/2026-09-18-orion-rebrand-batch1-identity-datadir.md`.

## 1. Scope landed (8 code commits; the 103-file, +2557/−440 net stats cover the full `945a0e5..9f7e8cf` range, which also includes the spec and plan docs commits `f4cccbc`/`4d381ea`)

| Commit | Subject | Task | Files |
|---|---|---|---|
| f5bc4e8 | feat(identity): add product.json as the single brand source | 1 | 7 (+125/−3) |
| 2ba0b22 | refactor(data-dir): rename the product data directory to ~/.claude/orion | 2 | 59 (+374/−349) |
| 4dcae83 | fix(tests): keep preset promo assertion on cc-haha text | 2-fix | 1 |
| e35780b | feat(data-dir): import cc-haha data into ~/.claude/orion once | 3 | 4 (+391) |
| 0ee4bf7 | fix(data-dir): record top-level import failures instead of throwing | 3-fix | 3 |
| 9eb1b51 | refactor(electron): read the product data dir name from product.json | 4 | 9 (+44/−25) |
| e696614 | refactor(renderer): follow the product data dir rename | 5 | 12 (+74/−23) |
| 9f7e8cf | refactor(scripts): sandbox and smoke scripts use the product data dir | 6 | 10 (+44/−39) |

Key surfaces: `product.json` (brand single source) consumed via `src/constants/orionProduct.ts` (server), `desktop/electron` main process, `desktop/src/lib/product.ts` (renderer twin); product data dir rename `cc-haha/` → `orion/` across src (57+ files) with display-name fixups; one-time marker-gated legacy import (`src/server/services/legacyDataDirImport.ts`, marker `orion/.imported-from-cc-haha`, copy-only, failure-tolerant) wired into server startup via `persistentStorageMigrations.ts`; Electron host paths + renderer dual-dir (`orion` ∪ legacy `cc-haha`) attachment resolution with locale hints; quality-gate scripts (sandbox, desktop-smoke, provider smoke) + module-graph file root for the JSON import.

## 2. Tests added/changed in the batch

- **New files:** `scripts/pr/product-identity.test.ts` (brand-source contract), `src/server/__tests__/legacy-data-dir-import.test.ts` (207 lines: marker gating, copy-only, never-overwrite, per-entry isolation, symlink skips, import-before-upgrade ordering, top-level failure recording).
- **New cases:** `scripts/pr/change-policy.test.ts` +2 (product-identity routing → all product surfaces; legacy-import routing → persistence check).
- **Contract updates:** `scripts/pr/quality-contract.test.ts` sandbox assertion now requires the product.json import + `` `${product.dataDirName}/providers.json` `` template (strictly stronger than the old literal).
- **Renames followed by:** 42 further test files (assertion string updates; no production behavior).

## 3. Task 7 verification — commands actually run and observed results

### Step 1 — residual grep (fresh)

Command (the brief's exact pipeline):

```
grep -rnE "'cc-haha'|\"cc-haha\"|[^/A-Za-z-]cc-haha/" src desktop/electron desktop/src adapters scripts \
  --include='*.ts' --include='*.tsx' | grep -v "\.test\.\|github.com\|cchaha"
```

Result: **3 hits, all accepted residuals, 0 unexpected** — no fix needed:

| Hit | Class | Why accepted |
|---|---|---|
| `src/server/services/conversationService.ts:1756` | comment referencing legacy data dir | Chinese comment `// "官方" 模式 (cc-haha/settings.json 没 provider env) …` — pure comment, describes legacy-era behavior; comment-class residual per accepted list |
| `src/services/openaiAuth/requestIdentity.ts:20` | internal request-identity JSON | `JSON.stringify(['cc-haha', sessionId, agentId])` is a stable UUID namespace string; changing it would break request-identity continuity for existing sessions |
| `adapters/whatsapp/session.ts:60` | WhatsApp browser identity | `browser: ['cc-haha', 'desktop', '1.0']` is the WhatsApp Web device tuple; changing it can invalidate paired sessions |

### Step 2 — impact report (fresh)

`PR_BASE_REF=945a0e5 ALLOW_CLI_CORE_CHANGE=1 bun run check:impact`

- Changed files: 103; Areas: cli-core, desktop, docs, release, server; Labels: allow-cli-core-change
- **Blocked: no**
- Required local checks selected: check:policy, check:desktop, check:server, check:provider-contract, check:chat-contract, check:agent-flow, check:native, check:persistence-upgrade, check:docs, check:coverage — superset of the brief's expected five (server / desktop / desktopNative(native) / persistence / policy). **passed**

### Step 3 — lanes

**Fresh in this task:**

1. `bun run check:policy` → **324 pass / 11 fail** (335 tests, 27 files, 40.02s). Failure set compared BY NAME against Task 1's stash-proven baseline 11 — **identical, no new failures**:
   - `computer-use live smoke path confinement` ×2 (POSIX /tmp assumptions)
   - `coverage gate helpers > collects root coverage …` ×1 (spawns build subprocess)
   - `evaluateChangePolicy > plan-only mode …` ×1 (5s bun timeout vs ~7s module-graph scan on this machine)
   - `final macOS helper cursor resource verification` ×4 (macOS-only)
   - `packaged artifact inspection` ×3 (Linux/macOS packaging layouts)
   Verdict: **passed per environment bar** (failure set ⊆ known pre-existing, by name).
2. Combined focused invocation of the 9 behaviorally-relevant test files of the ~47 changed (the rest were string-only syncs covered by task-level runs), one `bun test --timeout 15000` run:
   `./scripts/pr/product-identity.test.ts ./scripts/pr/change-policy.test.ts ./scripts/pr/quality-contract.test.ts ./scripts/quality-gate/sandbox.test.ts ./scripts/quality-gate/desktop-smoke/deterministic.test.ts ./scripts/quality-gate/providerTargets.test.ts ./src/server/__tests__/legacy-data-dir-import.test.ts ./src/server/__tests__/persistence-upgrade.test.ts ./src/server/__tests__/provider-presets.test.ts`
   → **102 pass / 0 fail** (650 expect calls, 10.31s). Cross-task integration proven in a single process. **passed**

**Reused from task evidence (no commits since 9f7e8cf):**

| Lane | Task-level result (from task reports / SDD ledger) | Verdict |
|---|---|---|
| `check:server` (full lane) | Cannot complete on this Windows machine even at pristine base — pre-existing EBUSY sandbox crash in run-server-tests.ts after 6 file failures, symmetric at base (Task 2 proof) | **blocked (infra, pre-existing)** — covered by focused 31-file set: 983 pass / 11 fail at baseline, and this task's fresh 9-file superset-check of the batch-touched server tests |
| `check:persistence-upgrade` | Task 3: full gate `all checks passed`, all 7 entries green incl. new "Legacy product data directory import" 9/0; re-proven fresh here via persistence-upgrade.test.ts + legacy-data-dir-import.test.ts in the 102/0 run | **passed** |
| `check:electron` | Task 4: tsc PASS; `bun test ./electron` 566 pass / 1 skip / 9 fail — all 9 reproduced at base (8× symlink EPERM, 1× flaky timing); build:electron verified with product.json inlined into main.cjs | **passed per environment bar** (no new failures) |
| `check:desktop` (renderer) | Task 5: lint + tsc + build PASS; vitest 5853 pass / 17 fail byte-identical at base (same names) | **passed per environment bar** (no new failures) |
| local-index-corpus (perf) | Task 6: 12 pass / 2 fail, both proven pre-existing on pristine stash baseline | **passed per environment bar** |

**Not run fresh in this task, why:** check:server / check:electron / check:desktop full lanes (controller ruling 3: reuse allowed, no commits since task evidence; full server lane structurally cannot finish on this machine); check:native, check:provider-contract, check:chat-contract, check:agent-flow, check:docs, check:coverage (not selected for fresh re-run by ruling 3; providerTargets.test.ts, sandbox.test.ts and deterministic.test.ts are covered fresh in the 102/0 run; agent-flow/live.test.ts was covered at task level only — Task 6's focused 4-file quality-gate run, 39 pass / 0 fail; check:policy's 27-file set includes the pr/*.ts members).

### Step 4 — smoke boot (fresh; sandbox config dir, port 3458)

Sandbox: `C:\Users\23865\AppData\Local\Temp\orion-smoke-3057` (never touched real `~/.claude`). Seed: `cc-haha/providers.json` = `{"providers":[],"activeId":null}`, md5 `da88b655f5bc41d126eb2f106e812ede`. Launch: `CLAUDE_CONFIG_DIR="<win path>" bun --no-env-file run src/server/index.ts --port 3458`.

Transcript (abridged to the verification points):

```
== /health ==
{"status":"ok","timestamp":"2026-09-18T17:40:48.815Z"}

== ls orion ==
.imported-from-cc-haha            25 bytes   (marker)
providers.json                   156 bytes   (upgraded from 31-byte seed)
providers.json.bak-before-migration-1789753245263-4c7cca   (upgrade backup)
db/                                            (runtime-created)

== marker ==
2026-09-18T17:40:45.259Z

== orion/providers.json ==
{ "providers": [], "activeId": null, "schemaVersion": 5,
  "providerOrder": ["claude-official","openai-official","grok-official"] }

== checks (bun -e) ==
providers.json parses: true
schemaVersion: 5 | typeof: number | isNumber: true
marker: "2026-09-18T17:40:45.259Z" | ISO parseable: true | epoch ms: 1789753245259

== cc-haha/providers.json untouched ==
cmp: byte-identical        (vs seed copy)
md5: da88b655f5bc41d126eb2f106e812ede   (== seed md5)

== kill ==
killing PID 25648 → taskkill success
port 3458: FREE (no LISTENING)

== server.log ==
[CronScheduler] Starting — checking every 60 s
[Server] Claude Code API server running at http://127.0.0.1:3458
(no error / import-failure lines)
```

All ruling-4 assertions hold: /health ok; `orion/providers.json` parses with numeric `schemaVersion` (import + upgrade ran); marker exists with parseable ISO timestamp; legacy `cc-haha/providers.json` byte-identical/untouched (copy-only). **passed**

## 4. Accepted-residual list (whole-batch, final)

| Residual | Class | Batch / why kept |
|---|---|---|
| `src/services/openaiAuth/requestIdentity.ts:20` `['cc-haha', sessionId, agentId]` | internal request-identity JSON namespace | renaming breaks request-identity continuity for existing sessions |
| `adapters/whatsapp/session.ts:60` `browser: ['cc-haha','desktop','1.0']` | WhatsApp browser identity | renaming risks invalidating paired WhatsApp sessions |
| Comment lines mentioning `~/.claude/cc-haha/` (e.g. `src/server/services/conversationService.ts:1756`) | comments | informational references to the legacy dir |
| `localStorage` / env keys `cc-haha-*` / `CC_HAHA_*` (e.g. `CC_HAHA_TRANSCRIPT_ENTRYPOINT`) | stored/env identifier layer | user-visible data-migration cost outweighs value; batch 2+ decision |
| Electron partitions `cc-haha-pet` / `cc-haha-preview-*` | partition identity | renaming orphans existing partition storage; batch 2+ decision |
| `mkdtemp` prefixes using `cc-haha` | temp-file prefix | cosmetic, no persistence |
| URLs `github.com/NanmiCoder/cc-haha` (source links, provider promo/assertion at `provider-presets.test.ts:224`) | external URLs | batch 2 data rebrand (promo text in `providerPresets.json:65` flips together with the test) |
| macOS helper binary names in scripts | binary filenames | rename requires rebuild/re-sign pipeline; batch 2/3 keeper decision |
| hash namespace `'cc-haha-local-index:'` in `scripts/perf/local-index-corpus.ts:103` | deterministic fixture hash namespace | NOT a path; renaming changes deterministic hashes; explicit keep-or-rename recorded for batch 2/3 |
| `DEFAULT_PROFILE_SUBTITLE 'github.com/NanmiCoder/cc-haha'` | user-visible text | accepted for batch 1; batch 2 |

## 5. Remaining risk

1. **Windows-only verification surface.** check:server full lane cannot finish on this machine (pre-existing EBUSY sandbox crash); symlink behavior (import skip logic, electron tests) is EPERM-guarded locally and self-skips — real symlink coverage needs CI/Linux. Batch should get one CI pass.
2. **Flaky timing tests** (bun 5s default vs ~7s module-graph scan; plan-only timeout) — use `--timeout 15000` for policy runs locally; unrelated to the batch.
3. **Renderer twin drift:** `desktop/src/lib/product.ts` duplicates `ProductIdentity` across the bundle boundary (plan-mandated); compile-time drift cannot be caught by tests — batch 2 should add a cross-check or shared build-time source.
4. **Legacy-import failure-recording semantics:** top-level failures are recorded in the migration report (never crash startup, retried next boot); an operator must read the report to notice a permanently failing entry. Consider surfacing in doctor/diagnostics later.
5. **Keeper decisions deferred to batch 2/3** (explicit keep-or-rename needed): localStorage/env keys, partitions, mkdtemp prefixes, macOS helper names, local-index hash namespace, promo text/URLs.
6. **Batch 2 scope (desktop-visible layer + packaging/update sources)** is not started; `desktop/package.json` identity assertions deliberately untouched (ruling 3 of the batch plan).

## 6. Batch 1 conclusion

All five verification steps completed; zero unexpected residuals; no fixes required in Task 7; every fresh check within its environment bar; smoke boot proves the end-to-end legacy → orion import + upgrade path on a real server process. Batch 1 is complete; batch 2 (desktop visible layer + packaging/update) to be planned separately.
