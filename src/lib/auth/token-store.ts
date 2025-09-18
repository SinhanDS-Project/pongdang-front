class TokenStore {
  private ACCESS_KEY = 'access_token'
  private accessTokenMemory: string | null = null
  private listeners = new Set<() => void>()

  hydrateFromStorage() {
    if (typeof window === 'undefined') return null
    const v = localStorage.getItem(this.ACCESS_KEY)
    this.accessTokenMemory = v
    return v
  }

  get() {
    // 메모리 우선, 없으면 localStorage에서
    return this.accessTokenMemory ?? localStorage.getItem(this.ACCESS_KEY)
  }

  set(token: string) {
    this.accessTokenMemory = token
    localStorage.setItem(this.ACCESS_KEY, token)
    this.emit()
  }

  clear() {
    this.accessTokenMemory = null
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
