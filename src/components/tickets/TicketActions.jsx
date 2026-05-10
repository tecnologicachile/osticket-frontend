import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UserPlus,
  UserCheck,
  ArrowRightLeft,
  Flag,
  GitMerge,
  User,
  Users,
  Plus,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useAssignTicket,
  useChangeStatus,
  useTransferTicket,
  useClaimTicket,
  useMergeTickets,
} from '../../hooks/useTickets.js'
import { useAgents } from '../../hooks/useAgents.js'
import { useDepartments } from '../../hooks/useDepartments.js'
import { STATUS_MAP } from '../../utils/constants.js'
import { formatDateTime } from '../../utils/formatters.js'
import apiRequest from '../../api/client.js'

function ActionBox({ icon: Icon, title, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </h4>
      {children}
    </div>
  )
}

function AssignAction({ ticketId, currentAssignee }) {
  const { data: agents = [] } = useAgents()
  const assignMutation = useAssignTicket()
  const [selectedAgent, setSelectedAgent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAssign = async () => {
    if (!selectedAgent) return
    setLoading(true)
    try {
      await assignMutation.mutateAsync({ id: ticketId, agentId: selectedAgent })
      toast.success('Ticket asignado')
      setSelectedAgent('')
    } catch (err) {
      toast.error(err.message || 'Error al asignar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ActionBox icon={UserPlus} title="Asignar">
      {currentAssignee && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Actual: <span className="font-medium text-gray-700 dark:text-gray-300">{currentAssignee}</span>
        </p>
      )}
      <div className="flex gap-2">
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="flex-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-2 py-1.5 text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-indigo-500 outline-none"
        >
          <option value="">Seleccionar agente…</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name || agent.email || `Agente #${agent.id}`}
            </option>
          ))}
        </select>
        <button
          onClick={handleAssign}
          disabled={loading || !selectedAgent}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
        >
          {loading ? '…' : 'Asignar'}
        </button>
      </div>
    </ActionBox>
  )
}

function StatusAction({ ticketId, currentStatus }) {
  const statusMutation = useChangeStatus()
  const [selectedStatus, setSelectedStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = async () => {
    if (!selectedStatus) return
    setLoading(true)
    try {
      await statusMutation.mutateAsync({ id: ticketId, status: selectedStatus })
      toast.success(`Estado cambiado a "${selectedStatus}"`)
      setSelectedStatus('')
    } catch (err) {
      toast.error(err.message || 'Error al cambiar estado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ActionBox icon={Flag} title="Cambiar estado">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Actual: <span className="font-medium text-gray-700 dark:text-gray-300">{STATUS_MAP[currentStatus]?.label || currentStatus}</span>
      </p>
      <div className="flex gap-2">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="flex-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-2 py-1.5 text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-indigo-500 outline-none"
        >
          <option value="">Seleccionar…</option>
          <option value="open">Abierto</option>
          <option value="resolved">Resuelto</option>
          <option value="closed">Cerrado</option>
        </select>
        <button
          onClick={handleChange}
          disabled={loading || !selectedStatus}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
        >
          {loading ? '…' : 'Cambiar'}
        </button>
      </div>
    </ActionBox>
  )
}

function TransferAction({ ticketId }) {
  const { data: departments = [] } = useDepartments()
  const transferMutation = useTransferTicket()
  const [selectedDept, setSelectedDept] = useState('')
  const [loading, setLoading] = useState(false)

  const handleTransfer = async () => {
    if (!selectedDept) return
    setLoading(true)
    try {
      await transferMutation.mutateAsync({ id: ticketId, departmentId: selectedDept })
      toast.success('Ticket transferido')
      setSelectedDept('')
    } catch (err) {
      toast.error(err.message || 'Error al transferir')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ActionBox icon={ArrowRightLeft} title="Transferir">
      <div className="flex gap-2">
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="flex-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-2 py-1.5 text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-indigo-500 outline-none"
        >
          <option value="">Seleccionar depto…</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name || `Depto #${dept.id}`}
            </option>
          ))}
        </select>
        <button
          onClick={handleTransfer}
          disabled={loading || !selectedDept}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
        >
          {loading ? '…' : 'Mover'}
        </button>
      </div>
    </ActionBox>
  )
}

function ClaimAction({ ticketId, hasAssignee }) {
  const claimMutation = useClaimTicket()
  const [loading, setLoading] = useState(false)

  const handleClaim = async () => {
    setLoading(true)
    try {
      await claimMutation.mutateAsync(ticketId)
      toast.success('Ticket asignado a ti')
    } catch (err) {
      toast.error(err.message || 'Error al reclamar')
    } finally {
      setLoading(false)
    }
  }

  if (hasAssignee) return null

  return (
    <ActionBox icon={UserCheck} title="Asignarme">
      <button
        onClick={handleClaim}
        disabled={loading}
        className="w-full px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
      >
        {loading ? 'Asignando…' : 'Asignarme este ticket'}
      </button>
    </ActionBox>
  )
}

function MergeAction({ ticketId }) {
  const mergeMutation = useMergeTickets()
  const [sourceIds, setSourceIds] = useState('')
  const [loading, setLoading] = useState(false)

  const handleMerge = async () => {
    const ids = sourceIds
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => !isNaN(n))

    if (ids.length === 0) return

    setLoading(true)
    try {
      await mergeMutation.mutateAsync({ targetId: ticketId, sourceIds: ids })
      toast.success(`${ids.length} ticket(s) fusionado(s)`)
      setSourceIds('')
    } catch (err) {
      toast.error(err.message || 'Error al fusionar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ActionBox icon={GitMerge} title="Fusionar tickets">
      <input
        type="text"
        value={sourceIds}
        onChange={(e) => setSourceIds(e.target.value)}
        placeholder="IDs separados por coma (ej: 42, 57)"
        className="w-full text-xs rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-2 py-1.5 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-1 focus:ring-indigo-500 outline-none"
      />
      <button
        onClick={handleMerge}
        disabled={loading || !sourceIds.trim()}
        className="w-full px-3 py-1.5 bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
      >
        {loading ? 'Fusionando…' : 'Fusionar en este ticket'}
      </button>
    </ActionBox>
  )
}

function CollaboratorAction({ ticketId }) {
  const queryClient = useQueryClient()
  const [searchUser, setSearchUser] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const { data: collabData } = useQuery({
    queryKey: ['collaborators', ticketId],
    queryFn: () => apiRequest('/tickets/' + ticketId + '/collaborators'),
    staleTime: 30000,
  })
  const collaborators = collabData?.data || []

  const addMutation = useMutation({
    mutationFn: (userId) => apiRequest('/tickets/' + ticketId + '/collaborators', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', ticketId] })
      toast.success('Colaborador agregado')
    },
    onError: (err) => toast.error(err.message || 'Error al agregar'),
  })

  const removeMutation = useMutation({
    mutationFn: (userId) => apiRequest('/tickets/' + ticketId + '/collaborators/' + userId, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', ticketId] })
      toast.success('Colaborador removido')
    },
    onError: (err) => toast.error(err.message || 'Error al remover'),
  })

  // Search users when typing
  const { data: userResults = [] } = useQuery({
    queryKey: ['userSearch', searchUser],
    queryFn: () => apiRequest('/users/search?q=' + encodeURIComponent(searchUser)),
    enabled: searchUser.length >= 3,
    select: (d) => d?.data || [],
    staleTime: 30000,
  })

  return (
    <ActionBox icon={Users} title='Colaboradores (CC)'>
      {/* Current collaborators */}
      {collaborators.length > 0 ? (
        <div className='space-y-1 mb-2'>
          {collaborators.map((c) => (
            <div key={c.id || c.user_id} className='flex items-center justify-between text-xs'>
              <span className='text-gray-700 dark:text-gray-300 truncate'>{c.name || c.email}</span>
              <button
                onClick={() => removeMutation.mutate(c.user_id || c.id)}
                className='p-0.5 text-gray-400 hover:text-red-500'
              ><X className='w-3 h-3' /></button>
            </div>
          ))}
        </div>
      ) : (
        <p className='text-xs text-gray-400 mb-2'>Sin colaboradores</p>
      )}

      {/* Add collaborator */}
      {showSearch ? (
        <div className='space-y-1'>
          <input
            type='text'
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            placeholder='Buscar usuario por nombre/email...'
            className='w-full text-xs rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-2 py-1.5'
            autoFocus
          />
          {userResults.length > 0 && (
            <div className='max-h-24 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded'>
              {userResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { addMutation.mutate(u.id); setShowSearch(false); setSearchUser('') }}
                  className='w-full text-left px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                >
                  {u.name || u.email} {u.email && u.name && <span className='text-gray-400'>({u.email})</span>}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setShowSearch(false)} className='text-xs text-gray-500 hover:text-gray-700'>Cancelar</button>
        </div>
      ) : (
        <button
          onClick={() => setShowSearch(true)}
          className='flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700'
        >
          <Plus className='w-3 h-3' /> Agregar colaborador
        </button>
      )}
    </ActionBox>
  )
}

export default function TicketActions({ ticket }) {
  if (!ticket) return null

  return (
    <div className="space-y-3">
      {/* Ticket Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          Información
        </h4>
        <dl className="text-xs space-y-1">
          <div className="flex justify-between">
            <dt className="text-gray-400 dark:text-gray-500">ID</dt>
            <dd className="font-mono text-gray-700 dark:text-gray-300">#{ticket.number || ticket.id}</dd>
          </div>
          {ticket.source && (
            <div className="flex justify-between">
              <dt className="text-gray-400 dark:text-gray-500">Fuente</dt>
              <dd className="text-gray-700 dark:text-gray-300 capitalize">{ticket.source}</dd>
            </div>
          )}
          {ticket.topic && (
            <div className="flex justify-between">
              <dt className="text-gray-400 dark:text-gray-500">Tema</dt>
              <dd className="text-gray-700 dark:text-gray-300 text-right">{ticket.topic}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-400 dark:text-gray-500">Creado</dt>
            <dd className="text-gray-700 dark:text-gray-300">{formatDateTime(ticket.created)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-400 dark:text-gray-500">Actualizado</dt>
            <dd className="text-gray-700 dark:text-gray-300">{formatDateTime(ticket.updated)}</dd>
          </div>
        </dl>
      </div>

      <AssignAction
        ticketId={ticket.id}
        currentAssignee={ticket.assignee?.name || ticket.assigned_to}
      />
      <StatusAction ticketId={ticket.id} currentStatus={ticket.status} />
      <TransferAction ticketId={ticket.id} />
      <ClaimAction ticketId={ticket.id} hasAssignee={!!(ticket.assignee || ticket.assigned_to)} />
      <MergeAction ticketId={ticket.id} />
      <CollaboratorAction ticketId={ticket.id} />
    </div>
  )
}
