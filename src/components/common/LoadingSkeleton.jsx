/* ────────── Table variants ────────── */

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
        </td>
      ))}
    </tr>
  )
}

export function TableSkeleton({ rows = 8, cols = 5 }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="w-full">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
                <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ────────── Card skeleton ────────── */

export function CardSkeleton() {
  return (
    <div className="animate-pulse bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
      <div className="h-8 w-1/2 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
      <div className="h-3 w-2/3 bg-slate-100 dark:bg-slate-800 rounded" />
    </div>
  )
}

export function CardSkeletonGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

/* ────────── Text skeleton ────────── */

export function TextSkeleton({ lines = 3 }) {
  const widths = ['w-full', 'w-4/5', 'w-2/3', 'w-5/6', 'w-1/2']
  return (
    <div className="animate-pulse space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-3.5 bg-slate-200 dark:bg-slate-700 rounded ${widths[i % widths.length]}`}
        />
      ))}
    </div>
  )
}

/* ────────── Default export (table for backward compat) ────────── */

export default function LoadingSkeleton({ rows = 8, cols = 5 }) {
  return <TableSkeleton rows={rows} cols={cols} />
}
