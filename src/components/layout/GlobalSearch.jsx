import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Loader2 } from 'lucide-react'
import { searchTickets } from '../../api/tickets.js'
import { STATUS_MAP } from '../../utils/constants.js'

export default function GlobalSearch({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    } else {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }, [open])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const timeoutId = setTimeout(async () => {
      try {
        const data = await searchTickets({ query: trimmed, limit: 10 })
        const items = Array.isArray(data) ? data : data.data || data.tickets || []
        setResults(items.slice(0, 10))
        setSelectedIndex(0)
      } catch (e) {
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1 < results.length ? prev + 1 : prev))
    }
    
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
    }
    
    if (e.key === 'Enter') {
      e.preventDefault()
      if (results.length > 0 && results[selectedIndex]) {
        handleSelect(results[selectedIndex])
      }
    }
  }

  const handleSelect = (ticket) => {
    navigate(`/tickets/${ticket.id}`)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden mx-4">
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800 no-focus-ring">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 px-4 py-4 bg-transparent no-focus-ring text-slate-900 dark:text-white placeholder:text-slate-400"
            placeholder="Buscar tickets... (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {isLoading && <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />}
        </div>

        {/* Results */}
        {query.trim().length >= 2 && (
          <div className="max-h-96 overflow-y-auto py-2">
            {results.length === 0 && !isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No se encontraron resultados
              </div>
            ) : (
              <ul>
                {results.map((ticket, index) => (
                  <li key={ticket.id}>
                    <button
                      className={`w-full px-4 py-3 flex flex-col items-start gap-1 text-left transition-colors ${
                        index === selectedIndex
                          ? 'bg-indigo-50 dark:bg-indigo-500/10'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                      onClick={() => handleSelect(ticket)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="font-medium text-slate-900 dark:text-white truncate">
                          #{ticket.number || ticket.id} - {ticket.subject}
                        </span>
                        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {STATUS_MAP[ticket.status]?.label || ticket.status}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {ticket.client_name || ticket.client || (ticket.user && ticket.user.name) || 'Cliente'}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}