import { cn } from '../lib/cn'
import type { SubjectDef } from '../utils/curriculumContext'

export function SubjectSelector({
  subjects,
  value,
  onChange,
  className,
}: {
  subjects: SubjectDef[]
  value: string
  onChange: (name: string) => void
  className?: string
}) {
  return (
    <div className={cn('grid gap-2 sm:grid-cols-2', className)}>
      {subjects.map((s) => (
        <button
          type="button"
          key={s.name}
          onClick={() => onChange(s.name)}
          className={cn(
            'flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition',
            value === s.name
              ? 'border-[#e8b923] bg-[#e8b923]/15 text-white'
              : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/20',
          )}
        >
          <span className="text-lg" aria-hidden>
            {s.emoji}
          </span>
          <span className="font-medium">{s.name}</span>
        </button>
      ))}
    </div>
  )
}
