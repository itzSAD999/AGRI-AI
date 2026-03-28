import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { flushSync } from 'react-dom'
import {
  demoSignIn,
  demoSignOut,
  demoSignUp,
  loadSession,
  type DemoUser,
} from '../services/demoAuth'
import { getSupabase, isSupabaseConfigured } from '../services/supabaseService'

type AuthUser = { id: string; email?: string; name?: string }

type AuthState = {
  user: AuthUser | null
  loading: boolean
  configured: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<{ needsConfirmation: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

function toAuthUser(d: DemoUser): AuthUser {
  return { id: d.id, email: d.email, name: d.name }
}

function mapSupabaseUser(u: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }): AuthUser {
  return {
    id: u.id,
    email: u.email ?? undefined,
    name: (u.user_metadata?.name as string | undefined) ?? u.email?.split('@')[0],
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabaseReady = isSupabaseConfigured()

  useEffect(() => {
    if (!supabaseReady) {
      const s = loadSession()
      if (s) setUser(toAuthUser(s))
      setLoading(false)
      return
    }

    const sb = getSupabase()
    if (!sb) {
      setLoading(false)
      return
    }

    sb.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          console.warn('[auth] getSession:', error.message)
          setUser(null)
        } else if (data.session?.user) {
          setUser(mapSupabaseUser(data.session.user))
        } else {
          setUser(null)
        }
      })
      .finally(() => setLoading(false))

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setUser(mapSupabaseUser(session.user))
      else setUser(null)
    })

    return () => subscription.unsubscribe()
  }, [supabaseReady])

  const signIn = useCallback(async (email: string, password: string) => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      throw new Error('Enter your email and password.')
    }
    if (!supabaseReady) {
      const u = await demoSignIn(trimmedEmail, password)
      flushSync(() => {
        setUser(toAuthUser(u))
      })
      return
    }
    const sb = getSupabase()
    if (!sb) throw new Error('Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.')
    const { data, error } = await sb.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    })
    if (error) throw new Error(error.message)
    if (!data.session?.user) {
      throw new Error('Sign in failed — no valid session. Check your email and password.')
    }
    flushSync(() => {
      setUser(mapSupabaseUser(data.session!.user))
    })
  }, [supabaseReady])

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) throw new Error('Email and password are required.')
    if (password.length < 6) throw new Error('Password must be at least 6 characters.')
    if (!supabaseReady) {
      const u = await demoSignUp(trimmedEmail, password, name)
      flushSync(() => {
        setUser(toAuthUser(u))
      })
      return { needsConfirmation: false }
    }
    const sb = getSupabase()
    if (!sb) throw new Error('Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.')
    const siteUrl = import.meta.env.VITE_APP_URL || window.location.origin
    const { data, error } = await sb.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: { name: name.trim() },
        emailRedirectTo: `${siteUrl}/signin`,
      },
    })
    if (error) throw new Error(error.message)
    if (data.session?.user) {
      flushSync(() => {
        setUser(mapSupabaseUser(data.session!.user))
      })
    }
    return { needsConfirmation: !data.session }
  }, [supabaseReady])

  const signOut = useCallback(async () => {
    if (!supabaseReady) {
      demoSignOut()
      setUser(null)
      return
    }
    const sb = getSupabase()
    if (sb) await sb.auth.signOut()
    setUser(null)
  }, [supabaseReady])

  const value = useMemo(
    () => ({ user, loading, configured: supabaseReady, signIn, signUp, signOut }),
    [user, loading, supabaseReady, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
