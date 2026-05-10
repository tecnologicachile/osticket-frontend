import { useState } from 'react'
import { StickyNote } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAddNote } from '../../hooks/useTickets.js'
import { useDraft } from '../../hooks/useDraft.js'
import RichTextEditor from '../common/RichTextEditor.jsx'
import AttachmentList from '../common/AttachmentList.jsx'

async function filesToBase64(files) {
  const results = []
  for (const file of files) {
    const data = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.readAsDataURL(file)
    })
    results.push({ name: file.name, type: file.type || 'application/octet-stream', data, encoding: 'base64' })
  }
  return results
}

export default function TicketNote({ ticketId }) {
  const { draft, saveDraft, clearDraft } = useDraft(`note_${ticketId}`)
  const [note, setNote] = useState(draft)
  const [title, setTitle] = useState('')
  const [sending, setSending] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [showSaved, setShowSaved] = useState(false)
  const noteMutation = useAddNote()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const plainText = note.replace(/<[^>]*>?/gm, '').trim()
    if (!plainText && !note.includes('<img')) return

    setSending(true)
    try {
      const data = { note: note.trim() }
      if (title.trim()) data.title = title.trim()
      if (attachments.length > 0) {
        data.attachments = await filesToBase64(attachments)
      }
      await noteMutation.mutateAsync({ id: ticketId, data })
      setNote('')
      setTitle('')
      setAttachments([])
      clearDraft()
      toast.success('Nota interna agregada')
    } catch (err) {
      toast.error(err.message || 'Error al agregar la nota')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2'>
          <StickyNote className='w-4 h-4' />
          Agregar nota interna
        </h3>
        {showSaved && (
          <span className='text-xs text-emerald-600 dark:text-emerald-400 animate-pulse'>✓ Borrador guardado</span>
        )}
      </div>

      <input
        type='text'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder='Título de la nota (opcional)'
        className='w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none'
      />

      <RichTextEditor
        content={note}
        onChange={(html) => { setNote(html); saveDraft(html); setShowSaved(true); setTimeout(() => setShowSaved(false), 1500) }}
        placeholder='Escribe una nota interna...'
      />

      <AttachmentList
        files={attachments}
        onRemove={(i) => setAttachments(attachments.filter((_, j) => j !== i))}
        onAdd={(newFiles) => setAttachments([...attachments, ...newFiles])}
      />

      <div className='flex justify-end'>
        <button
          type='submit'
          disabled={sending || (!note.replace(/<[^>]*>?/gm, '').trim() && !note.includes('<img'))}
          className='inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors'
        >
          {sending ? (
            <>
              <span className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
              Agregando…
            </>
          ) : (
            <>
              <StickyNote className='w-4 h-4' />
              Agregar nota
            </>
          )}
        </button>
      </div>
    </form>
  )
}
