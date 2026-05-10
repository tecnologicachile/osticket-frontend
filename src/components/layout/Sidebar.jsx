import { NavLink, useSearchParams } from 'react-router-dom'
import { ListTodo, BarChart3, Search, FolderTree } from 'lucide-react'
import { FOCUS_DELAY_MS } from '../../utils/constants.js'

const navItems = [
  { to: '/tickets', label: 'Tickets', icon: ListTodo },
  { to: '/stats', label: 'Estadísticas', icon: BarChart3 },
  { to: '/topics', label: 'Temas', icon: FolderTree },
]

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const [searchParams] = useSearchParams()
  const currentQueue = searchParams.get('queue') || 'my'

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-60 bg-slate-900 text-slate-300 flex flex-col
          shadow-xl border-r border-slate-800
          transform transition-all duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-3 h-16 px-5 border-b border-slate-800">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-600/25">
            os
          </div>
          <span className="font-semibold text-white text-lg tracking-tight">osTicket</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onMobileClose}
              end={to === '/tickets' ? false : true}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                  isActive
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}

          {/* Búsqueda */}
          <NavLink
            to="/tickets"
            onClick={() => {
              onMobileClose?.()
              setTimeout(() => {
                const el = document.querySelector('[data-global-search]')
                if (el) el.focus()
              }, FOCUS_DELAY_MS)
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <Search className="w-5 h-5 flex-shrink-0" />
            <span>Búsqueda avanzada</span>
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">osTicket Portal</span>
            <span className="text-slate-600">v1.0</span>
          </div>
        </div>
      </aside>
    </>
  )
}
