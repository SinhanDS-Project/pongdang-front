// token-store.ts
class TokenStore {
  private ACCESS_KEY = 'access_token'
  private listeners = new Set<() => void>()

  hydrateFromStorage() {
    /* 그대로 */
  }

  get() {
    return localStorage.getItem(this.ACCESS_KEY)
  }

  set(token: string) {
    localStorage.setItem(this.ACCESS_KEY, token)
    this.emit()
  }

  clear() {
    localStorage.removeItem(this.ACCESS_KEY)
    this.emit()
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit() {
    for (const fn of this.listeners) fn()
  }
}

export const tokenStore = new TokenStore()
