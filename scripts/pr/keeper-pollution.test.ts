import { describe, expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'

// De-brand incident lesson (debrand-handoff §6.1): a blanket rename once
// corrupted the TCC keeper chain, and the audit's own exclusion pattern
// hid the damage. These prefixes are the pollution signatures — the TCC
// identity must stay cc-haha/cc-haha-computer-use forever, so their
// "orion-" twins must never appear in production source roots.
const FORBIDDEN = ['orion-computer-use', 'orion-local-index']
const ROOTS = ['src', 'desktop/src', 'desktop/scripts', 'desktop/electron', 'native']

describe('keeper pollution guard', () => {
  test('TCC keeper namespaces have no orion- twins in production roots', () => {
    let hits = ''
    for (const root of ROOTS) {
      try {
        hits += execFileSync(
          'git', ['grep', '-l', '-E', FORBIDDEN.join('|'), '--', root],
          { encoding: 'utf8' },
        )
      } catch {
        // git grep exits 1 on zero matches — that is the passing case.
      }
    }
    expect(hits.trim()).toBe('')
  })
})
