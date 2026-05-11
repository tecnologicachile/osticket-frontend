import { useState, useMemo, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, Ticket, UserCheck, Flag, MessageSquare, MoreHorizontal, CheckCircle2, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { useTickets, useClaimTicket, useChangeStatus, useDeleteTicket, useEditTicket } from '../hooks/useTickets.js'
import { useBulkActions } from '../hooks/useBulkActions.js'
import toast from 'react-hot-toast'

import { formatDate } from '../utils/formatters.js'
import StatusBadge from '../components/common/StatusBadge.jsx'
import PriorityBadge from '../components/common/PriorityBadge.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import { TableRowSkeleton } from '../components/common/LoadingSkeleton.jsx'
import TicketFilters from '../components/tickets/TicketFilters.jsx'
import BulkActionsBar from '../components/tickets/BulkActionsBar.jsx'
import QuickReplyDrawer from '../components/tickets/QuickReplyDrawer.jsx'
import HoverPreview from '../components/common/HoverPreview.jsx'
import { useAuth } from '../stores/auth.jsx'

const columnHelper = createColumnHelper()

export default function TicketsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const lastClickedRef = useRef(null)
  const { staffId } = useAuth()

  const [replyTicketId, setReplyTicketId] = useState(null)
  const [openDropdownId, setOpenDropdownId] = useState(null)

  const claimMutation = useClaimTicket()
  const changeStatusMutation = useChangeStatus()
  const deleteMutation = useDeleteTicket()
  const editMutation = useEditTicket()

  // Read filters from URL
  const page = Number(searchParams.get('page') || 1)
  const queue = searchParams.get('queue') || 'my'
  const status = searchParams.get('status') || undefined
  const dept_id = searchParams.get('dept_id') || undefined
  const agent_id = searchParams.get('agent_id') || (queue === 'my' ? staffId : undefined)
  const priority = searchParams.get('priority') || undefined
  const date_from = searchParams.get('date_from') || undefined
  const date_to = searchParams.get('date_to') || undefined
  const overdue = searchParams.get('overdue') === '1' || undefined
  const topic_name = searchParams.get('topic_name') || undefined
  const q = searchParams.get('q') || undefined
  const sort_by = searchParams.get('sort_by') || 'created'
  const sort_dir = searchParams.get('sort_dir') || 'ASC'

  const { data, isLoading, isError, error } = useTickets({
    queue,
    page,
    limit: 25,
    status,
    dept_id,
    agent_id,
    priority,
    date_from,
    date_to,
    overdue,
    topic_name,
    q,
    sort_by,
    sort_dir,
  })

  const tickets = useMemo(() => data?.data || [], [data?.data])
  const ticketIds = useMemo(() => tickets.map((t) => t.id), [tickets])
  const total = data?.total || 0
  const totalPages = data?.pages || 1

  const bulkActions = useBulkActions()
  const { selectedIds, toggleSelect, selectAll, clearSelection } = bulkActions

  const allSelected = tickets.length > 0 && tickets.every((t) => selectedIds.includes(t.id))
  const someSelected = selectedIds.length > 0 && !allSelected

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      selectAll([])
    } else {
      selectAll(tickets.map(t => t.id))
    }
  }, [allSelected, selectAll, tickets])

  const handleRowClick = useCallback(
    (ticketId) => {
      navigate(`/tickets/${ticketId}`)
    },
    [navigate],
  )

  const handleCheckboxClick = useCallback((e, ticketId) => {
    e.stopPropagation()
    // Shift+click range selection
    if (e.shiftKey && lastClickedRef.current !== null) {
      const currentIdx = ticketIds.indexOf(ticketId)
      const lastIdx = ticketIds.indexOf(lastClickedRef.current)
      if (currentIdx !== -1 && lastIdx !== -1) {
        const start = Math.min(currentIdx, lastIdx)
        const end = Math.max(currentIdx, lastIdx)
        const rangeIds = ticketIds.slice(start, end + 1)
        // Toggle: if current is already selected, deselect range; otherwise select range
        if (selectedIds.includes(ticketId)) {
          selectAll(selectedIds.filter((id) => !rangeIds.includes(id)))
        } else {
          const merged = new Set([...selectedIds, ...rangeIds])
          selectAll([...merged])
        }
        return
      }
    }
    lastClickedRef.current = ticketId
    toggleSelect(ticketId)
  }, [ticketIds, selectedIds, toggleSelect, selectAll])

  const setPage = useCallback(
    (newPage) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('page', String(newPage))
        return next
      })
    },
    [setSearchParams],
  )

  const handleClaim = async (e, id) => {
    e.stopPropagation()
    try {
      await claimMutation.mutateAsync(id)
      toast.success('Ticket asignado')
    } catch (err) {
      toast.error('Error al asignar ticket')
    }
  }

  const handleChangeStatus = async (e, id, newStatus) => {
    e.stopPropagation()
    try {
      await changeStatusMutation.mutateAsync({ id, status: newStatus })
      toast.success('Estado cambiado')
      setOpenDropdownId(null)
    } catch (err) {
      toast.error('Error al cambiar estado')
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('¿Eliminar este ticket?')) return
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Ticket eliminado')
    } catch (err) {
      toast.error('Error al eliminar')
    }
  }

  const handlePriorityChange = async (id, priority) => {
    try {
      await editMutation.mutateAsync({ id, fields: { priority: String(priority) } })
      toast.success('Prioridad actualizada')
    } catch (err) {
      toast.error('Error al cambiar prioridad')
    }
  }

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: () => (
          <div className='flex flex-col items-center gap-1'>
            <input
              type='checkbox'
              checked={allSelected}
              ref={(el) => { if (el) el.indeterminate = someSelected }}
              onChange={handleSelectAll}
              className='rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500'
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className='flex flex-col items-center gap-1'>
            <input
              type='checkbox'
              checked={selectedIds.includes(row.original.id)}
              onChange={(e) => handleCheckboxClick(e, row.original.id)}
              onClick={(e) => e.stopPropagation()}
              className='rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500'
            />
            <span className='text-[10px] text-gray-500 dark:text-gray-400 font-mono leading-none'>
              {row.original.number}
            </span>
          </div>
        ),
        size: 50,
      }),
      columnHelper.accessor((row) => ({ subject: row.subject, user: row.user, id: row.id, preview: row.body_preview, html: row.body_html }), {
        id: 'solicitud',
        header: 'Solicitud',
        enableSorting: false,
        cell: ({ getValue }) => {
          const { subject, user, id, preview, html } = getValue()
          return (
            <div className='flex flex-col'>
              <HoverPreview content={preview} html={html}>
                <span
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRowClick(id)
                  }}
                  className='text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer line-clamp-1'
                >
                  {subject || '(sin asunto)'}
                </span>
              </HoverPreview>
              <span className='text-xs text-gray-500 dark:text-gray-400 line-clamp-1'>
                {user || '—'}
              </span>
            </div>
          )
        },
      }),
      columnHelper.accessor(
        (row) => ({ created: row.created, overdue: row.overdue }),
        {
          id: 'tiempos',
          header: ({ column }) => {
            const dir = column.getIsSorted()
            return (
              <button onClick={column.getToggleSortingHandler()} className='inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300'>
                Tiempo
                {dir === 'asc' && <ArrowDown className='w-3 h-3' />}
                {dir === 'desc' && <ArrowUp className='w-3 h-3' />}
              </button>
            )
          },
          cell: ({ getValue }) => {
            const { created, overdue } = getValue()
            if (!created) return <span className='text-xs text-gray-400'>—</span>
            const now = new Date()
            const createdDate = new Date(created.replace(' ', 'T'))
            const diffMs = now - createdDate
            const diffMin = Math.floor(diffMs / 60000)
            const diffHrs = Math.floor(diffMs / 3600000)
            const diffDays = Math.floor(diffMs / 86400000)

            let color = 'text-emerald-600 dark:text-emerald-400'
            let label
            if (diffMin < 60) {
              label = diffMin + 'min'
            } else if (diffHrs < 24) {
              label = diffHrs + 'h'
              color = diffHrs > 4 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
            } else {
              label = diffDays + 'd'
              color = diffDays > 3 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
            }

            return (
              <div className='flex flex-col'>
                <span className={`text-xs font-medium whitespace-nowrap ${overdue ? 'text-red-600 dark:text-red-400' : color}`}>
                  {overdue && <span className='inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1' />}
                  {label}
                </span>
                <span className='text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap'>
                  {formatDate(created)}
                </span>
              </div>
            )
          },
          size: 90,
        },
      ),
      columnHelper.accessor((row) => ({ assignee: row.assignee, department: row.department }), {
        id: 'asignacion',
        header: 'Asignación',
        cell: ({ getValue }) => {
          const { assignee, department } = getValue()
          return (
            <div className='flex flex-col'>
              <span className='text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap'>
                {assignee || 'Sin asignar'}
              </span>
              <span className='text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap'>
                {department || '—'}
              </span>
            </div>
          )
        },
        size: 130,
      }),
      columnHelper.accessor((row) => ({ status: row.status, priority: row.priority, tid: row.id }), {
        id: 'clasificacion',
        enableSorting: true,
        sortingFn: 'text',
        header: ({ column }) => (
          <button onClick={column.getToggleSortingHandler()} className='inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300'>
            Estado
            {{ asc: <ArrowUp className='w-3 h-3' />, desc: <ArrowDown className='w-3 h-3' /> }[column.getIsSorted()] ?? null}
          </button>
        ),
        cell: ({ getValue }) => {
          const { status, priority, tid } = getValue()
          return (
            <div className='flex flex-col gap-1 items-start'>
              <StatusBadge status={status} />
              <PriorityBadge priority={priority} onChange={(v) => handlePriorityChange(tid, v)} />
            </div>
          )
        },
        size: 120,
      }),
      columnHelper.accessor('topic', {
        header: 'Tema',
        cell: ({ getValue }) => (
          <span className='text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap truncate block' style={{ maxWidth: '120px' }} title={getValue() || ''}>
            {getValue() || '—'}
          </span>
        ),
        size: 130,
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const t = row.original
          const isDropdownOpen = openDropdownId === t.id
          
          return (
            <div className='relative flex justify-end items-center' onClick={(e) => e.stopPropagation()}>
              {/* Desktop Actions — 2 rows stacked (visible on hover) */}
              <div className='hidden lg:grid grid-cols-3 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity'>
                <button
                  onClick={(e) => !t.assignee && handleClaim(e, t.id)}
                  disabled={!!t.assignee}
                  className={`p-1.5 rounded ${t.assignee ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
                  title={t.assignee ? 'Ya asignado' : 'Asignarme'}
                >
                  <UserCheck className='w-4 h-4' />
                </button>
                <button
                  onClick={(e) => handleChangeStatus(e, t.id, 'closed')}
                  className='p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded'
                  title='Cerrar ticket'
                >
                  <CheckCircle2 className='w-4 h-4' />
                </button>
                <button
                  onClick={(e) => handleDelete(e, t.id)}
                  className='p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded'
                  title='Eliminar ticket'
                >
                  <Trash2 className='w-4 h-4' />
                </button>
                <div className='relative'>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenDropdownId(isDropdownOpen ? null : t.id)
                    }}
                    className='p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded'
                    title='Cambiar estado'
                  >
                    <Flag className='w-4 h-4' />
                  </button>
                  {isDropdownOpen && (
                    <div className='absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10 py-1'>
                      <button onClick={(e) => handleChangeStatus(e, t.id, 'open')} className='w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'>Abierto</button>
                      <button onClick={(e) => handleChangeStatus(e, t.id, 'resolved')} className='w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'>Resuelto</button>
                      <button onClick={(e) => handleChangeStatus(e, t.id, 'closed')} className='w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'>Cerrado</button>
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setReplyTicketId(t.id)
                  }}
                  className='p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded'
                  title='Responder'
                >
                  <MessageSquare className='w-4 h-4' />
                </button>
              </div>

              {/* Mobile Actions (Dropdown) */}
              <div className='lg:hidden relative'>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenDropdownId(isDropdownOpen ? null : t.id)
                  }}
                  className='p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded'
                >
                  <MoreHorizontal className='w-5 h-5' />
                </button>
                {isDropdownOpen && (
                  <div className='absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10 py-1'>
                    <button
                      onClick={(e) => {
                        if (!t.assignee) {
                          handleClaim(e, t.id)
                          setOpenDropdownId(null)
                        }
                      }}
                      disabled={!!t.assignee}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-sm ${t.assignee ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                      <UserCheck className='w-4 h-4' /> {t.assignee ? 'Asignado' : 'Asignarme'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setReplyTicketId(t.id)
                        setOpenDropdownId(null)
                      }}
                      className='w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    >
                      <MessageSquare className='w-4 h-4' /> Responder
                    </button>
                    <div className='border-t border-gray-200 dark:border-gray-700 my-1'></div>
                    <div className='px-4 py-1 text-xs font-semibold text-gray-500 uppercase'>Estado</div>
                    <button onClick={(e) => handleChangeStatus(e, t.id, 'open')} className='w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'>Abierto</button>
                    <button onClick={(e) => handleChangeStatus(e, t.id, 'resolved')} className='w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'>Resuelto</button>
                    <button onClick={(e) => handleChangeStatus(e, t.id, 'closed')} className='w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'>Cerrado</button>
                    <div className='border-t border-gray-200 dark:border-gray-700 my-1'></div>
                    <button
                      onClick={(e) => {
                        handleDelete(e, t.id)
                        setOpenDropdownId(null)
                      }}
                      className='w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    >
                      <Trash2 className='w-4 h-4' /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        },
        size: 100,
      }),
    ],
    [allSelected, someSelected, selectedIds, handleSelectAll, handleCheckboxClick, openDropdownId, handleRowClick],
  )

  const COL_TO_API_SORT = { tiempos: 'created', clasificacion: 'status', number: 'number', assignee: 'assignee' }
  const API_SORT_TO_COL = Object.fromEntries(Object.entries(COL_TO_API_SORT).map(([k, v]) => [v, k]))
  const defaultCol = API_SORT_TO_COL[sort_by] || 'tiempos'

  const [sorting, setSortingState] = useState([{ id: defaultCol, desc: sort_dir === 'DESC' }])

  const setSorting = useCallback((updater) => {
    setSortingState((prev) => {
      const newSorting = typeof updater === 'function' ? updater(prev) : updater
      setSearchParams((sp) => {
        const next = new URLSearchParams(sp)
        if (newSorting.length > 0) {
          const apiField = COL_TO_API_SORT[newSorting[0].id] || newSorting[0].id
          next.set('sort_by', apiField)
          next.set('sort_dir', newSorting[0].desc ? 'DESC' : 'ASC')
        } else {
          next.delete('sort_by')
          next.delete('sort_dir')
        }
        return next
      })
      return newSorting
    })
  }, [setSearchParams])

  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    manualPagination: true,
    pageCount: totalPages,
  })

  // --- Error state ---
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
        <Ticket className="w-12 h-12 mb-4" />
        <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">
          Error al cargar tickets
        </h3>
        <p className="text-sm text-red-500">{error?.message || 'Error desconocido'}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-0" onClick={() => setOpenDropdownId(null)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {total > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {total} {total === 1 ? 'ticket' : 'tickets'} encontrados
          </p>
        )}
      </div>

      {/* Filters */}
      <TicketFilters />

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                  {headerGroup.headers.map((header) => {
                    const isSelectorColumn = header.id === 'select'
                    const hideOnMobile = ['topic'].includes(header.id)
                    return (
                      <th
                        key={header.id}
                        className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                          isSelectorColumn ? 'w-10' : ''
                        } ${hideOnMobile ? 'hidden lg:table-cell' : ''}`}
                        style={header.getSize() !== 150 ? { width: header.getSize() } : undefined}
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={10} />
                ))
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <EmptyState
                      title="No se encontraron tickets"
                      description="No hay tickets que coincidan con los filtros seleccionados."
                    />
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => handleRowClick(row.original.id)}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    {row.getVisibleCells().map((cell) => {
                      const hideOnMobile = ['topic'].includes(cell.column.id)
                      return (
                        <td
                          key={cell.id}
                          className={`px-4 py-3 ${hideOnMobile ? 'hidden lg:table-cell' : ''}`}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      <BulkActionsBar actions={bulkActions} />

      {/* Quick Reply Drawer */}
      {replyTicketId && (
        <QuickReplyDrawer
          ticketId={replyTicketId}
          onClose={() => setReplyTicketId(null)}
        />
      )}
    </div>
  )
}
