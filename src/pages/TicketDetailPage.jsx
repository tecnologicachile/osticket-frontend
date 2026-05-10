import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTicket } from '../hooks/useTickets.js'
import StatusBadge from '../components/common/StatusBadge.jsx'
import PriorityBadge from '../components/common/PriorityBadge.jsx'
import TicketThread from '../components/tickets/TicketThread.jsx'
import TicketReply from '../components/tickets/TicketReply.jsx'
import TicketNote from '../components/tickets/TicketNote.jsx'
import TicketActions from '../components/tickets/TicketActions.jsx'

function DetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto animate-pulse space-y-4">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
      <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 mt-4">
        <div className="flex-[7] space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
        <div className="flex-[3] space-y-3">
          <div className="h-36 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export default function TicketDetailPage() {
  const { id } = useParams()
  const { data: ticket, isLoading, isError, error } = useTicket(id)

  // ---- Loading ----
  if (isLoading) {
    return <DetailSkeleton />
  }

  // ---- Error ----
  if (isError) {
    return (
      <div className="max-w-7xl mx-auto text-center py-16">
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-700 dark:text-red-400 font-semibold mb-2">
            Error al cargar el ticket
          </p>
          <p className="text-red-600 dark:text-red-500 text-sm">
            {error?.message || 'No se pudo cargar el ticket.'}
          </p>
          <Link
            to="/tickets"
            className="inline-block mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Volver a la lista
          </Link>
        </div>
      </div>
    )
  }

  // ---- Not found ----
  if (!ticket) {
    return (
      <div className="max-w-7xl mx-auto text-center py-16">
        <p className="text-gray-500 dark:text-gray-400">Ticket no encontrado.</p>
        <Link
          to="/tickets"
          className="inline-block mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Volver a la lista
        </Link>
      </div>
    )
  }

  const contactName = ticket.user?.name || ticket.user?.email || null

  return (
    <div className="max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="mb-5">
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a tickets
        </Link>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
            {ticket.subject}
          </h1>
          <div className="flex items-center gap-1.5">
            <StatusBadge status={ticket.status} />
            {ticket.priority != null && <PriorityBadge priority={ticket.priority} />}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <span className="font-mono">#{ticket.number || ticket.id}</span>
          {contactName && <span>— {contactName}</span>}
          {ticket.department && (
            <span className="inline-flex items-center gap-1">
              <span className="text-gray-300 dark:text-gray-600">|</span>
              {ticket.department}
            </span>
          )}
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Left: thread + reply + note */}
        <div className="flex-[7] min-w-0 space-y-4">
          <TicketThread thread={ticket.thread} />
          <TicketReply ticketId={ticket.id} />
          <TicketNote ticketId={ticket.id} />
        </div>

        {/* Right: info + actions sidebar */}
        <div className="flex-[3] min-w-0 lg:max-w-xs xl:max-w-sm">
          <TicketActions ticket={ticket} />
        </div>
      </div>
    </div>
  )
}
