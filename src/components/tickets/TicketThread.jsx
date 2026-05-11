import EmptyState from '../common/EmptyState.jsx'
import { useEffect, useRef } from 'react'
import { Lock, MessageSquare, Reply, Paperclip } from 'lucide-react'
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
      {entry.email?.from && (
        <div className='mt-2 ml-6 pl-3 border-l-2 border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 space-y-0.5 mb-2'>
          {entry.email.from && <p>De: <span className='text-gray-700 dark:text-gray-300'>{entry.email.from}</span></p>}
          {entry.email.to && <p>Para: <span className='text-gray-700 dark:text-gray-300'>{entry.email.to}</span></p>}
          {entry.email.cc && <p>CC: <span className='text-gray-700 dark:text-gray-300'>{entry.email.cc}</span></p>}
        </div>
      )}
      <div
        className="thread-body text-sm text-gray-900 dark:text-gray-100 leading-relaxed space-y-3"
        dangerouslySetInnerHTML={{ __html: entry.body }}
      />
      {entry.attachments?.length > 0 && (
        <div className='mt-3 pt-3 border-t border-gray-200 dark:border-gray-700'>
          <div className='flex flex-wrap gap-2'>
            {entry.attachments.map((att) => (
              <a
                key={att.id}
                href={`/api/http.php/rest/files/${att.id}`}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors'
              >
                <Paperclip className='w-3.5 h-3.5' />
                <span className='truncate max-w-[150px]'>{att.name || 'Archivo'}</span>
                {att.size > 0 && <span className='text-gray-400'>{(att.size / 1024).toFixed(0)} KB</span>}
              </a>
            ))}
          </div>
        </div>
      )}
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
