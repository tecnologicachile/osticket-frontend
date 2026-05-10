export const STATUS_MAP = {
  open: { label: 'Abierto', color: 'green' },
  Abrir: { label: 'Abierto', color: 'green' },
  resolved: { label: 'Resuelto', color: 'blue' },
  Resuelto: { label: 'Resuelto', color: 'blue' },
  closed: { label: 'Cerrado', color: 'gray' },
  Cerrado: { label: 'Cerrado', color: 'gray' },
}

export const PRIORITY_MAP = {
  1: { label: 'Baja', color: 'green' },
  2: { label: 'Normal', color: 'yellow' },
  3: { label: 'Alta', color: 'orange' },
  4: { label: 'Emergencia', color: 'red' },
}

export const BADGE_COLORS = {
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 ring-emerald-600/10',
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-blue-600/10',
  yellow: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ring-amber-600/10',
  orange: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 ring-orange-600/10',
  red: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-600/10',
  gray: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 ring-slate-500/10',
}

export const BADGE_DOT_COLORS = {
  green: 'bg-emerald-500',
  blue: 'bg-blue-500',
  yellow: 'bg-amber-500',
  red: 'bg-red-500',
  gray: 'bg-slate-400',
}

export const STORAGE_API_KEY = 'osticket_api_key'
export const STORAGE_DARK_MODE = 'osticket_dark_mode'
export const FOCUS_DELAY_MS = 100
