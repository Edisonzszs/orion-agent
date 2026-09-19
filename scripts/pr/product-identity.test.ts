import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(join(root, relativePath), 'utf8')) as T
}

type ProductJson = {
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

const product = readJson<ProductJson>('product.json')

describe('product.json', () => {
  test('declares every identity field as a non-empty string', () => {
    for (const key of [
      'name', 'shortName', 'cliName', 'dataDirName', 'legacyDataDirName',
      'appId', 'homepage', 'docsUrl', 'artifactPrefix',
    ] as const) {
      expect(typeof product[key]).toBe('string')
      expect(product[key].trim().length).toBeGreaterThan(0)
    }
    expect(typeof product.github.owner).toBe('string')
    expect(typeof product.github.repo).toBe('string')
  })

  test('uses filesystem- and shell-safe identifiers', () => {
    expect(product.cliName).toMatch(/^[a-z][a-z0-9-]*$/)
    expect(product.dataDirName).toMatch(/^[a-z][a-z0-9-]*$/)
    expect(product.legacyDataDirName).toMatch(/^[a-z][a-z0-9-]*$/)
    expect(product.dataDirName).not.toBe(product.legacyDataDirName)
    expect(product.appId).toMatch(/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/)
    expect(product.artifactPrefix).toMatch(/^[A-Za-z0-9-]+$/)
  })

  test('points homepage and docs at the declared GitHub repository', () => {
    const repoUrl = `https://github.com/${product.github.owner}/${product.github.repo}`
    expect(product.homepage).toBe(repoUrl)
    expect(product.docsUrl.startsWith(repoUrl)).toBe(true)
  })
})

describe('desktop/package.json stays in sync with product.json', () => {
  const desktop = readJson<{
    name: string
    version: string
    description: string
    homepage: string
    author: { name: string; email?: string }
    build: {
      productName?: string
      appId?: string
      artifactName?: string
      publish?: Array<{ provider: string; owner: string; repo: string }>
      linux?: { maintainer?: string }
    }
  }>('desktop/package.json')

  test('identity fields mirror product.json', () => {
    expect(desktop.build.productName).toBe(product.name)
    expect(desktop.build.appId).toBe(product.appId)
    expect(desktop.build.artifactName).toBe(`${product.artifactPrefix}-\${version}-\${os}-\${arch}.\${ext}`)
    expect(desktop.build.publish).toEqual([
      { provider: 'github', owner: product.github.owner, repo: product.github.repo },
    ])
    expect(desktop.homepage).toBe(product.homepage)
    expect(desktop.author.name).toBe(product.github.owner)
    expect(desktop.build.linux?.maintainer).toBe(`${product.github.owner} <${product.github.owner}@users.noreply.github.com>`)
    expect(desktop.name).toBe('orion-agent-desktop')
    expect(desktop.version).toBe('0.1.0')
    expect(desktop.description).toBe('Desktop coding agent workbench for Orion Agent.')
  })
})
