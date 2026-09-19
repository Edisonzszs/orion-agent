import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { PRODUCT, type ProductIdentity } from './product'

describe('renderer ProductIdentity twin', () => {
  it('stays field-for-field identical to product.json', () => {
    const productPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'product.json')
    const source = JSON.parse(readFileSync(productPath, 'utf8')) as ProductIdentity
    expect(PRODUCT).toEqual(source)
  })

  it('exposes the values the UI renders', () => {
    expect(PRODUCT.name).toBe('Orion Agent')
    expect(PRODUCT.shortName).toBe('Orion')
    expect(PRODUCT.homepage).toBe('https://github.com/Edisonzszs/orion-agent')
    expect(PRODUCT.github).toEqual({ owner: 'Edisonzszs', repo: 'orion-agent' })
  })
})
