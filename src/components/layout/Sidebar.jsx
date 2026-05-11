import { useState, useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { ListTodo, BarChart3, FolderTree, ChevronDown } from 'lucide-react'
import { useTopics } from '../../hooks/useTopics.js'

const navItems = [
  { to: '/tickets', label: 'Tickets', icon: ListTodo },
  { to: '/stats', label: 'Estadísticas', icon: BarChart3 },
  { to: '/topics', label: 'Temas', icon: FolderTree },
]

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const [topicsOpen, setTopicsOpen] = useState(true)
  const { data: topics = [] } = useTopics()

  const activeTopics = useMemo(() => {
    return topics
      .filter(t => (t.open_count || 0) > 0)
      .sort((a, b) => (b.open_count || 0) - (a.open_count || 0))
  }, [topics])

  // Group by hierarchy: parents first, then children underneath
  const groupedTopics = useMemo(() => {
    const parents = activeTopics.filter(t => !t.topic_pid || Number(t.topic_pid) === 0)
    const result = []
    parents.forEach(p => {
      const children = activeTopics.filter(t => Number(t.topic_pid) === Number(p.id))
      const totalOpen = (p.open_count || 0) + children.reduce((s, c) => s + (c.open_count || 0), 0)
      result.push({ ...p, isChild: false, total_open: totalOpen })
      children.forEach(c => result.push({ ...c, isChild: true, total_open: c.open_count || 0 }))
    })
    return result
  }, [activeTopics])

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

          {/* Temas activos (expandible) */}
          {groupedTopics.length > 0 && (
            <div>
              <button
                onClick={() => setTopicsOpen(!topicsOpen)}
                className="flex items-center gap-2 w-full pl-3 pr-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
              >
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${topicsOpen ? '' : '-rotate-90'}`} />
                <span>Temas activos</span>
                <span className="ml-auto text-[10px] text-slate-600">{groupedTopics.length}</span>
              </button>
              {topicsOpen && (
                <div className="mt-1 space-y-0.5 max-h-48 overflow-y-auto">
                  {groupedTopics.map(t => (
                    <NavLink
                      key={t.id}
                      to={`/tickets?topic_name=${encodeURIComponent(t.full_name)}&status=open`}
                      onClick={onMobileClose}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 text-xs ${
                          isActive
                            ? 'bg-slate-700 text-white font-medium'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        } ${t.isChild ? 'ml-5' : ''}`
                      }
                    >
                      {t.isChild && <span className="text-slate-600 mr-1">└</span>}
                      <span className="truncate flex-1">{t.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-900/50 text-blue-300">{t.total_open}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}

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
