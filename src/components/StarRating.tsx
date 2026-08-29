import { Star } from 'lucide-react'
import { starParts } from '../lib/rating'
import clsx from 'clsx'

interface StarRatingProps {
  rating: number
  size?: number
  showValue?: boolean
  className?: string
}

// Ported from online_library_2's StarRating.tsx, re-themed to this project's
// stone/warning palette (matches the rating stars already used as a
// hardcoded placeholder on BookDetailPage).
export default function StarRating({ rating, size = 14, showValue = false, className }: StarRatingProps) {
  // Defensive: `rating` can be undefined/null if a book row predates the
  // rating column or the migration hasn't run yet — never let that crash
  // the page it's rendered on.
  const safeRating = Number(rating) || 0
  const { full, half, empty } = starParts(safeRating)

  return (
    <div className={clsx('flex items-center gap-0.5', className)} aria-label={`Rating: ${safeRating.toFixed(1)} of 5`}>
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} className="text-warning-500 fill-warning-500" style={{ width: size, height: size }} />
      ))}
      {half && (
        <div className="relative" style={{ width: size, height: size }}>
          <Star className="absolute inset-0 text-stone-300" style={{ width: size, height: size }} />
          <Star
            className="absolute inset-0 text-warning-500 fill-warning-500"
            style={{ width: size, height: size, clipPath: 'inset(0 50% 0 0)' }}
          />
        </div>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} className="text-stone-300" style={{ width: size, height: size }} />
      ))}
      {showValue && <span className="text-sm text-stone-500 ml-2">{safeRating.toFixed(1)}</span>}
    </div>
  )
}
