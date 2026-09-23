/**
 * Centralna konfiguracja sidebara — edytuj ten plik, aby zmienić wygląd i menu.
 *
 * Struktura:
 * - sidebarNavigation — pozycje menu (nazwa, ścieżka, ikona)
 * - sidebarLayout — wymiary i offset treści
 * - sidebarClasses — gotowe klasy Tailwind (powłoka, brand, linki, mobile header)
 * - sidebarNavLinkClass / sidebarNavIconClass — stany aktywny / nieaktywny
 */

import { translate as t } from '../i18n'

import {
  UserIcon,
  CubeTransparentIcon,
  BanknotesIcon,
  CalendarIcon,
  SparklesIcon,
  SwatchIcon,
  Cog6ToothIcon,
  CpuChipIcon,
} from '@heroicons/vue/24/outline'

// ——— Menu ———————————————————————————————————————————————————————————————————

export const sidebarNavigation = [
  { labelKey: 'nav.overview', href: '/home', icon: CubeTransparentIcon },
  {
    labelKey: 'nav.souls',
    href: '/souls/prims',
    icon: UserIcon,
    subItems: [
      { labelKey: 'nav.prims', href: '/souls/prims', activeMatch: 'prims' },
      { labelKey: 'souls.animals.title', href: '/souls/animals', activeMatch: 'exact' },
    ],
  },
  {
    labelKey: 'nav.style',
    href: '/style',
    icon: SwatchIcon,
    subItems: [
      { labelKey: 'style.nav.outfits', href: '/style', activeMatch: 'exact' },
      { labelKey: 'style.nav.aiStylist', href: '/style/ai-stylist', activeMatch: 'exact' },
      { labelKey: 'style.nav.styles', href: '/style/styles', activeMatch: 'styles' },
      { labelKey: 'nav.collection', href: '/collection', activeMatch: 'collection' },
    ],
  },
  {
    labelKey: 'nav.finance',
    href: '/finance',
    icon: BanknotesIcon,
    subItems: [
      { labelKey: 'finance.nav.overview', href: '/finance', activeMatch: 'exact' },
      { labelKey: 'finance.nav.portfolio', href: '/finance/portfolio', activeMatch: 'exact' },
      { labelKey: 'finance.nav.savings', href: '/finance/savings', activeMatch: 'exact' },
      { labelKey: 'finance.nav.accounts', href: '/finance/demo-assets', activeMatch: 'exact' },
      { labelKey: 'finance.nav.expenses', href: '/finance/expenses', activeMatch: 'exact' },
    ],
  },
  {
    labelKey: 'nav.growth',
    href: '/growth/goals',
    icon: SparklesIcon,
    subItems: [
      { labelKey: 'growth.nav.goals', href: '/growth/goals', activeMatch: 'growth-goals' },
      { labelKey: 'growth.nav.wellbeing', href: '/growth/wellbeing', activeMatch: 'exact' },
      { labelKey: 'growth.nav.sleep', href: '/growth/sleep', activeMatch: 'exact' },
      { labelKey: 'growth.nav.medical', href: '/growth/health', activeMatch: 'exact' },
    ],
  },
  { labelKey: 'nav.calendar', href: '/calendar', icon: CalendarIcon },
]

/** Konto aplikacji — profil użytkownika (nie Souls / Prims). */
export const sidebarAccountNavigation = [
  {
    labelKey: 'account.nav.settings',
    href: '/account',
    icon: Cog6ToothIcon,
    activeMatch: 'exact',
  },
  {
    labelKey: 'account.nav.backend',
    href: '/account/backend',
    icon: CpuChipIcon,
    activeMatch: 'prefix',
    adminOnly: true,
  },
]

/** Account nav filtered for the signed-in user (hides admin-only entries). */
export function sidebarAccountNavigationForUser({ isAdmin = false } = {}) {
  return sidebarAccountNavigation.filter((item) => !item.adminOnly || isAdmin)
}

// ——— Wymiary i layout —————————————————————————————————————————————————————

export const sidebarLayout = {
  /** Szerokość sidebara na desktop (Tailwind width) */
  width: 'w-64',
  /** Padding głównej treści pod sidebar na desktop */
  mainOffset: 'lg:pl-64',
  /** Max szerokość panelu mobilnego */
  mobilePanelMax: 'max-w-[17rem]',
  /** Odstęp między sidebarem a treścią */
  mainInnerPad: 'lg:pl-1',
  /** Padding pionowy obszaru treści */
  mainPy: 'py-10 sm:py-12',
  /**
   * Górna wpadka sidebara — pierwszy link nawigacji zrównany z <router-view>
   * (mainPy + wysokość AppPageSearch + mb-8 − brand − odstęp sekcji nav).
   */
  navTopPad:
    'pt-[calc(theme(spacing.10)+theme(spacing.9)+theme(spacing.8)-theme(spacing.11)-theme(spacing.5))] sm:pt-[calc(theme(spacing.12)+theme(spacing.9)+theme(spacing.8)-theme(spacing.11)-theme(spacing.5))]',
}

// ——— Klasy wizualne (Tailwind) ——————————————————————————————————————————————

export const sidebarClasses = {
  // Powłoka desktop
  desktopShell: [
    'hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col',
    sidebarLayout.width,
    'border-r border-gray-200/80 bg-gray-50 dark:bg-zinc-950',
  ].join(' '),

  // Panel mobilny (drawer)
  mobilePanel: 'flex grow flex-col border-r border-gray-200/80 bg-white',
  mobileOverlay: 'fixed inset-0 bg-gray-900/60 backdrop-blur-[2px]',
  mobileCloseBtn: '-m-2.5 rounded-md p-2.5 text-white/80 hover:text-white',

  // Wnętrze nawigacji
  navRoot: [
    'flex h-full min-h-0 flex-col px-3 pb-5',
    sidebarLayout.navTopPad,
  ].join(' '),
  navList: 'flex flex-1 flex-col gap-y-2.5',
  navSection: 'mt-5 flex flex-1 flex-col min-h-0',
  navAccountSection: 'mt-6 shrink-0',
  navGroupLabel:
    'px-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400',
  navAccountList: 'mt-2 flex flex-col gap-y-2.5',
  navSubList: 'mt-1 flex flex-col gap-y-1 border-l border-gray-200/80 ml-3 pl-1',
  navFooter: 'mt-6 shrink-0 border-t border-gray-200/80 pt-3',

  // Brand / logo
  brandRow: 'flex h-11 shrink-0 items-center px-3',
  brandText:
    'text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-900 dark:text-zinc-100',

  // Link nawigacji — baza (wspólna dla active i inactive)
  navLinkBase:
    'group flex w-full min-h-10 items-center gap-x-3 rounded-lg px-3 py-2.5 text-[13px] font-medium leading-none tracking-tight transition-colors duration-150',
  navLinkActive: 'bg-gray-900/[0.06] text-gray-950 dark:bg-white/[0.06] dark:text-zinc-50',
  navLinkInactive: 'text-gray-500 hover:bg-gray-900/[0.04] hover:text-gray-800 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-200',

  // Ikony linków
  navIconBase: 'size-[1.125rem] shrink-0 stroke-[1.75]',
  navIconActive: 'text-gray-900 dark:text-zinc-100',
  navIconInactive: 'text-gray-400 group-hover:text-gray-600 dark:text-zinc-500 dark:group-hover:text-zinc-300',

  // Konto użytkownika w stopce sidebara (ten sam rytm co navLinkBase)
  accountButton:
    'group flex w-full min-h-10 items-center gap-x-3 rounded-lg px-3 py-2.5 text-[13px] font-medium leading-none tracking-tight text-gray-500 transition-colors duration-150 hover:bg-gray-900/[0.04] hover:text-gray-800 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-200',
  accountAvatar: 'size-7 rounded-full bg-gray-100 outline -outline-offset-1 outline-black/5 dark:bg-zinc-800',
  accountChevron: 'size-4 shrink-0 text-gray-400',

  // Mobile top bar (nad treścią)
  mobileHeader:
    'sticky top-0 z-40 flex items-center gap-x-4 border-b border-gray-200/80 bg-white/90 px-4 py-3 backdrop-blur-sm dark:bg-zinc-950/90 sm:px-6 lg:hidden',
  mobileMenuBtn:
    '-m-2.5 rounded-md p-2.5 text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
  mobileTitle: 'flex-1 truncate text-sm font-medium tracking-tight text-gray-900 dark:text-zinc-100',
}

// ——— Pomocnicze —————————————————————————————————————————————————————————————

export function sidebarNavLinkClass(active) {
  return [
    sidebarClasses.navLinkBase,
    active ? sidebarClasses.navLinkActive : sidebarClasses.navLinkInactive,
  ]
}

export function sidebarNavIconClass(active) {
  return [
    sidebarClasses.navIconBase,
    active ? sidebarClasses.navIconActive : sidebarClasses.navIconInactive,
  ]
}

export function isSoulsSectionActive(path) {
  return path.startsWith('/souls') || path.startsWith('/personas')
}

export function isGrowthSectionActive(path) {
  return path.startsWith('/growth')
}

export function isFinanceSectionActive(path) {
  return path.startsWith('/finance')
}

export function isStyleSectionActive(path) {
  return path.startsWith('/style') || path.startsWith('/collection')
}

/** Czy aktualna trasa należy do grupy z podmenu (Souls, Style, Finanse, Rozwój, …). */
export function isNavGroupActive(item, path) {
  if (!item?.subItems?.length) return false
  if (item.labelKey === 'nav.style' || item.href?.startsWith('/style') || item.href === '/collection') {
    return isStyleSectionActive(path)
  }
  if (item.href?.startsWith('/growth')) {
    return isGrowthSectionActive(path)
  }
  if (item.href?.startsWith('/finance')) {
    return isFinanceSectionActive(path)
  }
  if (item.href?.startsWith('/souls')) {
    return isSoulsSectionActive(path)
  }
  return item.subItems.some((sub) => isSidebarNavItemActive(sub, path))
}

export function isSidebarNavItemActive(item, path) {
  if (item.activeMatch === 'exact') {
    return path === item.href
  }
  if (item.activeMatch === 'collection') {
    return path.startsWith('/collection')
  }
  if (item.activeMatch === 'styles') {
    return path === '/style/styles' || path.startsWith('/style/styles/')
  }
  if (item.activeMatch === 'prims') {
    return (
      path === '/souls/prims' ||
      /^\/souls\/prims\/[^/]+$/.test(path) ||
      path === '/personas' ||
      /^\/personas\/[^/]+$/.test(path)
    )
  }
  if (item.subItems) {
    if (item.labelKey === 'nav.style') return isStyleSectionActive(path)
    if (item.href?.startsWith('/growth')) return path.startsWith('/growth')
    if (item.href?.startsWith('/finance')) return path.startsWith('/finance')
    if (item.href?.startsWith('/style')) return isStyleSectionActive(path)
    if (item.href?.startsWith('/souls')) return isSoulsSectionActive(path)
    return item.subItems.some((sub) => isSidebarNavItemActive(sub, path))
  }
  if (item.activeMatch === 'growth-goals') {
    return path === '/growth' || path.startsWith('/growth/goals')
  }
  if (item.href === '/home') return path === '/home' || path === '/'
  if (item.href === '/collection') return path.startsWith('/collection')
  if (item.href === '/style') return path.startsWith('/style')
  return path === item.href || path.startsWith(`${item.href}/`)
}

/** @deprecated Użyj isSidebarNavItemActive */
export function isSidebarNavActive(item, path) {
  return isSidebarNavItemActive(item, path)
}

export function sidebarPageTitle(path) {
  if (path.startsWith('/account/backend/style-modules')) return t('admin.styleModules.title')
  if (path.startsWith('/account/backend') || path.startsWith('/account/model-assistant')) {
    return t('account.nav.backend')
  }
  if (path.startsWith('/account')) return t('account.section')
  if (path.startsWith('/finance')) return t('nav.finance')
  if (path.startsWith('/growth')) return t('nav.growth')
  if (path.startsWith('/collection')) return t('nav.collection')
  if (path.startsWith('/style/styles')) return t('style.nav.styles')
  if (path.startsWith('/style/ai-stylist')) return t('style.nav.aiStylist')
  if (path.startsWith('/style')) return t('nav.style')
  if (path.startsWith('/souls/animals')) return t('souls.animals.title')
  if (path.startsWith('/souls/prims') || /^\/souls\/prims\/\d+/.test(path)) return t('nav.prims')
  if (path.startsWith('/souls') || path.startsWith('/personas')) return t('nav.souls')
  const accountItem = sidebarAccountNavigation.find((n) =>
    isSidebarNavItemActive(n, path),
  )
  if (accountItem?.labelKey) return t(accountItem.labelKey)
  const item = sidebarNavigation.find((n) => isSidebarNavItemActive(n, path))
  return item?.labelKey ? t(item.labelKey) : t('nav.overview')
}

/** Tekst brandu — zmień w sidebarClasses.brandText lub tutaj */
export const sidebarBrandText = 'nohooks'
