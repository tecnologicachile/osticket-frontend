import { useState } from 'react'
import { Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import { useReplyTicket } from '../../hooks/useTickets.js'
import { useDraft } from '../../hooks/useDraft.js'
import RichTextEditor from '../common/RichTextEditor.jsx'
import AttachmentList from '../common/AttachmentList.jsx'
import apiRequest from '../../api/client.js'

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

export default function TicketReply({ ticketId }) {
  const { draft, saveDraft, clearDraft } = useDraft(`reply_${ticketId}`)
  const [message, setMessage] = useState(draft)
  const [newStatus, setNewStatus] = useState('')
  const [replyTo, setReplyTo] = useState('all')
  const [sending, setSending] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [showSaved, setShowSaved] = useState(false)
  const replyMutation = useReplyTicket()

  const { data: emails = [] } = useQuery({
    queryKey: ['emails'],
    queryFn: () => apiRequest('/emails'),
    select: (d) => d?.data || [],
    staleTime: 10 * 60 * 1000,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const plainText = message.replace(/<[^>]*>?/gm, '').trim()
    if (!plainText && !message.includes('<img')) return

    setSending(true)
    try {
      const data = { message: message.trim(), reply_to: replyTo }
      if (newStatus) data.status = newStatus
      if (attachments.length > 0) {
        data.attachments = await filesToBase64(attachments)
      }
      await replyMutation.mutateAsync({ id: ticketId, data })
      setMessage('')
      setAttachments([])
      setNewStatus('')
      clearDraft()
      toast.success('Respuesta enviada')
    } catch (err) {
      toast.error(err.message || 'Error al enviar la respuesta')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden'>
      <div className='p-4 space-y-3'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2'>
            <Send className='w-4 h-4' />
            Enviar respuesta
          </h3>
          {showSaved && (
            <span className='text-xs text-emerald-600 dark:text-emerald-400 animate-pulse'>✓ Borrador guardado</span>
          )}
        </div>

        <RichTextEditor
          content={message}
          onChange={(html) => { setMessage(html); saveDraft(html); setShowSaved(true); setTimeout(() => setShowSaved(false), 1500) }}
          placeholder='Escribe tu respuesta...'
        />

        <AttachmentList
          files={attachments}
          onRemove={(i) => setAttachments(attachments.filter((_, j) => j !== i))}
          onAdd={(newFiles) => setAttachments([...attachments, ...newFiles])}
        />

        <div className='flex flex-wrap items-center gap-3'>
          <div className='flex items-center gap-2'>
            <label className='text-xs text-gray-500 dark:text-gray-400'>Estado:</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className='text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-2 py-1 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none'
            >
              <option value=''>Sin cambio</option>
              <option value='open'>Abierto</option>
              <option value='resolved'>Resuelto</option>
              <option value='closed'>Cerrado</option>
            </select>
          </div>

          <div className='flex items-center gap-2'>
            <label className='text-xs text-gray-500 dark:text-gray-400'>Responder a:</label>
            <select
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              className='text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-2 py-1 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none'
            >
              <option value='all'>Todos</option>
              <option value='user'>Solo el usuario</option>
              <option value='none'>No enviar email</option>
            </select>
          </div>

          {emails.length > 1 && (
            <div className='flex items-center gap-2'>
              <label className='text-xs text-gray-500 dark:text-gray-400'>Desde:</label>
              <select
                defaultValue=''
                className='text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-2 py-1 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none max-w-[200px]'
              >
                <option value=''>Default</option>
                {emails.map((em) => (
                  <option key={em.id} value={em.id}>{em.name} &lt;{em.email}&gt;</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className='flex justify-end'>
          <button
            type='submit'
            disabled={sending || (!message.replace(/<[^>]*>?/gm, '').trim() && !message.includes('<img'))}
            className='inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors'
          >
            {sending ? (
              <>
                <span className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                Enviando…
              </>
            ) : (
              <>
                <Send className='w-4 h-4' />
                Enviar respuesta
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
