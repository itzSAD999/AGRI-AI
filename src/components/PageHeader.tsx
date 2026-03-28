import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  className,
  children,
}: {
  title: string
  subtitle?: string
  eyebrow?: string
  actions?: ReactNode
  className?: string
  children?: ReactNode
}) {
  return (
    <header className={cn('mb-8 border-b border-white/10 pb-6', className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="mb-1 text-xs font-mono font-medium text-[#2dd4bf]">{eyebrow}</p>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 max-w-2xl text-slate-400">{subtitle}</p>}
          {children && <div className="mt-3">{children}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
