/** Ocena „jak bardzo lubimy” produkt — 1–5 buźek. */

export const LIKE_RATING_LEVELS = [
  { value: 1, emoji: '😞', label: 'Słabo' },
  { value: 2, emoji: '😕', label: 'Tak sobie' },
  { value: 3, emoji: '😐', label: 'OK' },
  { value: 4, emoji: '🙂', label: 'Lubię' },
  { value: 5, emoji: '🤩', label: 'Uwielbiam' },
]

export function normalizeLikeRating(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1 || n > 5) return null
  return n
}

export function likeRatingLevel(value) {
  const rating = normalizeLikeRating(value)
  if (!rating) return null
  return LIKE_RATING_LEVELS.find((l) => l.value === rating) ?? null
}

export function displayLikeRating(value) {
  const level = likeRatingLevel(value)
  if (!level) return null
  return `${level.emoji} ${level.label}`
}
