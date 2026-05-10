import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ExternalLink, Loader2 } from 'lucide-react'
import { useTicket, useReplyTicket } from '../../hooks/useTickets.js'
import { useDraft } from '../../hooks/useDraft.js'
import toast from 'react-hot-toast'
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

export default function QuickReplyDrawer({ ticketId, onClose }) {
  const navigate = useNavigate()
  const { data: ticket, isLoading } = useTicket(ticketId)
  const replyMutation = useReplyTicket()
  const { draft, saveDraft, clearDraft } = useDraft(`quickreply_${ticketId}`)

  const [message, setMessage] = useState(draft)
  const [status, setStatus] = useState('')
  const [attachments, setAttachments] = useState([])

  useEffect(() => {
    if (ticket && !status) {
      setStatus(ticket.status || 'open')
    }
  }, [ticket, status])

  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Trigger animation after mount
    requestAnimationFrame(() => setIsOpen(true))
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(onClose, 300) // Wait for animation
  }

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const plainText = message.replace(/<[^>]*>?/gm, '').trim()
    if (!plainText && !message.includes('<img')) return

    try {
      const data = { message, status }
      if (attachments.length > 0) {
        data.attachments = await filesToBase64(attachments)
      }
      await replyMutation.mutateAsync({ id: ticketId, data })
      clearDraft()
      toast.success('Respuesta enviada')
      handleClose()
    } catch (err) {
      toast.error(err.message || 'Error al enviar respuesta')
    }
  }

  // Get last message from thread
  const lastMessage = ticket?.thread?.filter(t => t.type === 'message' || t.type === 'reply').pop()
  const lastMessageText = lastMessage?.body || ''
  const truncatedMessage = lastMessageText.length > 300 
    ? lastMessageText.substring(0, 300) + '...' 
    : lastMessageText

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-full lg:w-96 bg-white dark:bg-gray-900 shadow-xl z-50 flex flex-col transform transition-transform duration-300 border-l border-gray-200 dark:border-gray-800 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800'>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
            Respuesta rápida
          </h2>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => navigate(`/tickets/${ticketId}`)}
              className='p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors'
              title='Abrir vista completa'
            >
              <ExternalLink className='w-4 h-4' />
            </button>
            <button
              onClick={handleClose}
              className='p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors'
            >
              <X className='w-5 h-5' />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className='flex-1 overflow-y-auto p-4'>
          {isLoading ? (
            <div className='flex items-center justify-center h-32'>
              <Loader2 className='w-6 h-6 animate-spin text-gray-400' />
            </div>
          ) : ticket ? (
            <div className='space-y-4'>
              <div>
                <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400'>Asunto</h3>
                <p className='text-sm text-gray-900 dark:text-gray-100 font-medium mt-1'>
                  {ticket.subject || '(sin asunto)'}
                </p>
              </div>

              {ticket.topic && (
                <div>
                  <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400'>Tema</h3>
                  <p className='text-sm text-gray-900 dark:text-gray-100 mt-1'>
                    {ticket.topic}
                  </p>
                </div>
              )}

              {lastMessageText && (
                <div>
                  <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400'>Último mensaje</h3>
                  <div className='mt-1 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md text-sm text-gray-700 dark:text-gray-300 italic border border-gray-100 dark:border-gray-800'>
                    <div dangerouslySetInnerHTML={{ __html: truncatedMessage }} />
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className='space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                    Respuesta
                  </label>
                  <RichTextEditor
                    content={message}
                    onChange={(html) => { setMessage(html); saveDraft(html) }}
                    placeholder='Escribe tu respuesta...'
                  />
                  <AttachmentList
                    files={attachments}
                    onRemove={(i) => setAttachments(attachments.filter((_, j) => j !== i))}
                    onAdd={(newFiles) => setAttachments([...attachments, ...newFiles])}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                    Estado del ticket
                  </label>
                  <select
                    className='w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 text-sm'
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value='open'>Abierto</option>
                    <option value='resolved'>Resuelto</option>
                    <option value='closed'>Cerrado</option>
                  </select>
                </div>

                <div className='pt-2'>
                  <button
                    type='submit'
                    disabled={replyMutation.isPending || (!message.replace(/<[^>]*>?/gm, '').trim() && !message.includes('<img'))}
                    className='w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {replyMutation.isPending ? (
                      <>
                        <Loader2 className='w-4 h-4 animate-spin' />
                        Enviando...
                      </>
                    ) : (
                      'Enviar respuesta'
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className='text-center text-sm text-gray-500 py-8'>
              No se pudo cargar el ticket.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
