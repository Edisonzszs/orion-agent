import product from '../../product.json'

/**
 * Product identity shared by the CLI, the local server and the sidecars.
 * `product.json` at the repository root is the single source of truth; the
 * desktop renderer and the Electron host read the same file through their
 * own thin modules because those bundles cannot import from `src/`.
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

/** Sub-directory under the Claude config home that holds this product's own state. */
export const PRODUCT_DATA_DIR_NAME = PRODUCT.dataDirName

/** Previous name of that sub-directory; only read by the one-time import. */
export const LEGACY_PRODUCT_DATA_DIR_NAME = PRODUCT.legacyDataDirName
