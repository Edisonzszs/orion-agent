import product from '../../../product.json'

export type AppUserModelIdHost = {
  setAppUserModelId(id: string): void
}

/** Display name from product.json; the Electron menu and notifications fall back to it. */
export const PRODUCT_NAME: string = product.name

/** Sub-directory of the Claude config root that holds this product's own state. */
export const PRODUCT_DATA_DIR_NAME: string = product.dataDirName

// Must stay in sync with build.appId in desktop/package.json. Windows attributes
// toast notifications (and taskbar pinning) to this AppUserModelID; without an
// explicit call, notifications from a dev/unpackaged run can silently fail to show.
export const WINDOWS_APP_USER_MODEL_ID = 'com.claude-code-haha.desktop'

export function applyWindowsAppUserModelId(
  app: AppUserModelIdHost,
  platform: NodeJS.Platform = process.platform,
  appUserModelId: string = WINDOWS_APP_USER_MODEL_ID,
): boolean {
  if (platform !== 'win32') return false
  app.setAppUserModelId(appUserModelId)
  return true
}
