import { describe, expect, it } from 'bun:test'
import type { ToolPermissionContext } from '../../Tool.js'
import './permissionSetup.js'
import { applyPermissionUpdate } from './PermissionUpdate.js'

// Regression: PermissionUpdate used to resolve its circular dependency on
// permissionSetup with a top-level require() — despite its own comment saying
// "resolve it at call time". When another module loads permissionSetup first,
// that top-level require caches the partially-initialized module and
// transitionPermissionMode is undefined (seen deterministically in the
// full-suite run order on CI). Importing permissionSetup before
// PermissionUpdate here reproduces that entry into the cycle; the setMode
// transition below must still run.
describe('setMode permission updates (load-order regression)', () => {
  it('applies the plan-exit transition when permissionSetup loaded first', () => {
    const context = {
      mode: 'plan',
      isBypassPermissionsModeAvailable: false,
    } as unknown as ToolPermissionContext
    const result = applyPermissionUpdate(context, {
      type: 'setMode',
      mode: 'default',
    })
    expect(result.mode).toBe('default')
  })
})
