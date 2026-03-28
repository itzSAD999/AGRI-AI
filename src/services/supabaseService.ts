import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { TutorOutput, MarkerOutput } from '../utils/outputParsers'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

let client: SupabaseClient | null = null

/** Reject placeholder .env so we do not silently use demo auth with fake "configured" state */
function isValidSupabaseUrl(u: string): boolean {
  try {
    const parsed = new URL(u)
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname.endsWith('.supabase.co') &&
      parsed.hostname.length > '.supabase.co'.length
    )
  } catch {
    return false
  }
}

function isValidSupabaseAnonKey(key: string): boolean {
  return key.startsWith('eyJ') && key.length >= 80
}

export function getSupabase(): SupabaseClient | null {
  if (!url || !anon || !isValidSupabaseUrl(url) || !isValidSupabaseAnonKey(anon)) return null
  if (!client) client = createClient(url, anon)
  return client
}

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anon && isValidSupabaseUrl(url) && isValidSupabaseAnonKey(anon))
}

export async function insertTutorSession(row: {
  session_id: string
  user_id?: string | null
  subject: string
  level: string
  topic?: string | null
  question: string
  tutor_output: TutorOutput | Record<string, unknown>
  language?: string
}) {
  const sb = getSupabase()
  if (!sb) return
  const { error } = await sb.from('tutor_sessions').insert({
    session_id: row.session_id,
    user_id: row.user_id ?? null,
    subject: row.subject,
    level: row.level,
    topic: row.topic ?? null,
    question: row.question,
    tutor_output: row.tutor_output,
    language: row.language ?? 'english',
  })
  if (error) {
    console.warn('[supabase] insertTutorSession:', error.message, error.code)
    if (error.code === '42501') console.warn('[supabase] Run the GRANT SQL in Supabase Dashboard — see schema.sql Section 9B')
  }
}

export async function insertPracticeAttempt(row: {
  session_id: string
  user_id?: string | null
  subject: string
  level: string
  topic?: string | null
  question: string
  student_answer: string | null
  marker_output: MarkerOutput
  is_correct: boolean
}) {
  const sb = getSupabase()
  if (!sb) return
  const { error } = await sb.from('practice_attempts').insert({
    session_id: row.session_id,
    user_id: row.user_id ?? null,
    subject: row.subject,
    level: row.level,
    topic: row.topic ?? null,
    question: row.question,
    student_answer: row.student_answer,
    marker_output: row.marker_output,
    is_correct: row.is_correct,
  })
  if (error) {
    console.warn('[supabase] insertPracticeAttempt:', error.message, error.code)
    if (error.code === '42501') console.warn('[supabase] Run the GRANT SQL in Supabase Dashboard — see schema.sql Section 9B')
  }
}

export async function insertUsageEvent(row: {
  event_type: string
  subject?: string | null
  level?: string | null
  language?: string | null
}) {
  const sb = getSupabase()
  if (!sb) return
  const { error } = await sb.from('usage_events').insert({
    event_type: row.event_type,
    subject: row.subject ?? null,
    level: row.level ?? null,
    language: row.language ?? null,
  })
  if (error) {
    console.warn('[supabase] insertUsageEvent:', error.message, error.code)
    if (error.code === '42501') console.warn('[supabase] Run the GRANT SQL in Supabase Dashboard — see schema.sql Section 9B')
  }
}

export async function fetchDashboardStats() {
  const sb = getSupabase()
  if (!sb) {
    return {
      today: 0,
      allTime: 0,
      subjects: [] as { subject: string; count: number }[],
      topics: [] as { topic: string; count: number }[],
      languages: { english: 0, twi: 0 },
      recent: [] as Array<{
        id: string
        subject: string
        question: string
        created_at: string
        language: string | null
      }>,
    }
  }
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const { count: allTime } = await sb
    .from('tutor_sessions')
    .select('*', { count: 'exact', head: true })

  const { count: today } = await sb
    .from('tutor_sessions')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', start.toISOString())

  const { data: bySubject } = await sb.from('tutor_sessions').select('subject')
  const subjectMap = new Map<string, number>()
  for (const r of bySubject ?? []) {
    const s = (r as { subject: string }).subject
    subjectMap.set(s, (subjectMap.get(s) ?? 0) + 1)
  }
  const subjects = [...subjectMap.entries()]
    .map(([subject, count]) => ({ subject, count }))
    .sort((a, b) => b.count - a.count)

  const { data: topicRows } = await sb.from('tutor_sessions').select('topic')
  const topicMap = new Map<string, number>()
  for (const r of topicRows ?? []) {
    const t = (r as { topic: string | null }).topic
    if (!t) continue
    topicMap.set(t, (topicMap.get(t) ?? 0) + 1)
  }
  const topics = [...topicMap.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)

  const { data: langRows } = await sb.from('tutor_sessions').select('language')
  let english = 0
  let twi = 0
  for (const r of langRows ?? []) {
    const l = ((r as { language: string | null }).language || 'english').toLowerCase()
    if (l === 'twi' || l === 'akan') twi++
    else english++
  }
  const { data: evLang } = await sb.from('usage_events').select('language')
  for (const r of evLang ?? []) {
    const l = ((r as { language: string | null }).language || '').toLowerCase()
    if (l === 'twi' || l === 'akan') twi++
  }

  const { data: recentRows } = await sb
    .from('tutor_sessions')
    .select('id, subject, question, created_at, language')
    .order('created_at', { ascending: false })
    .limit(8)

  return {
    today: today ?? 0,
    allTime: allTime ?? 0,
    subjects,
    topics,
    languages: { english, twi },
    recent: (recentRows ?? []) as Array<{
      id: string
      subject: string
      question: string
      created_at: string
      language: string | null
    }>,
  }
}

export async function fetchUserTutorHistory(userId: string) {
  const sb = getSupabase()
  if (!sb) return []
  const { data } = await sb
    .from('tutor_sessions')
    .select('id, subject, level, question, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)
  return data ?? []
}

export async function fetchUserPracticeHistory(userId: string) {
  const sb = getSupabase()
  if (!sb) return []
  const { data } = await sb
    .from('practice_attempts')
    .select('id, subject, level, topic, is_correct, created_at, question')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)
  return data ?? []
}

export type StudyNoteRow = {
  id: string
  subject: string
  topic: string
  note: string
  created_at: string
}

export async function fetchStudyNotes(userId: string): Promise<StudyNoteRow[]> {
  const sb = getSupabase()
  if (!sb) return []
  const { data } = await sb
    .from('study_notes')
    .select('id, subject, topic, note, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data ?? []) as StudyNoteRow[]
}

export async function addStudyNote(userId: string, row: { subject: string; topic: string; note: string }) {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase not configured')
  const { error } = await sb.from('study_notes').insert({
    user_id: userId,
    subject: row.subject,
    topic: row.topic,
    note: row.note,
  })
  if (error) throw error
}

export async function deleteStudyNote(userId: string, id: string) {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase not configured')
  const { error } = await sb.from('study_notes').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}

export async function updateStudentProfile(
  userId: string,
  row: Partial<{
    display_name: string
    school_level: string
    primary_subjects: string[]
    school_name: string
    language_pref: string
  }>,
) {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase not configured')
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (row.display_name !== undefined) payload.display_name = row.display_name
  if (row.school_level !== undefined) payload.school_level = row.school_level
  if (row.primary_subjects !== undefined) payload.primary_subjects = row.primary_subjects
  if (row.school_name !== undefined) payload.school_name = row.school_name
  if (row.language_pref !== undefined) payload.language_pref = row.language_pref
  const { error } = await sb.from('student_profiles').update(payload).eq('id', userId)
  if (error) throw error
}

export function subscribeTutorSessions(cb: () => void) {
  const sb = getSupabase()
  if (!sb) return () => {}
  const ch = sb
    .channel('tutor_sessions_feed')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'tutor_sessions' },
      () => cb(),
    )
    .subscribe()
  return () => {
    void sb.removeChannel(ch)
  }
}

export function subscribeUsageEvents(cb: () => void) {
  const sb = getSupabase()
  if (!sb) return () => {}
  const ch = sb
    .channel('usage_events_feed')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'usage_events' },
      () => cb(),
    )
    .subscribe()
  return () => {
    void sb.removeChannel(ch)
  }
}
