import { colorSwatchStyle, displayColorName } from './itemColors'

export const SKIN_TONE_OPTIONS = [
  { value: 'bardzo_jasna', label: 'Bardzo jasna' },
  { value: 'jasna', label: 'Jasna' },
  { value: 'srednia', label: 'Średnia' },
  { value: 'oliwkowa', label: 'Oliwkowa' },
  { value: 'ciemna', label: 'Ciemna' },
  { value: 'bardzo_ciemna', label: 'Bardzo ciemna' },
]

const SKIN_TONE_HEX = {
  bardzo_jasna: '#fde8d8',
  jasna: '#f5d0b5',
  srednia: '#d4a574',
  oliwkowa: '#b8956a',
  ciemna: '#8d5524',
  bardzo_ciemna: '#5c3d2e',
}

export function displaySkinTone(value) {
  if (!value) return null
  const option = SKIN_TONE_OPTIONS.find((o) => o.value === value)
  return option?.label ?? displayColorName(value) ?? value
}

export function skinToneSwatchStyle(value) {
  const hex = SKIN_TONE_HEX[value]
  if (hex) return { backgroundColor: hex }
  return colorSwatchStyle(value)
}

export function emptyBodyForm() {
  const today = new Date()
  const recordedAt = today.toISOString().slice(0, 10)

  return {
    recorded_at: recordedAt,
    height_cm: '',
    weight_kg: '',
    skin_tone: '',
    chest_cm: '',
    waist_cm: '',
    hips_cm: '',
    shoulder_cm: '',
    inseam_cm: '',
    notes: '',
  }
}

export function snapshotToForm(snapshot) {
  if (!snapshot) return emptyBodyForm()

  return {
    recorded_at: snapshot.recorded_at?.slice?.(0, 10) ?? snapshot.recorded_at ?? '',
    height_cm: snapshot.height_cm ?? '',
    weight_kg: snapshot.weight_kg ?? '',
    skin_tone: snapshot.skin_tone ?? '',
    chest_cm: snapshot.chest_cm ?? '',
    waist_cm: snapshot.waist_cm ?? '',
    hips_cm: snapshot.hips_cm ?? '',
    shoulder_cm: snapshot.shoulder_cm ?? '',
    inseam_cm: snapshot.inseam_cm ?? '',
    notes: snapshot.notes ?? '',
  }
}

export function formToPayload(form) {
  const num = (v) => (v === '' || v == null ? null : Number(v))

  return {
    recorded_at: form.recorded_at,
    height_cm: num(form.height_cm),
    weight_kg: num(form.weight_kg),
    skin_tone: form.skin_tone || null,
    chest_cm: num(form.chest_cm),
    waist_cm: num(form.waist_cm),
    hips_cm: num(form.hips_cm),
    shoulder_cm: num(form.shoulder_cm),
    inseam_cm: num(form.inseam_cm),
    notes: form.notes?.trim() || null,
  }
}

export function formatMeasurement(value, unit) {
  if (value == null || value === '') return '—'
  return `${value} ${unit}`
}

export function formatSnapshotDate(value) {
  if (!value) return '—'
  const date = new Date(value.includes('T') ? value : `${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function deltaLabel(current, previous, unit, decimals = 1) {
  if (current == null || previous == null) return null
  const diff = Number(current) - Number(previous)
  if (!Number.isFinite(diff) || diff === 0) return null
  const sign = diff > 0 ? '+' : ''
  return `${sign}${diff.toFixed(decimals)} ${unit}`
}
