import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, FolderTree } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTopics, useCreateTopic, useUpdateTopic, useDeleteTopic } from '../hooks/useTopics.js'
import { useDepartments } from '../hooks/useDepartments.js'
import { TableRowSkeleton } from '../components/common/LoadingSkeleton.jsx'
import EmptyState from '../components/common/EmptyState.jsx'

export default function TopicsPage() {
  const navigate = useNavigate()
  const { data: topics = [], isLoading, isError } = useTopics()
  const { data: departments = [] } = useDepartments()

  const createMutation = useCreateTopic()
  const updateMutation = useUpdateTopic()
  const deleteMutation = useDeleteTopic()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTopic, setEditingTopic] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    topic_pid: 0,
    dept_id: 0,
    ispublic: true,
    status: 'active'
  })

  // Group topics: parents first, then children with rollup counts
  const groupedTopics = useMemo(() => {
    const parents = topics.filter((t) => !t.topic_pid || Number(t.topic_pid) === 0)
    const result = []
    parents.forEach((p) => {
      const children = topics.filter((t) => Number(t.topic_pid) === Number(p.id))
      const rollup = (field) => (p[field] || 0) + children.reduce((s, c) => s + (c[field] || 0), 0)
      result.push({ ...p, isChild: false,
        total_open: rollup('open_count'),
        total_resolved: rollup('resolved_count'),
        total_closed: rollup('closed_count'),
      })
      children.forEach((c) => result.push({ ...c, isChild: true,
        total_open: c.open_count || 0,
        total_resolved: c.resolved_count || 0,
        total_closed: c.closed_count || 0,
      }))
    })
    topics.forEach((t) => {
      if (Number(t.topic_pid) !== 0 && !result.some((r) => r.id === t.id)) {
        result.push({ ...t, isChild: false,
          total_open: t.open_count || 0,
          total_resolved: t.resolved_count || 0,
          total_closed: t.closed_count || 0,
        })
      }
    })
    return result
  }, [topics])

  const handleTicketFilter = (topicName, status) => {
    navigate(`/tickets?queue=open&topic_name=${encodeURIComponent(topicName)}&status=${status}`)
  }

  const handleOpenModal = (topic = null) => {
    if (topic) {
      setEditingTopic(topic)
      setFormData({
        name: topic.name || '',
        topic_pid: topic.topic_pid || 0,
        dept_id: topic.dept_id || 0,
        ispublic: topic.ispublic !== 0 && topic.ispublic !== false,
        status: topic.isactive === 1 || topic.isactive === true ? 'active' : 'disabled'
      })
    } else {
      setEditingTopic(null)
      setFormData({
        name: '',
        topic_pid: 0,
        dept_id: 0,
        ispublic: true,
        status: 'active'
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTopic(null)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    const payload = {
      topic: formData.name,
      topic_pid: Number(formData.topic_pid),
      dept_id: Number(formData.dept_id),
      ispublic: formData.ispublic ? 1 : 0,
      isactive: formData.status === 'active' ? 1 : 0,
    }

    try {
      if (editingTopic) {
        await updateMutation.mutateAsync({ id: editingTopic.id, data: payload })
        toast.success('Tema actualizado')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Tema creado')
      }
      handleCloseModal()
    } catch (err) {
      toast.error(err.message || 'Error al guardar el tema')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este tema?')) return
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Tema eliminado')
    } catch (err) {
      toast.error(err.message || 'Error al eliminar el tema')
    }
  }

  const parentTopics = useMemo(() => {
    return topics.filter(t => !t.topic_pid || Number(t.topic_pid) === 0)
  }, [topics])

  const getDeptName = (id) => {
    const dept = departments.find(d => Number(d.id) === Number(id))
    return dept ? dept.name : '—'
  }

  return (
    <div className='flex flex-col h-full'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Gestión de Temas</h1>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className='flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium'
        >
          <Plus className='w-4 h-4' />
          Nuevo tema
        </button>
      </div>

      <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden flex-1'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50'>
                <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  Nombre
                </th>
                <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  Departamento
                </th>
                <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  Estado
                </th>
                <th className='px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16'>
                  Abiertos
                </th>
                <th className='px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16'>
                  Resueltos
                </th>
                <th className='px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16'>
                  Cerrados
                </th>
                <th className='px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100 dark:divide-gray-800'>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={7} />
                ))
              ) : groupedTopics.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={FolderTree}
                      title='No hay temas configurados'
                      description='Comienza creando tu primer tema de ayuda.'
                    />
                  </td>
                </tr>
              ) : (
                groupedTopics.map((topic) => (
                  <tr
                    key={topic.id}
                    className='hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'
                  >
                    <td className='px-4 py-3'>
                      <div className='flex items-center'>
                        {topic.isChild && (
                          <span className='text-gray-300 dark:text-gray-600 mr-2 ml-4'>└</span>
                        )}
                        <span className={`text-sm ${topic.isChild ? 'text-gray-600 dark:text-gray-400' : 'font-medium text-gray-900 dark:text-white'}`}>
                          {topic.name}
                        </span>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <span className='text-sm text-gray-500 dark:text-gray-400'>
                        {getDeptName(topic.dept_id)}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          topic.isactive === 1 || topic.isactive === true
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {topic.isactive === 1 || topic.isactive === true ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-center'>
                      {topic.total_open_count > 0 ? (
                        <button
                          onClick={() => handleTicketFilter(topic.full_name, 'open')}
                          className='inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors'
                        >
                          {topic.total_open_count}
                        </button>
                      ) : (
                        <span className='inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'>
                          0
                        </span>
                      )}
                    </td>
                    <td className='px-4 py-3 text-center'>
                      {topic.total_resolved > 0 ? (
                        <button
                          onClick={() => handleTicketFilter(topic.full_name, 'resolved')}
                          className='inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 transition-colors'
                        >
                          {topic.total_resolved}
                        </button>
                      ) : (
                        <span className='inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'>0</span>
                      )}
                    </td>
                    <td className='px-4 py-3 text-center'>
                      {topic.total_closed > 0 ? (
                        <button
                          onClick={() => handleTicketFilter(topic.full_name, 'closed')}
                          className='inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 transition-colors'
                        >
                          {topic.total_closed}
                        </button>
                      ) : (
                        <span className='inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'>0</span>
                      )}
                    </td>
                    <td className='px-4 py-3 text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        <button
                          onClick={() => handleOpenModal(topic)}
                          className='p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded'
                          title='Editar'
                        >
                          <Pencil className='w-4 h-4' />
                        </button>
                        <button
                          onClick={() => handleDelete(topic.id)}
                          className='p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded'
                          title='Eliminar'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm'>
          <div className='bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-800'>
            <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-800'>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                {editingTopic ? 'Editar Tema' : 'Nuevo Tema'}
              </h2>
            </div>
            
            <form onSubmit={handleSave} className='p-6 space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Nombre
                </label>
                <input
                  type='text'
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none'
                  placeholder='Ej: Soporte Técnico'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Tema Padre
                </label>
                <select
                  value={formData.topic_pid}
                  onChange={(e) => setFormData({ ...formData, topic_pid: e.target.value })}
                  className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none'
                >
                  <option value={0}>Ninguno (Tema Principal)</option>
                  {parentTopics.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Departamento
                </label>
                <select
                  value={formData.dept_id}
                  onChange={(e) => setFormData({ ...formData, dept_id: e.target.value })}
                  className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none'
                >
                  <option value={0}>Seleccionar departamento...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className='flex items-center gap-2 pt-2'>
                <input
                  type='checkbox'
                  id='ispublic'
                  checked={formData.ispublic}
                  onChange={(e) => setFormData({ ...formData, ispublic: e.target.checked })}
                  className='rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 w-4 h-4'
                />
                <label htmlFor='ispublic' className='text-sm text-gray-700 dark:text-gray-300'>
                  Público (visible para usuarios)
                </label>
              </div>

              <div className='flex items-center gap-2 pt-2'>
                <input
                  type='checkbox'
                  id='status'
                  checked={formData.status === 'active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'disabled' })}
                  className='rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 w-4 h-4'
                />
                <label htmlFor='status' className='text-sm text-gray-700 dark:text-gray-300'>
                  Activo
                </label>
              </div>

              <div className='flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-800'>
                <button
                  type='button'
                  onClick={handleCloseModal}
                  className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors'
                >
                  Cancelar
                </button>
                <button
                  type='submit'
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className='px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50'
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
