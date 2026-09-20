import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, expect, it } from 'vitest'

import { OrionMark } from './OrionMark'

const SIZES = ['sm', 'md', 'lg', 'xl'] as const

// The official mark: three interlocked modules, rendered as a single
// monochrome unit (the brand guide's preferred form at UI sizes).
const MODULE_COUNT = 3

describe('OrionMark', () => {
  it('is decorative and hidden from assistive tech', () => {
    const { container } = render(<OrionMark />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders all three modules at every size', () => {
    for (const size of SIZES) {
      const { container, unmount } = render(<OrionMark size={size} />)
      expect(container.querySelectorAll('path').length, size).toBe(MODULE_COUNT)
      unmount()
    }
  })

  it('paints from the text token so all six palettes recolor it', () => {
    const { container } = render(<OrionMark size="xl" />)
    const svg = container.firstElementChild!
    const fills = [...svg.querySelectorAll('path')].map((p) => p.getAttribute('fill'))
    expect(fills.every((f) => f === 'var(--color-text-primary)')).toBe(true)
    expect(svg.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('does not shrink inside flex containers', () => {
    const { container } = render(<OrionMark />)
    expect(container.firstElementChild).toHaveClass('flex-shrink-0')
  })
})
