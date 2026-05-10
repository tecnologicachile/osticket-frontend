import { useState } from 'react'
import { StickyNote } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAddNote } from '../../hooks/useTickets.js'

export default function TicketNote({ ticketId }) {
  const [note, setNote] = useState('')
  const [title, setTitle] = useState('')
  const [sending, setSending] = useState(false)
  const noteMutation = useAddNote()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!note.trim()) return

    setSending(true)
    try {
      const data = { note: note.trim() }
      if (title.trim()) {
        data.title = title.trim()
      }
      await noteMutation.mutateAsync({ id: ticketId, data })
      setNote('')
      setTitle('')
      toast.success('Nota interna agregada')
    } catch (err) {
      toast.error(err.message || 'Error al agregar la nota')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <StickyNote className="w-4 h-4" />
        Agregar nota interna
      </h3>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título de la nota (opcional)"
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
      />

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        placeholder="Escribe una nota interna…"
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none resize-y"
        required
      />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={sending || !note.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {sending ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Agregando…
            </>
          ) : (
            <>
              <StickyNote className="w-4 h-4" />
              Agregar nota
            </>
          )}
        </button>
      </div>
    </form>
  )
}
