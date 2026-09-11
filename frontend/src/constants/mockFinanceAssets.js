export const MOCK_FINANCE_ASSETS = [
  { id: 1, name: 'Card 1', account_number: '1234567890', account_name: 'Raty', category: 'fiat', balance: '409.56 PLN' },
  { id: 2, name: 'Card 2', account_number: '1234567890', account_name: 'Oszczednosci', category: 'fiat', balance: '00.00 PLN' },
  { id: 3, name: 'Card 3', account_number: '1234567890', account_name: 'VoD Muzyka', category: 'fiat', balance: '30.96 PLN' },
  {
    id: 4,
    name: 'Card 4',
    account_number: '1234567890',
    account_name: 'Oszczednosci - czesne',
    category: 'fiat',
    balance: '24 080.50 PLN',
  },
  { id: 5, name: 'Card 5', account_number: '1234567890', account_name: 'Mieszkanie', category: 'fiat', balance: '83.90 PLN' },
  { id: 6, name: 'Stock wallett', account_number: '1234567890', account_name: 'XTB', category: 'investment', balance: '43 000.00 PLN' },
  { id: 7, name: 'Stocks', account_number: '1234567890', account_name: 'Holidays', category: 'fiat', balance: '' },
  { id: 8, name: 'Collectible', account_number: '1234567890', account_name: 'Family', category: 'fiat', balance: '' },
]

/** Parse balance strings like "24 080.50 PLN" to a number. */
export function parseMockAssetBalance(balance) {
  if (balance == null || String(balance).trim() === '') return 0
  const n = parseFloat(String(balance).replace(/PLN/gi, '').replace(/\s/g, '').trim())
  return Number.isFinite(n) ? n : 0
}

export function mockFinanceAssetsTotal() {
  return MOCK_FINANCE_ASSETS.reduce((sum, a) => sum + parseMockAssetBalance(a.balance), 0)
}
