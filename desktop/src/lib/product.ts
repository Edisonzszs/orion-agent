import product from '../../../product.json'

/**
 * Product identity for the renderer. `product.json` at the repository root is
 * the single source of truth; the renderer bundle cannot import from `src/`,
 * so it reads the file directly (the same way providerPresets.json is read).
 */
export type ProductIdentity = {
  name: string
  shortName: string
  cliName: string
  dataDirName: string
  legacyDataDirName: string
  appId: string
  github: { owner: string; repo: string }
  homepage: string
  docsUrl: string
  artifactPrefix: string
}

export const PRODUCT: ProductIdentity = product
