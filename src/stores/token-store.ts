class TokenStore {
  private ACCESS_KEY = 'access_token'
  private accessTokenMemory: string | null = null
  private listeners = new Set<() => void>()

  hydrateFromStorage() {
    if (typeof window === 'undefined') return null
    const v = localStorage.getItem(this.ACCESS_KEY)
    this.accessTokenMemory = v

    // FIXME:
    console.log('🚀 ~ TokenStore ~ hydrateFromStorage ~ this.accessTokenMemory:', this.accessTokenMemory)
    console.log('[tokenStore] hydrateFromStorage:', v ? 'token loaded' : 'no token')

    return v
  }

  get() {
    if (this.accessTokenMemory) return this.accessTokenMemory
    if (typeof window === 'undefined') return null
    try {
      return localStorage.getItem(this.ACCESS_KEY)
    } catch {
      return null
    }
  }

  set(token: string) {
    this.accessTokenMemory = token
    localStorage.setItem(this.ACCESS_KEY, token)

    //FIXME:
    console.log('[tokenStore] set:', token?.slice(0, 15) + '...')

    this.emit()
  }

  clear() {
    this.accessTokenMemory = null
    localStorage.removeItem(this.ACCESS_KEY)

    //FIXME:
    console.log('[tokenStore] clear')

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
