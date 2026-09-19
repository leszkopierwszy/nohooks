import {
  PRESETS,
  loadAppearance,
  saveAppearance,
  resolveTheme,
  applyTheme,
  themeFromCustomColor,
  luminance,
} from './theme.js'

const pollTimers = new Map()
let appearance = loadAppearance()
let allBundles = []

function initTheme() {
  const theme = resolveTheme(appearance)
  applyTheme(theme)
  updateStatusVars(theme)
  document.documentElement.dataset.theme = theme.id === 'dark' || luminance(theme.pageBg) <= 0.55 ? 'dark' : 'light'
  renderPresetChips()
  const picker = document.getElementById('bg-color-picker')
  const hex = document.getElementById('bg-color-hex')
  if (picker && hex) {
    const color = appearance.preset === 'custom' ? appearance.customColor : theme.pageBg
    picker.value = color
    hex.value = color
  }
}

function updateStatusVars(theme) {
  const light = luminance(theme.pageBg) > 0.55
  const root = document.documentElement
  if (light) {
    root.style.setProperty('--status-neutral-bg', '#f4f4f5')
    root.style.setProperty('--status-neutral-text', '#52525b')
    root.style.setProperty('--status-ok-bg', '#d1fae5')
    root.style.setProperty('--status-ok-text', '#047857')
    root.style.setProperty('--status-warn-bg', '#fef3c7')
    root.style.setProperty('--status-warn-text', '#92400e')
    root.style.setProperty('--status-err-bg', '#fee2e2')
    root.style.setProperty('--status-err-text', '#991b1b')
    root.style.setProperty('--size-ok', '#059669')
  } else {
    root.style.setProperty('--status-neutral-bg', '#27272a')
    root.style.setProperty('--status-neutral-text', '#a1a1aa')
    root.style.setProperty('--status-ok-bg', '#064e3b')
    root.style.setProperty('--status-ok-text', '#6ee7b7')
    root.style.setProperty('--status-warn-bg', '#422006')
    root.style.setProperty('--status-warn-text', '#fcd34d')
    root.style.setProperty('--status-err-bg', '#450a0a')
    root.style.setProperty('--status-err-text', '#fca5a5')
    root.style.setProperty('--size-ok', '#34d399')
  }
}

function setPreset(presetId) {
  appearance.preset = presetId
  if (presetId !== 'custom') appearance.customColor = PRESETS[presetId].pageBg
  saveAppearance(appearance)
  initTheme()
}

function setCustomColor(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    toast('Podaj kolor w formacie #rrggbb', true)
    return
  }
  appearance.preset = 'custom'
  appearance.customColor = hex
  saveAppearance(appearance)
  initTheme()
}

function renderPresetChips() {
  const wrap = document.getElementById('preset-buttons')
  if (!wrap) return
  wrap.innerHTML = Object.values(PRESETS)
    .map(
      (p) =>
        `<button type="button" class="preset-chip ${appearance.preset === p.id ? 'active' : ''}" data-preset="${p.id}">${p.label}</button>`
    )
    .join('')
  wrap.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => setPreset(btn.dataset.preset))
  })
}

function statusPill(ok, label) {
  const cls = ok ? 'status-pill status-pill--ok' : 'status-pill status-pill--err'
  return `<span class="${cls}">${label}</span>`
}

async function loadObservability() {
  const panel = document.getElementById('observability-panel')
  if (!panel) return
  panel.innerHTML = '<p class="text-sm themed-muted col-span-full">Ładowanie statusu usług…</p>'
  try {
    const data = await fetch('/api/observability').then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json()
    })
    const lf = data.langfuse || {}
    const pp = data.product_parser || {}
    const lfUrl = lf.ui_url || 'http://localhost:3100'
    panel.innerHTML = [
      '<div class="guide-card">',
      '<h3>Langfuse UI</h3>',
      `<p class="text-sm themed-muted mt-1">${lf.tracing_note || ''}</p>`,
      '<p class="mt-3 flex flex-wrap items-center gap-2">',
      statusPill(lf.online, lf.online ? 'Online' : 'Offline'),
      `<a href="${lfUrl}" target="_blank" rel="noopener" class="themed-link text-sm">${lfUrl} ↗</a>`,
      '</p></div>',
      '<div class="guide-card">',
      '<h3>Product parser</h3>',
      `<p class="text-sm themed-muted mt-1">${pp.url || '—'}</p>`,
      '<p class="mt-3 flex flex-wrap items-center gap-2">',
      statusPill(pp.online, pp.online ? 'Online' : 'Offline'),
      statusPill(pp.langfuse_tracing, pp.langfuse_tracing ? 'Tracing ON' : 'Tracing OFF'),
      '</p></div>',
      '<div class="guide-card">',
      '<h3>Co logujemy</h3>',
      '<ul class="text-sm themed-muted mt-2 space-y-1 list-disc pl-4">',
      '<li><code>parse_product</code> — import z URL sklepu</li>',
      '<li><code>rank_product_images</code> — wybór covera</li>',
      '<li><code>ollama_vision</code> — klasyfikacja zdjęć</li>',
      '</ul>',
      `<a href="${lfUrl}" target="_blank" rel="noopener" class="themed-link text-sm inline-block mt-3">Zobacz trace’y w Langfuse →</a>`,
      '</div>',
    ].join('').replace(/<\/?motion\.div>/g, (tag) => tag.replace('motion.', ''))
  } catch (e) {
    panel.innerHTML = `<p class="text-sm text-red-600 col-span-full">Nie udało się pobrać statusu: ${e.message}</p>`
  }
}

function toast(msg, isErr = false) {
  const el = document.getElementById('toast')
  el.textContent = msg
  el.classList.remove('hidden')
  el.style.borderColor = isErr ? '#ef4444' : 'var(--card-border)'
  setTimeout(() => el.classList.add('hidden'), 5000)
}

function statusLabel(s, progress) {
  const m = {
    not_installed: 'Nie zainstalowany',
    partial: 'Częściowo na dysku',
    pending: 'Oczekuje',
    downloading: 'Pobieranie…',
    installed: 'Zainstalowany',
    uninstalling: 'Usuwanie…',
    uninstalled: 'Cofnięty',
    failed: 'Błąd',
  }
  if (progress?.overall_percent != null && ['pending', 'downloading', 'uninstalling'].includes(s)) {
    return `${m[s] || s} ${progress.overall_percent}%`
  }
  return m[s] || s
}

function renderProgressBlock(inst, st) {
  if (!inst || !['pending', 'downloading', 'uninstalling'].includes(st)) return ''
  const p = inst.progress || {}
  const pct = Math.max(0, Math.min(100, p.overall_percent ?? 0))
  const msg = p.message || inst.error_message || statusLabel(st)
  const detail =
    p.file_count > 0
      ? `Plik ${p.file_index || 0}/${p.file_count}${p.current_filename ? `: ${p.current_filename}` : ''}`
      : ''
  const bytes =
    p.bytes_total_human && p.bytes_downloaded_human
      ? `${p.bytes_downloaded_human} / ${p.bytes_total_human}`
      : p.bytes_downloaded_human || ''

  return `
    <div class="mt-3 rounded-lg border p-3" style="border-color: var(--card-border); background: color-mix(in srgb, var(--accent) 6%, var(--card-bg))">
      <p class="text-sm font-medium m-0" style="color: var(--text)">${msg}</p>
      ${detail ? `<p class="text-xs themed-muted mt-1 mb-0">${detail}${bytes ? ` · ${bytes}` : ''}</p>` : ''}
      <div class="progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-fill" style="width: ${pct}%"></div>
      </div>
    </div>`
}

function renderActiveDownloads() {
  const el = document.getElementById('active-downloads')
  if (!el) return
  const active = allBundles.filter((b) =>
    ['pending', 'downloading', 'uninstalling'].includes(b.install_status)
  )
  if (!active.length) {
    el.classList.add('hidden')
    el.innerHTML = ''
    return
  }
  el.classList.remove('hidden')
  el.innerHTML = `
    <div class="active-downloads-banner">
      <p class="text-sm font-semibold m-0 mb-2" style="color: var(--text)">Aktywne operacje (${active.length})</p>
      ${active
        .map((b) => {
          const p = b.installation?.progress || {}
          const pct = p.overall_percent ?? 0
          return `
          <div class="mb-3 last:mb-0">
            <div class="flex justify-between text-sm">
              <span class="font-medium">${b.name}</span>
              <span class="themed-muted">${statusLabel(b.install_status, p)}</span>
            </div>
            <p class="text-xs themed-muted mt-0.5 mb-1">${p.message || '—'}</p>
            <div class="progress-track"><div class="progress-fill" style="width: ${pct}%"></div></div>
          </div>`
        })
        .join('')}
    </div>`
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('pl-PL')
  } catch {
    return iso
  }
}

function formatBytes(n) {
  if (!n) return '0 B'
  let i = 0
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(1)} ${u[i]}`
}

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: {
      Accept: 'application/json',
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...opts,
  })
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : null
  if (!res.ok) {
    let msg = res.statusText
    if (typeof data?.detail === 'string') msg = data.detail
    else if (Array.isArray(data?.detail)) msg = data.detail.map((d) => d.msg).join('; ')
    throw new Error(msg)
  }
  return data
}

function renderStorage(storage) {
  const el = document.getElementById('storage-summary')
  if (!el || !storage) return
  el.innerHTML = `<strong>${storage.total_human}</strong> w folderze modeli`
  const sub = document.getElementById('storage-subdirs')
  if (sub) {
    sub.innerHTML = Object.entries(storage.subdirs || {})
      .map(([k, v]) => `<li><span class="themed-muted">${k}</span> — ${v.human}</li>`)
      .join('')
  }
}

function pollInstallation(bundleId) {
  if (pollTimers.has(bundleId)) clearInterval(pollTimers.get(bundleId))
  const timer = setInterval(async () => {
    try {
      await loadBundles()
      const b = allBundles.find((x) => x.id === bundleId)
      const st = b?.install_status
      if (!st || !['pending', 'downloading', 'uninstalling'].includes(st)) {
        clearInterval(timer)
        pollTimers.delete(bundleId)
        if (st === 'installed') toast(`Zainstalowano: ${b.name}`)
        if (st === 'failed') toast(b.installation?.error_message || `Błąd: ${b.name}`, true)
      }
    } catch (e) {
      console.error(e)
    }
  }, 1000)
  pollTimers.set(bundleId, timer)
}

async function install(bundleId) {
  try {
    const { installation } = await api(`/api/bundles/${bundleId}/install`, { method: 'POST' })
    toast('Rozpoczęto pobieranie…')
    pollInstallation(bundleId)
    await loadBundles()
  } catch (e) {
    toast(e.message, true)
  }
}

async function uninstall(bundleId) {
  if (!confirm('Usunąć pliki tego pakietu z dysku?')) return
  try {
    await api(`/api/bundles/${bundleId}/uninstall`, { method: 'POST' })
    toast('Usuwanie…')
    pollInstallation(bundleId)
    await loadBundles()
  } catch (e) {
    toast(e.message, true)
  }
}

async function removeFromCatalog(bundleId) {
  if (!confirm('Usunąć wpis z katalogu?')) return
  try {
    await api(`/api/bundles/custom/${bundleId}`, { method: 'DELETE' })
    toast('Usunięto z katalogu')
    await loadBundles()
  } catch (e) {
    toast(e.message, true)
  }
}

async function addCustom() {
  const urls = document.getElementById('custom-urls').value.trim()
  if (!urls) {
    toast('Wklej link HF', true)
    return
  }
  const body = {
    hf_urls: urls.split('\n').map((s) => s.trim()).filter(Boolean),
    name: document.getElementById('custom-name').value.trim() || null,
  }
  const sub = document.getElementById('custom-subdir').value
  if (sub) body.target_subdir = sub
  try {
    await api('/api/bundles/custom', { method: 'POST', body: JSON.stringify(body) })
    toast('Dodano do katalogu')
    document.getElementById('custom-urls').value = ''
    document.getElementById('custom-name').value = ''
    await loadBundles()
    document.getElementById('bundles')?.scrollIntoView({ behavior: 'smooth' })
  } catch (e) {
    toast(e.message, true)
  }
}

function renderBundle(b) {
  const st = b.install_status
  const missing = b.missing_file_count ?? 0
  const canInstall =
    missing > 0 && !['pending', 'downloading', 'uninstalling'].includes(st)
  const canUninstall = st === 'installed' && !!b.installation
  const isCustom = b.custom || (b.id && b.id.startsWith('custom-'))
  const inst = b.installation
  const completed = new Set(inst?.progress?.files_completed || [])
  const currentFile = inst?.progress?.current_filename

  const filesHtml = (b.files || [])
    .map((f) => {
      let icon = '○'
      let rowClass = 'themed-muted'
      const skipNote = f.skip_download ? ' <span class="text-xs">(już na dysku)</span>' : ''
      if (f.installed) {
        icon = '✓'
        rowClass = 'file-row-done'
      } else if (f.downloading || f.filename === currentFile) {
        icon = '↻'
        rowClass = 'file-row-downloading'
      } else if (completed.has(f.filename)) {
        icon = '✓'
        rowClass = 'file-row-done'
      }
      return `
      <li class="text-sm ${rowClass}">
        ${icon} ${f.filename}
        ${f.size_bytes ? ` (${formatBytes(f.size_bytes)})` : ''}${skipNote}
        — <a href="${f.hf_url}" target="_blank" rel="noopener" class="themed-link">${f.filename}</a>
      </li>`
    })
    .join('')

  const sizeLine = b.disk_summary
    ? `<span class="${missing ? 'themed-muted' : 'size-ok'}">${b.disk_summary}</span>`
    : b.installed_size_bytes > 0
      ? `<span class="size-ok">Na dysku: ${b.installed_size_human}</span> <span class="themed-muted">(${b.installed_file_count}/${b.file_count})</span>`
      : `<span class="themed-muted">0 B na dysku · ${b.file_count} plików</span>`

  const installBtnLabel =
    missing > 0
      ? missing === b.file_count
        ? 'Pobierz i zainstaluj'
        : `Pobierz brakujące (${missing})`
      : 'Już kompletny na dysku'

  return `
    <article id="bundle-${b.id}" class="bundle-card scroll-mt-24" data-bundle-name="${(b.name || '').toLowerCase()}">
      <div class="flex flex-wrap items-center gap-2">
        <h3 class="text-base font-semibold m-0" style="color:var(--text)">${b.name}</h3>
        ${isCustom ? '<span class="themed-tag-custom text-xs font-medium px-2 py-0.5 rounded-full">własny</span>' : ''}
        <span class="status-pill status-${st}">${statusLabel(st, inst?.progress)}</span>
      </div>
      ${renderProgressBlock(inst, st)}
      <p class="mt-2 text-sm themed-muted mb-0">${b.description || ''}</p>
      <div class="mt-2 flex flex-wrap gap-1">${(b.tags || []).map((t) => `<span class="themed-tag text-xs px-2 py-0.5 rounded-full">${t}</span>`).join('')}</div>
      <p class="mt-2 text-sm mb-1">${sizeLine}</p>
      <p class="text-sm themed-muted mb-0">
        <a href="${b.hf_page}" target="_blank" rel="noopener" class="themed-link">Hugging Face →</a>
        · ${b.catalog_added || '—'}
        ${inst?.installed_at ? ` · ${formatDate(inst.installed_at)}` : ''}
      </p>
      ${inst?.error_message && st === 'failed' ? `<p class="mt-2 text-sm text-red-600">${inst.error_message}</p>` : ''}
      <ul class="mt-3 list-disc pl-5 space-y-0.5">${filesHtml}</ul>
      <div class="mt-4 flex flex-wrap gap-2">
        <button type="button" ${canInstall ? '' : 'disabled'} onclick="install('${b.id}')"
          class="btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
          ${installBtnLabel}
        </button>
        <button type="button" ${canUninstall ? '' : 'disabled'} onclick="uninstall('${b.id}')"
          class="btn-outline rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
          Cofnij
        </button>
        ${isCustom ? `<button type="button" onclick="removeFromCatalog('${b.id}')" class="btn-outline rounded-lg px-3 py-2 text-sm">Usuń z katalogu</button>` : ''}
      </div>
    </article>`
}

function filterBundles(query) {
  const q = query.trim().toLowerCase()
  const list = q
    ? allBundles.filter(
        (b) =>
          (b.name || '').toLowerCase().includes(q) ||
          (b.description || '').toLowerCase().includes(q) ||
          (b.tags || []).some((t) => t.toLowerCase().includes(q))
      )
    : allBundles
  const app = document.getElementById('bundle-list')
  if (!app) return
  app.innerHTML = list.length
    ? list.map(renderBundle).join('')
    : '<p class="text-sm themed-muted">Brak wyników.</p>'
}

async function loadBundles() {
  const { bundles, storage } = await api('/api/bundles')
  allBundles = bundles
  renderStorage(storage)
  filterBundles(document.getElementById('bundle-search')?.value || '')
  renderActiveDownloads()
  bundles.forEach((b) => {
    if (['pending', 'downloading', 'uninstalling'].includes(b.install_status)) {
      pollInstallation(b.id)
    }
  })
  updateSidebarBundleLinks(bundles)
}

function updateSidebarBundleLinks(bundles) {
  const nav = document.getElementById('nav-bundles')
  if (!nav) return
  const top = bundles.slice(0, 8)
  nav.innerHTML = top
    .map(
      (b) =>
        `<a href="#bundle-${b.id}" class="nav-link text-xs py-1">${b.name}</a>`
    )
    .join('')
}

function setupNavScrollSpy() {
  const links = document.querySelectorAll('.nav-link[data-section]:not([data-view])')
  const sections = [...links].map((l) => document.getElementById(l.dataset.section)).filter(Boolean)

  const observer = new IntersectionObserver(
    (entries) => {
      if (document.getElementById('view-home')?.hidden) return
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          document.querySelectorAll('.nav-link[data-section]').forEach((l) => {
            l.classList.toggle('active', l.dataset.section === entry.target.id)
          })
        }
      })
    },
    { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
  )
  sections.forEach((s) => observer.observe(s))
}

const STANDALONE_VIEWS = new Set(['fashion-ai', 'openai-prompt', 'openai-logs'])

function setActiveNav(sectionId) {
  document.querySelectorAll('.nav-link[data-section]').forEach((l) => {
    l.classList.toggle('active', l.dataset.section === sectionId)
  })
}

function showAppView(viewId) {
  document.querySelectorAll('[data-app-view]').forEach((el) => {
    const match = el.dataset.appView === viewId
    el.hidden = !match
  })
  if (viewId !== 'home') {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
  }
}

function applyRouteFromHash() {
  const raw = (location.hash || '#intro').replace(/^#/, '')
  const id = raw.startsWith('bundle-') ? 'bundles' : raw || 'intro'

  if (STANDALONE_VIEWS.has(id)) {
    showAppView(id)
    setActiveNav(id)
    if (id === 'fashion-ai') loadFashionAi().catch((e) => console.error(e))
    if (id === 'openai-prompt') loadOpenaiPrompt().catch((e) => console.error(e))
    if (id === 'openai-logs') loadOpenaiLogs().catch((e) => console.error(e))
    return
  }

  showAppView('home')
  setActiveNav(id)
  const el = document.getElementById(id)
  if (el && raw) {
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
}

function setupViewRouter() {
  window.addEventListener('hashchange', () => applyRouteFromHash())
  applyRouteFromHash()
}

function setupSidebar() {
  const sidebar = document.getElementById('sidebar')
  const backdrop = document.getElementById('sidebar-backdrop')
  const open = () => {
    sidebar?.classList.add('open')
    backdrop?.classList.add('visible')
  }
  const close = () => {
    sidebar?.classList.remove('open')
    backdrop?.classList.remove('visible')
  }
  document.getElementById('btn-menu')?.addEventListener('click', open)
  backdrop?.addEventListener('click', close)
  sidebar?.querySelectorAll('.nav-link').forEach((a) => {
    a.addEventListener('click', () => {
      if (window.innerWidth < 1024) close()
    })
  })
}

function setupSearch() {
  const input = document.getElementById('bundle-search')
  const heroSearch = document.getElementById('hero-search')
  const sync = (v) => {
    if (input) input.value = v
    if (heroSearch) heroSearch.value = v
    filterBundles(v)
    if (v) {
      if (location.hash !== '#bundles') location.hash = 'bundles'
      else document.getElementById('bundles')?.scrollIntoView({ behavior: 'smooth' })
    }
  }
  input?.addEventListener('input', (e) => sync(e.target.value))
  heroSearch?.addEventListener('input', (e) => sync(e.target.value))
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      ;(document.getElementById('hero-search') || document.getElementById('bundle-search'))?.focus()
    }
  })
}

document.getElementById('btn-add-custom')?.addEventListener('click', addCustom)
document.getElementById('btn-apply-custom')?.addEventListener('click', () => {
  setCustomColor(document.getElementById('bg-color-hex').value.trim())
})
document.getElementById('bg-color-picker')?.addEventListener('input', (e) => {
  document.getElementById('bg-color-hex').value = e.target.value
})
document.getElementById('bg-color-hex')?.addEventListener('change', (e) => {
  let v = e.target.value.trim()
  if (!v.startsWith('#')) v = `#${v}`
  if (/^#[0-9a-fA-F]{6}$/.test(v)) {
    document.getElementById('bg-color-picker').value = v
    setCustomColor(v)
  }
})

window.install = install
window.uninstall = uninstall
window.removeFromCatalog = removeFromCatalog

initTheme()
setupSidebar()
setupNavScrollSpy()
setupSearch()
document.getElementById('btn-refresh-observability')?.addEventListener('click', () => loadObservability())

async function loadFashionAi() {
  const badge = document.getElementById('fashion-ai-badge')
  const msg = document.getElementById('fashion-ai-msg')
  const list = document.getElementById('fashion-keys-list')
  try {
    const data = await fetch('/api/fashion-ai/settings').then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json()
    })
    if (badge) {
      const n = (data.keys || []).length
      badge.textContent = data.configured
        ? `Connected · ${n} key${n === 1 ? '' : 's'}`
        : 'Not configured'
    }
    const model = document.getElementById('fashion-model')
    const base = document.getElementById('fashion-base-url')
    const key = document.getElementById('fashion-api-key')
    const label = document.getElementById('fashion-key-label')
    if (model) model.value = data.model || 'gpt-4o-mini'
    if (base) base.value = data.base_url || 'https://api.openai.com/v1'
    if (key) key.value = ''
    if (label) label.value = ''
    if (list) {
      const keys = data.keys || []
      if (!keys.length) {
        list.innerHTML = '<p class="text-sm themed-muted">Brak zapisanych kluczy.</p>'
      } else {
        list.innerHTML = keys
          .map((k) => {
            const active = k.active
              ? '<span class="ml-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style="background: var(--status-ok-bg); color: var(--status-ok-text)">active</span>'
              : ''
            const activateBtn = k.active
              ? ''
              : `<button type="button" class="btn-outline rounded-md px-2.5 py-1 text-xs font-semibold" data-activate-key="${k.id}">Aktywuj</button>`
            return `<div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 overflow-hidden" style="border-color: var(--card-border); background: var(--card-bg)">
              <div class="min-w-0 flex-1 overflow-hidden">
                <p class="text-sm font-medium truncate" style="color: var(--text)">${escapeHtml(k.label || 'untitled')}${active}</p>
                <p class="mt-0.5 font-mono text-xs themed-muted truncate" title="${escapeHtml(k.api_key_hint || '')}">${escapeHtml(k.api_key_hint || '••••')}</p>
              </div>
              <div class="flex shrink-0 flex-wrap gap-2">
                ${activateBtn}
                <button type="button" class="btn-outline rounded-md px-2.5 py-1 text-xs font-semibold" data-delete-key="${k.id}">Usuń</button>
              </div>
            </div>`
          })
          .join('')
      }
    }
    if (msg) msg.textContent = ''
  } catch (err) {
    if (badge) badge.textContent = 'Error'
    if (list) list.innerHTML = `<p class="text-sm" style="color: var(--status-err-text)">${escapeHtml(err.message || String(err))}</p>`
    if (msg) msg.textContent = err.message || String(err)
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function saveFashionAiMeta() {
  const msg = document.getElementById('fashion-ai-msg')
  const payload = {
    model: document.getElementById('fashion-model')?.value || '',
    base_url: document.getElementById('fashion-base-url')?.value || '',
  }
  try {
    const res = await fetch('/api/fashion-ai/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.detail || `HTTP ${res.status}`)
    }
    if (msg) msg.textContent = 'Zapisano model / URL.'
    await loadFashionAi()
  } catch (err) {
    if (msg) msg.textContent = err.message || String(err)
  }
}

async function addFashionAiKey() {
  const msg = document.getElementById('fashion-ai-msg')
  const apiKey = document.getElementById('fashion-api-key')?.value?.trim()
  if (!apiKey) {
    if (msg) msg.textContent = 'Podaj klucz API.'
    return
  }
  const payload = {
    api_key: apiKey,
    label: document.getElementById('fashion-key-label')?.value?.trim() || '',
    activate: true,
  }
  if (msg) msg.textContent = 'Zapisywanie…'
  try {
    await fetch('/api/fashion-ai/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        model: document.getElementById('fashion-model')?.value || '',
        base_url: document.getElementById('fashion-base-url')?.value || '',
      }),
    })
    const res = await fetch('/api/fashion-ai/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      const detail = body.detail
      const text = Array.isArray(detail)
        ? detail.map((d) => d.msg || JSON.stringify(d)).join('; ')
        : detail || `HTTP ${res.status}`
      throw new Error(text)
    }
    if (msg) msg.textContent = 'Dodano klucz i ustawiono jako aktywny.'
    await loadFashionAi()
  } catch (err) {
    if (msg) msg.textContent = err.message || String(err)
  }
}

async function activateFashionKey(id) {
  const msg = document.getElementById('fashion-ai-msg')
  try {
    const res = await fetch(`/api/fashion-ai/keys/${encodeURIComponent(id)}/activate`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    if (msg) msg.textContent = 'Ustawiono aktywny klucz.'
    await loadFashionAi()
  } catch (err) {
    if (msg) msg.textContent = err.message || String(err)
  }
}

async function deleteFashionKey(id) {
  const msg = document.getElementById('fashion-ai-msg')
  if (!confirm('Usunąć ten klucz?')) return
  try {
    const res = await fetch(`/api/fashion-ai/keys/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    if (msg) msg.textContent = 'Klucz usunięty.'
    await loadFashionAi()
  } catch (err) {
    if (msg) msg.textContent = err.message || String(err)
  }
}

document.getElementById('fashion-ai-form')?.addEventListener('submit', (e) => {
  e.preventDefault()
  addFashionAiKey()
})
document.getElementById('btn-save-fashion-meta')?.addEventListener('click', () => saveFashionAiMeta())
document.getElementById('btn-refresh-fashion-ai')?.addEventListener('click', () => loadFashionAi())
document.getElementById('fashion-keys-list')?.addEventListener('click', (e) => {
  const act = e.target.closest?.('[data-activate-key]')
  const del = e.target.closest?.('[data-delete-key]')
  if (act) activateFashionKey(act.getAttribute('data-activate-key'))
  if (del) deleteFashionKey(del.getAttribute('data-delete-key'))
})

async function loadOpenaiPrompt() {
  const badge = document.getElementById('openai-prompt-badge')
  const msg = document.getElementById('openai-prompt-msg')
  const ta = document.getElementById('openai-system-prompt')
  const userTpl = document.getElementById('openai-user-template')
  const shape = document.getElementById('openai-request-shape')
  try {
    const data = await fetch('/api/fashion-ai/prompt').then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json()
    })
    if (ta) ta.value = data.system_prompt || ''
    if (userTpl) userTpl.textContent = data.user_message_template || ''
    if (shape) shape.textContent = JSON.stringify(data.request_shape || {}, null, 2)
    if (badge) {
      badge.textContent = data.is_custom ? 'Custom prompt' : 'Default prompt'
    }
    if (msg) msg.textContent = data.notes || ''
  } catch (err) {
    if (badge) badge.textContent = 'Błąd'
    if (msg) msg.textContent = err.message || String(err)
  }
}

async function saveOpenaiPrompt() {
  const msg = document.getElementById('openai-prompt-msg')
  const ta = document.getElementById('openai-system-prompt')
  try {
    const res = await fetch('/api/fashion-ai/prompt', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ system_prompt: ta?.value || '', reset: false }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    if (msg) msg.textContent = 'Prompt zapisany — Laravel użyje go przy kolejnej sugestii.'
    await loadOpenaiPrompt()
  } catch (err) {
    if (msg) msg.textContent = err.message || String(err)
  }
}

async function resetOpenaiPrompt() {
  const msg = document.getElementById('openai-prompt-msg')
  if (!confirm('Przywrócić domyślny system prompt?')) return
  try {
    const res = await fetch('/api/fashion-ai/prompt', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ reset: true }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    if (msg) msg.textContent = 'Przywrócono domyślny prompt.'
    await loadOpenaiPrompt()
  } catch (err) {
    if (msg) msg.textContent = err.message || String(err)
  }
}

document.getElementById('btn-refresh-openai-prompt')?.addEventListener('click', () => loadOpenaiPrompt())
document.getElementById('btn-save-openai-prompt')?.addEventListener('click', () => saveOpenaiPrompt())
document.getElementById('btn-reset-openai-prompt')?.addEventListener('click', () => resetOpenaiPrompt())

let openaiLogsCache = []

function fmtLogTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('pl-PL')
  } catch {
    return iso
  }
}

function prettyJson(value) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value ?? '')
  }
}

function renderOpenaiLogDetail(entry) {
  const box = document.getElementById('openai-log-detail')
  if (!box) return
  if (!entry) {
    box.innerHTML = `<p class="text-sm themed-muted">Wybierz wpis z listy.</p>`
    return
  }
  const reqMsgs = entry.request?.messages || []
  const system = reqMsgs.find((m) => m.role === 'system')?.content || ''
  const user = reqMsgs.find((m) => m.role === 'user')?.content || ''
  const content = entry.response?.content ?? entry.response?.parsed ?? entry.response
  box.innerHTML = `
    <div class="space-y-3 text-sm">
      <div class="flex flex-wrap gap-2 text-xs themed-muted">
        <span>${fmtLogTime(entry.created_at)}</span>
        <span>·</span>
        <span>${entry.model || '—'}</span>
        <span>·</span>
        <span>${entry.duration_ms != null ? `${entry.duration_ms} ms` : '—'}</span>
        <span>·</span>
        <span>catalog ${entry.catalog_count ?? '—'}</span>
        ${entry.occasion ? `<span>·</span><span>${entry.occasion}</span>` : ''}
      </div>
      ${entry.error ? `<p class="rounded-md px-3 py-2 text-sm" style="background: var(--status-err-bg); color: var(--status-err-text)">${escapeHtml(entry.error)}</p>` : ''}
      <div>
        <p class="font-semibold" style="color: var(--text)">System</p>
        <pre class="mt-1 max-h-40 overflow-auto rounded border p-2 font-mono text-xs whitespace-pre-wrap" style="border-color: var(--card-border)">${escapeHtml(system)}</pre>
      </div>
      <div>
        <p class="font-semibold" style="color: var(--text)">User</p>
        <pre class="mt-1 max-h-56 overflow-auto rounded border p-2 font-mono text-xs whitespace-pre-wrap" style="border-color: var(--card-border)">${escapeHtml(typeof user === 'string' ? user : prettyJson(user))}</pre>
      </div>
      <div>
        <p class="font-semibold" style="color: var(--text)">Model response</p>
        <pre class="mt-1 max-h-72 overflow-auto rounded border p-2 font-mono text-xs whitespace-pre-wrap" style="border-color: var(--card-border)">${escapeHtml(typeof content === 'string' ? content : prettyJson(content))}</pre>
      </div>
      ${entry.usage ? `<div><p class="font-semibold" style="color: var(--text)">Usage</p><pre class="mt-1 overflow-auto rounded border p-2 font-mono text-xs" style="border-color: var(--card-border)">${escapeHtml(prettyJson(entry.usage))}</pre></div>` : ''}
    </div>
  `
}

async function loadOpenaiLogs() {
  const badge = document.getElementById('openai-logs-badge')
  const msg = document.getElementById('openai-logs-msg')
  const list = document.getElementById('openai-logs-list')
  try {
    const data = await fetch('/api/fashion-ai/logs?limit=50').then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json()
    })
    openaiLogsCache = data.entries || []
    if (badge) badge.textContent = `${data.count ?? openaiLogsCache.length} wpisów`
    if (msg) msg.textContent = openaiLogsCache.length ? '' : 'Brak logów — wywołaj Suggest outfits w aplikacji.'
    if (!list) return
    if (!openaiLogsCache.length) {
      list.innerHTML = `<p class="text-sm themed-muted">Brak wpisów.</p>`
      renderOpenaiLogDetail(null)
      return
    }
    list.innerHTML = openaiLogsCache
      .map((e) => {
        const ok = e.status === 'ok'
        const label = ok ? 'OK' : 'ERR'
        const bg = ok ? 'var(--status-ok-bg)' : 'var(--status-err-bg)'
        const fg = ok ? 'var(--status-ok-text)' : 'var(--status-err-text)'
        return `<button type="button" data-log-id="${escapeHtml(e.id)}" class="w-full text-left rounded-lg border px-3 py-2 hover:opacity-90" style="border-color: var(--card-border); background: var(--card-bg)">
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-medium truncate" style="color: var(--text)">${escapeHtml(e.model || 'model')}</span>
            <span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" style="background:${bg};color:${fg}">${label}</span>
          </div>
          <p class="mt-1 text-xs themed-muted truncate">${fmtLogTime(e.created_at)} · ${e.duration_ms != null ? e.duration_ms + ' ms' : '—'} · cat ${e.catalog_count ?? '—'}${e.occasion ? ' · ' + escapeHtml(e.occasion) : ''}</p>
        </button>`
      })
      .join('')
    renderOpenaiLogDetail(openaiLogsCache[0])
  } catch (err) {
    if (badge) badge.textContent = 'Błąd'
    if (msg) msg.textContent = err.message || String(err)
  }
}

async function clearOpenaiLogs() {
  const msg = document.getElementById('openai-logs-msg')
  if (!confirm('Wyczyścić wszystkie logi OpenAI?')) return
  try {
    const res = await fetch('/api/fashion-ai/logs', { method: 'DELETE', headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    if (msg) msg.textContent = 'Wyczyszczono.'
    await loadOpenaiLogs()
  } catch (err) {
    if (msg) msg.textContent = err.message || String(err)
  }
}

document.getElementById('btn-refresh-openai-logs')?.addEventListener('click', () => loadOpenaiLogs())
document.getElementById('btn-clear-openai-logs')?.addEventListener('click', () => clearOpenaiLogs())
document.getElementById('openai-logs-list')?.addEventListener('click', (e) => {
  const btn = e.target.closest?.('[data-log-id]')
  if (!btn) return
  const id = btn.getAttribute('data-log-id')
  const entry = openaiLogsCache.find((x) => String(x.id) === String(id))
  renderOpenaiLogDetail(entry || null)
})

setupViewRouter()

loadObservability().catch(() => {})
loadFashionAi().catch(() => {})
loadOpenaiPrompt().catch(() => {})
loadBundles().catch((e) => {
  const app = document.getElementById('bundle-list')
  if (app) app.innerHTML = `<p class="text-sm text-red-600">Błąd: ${e.message}</p>`
})
