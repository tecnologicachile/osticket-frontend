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

export default function PriorityBadge({ priority, icon = true }) {
  // Handle nested object from detail endpoint: {ht: {priority_id: 2, ...}}
  const raw = priority?.ht?.priority_id ?? priority?.priority_id ?? priority
  const p = Number(raw)
  const config = PRIORITY_MAP[p] || { label: raw ? `P${raw}` : '—', color: 'gray' }
  const color = PRIORITY_COLORS[p] || config.color
  const cls = BADGE_COLORS[color] || BADGE_COLORS.gray
  const IconComp = PRIORITY_ICONS[p]

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${cls}`}
    >
      {icon && IconComp && <IconComp className="w-3 h-3" />}
      {config.label}
    </span>
  )
}
