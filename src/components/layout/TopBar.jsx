import { useLocation, useNavigate } from 'react-router-dom'
import {
  Search,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  Home,
  Menu,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../../stores/auth.jsx'
import GlobalSearch from './GlobalSearch.jsx'

const pageMeta = {
  '/tickets': { title: 'Tickets', parent: null },
  '/tickets/new': { title: 'Nuevo Ticket', parent: { label: 'Tickets', to: '/tickets' } },
  '/stats': { title: 'Panel', parent: null },
}

export default function TopBar({ onMenuToggle }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, apiKey, agentName, logout } = useAuth()

  // Dark mode state
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('osticket_dark_mode')
      if (stored !== null) return stored === 'true'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('osticket_dark_mode', String(dark))
  }, [dark])

  // Resolve page title & breadcrumb
  const meta = pageMeta[pathname]
  const title = meta?.title || 'osTicket'
  const parent = meta?.parent

  // Avatar initial from agent name or API key fallback
  const avatarInitial = agentName ? agentName.charAt(0).toUpperCase() : (apiKey?.[0] || 'A').toUpperCase()

  const [isSearchOpen, setIsSearchOpen] = useState(false)

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      {/* Left: Hamburger + Breadcrumb / Title */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 -ml-1 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          onClick={onMenuToggle}
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {parent && (
          <nav className="hidden sm:flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
            <Home className="w-3.5 h-3.5" />
            <button
              onClick={() => navigate(parent.to)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {parent.label}
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
          </nav>
        )}
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
          {title}
        </h1>
      </div>

      <GlobalSearch open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Global search */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 ring-1 ring-slate-200 dark:ring-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-400 w-32 text-left">Buscar tickets...</span>
          <span className="text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-medium ml-2">
            ⌘K
          </span>
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={() => setDark((d) => !d)}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
        >
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Avatar & status */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-700">
          <div className="relative">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold ring-2 ring-offset-1 ring-indigo-600/30 ring-offset-white dark:ring-offset-slate-900">
              {avatarInitial}
            </div>
            {isAuthenticated && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
            )}
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden md:inline">
            {agentName || 'Agente'}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
