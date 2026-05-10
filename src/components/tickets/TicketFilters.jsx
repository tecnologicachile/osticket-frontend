import { useSearchParams } from 'react-router-dom'
import { useCallback } from 'react'
import { useAgents } from '../../hooks/useAgents.js'
import { useDepartments } from '../../hooks/useDepartments.js'
import { useTopics } from '../../hooks/useTopics.js'
import { PRIORITY_MAP } from '../../utils/constants.js'
import { Filter, X } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'open', label: 'Abierto' },
  { value: 'resolved', label: 'Resuelto' },
  { value: 'closed', label: 'Cerrado' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: 'Todas' },
  ...Object.entries(PRIORITY_MAP).map(([value, { label }]) => ({ value, label })),
]

export default function TicketFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: agents = [] } = useAgents()
  const { data: departments = [] } = useDepartments()
  const { data: topics = [] } = useTopics()

  const get = (key) => searchParams.get(key) || ''

  const setParam = useCallback((key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value === '' || value === null || value === undefined) {
        next.delete(key)
      } else {
        next.set(key, value)
      }
      if (key !== 'page') {
        next.delete('page')
      }
      return next
    })
  }, [setSearchParams])

  const clearFilters = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams()
      const q = prev.get('queue')
      if (q) next.set('queue', q)
      return next
    })
  }, [setSearchParams])

  const hasFilters = get('status') || get('dept_id') || get('agent_id') || get('priority') || get('date_from') || get('date_to') || get('overdue')

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 lg:p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros</span>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
          >
            <X className="w-3 h-3" />
            Limpiar filtros
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Estado
          </label>
          <select
            value={get('status')}
            onChange={(e) => setParam('status', e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Department */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Departamento
          </label>
          <select
            value={get('dept_id')}
            onChange={(e) => setParam('dept_id', e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Agent */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Agente
          </label>
          <select
            value={get('agent_id')}
            onChange={(e) => setParam('agent_id', e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Prioridad
          </label>
          <select
            value={get('priority')}
            onChange={(e) => setParam('priority', e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Topic */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Tema
          </label>
          <select
            value={get('topic_name')}
            onChange={(e) => setParam('topic_name', e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos</option>
            {topics.map((t) => (
              <option key={t.id} value={t.full_name}>
                {t.topic_pid ? '\u00A0\u00A0\u00A0\u00A0' + t.name : t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Desde
          </label>
          <input
            type="date"
            value={get('date_from')}
            onChange={(e) => setParam('date_from', e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Hasta
          </label>
          <input
            type="date"
            value={get('date_to')}
            onChange={(e) => setParam('date_to', e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Overdue + Queue selector */}
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Cola
            </label>
            <select
              value={get('queue') || 'open'}
              onChange={(e) => setParam('queue', e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="open">Abiertos</option>
              <option value="my">Mis tickets</option>
              <option value="closed">Cerrados</option>
            </select>
          </div>
          <label className="flex items-center gap-2 pb-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={get('overdue') === '1'}
              onChange={(e) => setParam('overdue', e.target.checked ? '1' : '')}
              className="rounded border-gray-300 dark:border-gray-600 text-red-500 focus:ring-red-500"
            />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Solo vencidos
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}
