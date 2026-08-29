import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from './supabase'
import type { Profile, UserRole, Locale } from './types'

interface AuthContextValue {
  user: Profile | null
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      if (session) {
        await loadProfile(session.user.id)
      }
      setLoading(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (!mounted) return
        if (session) {
          await loadProfile(session.user.id)
        } else {
          setUser(null)
        }
        setLoading(false)
      })()
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error loading profile:', error)
      return
    }
    if (data) {
      setUser(data as Profile)
    } else {
      // Profile row may not exist yet for a just-signed-up user; create a minimal one
      const { data: authUser } = await supabase.auth.getUser()
      if (authUser.user) {
        const newProfile = {
          id: authUser.user.id,
          email: authUser.user.email || '',
          full_name: (authUser.user.user_metadata?.full_name as string) || null,
          phone: (authUser.user.user_metadata?.phone as string) || null,
          locale: 'en' as Locale,
          role: 'customer' as UserRole,
        }
        const { data: inserted } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select('*')
          .maybeSingle()
        if (inserted) setUser(inserted as Profile)
      }
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return { error: error.message.includes('Invalid login') ? 'auth.error.invalid' : 'auth.error.generic' }
    }
    return { error: null }
  }

  async function signUp(email: string, password: string, fullName: string, phone?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone: phone || '' } },
    })
    if (error) {
      if (error.message.includes('already')) return { error: 'auth.error.exists' }
      return { error: 'auth.error.generic' }
    }
    if (data.user) {
      // Create profile row
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        phone: phone || null,
        locale: 'en',
        role: 'customer',
      })
    }
    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin: user?.role === 'admin',
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
