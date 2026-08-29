// Splits a 0–5 rating into whole/half/empty star counts for rendering.
// Ported from online_library_2's lib/book.ts (starRating helper).
export function starParts(rating: number): { full: number; half: boolean; empty: number } {
  const r = Math.max(0, Math.min(5, Number(rating) || 0))
  const full = Math.floor(r)
  const half = r - full >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return { full, half, empty }
}
