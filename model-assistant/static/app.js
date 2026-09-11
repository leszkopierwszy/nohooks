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
  const links = document.querySelectorAll('.nav-link[data-section]')
  const sections = [...links].map((l) => document.getElementById(l.dataset.section)).filter(Boolean)

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((l) => {
            l.classList.toggle('active', l.dataset.section === entry.target.id)
          })
        }
      })
    },
    { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
  )
  sections.forEach((s) => observer.observe(s))
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
    if (v) document.getElementById('bundles')?.scrollIntoView({ behavior: 'smooth' })
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
loadObservability().catch(() => {})
loadBundles().catch((e) => {
  const app = document.getElementById('bundle-list')
  if (app) app.innerHTML = `<p class="text-sm text-red-600">Błąd: ${e.message}</p>`
})
