export const PORTFOLIO_TRACKING_MODES = [
  { value: 'manual', label: 'Wartość ręczna' },
  { value: 'unit_price', label: 'Z ceny jednostkowej (link)' },
]

export function portfolioTrackingLabel(mode) {
  return PORTFOLIO_TRACKING_MODES.find((m) => m.value === mode)?.label ?? 'Wartość ręczna'
}
