const USERS_KEY = 'edugap_users'
const SESSION_KEY = 'edugap_session'

type StoredUser = {
  id: string
  email: string
  name: string
  hash: string
}

export type DemoUser = { id: string; email: string; name: string }

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function loadUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]') as StoredUser[]
  } catch {
    return []
  }
}
function saveUsers(u: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(u))
}

export function loadSession(): DemoUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as DemoUser
  } catch {
    return null
  }
}
function saveSession(u: DemoUser | null) {
  if (u) localStorage.setItem(SESSION_KEY, JSON.stringify(u))
  else localStorage.removeItem(SESSION_KEY)
}

export async function demoSignUp(
  email: string,
  password: string,
  name: string,
): Promise<DemoUser> {
  const e = email.trim().toLowerCase()
  if (!e || !password) throw new Error('Email and password are required.')
  if (password.length < 6) throw new Error('Password must be at least 6 characters.')
  const users = loadUsers()
  if (users.find((u) => u.email === e)) throw new Error('An account with that email already exists.')
  const hash = await sha256(password)
  const user: StoredUser = { id: crypto.randomUUID(), email: e, name: name.trim() || e.split('@')[0], hash }
  saveUsers([...users, user])
  const session: DemoUser = { id: user.id, email: user.email, name: user.name }
  saveSession(session)
  return session
}

export async function demoSignIn(email: string, password: string): Promise<DemoUser> {
  const e = email.trim().toLowerCase()
  const hash = await sha256(password)
  const user = loadUsers().find((u) => u.email === e && u.hash === hash)
  if (!user) throw new Error('Invalid email or password.')
  const session: DemoUser = { id: user.id, email: user.email, name: user.name }
  saveSession(session)
  return session
}

export function demoSignOut() {
  saveSession(null)
}
