import {
  AcademicCapIcon,
  BanknotesIcon,
  BoltIcon,
  CakeIcon,
  CloudIcon,
  CpuChipIcon,
  DevicePhoneMobileIcon,
  FilmIcon,
  FolderIcon,
  HomeIcon,
  MusicalNoteIcon,
  ShoppingBagIcon,
  SparklesIcon,
  TagIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/vue/24/outline'

const FALLBACK_ICONS = [
  FolderIcon,
  TagIcon,
  BanknotesIcon,
  ShoppingBagIcon,
  CloudIcon,
  HomeIcon,
]

/** Dokładne dopasowanie (klucz znormalizowany). */
const EXACT_ICONS = {
  music: MusicalNoteIcon,
  muzyka: MusicalNoteIcon,
  vod: FilmIcon,
  language: AcademicCapIcon,
  jezyk: AcademicCapIcon,
  język: AcademicCapIcon,
  communication: DevicePhoneMobileIcon,
  komunikacja: DevicePhoneMobileIcon,
  ai: SparklesIcon,
  food: CakeIcon,
  jedzenie: CakeIcon,
  'bez kategorii': TagIcon,
}

const KEYWORD_RULES = [
  { test: /muzy|music|audio|spotify/i, icon: MusicalNoteIcon },
  { test: /vod|video|film|netflix|stream|tv|apple tv/i, icon: FilmIcon },
  { test: /lang|jezyk|język|edu|nauka|duolingo/i, icon: AcademicCapIcon },
  { test: /comm|telefon|mobile|phone|orange|internet/i, icon: DevicePhoneMobileIcon },
  { test: /\bai\b|gpt|openai|ml|chip/i, icon: CpuChipIcon },
  { test: /food|jedzen|dieta|meal|kuchn|restaur/i, icon: CakeIcon },
  { test: /shop|zakup|grocery|market/i, icon: ShoppingBagIcon },
  { test: /dom|home|mieszk|rent|czynsz/i, icon: HomeIcon },
  { test: /transport|uber|paliw|auto|car/i, icon: TruckIcon },
  { test: /tool|saas|software|app|subscr/i, icon: WrenchScrewdriverIcon },
  { test: /cloud|host|server|aws/i, icon: CloudIcon },
  { test: /energ|prąd|prad|bolt|utilities/i, icon: BoltIcon },
]

function normalizeCategoryName(name) {
  return (name ?? '').trim().toLowerCase()
}

function hashIndex(name, modulo) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i) * (i + 1)) % modulo
  }
  return hash
}

export function categoryIconComponent(name) {
  const key = normalizeCategoryName(name)

  if (EXACT_ICONS[key]) {
    return EXACT_ICONS[key]
  }

  for (const rule of KEYWORD_RULES) {
    if (rule.test.test(name)) {
      return rule.icon
    }
  }

  return FALLBACK_ICONS[hashIndex(key || 'x', FALLBACK_ICONS.length)]
}
