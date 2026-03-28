import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  demoSignIn,
  demoSignOut,
  demoSignUp,
  loadSession,
  type DemoUser,
} from '../services/demoAuth'

type AuthUser = { id: string; email?: string; name?: string }

type AuthState = {
  user: AuthUser | null
  loading: boolean
  configured: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

function toAuthUser(d: DemoUser): AuthUser {
  return { id: d.id, email: d.email, name: d.name }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = loadSession()
    if (s) setUser(toAuthUser(s))
    setLoading(false)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const u = await demoSignIn(email, password)
    setUser(toAuthUser(u))
  }, [])

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const u = await demoSignUp(email, password, name)
    setUser(toAuthUser(u))
  }, [])

  const signOut = useCallback(async () => {
    demoSignOut()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, configured: true, signIn, signUp, signOut }),
    [user, loading, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
