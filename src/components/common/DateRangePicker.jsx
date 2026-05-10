import { Calendar, X } from 'lucide-react'

export default function DateRangePicker({
  fromValue = '',
  toValue = '',
  onFromChange,
  onToChange,
  fromLabel = 'Desde',
  toLabel = 'Hasta',
  clearable = true,
}) {
  const hasValues = fromValue || toValue

  const handleClear = () => {
    onFromChange?.('')
    onToChange?.('')
  }

  return (
    <div className="flex items-end gap-2">
      {/* Desde */}
      <div className="flex-1 min-w-0">
        {fromLabel && (
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            {fromLabel}
          </label>
        )}
        <div className="relative">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="date"
            value={fromValue}
            onChange={(e) => onFromChange?.(e.target.value)}
            className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Hasta */}
      <div className="flex-1 min-w-0">
        {toLabel && (
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            {toLabel}
          </label>
        )}
        <div className="relative">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="date"
            value={toValue}
            onChange={(e) => onToChange?.(e.target.value)}
            className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Clear button */}
      {clearable && hasValues && (
        <button
          type="button"
          onClick={handleClear}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors flex-shrink-0"
          title="Limpiar fechas"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
