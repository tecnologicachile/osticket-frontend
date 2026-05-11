import { useState, useRef, useEffect } from 'react'
import { useAgents } from '../../hooks/useAgents.js'
import { useDepartments } from '../../hooks/useDepartments.js'
import { useTopics } from '../../hooks/useTopics.js'
import { STATUS_MAP } from '../../utils/constants.js'
import {
  X,
  CheckCircle,
  AlertCircle,
  Trash2,
  ArrowRightLeft,
  GitMerge,
  FolderTree,
} from 'lucide-react'
import toast from 'react-hot-toast'

/* ─── Confirm Modal ─── */
function ConfirmModal({
  open,
  onClose,
  title,
  children,
  onConfirm,
  confirmLabel = 'Confirmar',
  confirmVariant = 'indigo',
  disabled = false,
}) {
  const overlayRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    return () => { document.body.classList.remove('overflow-hidden') }
  }, [open])

  if (!open) return null

  const variantClasses = {
    indigo: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
    red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    amber: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby={`confirm-title-${title}`} className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 id={`confirm-title-${title}`} className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mb-6 text-sm text-slate-600 dark:text-slate-400">{children}</div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[confirmVariant] || variantClasses.indigo}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Bulk Action Button ─── */
function ActionButton({ onClick, icon: Icon, label, variant = 'slate' }) {
  const variants = {
    indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    amber: 'bg-amber-600 hover:bg-amber-700 text-white',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    red: 'bg-red-600 hover:bg-red-700 text-white',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${variants[variant] || variants.slate}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )
}

/* ─── Main Component ─── */
export default function BulkActionsBar({ actions }) {
  const {
    selectedIds,
    clearSelection,
    bulkStatus,
    bulkAssign,
    bulkDelete,
    bulkTransfer,
    bulkMerge,
    bulkTopic,
  } = actions
  const { data: agents = [] } = useAgents()
  const { data: departments = [] } = useDepartments()
  const { data: topics = [] } = useTopics()

  const [modal, setModal] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [mergeTargetId, setMergeTargetId] = useState('')

  const resetAndClose = () => {
    setModal(null)
    setSelectedStatus('')
    setSelectedAgent('')
    setSelectedDept('')
    setSelectedTopic('')
    setMergeTargetId('')
  }

  const handleStatusConfirm = () => {
    if (!selectedStatus) return
    bulkStatus(selectedStatus, {
      onSuccess: (data) => {
        const ok = data?.succeeded ?? data?.ok ?? selectedIds.length
        const fail = data?.failed ?? 0
        toast.success(fail > 0 ? `${ok} ok, ${fail} errores` : `${ok} tickets actualizados`)
        clearSelection()
        resetAndClose()
      },
      onError: (err) => {
        toast.error(`Error: ${err.message}`)
      },
    })
  }

  const handleAssignConfirm = () => {
    if (!selectedAgent) return
    bulkAssign(selectedAgent, {
      onSuccess: (data) => {
        const ok = data?.succeeded ?? data?.ok ?? selectedIds.length
        const fail = data?.failed ?? 0
        toast.success(fail > 0 ? `${ok} ok, ${fail} errores` : `${ok} tickets asignados`)
        clearSelection()
        resetAndClose()
      },
      onError: (err) => {
        toast.error(`Error: ${err.message}`)
      },
    })
  }

  const handleTransferConfirm = () => {
    if (!selectedDept) return
    if (bulkTransfer) {
      bulkTransfer(selectedDept, {
        onSuccess: (data) => {
          const ok = data?.succeeded ?? data?.ok ?? selectedIds.length
          toast.success(`${ok} tickets transferidos`)
          clearSelection()
          resetAndClose()
        },
        onError: (err) => toast.error(`Error: ${err.message}`),
      })
    } else {
      toast.error('Transferencia masiva no disponible aún')
      resetAndClose()
    }
  }

  const handleTopicConfirm = () => {
    if (!selectedTopic) return
    bulkTopic(selectedTopic, {
      onSuccess: (data) => {
        const ok = data?.succeeded ?? data?.ok ?? selectedIds.length
        const fail = data?.failed ?? 0
        toast.success(fail > 0 ? `${ok} ok, ${fail} errores` : `Tema asignado a ${ok} tickets`)
        clearSelection()
        resetAndClose()
      },
      onError: (err) => toast.error(`Error: ${err.message}`),
    })
  }

  const handleDeleteConfirm = () => {
    bulkDelete({
      onSuccess: (data) => {
        const ok = data?.succeeded ?? data?.ok ?? selectedIds.length
        const fail = data?.failed ?? 0
        toast.success(fail > 0 ? `${ok} ok, ${fail} errores` : `${ok} tickets eliminados`)
        clearSelection()
        resetAndClose()
      },
      onError: (err) => {
        toast.error(`Error: ${err.message}`)
      },
    })
  }

  const handleMergeConfirm = () => {
    if (!mergeTargetId) return
    if (bulkMerge) {
      bulkMerge(mergeTargetId, {
        onSuccess: () => {
          toast.success(`Tickets fusionados en #${mergeTargetId}`)
          clearSelection()
          resetAndClose()
        },
        onError: (err) => toast.error(`Error: ${err.message}`),
      })
    } else {
      toast.error('Merge masivo no disponible aún')
      resetAndClose()
    }
  }

  if (selectedIds.length === 0) return null

  const multiple = selectedIds.length > 1
  const count = selectedIds.length

  return (
    <>
      {/* Floating bar */}
      <div className="sticky bottom-0 z-40 -mx-4 lg:-mx-6 bg-white dark:bg-slate-900 border-t-2 border-indigo-500 shadow-2xl px-4 lg:px-6 py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-bold">
              {count}
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {count === 1 ? 'ticket seleccionado' : 'tickets seleccionados'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 sm:ml-auto">
            {/* Asignar */}
            <ActionButton
              onClick={() => { setSelectedAgent(''); setModal('assign') }}
              icon={CheckCircle}
              label="Asignar"
              variant="indigo"
            />

            {/* Cambiar Estado */}
            <ActionButton
              onClick={() => { setSelectedStatus(''); setModal('status') }}
              icon={AlertCircle}
              label="Estado"
              variant="amber"
            />

            {/* Transferir */}
            <ActionButton
              onClick={() => { setSelectedDept(''); setModal('transfer') }}
              icon={ArrowRightLeft}
              label="Transferir"
              variant="emerald"
            />

            {/* Tema */}
            <ActionButton
              onClick={() => { setSelectedTopic(''); setModal('topic') }}
              icon={FolderTree}
              label="Tema"
              variant="slate"
            />

            {/* Merge (only if 2+) */}
            {multiple && (
              <ActionButton
                onClick={() => { setMergeTargetId(''); setModal('merge') }}
                icon={GitMerge}
                label="Fusionar"
                variant="slate"
              />
            )}

            {/* Eliminar */}
            <ActionButton
              onClick={() => setModal('delete')}
              icon={Trash2}
              label="Eliminar"
              variant="red"
            />

            {/* Deseleccionar */}
            <ActionButton
              onClick={clearSelection}
              icon={X}
              label="Cancelar"
              variant="slate"
            />
          </div>
        </div>
      </div>

      {/* ── Modals ── */}

      {/* Status Modal */}
      <ConfirmModal
        open={modal === 'status'}
        onClose={resetAndClose}
        title="Cambiar estado"
        onConfirm={handleStatusConfirm}
        confirmLabel="Cambiar estado"
        disabled={!selectedStatus}
      >
        <p className="mb-3">
          Cambiar estado de <strong>{count}</strong> {count === 1 ? 'ticket' : 'tickets'}:
        </p>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">Seleccionar estado…</option>
          {Object.entries(STATUS_MAP).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </ConfirmModal>

      {/* Assign Modal */}
      <ConfirmModal
        open={modal === 'assign'}
        onClose={resetAndClose}
        title="Asignar tickets"
        onConfirm={handleAssignConfirm}
        confirmLabel="Asignar"
        disabled={!selectedAgent}
      >
        <p className="mb-3">
          Asignar <strong>{count}</strong> {count === 1 ? 'ticket' : 'tickets'} a:
        </p>
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">Seleccionar agente…</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </ConfirmModal>

      {/* Transfer Modal */}
      <ConfirmModal
        open={modal === 'transfer'}
        onClose={resetAndClose}
        title="Transferir tickets"
        onConfirm={handleTransferConfirm}
        confirmLabel="Transferir"
        confirmVariant="emerald"
        disabled={!selectedDept}
      >
        <p className="mb-3">
          Transferir <strong>{count}</strong> {count === 1 ? 'ticket' : 'tickets'} a:
        </p>
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">Seleccionar departamento…</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </ConfirmModal>

      {/* Topic Modal */}
      <ConfirmModal
        open={modal === 'topic'}
        onClose={resetAndClose}
        title="Asignar tema"
        onConfirm={handleTopicConfirm}
        confirmLabel="Asignar tema"
        confirmVariant="indigo"
        disabled={!selectedTopic}
      >
        <p className="mb-3">
          Asignar tema a <strong>{count}</strong> {count === 1 ? 'ticket' : 'tickets'}:
        </p>
        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">Seleccionar tema…</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name || t.name}
            </option>
          ))}
        </select>
      </ConfirmModal>

      {/* Merge Modal */}
      <ConfirmModal
        open={modal === 'merge'}
        onClose={resetAndClose}
        title="Fusionar tickets"
        onConfirm={handleMergeConfirm}
        confirmLabel="Fusionar"
        confirmVariant="amber"
        disabled={!mergeTargetId}
      >
        <p className="mb-3">
          Fusionar <strong>{count}</strong> tickets dentro del ticket destino:
        </p>
        <input
          type="text"
          value={mergeTargetId}
          onChange={(e) => setMergeTargetId(e.target.value)}
          placeholder="ID del ticket destino"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Los tickets seleccionados se cerrarán y sus conversaciones se moverán al ticket destino.
        </p>
      </ConfirmModal>

      {/* Delete Modal */}
      <ConfirmModal
        open={modal === 'delete'}
        onClose={resetAndClose}
        title="Eliminar tickets"
        onConfirm={handleDeleteConfirm}
        confirmLabel={`Eliminar ${count} ${count === 1 ? 'ticket' : 'tickets'}`}
        confirmVariant="red"
      >
        <div className="space-y-2">
          <p className="text-red-600 dark:text-red-400 font-medium">
            Esta acción no se puede deshacer.
          </p>
          <p>
            ¿Estás seguro de eliminar <strong>{count}</strong> {count === 1 ? 'ticket' : 'tickets'} de forma permanente?
          </p>
        </div>
      </ConfirmModal>
    </>
  )
}
