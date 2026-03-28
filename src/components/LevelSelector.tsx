import { cn } from '../lib/cn'

type Level = 'BECE' | 'WASSCE'

export function LevelSelector({
  value,
  onChange,
  className,
}: {
  value: Level
  onChange: (l: Level) => void
  className?: string
}) {
  const btn = (l: Level, label: string) => (
    <button
      type="button"
      key={l}
      onClick={() => onChange(l)}
      className={cn(
        'rounded-xl px-4 py-2 text-sm font-semibold transition',
        value === l
          ? 'bg-[#e8b923] text-[#0a1628]'
          : 'bg-white/10 text-slate-200 hover:bg-white/15',
      )}
    >
      {label}
    </button>
  )
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {btn('BECE', 'BECE (JHS)')}
      {btn('WASSCE', 'WASSCE (SHS)')}
    </div>
  )
}
