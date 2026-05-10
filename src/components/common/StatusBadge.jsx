import { STATUS_MAP, BADGE_COLORS, BADGE_DOT_COLORS } from '../../utils/constants.js'

export default function StatusBadge({ status, dot = true }) {
  const config = STATUS_MAP[status] || { label: status || '—', color: 'gray' }
  const cls = BADGE_COLORS[config.color] || BADGE_COLORS.gray

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${cls}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${BADGE_DOT_COLORS[config.color] || BADGE_DOT_COLORS.gray}`} />
      )}
      {config.label}
    </span>
  )
}
