import { cx } from '@/lib/cx'

/**
 * The Orion Agent mark — three interlocked modules (orchestration,
 * autonomy, coordination) from the official brand kit, rendered as a
 * single monochrome unit: the brand guide's preferred form at UI sizes.
 * Geometry is the kit's symbol-black variant with fills re-bound to the
 * text token so each of the six palettes repaints it.
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

// Paths copied verbatim from orion-agent_symbol-black.svg (viewBox 0 0 512 512).
const MODULE_PATHS = [
  'M92 170 Q92 138 119 122 L178 88 Q198 76 219 88 L268 116 L214 148 L177 127 Q168 122 159 127 L132 143 Q123 149 123 160 L123 247 Q123 258 133 264 L163 281 L163 325 L119 300 Q92 284 92 252 Z',
  'M206 71 Q222 43 254 43 Q268 43 281 50 L393 115 Q421 131 421 163 L421 260 Q421 285 399 298 L374 313 Q357 323 341 313 Q326 304 326 285 L326 195 Q326 182 314 175 L238 131 Q226 124 214 131 L177 152 L157 117 Z',
  'M236 210 Q249 187 276 187 Q289 187 301 194 L326 208 L326 252 L300 237 Q289 231 279 237 L263 246 Q252 252 252 265 L252 300 Q252 313 263 319 L360 375 Q388 391 388 423 Q388 438 380 451 Q364 478 332 478 Q318 478 305 471 L210 416 Q182 400 182 368 L182 284 Q182 259 204 246 Z',
]

export function OrionMark({ size = 'md', className }: OrionMarkProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 512 512"
      className={cx('flex-shrink-0', SIZES[size].box, className)}
      role="presentation"
    >
      {MODULE_PATHS.map((d) => (
        <path key={d.slice(0, 24)} d={d} fill="var(--color-text-primary)" />
      ))}
    </svg>
  )
}
