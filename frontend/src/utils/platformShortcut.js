/** @returns {boolean} */
export function detectMacPlatform() {
  if (typeof navigator === 'undefined') return false

  const platform = navigator.userAgentData?.platform
  if (platform) {
    return platform === 'macOS'
  }

  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)
}

/** @param {boolean} isMac */
export function searchShortcutLabel(isMac) {
  return isMac ? '⌘K' : 'Ctrl+K'
}
