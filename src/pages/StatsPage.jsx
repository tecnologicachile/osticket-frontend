import { useState } from 'react'
import { Ticket, CheckCircle2, AlertCircle, UserCheck, HelpCircle, Clock, Timer } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getStats } from '../api/stats.js'
import { CardSkeletonGrid } from '../components/common/LoadingSkeleton.jsx'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const statCards = [
  { key: 'open', label: 'Abiertos', icon: HelpCircle, color: 'indigo' },
  { key: 'today_closed', label: 'Cerrados Hoy', icon: CheckCircle2, color: 'emerald' },
  { key: 'overdue', label: 'Vencidos', icon: AlertCircle, color: 'red' },
  { key: 'assigned', label: 'Asignados', icon: UserCheck, color: 'blue' },
  { key: 'unassigned', label: 'Sin Asignar', icon: Ticket, color: 'amber' },
]

const colorMap = {
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    icon: 'text-indigo-600 dark:text-indigo-400',
    dot: 'bg-indigo-500',
    bar: 'bg-indigo-500',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500',
    bar: 'bg-red-500',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
    bar: 'bg-blue-500',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
  },
}

const periods = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: 'all', label: 'Todo' },
]

export default function StatsPage() {
  const [period, setPeriod] = useState('today')

  const { data, isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: ['stats', period],
    queryFn: () => getStats(period),
    select: (data) => data?.data || {},
  })

  const stats = data || {}

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Panel</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Vista general del helpdesk</p>
        <CardSkeletonGrid count={5} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium">
          Error al cargar estadísticas
        </p>
      </div>
    )
  }

  const total = (stats.open || 0) + (stats.closed || 0)
  const lastUpdated = dataUpdatedAt 
    ? new Date(dataUpdatedAt).toLocaleString('es-CL') 
    : new Date().toLocaleString('es-CL')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Panel</h1>
          <p className="text-slate-500 dark:text-slate-400">Vista general del helpdesk</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {periods.map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  period === p.id 
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            Última actualización: <span className="font-medium text-slate-700 dark:text-slate-300">{lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-slate-500 dark:text-slate-400">Total de Tickets</h3>
            <p className="text-4xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">{total.toLocaleString()}</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Ticket className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-slate-500 dark:text-slate-400">Tiempo 1ra Respuesta</h3>
            <p className="text-4xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
              {stats.first_response_avg_min || 0} <span className="text-lg font-medium text-slate-500">min</span>
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <Clock className="w-8 h-8 text-blue-500 dark:text-blue-400" />
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-slate-500 dark:text-slate-400">Tiempo Resolución</h3>
            <p className="text-4xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
              {stats.resolution_avg_hours || 0} <span className="text-lg font-medium text-slate-500">hrs</span>
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <Timer className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Count Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {statCards.map(({ key, label, icon: Icon, color }) => {
          const c = colorMap[color] || colorMap.indigo
          const value = stats[key] || 0
          const display = value.toLocaleString()
          const percentage = total > 0 ? Math.round((value / total) * 100) : 0

          return (
            <div
              key={key}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.bg}`}>
                  <Icon className={`w-5 h-5 ${c.icon}`} />
                </div>
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums mb-1">
                {display}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-4">
                {label}
              </p>
              
              <div className="mt-auto">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
                  <div 
                    className={`h-full rounded-full ${c.bar}`} 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {label} {display} de {total.toLocaleString()} totales = ~{percentage}%
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Trend Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Tendencia de Tickets</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.trend || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => {
                  if (!val) return '';
                  const d = new Date(val + 'T00:00:00');
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ color: '#64748b', marginBottom: '4px' }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              <Line 
                type="monotone" 
                name="Creados"
                dataKey="created" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                name="Resueltos"
                dataKey="closed" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
