const ACCESS_KEY = 'access_token'

let accessTokenMemory: string | null = null

export const tokenStore = {
  get() {
    if (typeof window === 'undefined') return accessTokenMemory
    return accessTokenMemory ?? localStorage.getItem(ACCESS_KEY)
  },
  set(token: string | null) {
    accessTokenMemory = token
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem(ACCESS_KEY, token)
      else localStorage.removeItem(ACCESS_KEY)
    }
  },
  hydrateFromStorage() {
    if (typeof window === 'undefined') return
    const v = localStorage.getItem(ACCESS_KEY)
    accessTokenMemory = v
    return v
  },
  clear() {
    this.set(null)
  },
}
