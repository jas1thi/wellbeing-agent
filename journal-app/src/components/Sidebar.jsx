import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Calendar, Search, MessageSquare } from 'lucide-react'
import { useSearchModal } from '../hooks/useSearchModal'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/chat', icon: MessageSquare, label: 'Check-in' },
  { to: '/entries', icon: BookOpen, label: 'Entries' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
]

export default function Sidebar() {
  const { open } = useSearchModal()

  return (
    <aside className="w-60 h-screen flex flex-col bg-surface border-r border-border shrink-0">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">W</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text-primary leading-tight">Wellbeing</h1>
            <p className="text-[11px] text-text-muted leading-tight">Journal</p>
          </div>
        </div>
      </div>

      {/* Search trigger */}
      <div className="px-3 mb-2">
        <button
          onClick={open}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-text-muted rounded-lg border border-border/60 hover:border-border hover:bg-surface-raised transition-all group"
        >
          <Search size={14} className="shrink-0 opacity-50 group-hover:opacity-80" />
          <span className="flex-1 text-left">Search</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-surface-raised border border-border/60 rounded text-text-muted">
            <span className="text-[10px]">&#8984;</span>K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 mt-1">
        <p className="px-3 mb-2 text-[10px] font-semibold text-text-muted uppercase tracking-widest">
          Menu
        </p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                isActive
                  ? 'bg-brand-600/12 text-brand-400'
                  : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary'
              }`
            }
          >
            <Icon size={16} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-surface-raised border border-border flex items-center justify-center">
            <span className="text-[10px] font-semibold text-text-muted">AI</span>
          </div>
          <p className="text-[11px] text-text-muted">Gemini Companion</p>
        </div>
      </div>
    </aside>
  )
}
