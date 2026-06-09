import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '~/lib/api'

interface User {
  id: string
  email: string
  name: string
  emailVerified: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

interface Session {
  id: string
  userId: string
  token: string
  expiresAt: Date | string
  createdAt: Date | string
  updatedAt: Date | string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = async () => {
    try {
      const data = await api.auth.getSession()
      if (data && data.user && data.session) {
        setUser(data.user as User)
        setSession(data.session as Session)
      } else {
        setUser(null)
        setSession(null)
      }
    } catch (error) {
      setUser(null)
      setSession(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signIn = async (email: string, password: string) => {
    const data = await api.auth.signIn({ email, password })
    if (data && data.user) {
      setUser(data.user as User)
      // Better Auth sign-in returns token, not session
      if (data.token) {
        setSession({ token: data.token, userId: data.user.id } as Session)
      }
    }
    await refreshSession()
  }

  const signUp = async (email: string, password: string, name: string) => {
    const data = await api.auth.signUp({ email, password, name })
    if (data && data.user) {
      setUser(data.user as User)
      if (data.token) {
        setSession({ token: data.token, userId: data.user.id } as Session)
      }
    }
    await refreshSession()
  }

  const signOut = async () => {
    await api.auth.signOut()
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
