import { Link } from 'react-router-dom'
import { useStudy } from '../context/StudyContext'

export function GroupStudyLinkBanner() {
  const { linkedGroupStudy, clearGroupStudyLink } = useStudy()
  if (!linkedGroupStudy) return null
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#2dd4bf]/30 bg-[#2dd4bf]/10 px-4 py-3 text-sm">
      <p className="text-slate-200">
        Linked from StudyG:{' '}
        <span className="font-semibold text-white">{linkedGroupStudy.title}</span>
        <span className="text-slate-500"> · </span>
        <span className="text-[#e8b923]">{linkedGroupStudy.subjectHint}</span> ({linkedGroupStudy.level})
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          to={`/app/studyg/sessions/${linkedGroupStudy.id}`}
          className="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/15"
        >
          Back to session
        </Link>
        <button
          type="button"
          onClick={clearGroupStudyLink}
          className="rounded-lg px-3 py-1 text-xs text-slate-400 hover:text-white"
        >
          Unlink
        </button>
      </div>
    </div>
  )
}
