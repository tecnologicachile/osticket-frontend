import EmptyState from '../common/EmptyState.jsx'
import { useEffect, useRef } from 'react'
import { Lock, MessageSquare, Reply } from 'lucide-react'
import { formatDateTime } from '../../utils/formatters.js'

const threadStyles = {
  M: {
    wrapper: 'bg-white dark:bg-gray-800 border-l-4 border-l-blue-500',
    icon: MessageSquare,
    iconColor: 'text-blue-500',
    label: 'Mensaje original',
  },
  R: {
    wrapper: 'bg-green-50 dark:bg-green-950/30 border-l-4 border-l-green-500',
    icon: Reply,
    iconColor: 'text-green-600 dark:text-green-400',
    label: 'Respuesta',
  },
  N: {
    wrapper: 'bg-yellow-50 dark:bg-yellow-950/30 border-l-4 border-l-yellow-500',
    icon: Lock,
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    label: 'Nota interna',
  },
}

function ThreadEntry({ entry }) {
  const style = threadStyles[entry.type] || threadStyles.M
  const Icon = style.icon

  return (
    <div className={`rounded-r-lg p-4 shadow-sm border border-l-0 border-gray-200 dark:border-gray-700 ${style.wrapper}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${style.iconColor}`} />
        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
          {entry.poster || 'Sistema'}
        </span>
        {entry.type === 'N' && (
          <span className="inline-flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/40 px-2 py-0.5 rounded-full">
            <Lock className="w-3 h-3" />
            Interna
          </span>
        )}
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
          {formatDateTime(entry.created)}
        </span>
      </div>
      <div
        className="prose prose-sm max-w-none dark:prose-invert text-gray-700 dark:text-gray-300"
        dangerouslySetInnerHTML={{ __html: entry.body }}
      />
    </div>
  )
}

export default function TicketThread({ thread }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread])

  if (!thread || thread.length === 0) {
    return (
      <EmptyState
        title="No hay mensajes"
        description="Este ticket aún no tiene mensajes. Usa el formulario de abajo para enviar la primera respuesta."
      />
    )
  }

  return (
    <div className="space-y-3">
      {thread.map((entry) => (
        <ThreadEntry key={entry.id} entry={entry} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
