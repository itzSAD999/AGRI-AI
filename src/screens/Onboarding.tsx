import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { LevelSelector } from '../components/LevelSelector'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured, updateStudentProfile } from '../services/supabaseService'
import { userFacingError } from '../utils/errorHandler'

export function Onboarding() {
  const { user, loading } = useAuth()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [school, setSchool] = useState('')
  const [level, setLevel] = useState<'BECE' | 'WASSCE'>('BECE')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!loading && !user) {
    return <Navigate to="/signin" replace />
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      if (isSupabaseConfigured()) {
        await updateStudentProfile(user.id, {
          display_name: name.trim() || undefined,
          school_name: school.trim() || undefined,
          school_level: level,
        })
      }
      nav('/app', { replace: true })
    } catch (err) {
      setError(userFacingError(err))
    } finally {
      setSaving(false)
    }
  }

  const skip = () => nav('/app', { replace: true })

  return (
    <div className="animate-fade-in mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome to EduGap AI</h1>
        <p className="mt-1 text-sm text-slate-400">
          Optional profile — helps personalise your study space.
        </p>
      </div>
      <form onSubmit={save} className="glass-card space-y-4 p-6">
        <div>
          <label className="text-sm font-medium text-slate-300">Display name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-dark mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300">School (optional)</label>
          <input
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            className="input-dark mt-1"
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-slate-300">Target exam</p>
          <LevelSelector value={level} onChange={setLevel} />
        </div>
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-[#e8b923] py-3 text-sm font-semibold text-[#0a1628] disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save & continue'}
        </button>
        <button
          type="button"
          onClick={skip}
          className="w-full text-sm text-slate-400 underline"
        >
          Skip for now
        </button>
      </form>
    </div>
  )
}
