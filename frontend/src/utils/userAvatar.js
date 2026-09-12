/**
 * Initials / letter avatar so each account looks distinct without an uploaded image.
 * @param {{ displayName?: string|null, username?: string|null, email?: string|null, id?: string|number|null }} user
 * @returns {string} data-URL SVG
 */
export function userAvatarDataUrl(user) {
  const label = String(user?.displayName || user?.username || user?.email || '?').trim()
  const parts = label.split(/\s+/).filter(Boolean)
  const initials =
    parts.length >= 2
      ? `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
      : label.slice(0, 2).toUpperCase() || '?'

  const hue = hashToHue(String(user?.id ?? label))
  const bg = `hsl(${hue} 42% 38%)`
  const safe = escapeXml(initials.slice(0, 2))

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="64" fill="${bg}"/>
  <text x="64" y="64" dy="0.35em" text-anchor="middle" font-family="system-ui,sans-serif" font-size="52" font-weight="600" fill="#fff">${safe}</text>
</svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function hashToHue(input) {
  let h = 0
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0
  return h % 360
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
