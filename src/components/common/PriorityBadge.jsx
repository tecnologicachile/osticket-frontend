import { useState, useRef, useEffect } from 'react'
import { PRIORITY_MAP, BADGE_COLORS } from '../../utils/constants.js'
import { AlertTriangle, ArrowDown, Minus, ArrowUp } from 'lucide-react'

const PRIORITY_ICONS = {
  1: ArrowDown,
  2: Minus,
  3: ArrowUp,
  4: AlertTriangle,
}

const PRIORITY_COLORS = {
  1: 'green',
  2: 'yellow',
  3: 'orange',
  4: 'red',
}

export default function PriorityBadge({ priority, icon = true, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const p = Number(priority?.ht?.priority_id ?? priority?.priority_id ?? priority)
  const config = PRIORITY_MAP[p] || { label: p ? `P${p}` : '—', color: 'gray' }
  const color = PRIORITY_COLORS[p] || config.color
  const cls = BADGE_COLORS[color] || BADGE_COLORS.gray
  const IconComp = PRIORITY_ICONS[p]

  const badge = (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${cls} ${onChange ? 'cursor-pointer hover:ring-2' : ''}`}>
      {icon && IconComp && <IconComp className='w-3 h-3' />}
      {config.label}
    </span>
  )

  if (!onChange) return badge

  return (
    <div ref={ref} className='relative inline-block' onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen(!open)} className='focus:outline-none'>
        {badge}
      </button>
      {open && (
        <div className='absolute left-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1'>
          {[4, 3, 2, 1].map((v) => {
            const opt = PRIORITY_MAP[v]
            const optColor = PRIORITY_COLORS[v]
            const optCls = BADGE_COLORS[optColor]
            const OptIcon = PRIORITY_ICONS[v]
            return (
              <button
                key={v}
                onClick={(e) => { e.stopPropagation(); onChange(v); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${v === p ? 'font-semibold' : ''}`}
              >
                {OptIcon && <OptIcon className='w-3.5 h-3.5' />}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${optCls}`}>
                  {opt.label}
                </span>
                {v === p && <span className='ml-auto text-blue-500'>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
