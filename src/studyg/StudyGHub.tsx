import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { useGroupStudy } from '../context/GroupStudyContext'

export function StudyGHub() {
  const { sessions } = useGroupStudy()

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="StudyG · virtual group learning"
        title="Sessions, chat, materials & revision"
        subtitle="Create a session, paste materials, track reading, chat, check-ins, and spaced revision — then open Tutor, Practice, or Advisory with that session linked."
        actions={
          <>
            <Link
              to="/app/studyg/sessions/new"
              className="rounded-xl bg-[#e8b923] px-4 py-2.5 text-sm font-semibold text-[#0a1628] hover:brightness-110"
            >
              New session
            </Link>
            <Link
              to="/app/studyg/sessions"
              className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              My sessions ({sessions.length})
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          {
            t: 'Materials & progress',
            d: 'Paste notes as materials, set minutes/page, track page progress and ETA.',
            to: '/app/studyg/sessions',
          },
          {
            t: 'Realtime chat',
            d: 'Session-scoped messages stored on this device — ready to sync to Convex later.',
            to: '/app/studyg/sessions',
          },
          {
            t: 'Shared annotations',
            d: 'Pin notes to material pages for the whole group to see.',
            to: '/app/studyg/sessions',
          },
          {
            t: 'Check-ins',
            d: 'Schedule prompts (e.g. every 20 min) and log on-track / struggling / ahead.',
            to: '/app/studyg/sessions',
          },
          {
            t: 'AI quiz from notes',
            d: 'Generate BECE/WASSCE-style questions from session material via the same AI stack.',
            to: '/app/studyg/sessions',
          },
          {
            t: 'Spaced repetition',
            d: 'Revision queue with SM-2-style scheduling after you self-grade recall.',
            to: '/app/studyg/sessions',
          },
        ].map((x) => (
          <Link
            key={x.t}
            to={x.to}
            className="rounded-xl border border-white/10 bg-[#0c1e3d]/50 p-5 transition hover:border-[#e8b923]/40"
          >
            <h2 className="font-semibold text-white">{x.t}</h2>
            <p className="mt-2 text-sm text-slate-400">{x.d}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-xl border border-dashed border-white/20 p-6 text-sm text-slate-500">
        <p>
          <span className="text-slate-300">Backend roadmap:</span> Convex + BetterAuth + OpenAI actions
          can replace local storage per your StudyG spec — the UI routes and data shapes here are
          aligned to that migration.
        </p>
      </section>
    </div>
  )
}
