export const SESSION_STORAGE_KEY = 'inveFatSession'
export const LEGACY_SESSION_STORAGE_KEY = 'inveFatSession'
export const LAST_ACTIVE_PAGE_KEY = 'invefat_last_active_page'
export const INACTIVITY_TIMEOUT_MS = 53 * 60 * 1000

let inactivityTimer = null
let inactivityCallback = null

function canUseWindow() {
  return typeof window !== 'undefined'
}

export function saveSession(session) {
  if (!canUseWindow()) return
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY)
}

export function loadSession() {
  if (!canUseWindow()) return null

  try {
    const savedSession = sessionStorage.getItem(SESSION_STORAGE_KEY)
    return savedSession ? JSON.parse(savedSession) : null
  } catch {
    clearSession()
    return null
  }
}

export function clearSession() {
  if (!canUseWindow()) return
  sessionStorage.removeItem(SESSION_STORAGE_KEY)
  localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY)
}

export function saveLastActivePage(pageId) {
  if (!canUseWindow() || !pageId) return
  localStorage.setItem(LAST_ACTIVE_PAGE_KEY, String(pageId))
}

export function restoreLastActivePage(defaultPageId = 'dashboard') {
  if (!canUseWindow()) return defaultPageId
  return localStorage.getItem(LAST_ACTIVE_PAGE_KEY) || defaultPageId
}

export function resetInactivityTimer() {
  if (!canUseWindow() || typeof inactivityCallback !== 'function') return
  window.clearTimeout(inactivityTimer)
  inactivityTimer = window.setTimeout(() => {
    inactivityCallback()
  }, INACTIVITY_TIMEOUT_MS)
}

export function startInactivityTimer(onTimeout) {
  if (!canUseWindow() || typeof onTimeout !== 'function') return () => {}

  inactivityCallback = onTimeout
  const events = ['mousemove', 'mousedown', 'keydown', 'click', 'touchstart', 'pointerdown', 'wheel', 'scroll']
  const handleActivity = () => resetInactivityTimer()
  const handleVisibility = () => {
    if (!document.hidden) resetInactivityTimer()
  }

  events.forEach((eventName) => window.addEventListener(eventName, handleActivity, { passive: true }))
  document.addEventListener('visibilitychange', handleVisibility)
  window.addEventListener('focus', handleActivity)
  resetInactivityTimer()

  return () => {
    window.clearTimeout(inactivityTimer)
    events.forEach((eventName) => window.removeEventListener(eventName, handleActivity))
    document.removeEventListener('visibilitychange', handleVisibility)
    window.removeEventListener('focus', handleActivity)
    inactivityCallback = null
  }
}

export function logoutByInactivity(onLogout) {
  clearSession()
  onLogout?.('inactivity')
}
