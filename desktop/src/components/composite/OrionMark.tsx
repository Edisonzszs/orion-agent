import { cx } from '@/lib/cx'

/**
 * The Orion Agent mark — a ring (the "O") with Orion's three-star belt.
 *
 * Placeholder geometry until the official logo lands (branding/ in batch 4
 * regenerates all icon sizes from one source). Two rules carried over from
 * the mark it replaced:
 *
 * 1. Recolor. Every stroke takes `var(--color-text-primary)` and the stars
 *    take `var(--color-brand)`, so each of the six palettes repaints it.
 * 2. Shrink. Below ~38px a star is under 2px across and reads as dirt, so
 *    the stars only render at `xl`; the ring survives every size.
 */
export type OrionMarkSize = 'sm' | 'md' | 'lg' | 'xl'

export type OrionMarkProps = {
  size?: OrionMarkSize
  className?: string
}

const SIZES: Record<OrionMarkSize, { box: string }> = {
  sm: { box: 'h-6 w-6' },
  md: { box: 'h-8 w-8' },
  lg: { box: 'h-[38px] w-[38px]' },
  xl: { box: 'h-20 w-20' },
}

// A four-pointed star centered at (cx, cy) with radius r.
function star(cx: number, cy: number, r: number, key: string) {
  const inner = r * 0.28
  return (
    <path
      key={key}
      fill="var(--color-brand)"
      d={`M ${cx} ${cy - r} L ${cx + inner} ${cy - inner} L ${cx + r} ${cy} L ${cx + inner} ${cy + inner} L ${cx} ${cy + r} L ${cx - inner} ${cy + inner} L ${cx - r} ${cy} L ${cx - inner} ${cy - inner} Z`}
    />
  )
}

export function OrionMark({ size = 'md', className }: OrionMarkProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="96 96 832 832"
      className={cx(SIZES[size].box, className)}
      role="presentation"
    >
      <circle
        cx="512"
        cy="512"
        r="322"
        fill="none"
        stroke="var(--color-text-primary)"
        strokeWidth="96"
      />
      {size === 'xl' && (
        <>
          {star(512, 430, 44, 'belt-nw')}
          {star(586, 512, 36, 'belt-e')}
          {star(470, 596, 40, 'belt-sw')}
        </>
      )}
    </svg>
  )
}
