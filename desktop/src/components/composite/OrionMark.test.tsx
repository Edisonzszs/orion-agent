import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, expect, it } from 'vitest'

import { OrionMark } from './OrionMark'

const SIZES = ['sm', 'md', 'lg', 'xl'] as const

describe('OrionMark', () => {
  it('is decorative and hidden from assistive tech', () => {
    const { container } = render(<OrionMark />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders at every size with the ring intact', () => {
    for (const size of SIZES) {
      const { container, unmount } = render(<OrionMark size={size} />)
      const ring = container.querySelector('circle[stroke="var(--color-text-primary)"]')
      expect(ring).not.toBeNull()
      unmount()
    }
  })

  it('paints from tokens so all six palettes recolor it', () => {
    const { container } = render(<OrionMark size="xl" />)
    const svg = container.firstElementChild!
    expect(svg.querySelector('[stroke="var(--color-text-primary)"]')).not.toBeNull()
    expect(svg.querySelector('[fill="var(--color-brand)"]')).not.toBeNull()
    expect(svg.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('sheds the stars as it shrinks instead of turning to mush', () => {
    const starCount = (size: (typeof SIZES)[number]) => {
      const { container, unmount } = render(<OrionMark size={size} />)
      const filled = container.querySelectorAll('path[fill="var(--color-brand)"]').length
      unmount()
      return filled
    }
    expect(starCount('xl')).toBe(3) // Orion belt: three stars
    expect(starCount('lg')).toBe(0)
    expect(starCount('md')).toBe(0)
    expect(starCount('sm')).toBe(0) // ring only
  })
})
