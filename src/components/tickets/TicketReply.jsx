import { useState, useRef } from 'react'
import { Send, Bold, Italic, List, Link2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useReplyTicket } from '../../hooks/useTickets.js'

function HtmlToolbar({ textareaRef, onFormat }) {
  const btnClass =
    'p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors'

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 border-b border-gray-200 dark:border-gray-700">
      <button type="button" className={btnClass} title="Negrita" onClick={() => onFormat('bold')}>
        <Bold className="w-3.5 h-3.5" />
      </button>
      <button type="button" className={btnClass} title="Cursiva" onClick={() => onFormat('italic')}>
        <Italic className="w-3.5 h-3.5" />
      </button>
      <button type="button" className={btnClass} title="Lista" onClick={() => onFormat('list')}>
        <List className="w-3.5 h-3.5" />
      </button>
      <button type="button" className={btnClass} title="Enlace" onClick={() => onFormat('link')}>
        <Link2 className="w-3.5 h-3.5" />
      </button>
      <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-500">HTML</span>
    </div>
  )
}

function LinkModal({ open, onClose, onSubmit }) {
  const overlayRef = useRef(null)
  const [text, setText] = useState('')
  const [url, setUrl] = useState('https://')

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (url.trim()) {
      onSubmit(text || 'texto del enlace', url.trim())
      setText('')
      setUrl('https://')
      onClose()
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-modal-title"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 id="link-modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">Insertar enlace</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label htmlFor="link-text" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Texto</label>
            <input id="link-text" type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="texto del enlace" className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
          </div>
          <div>
            <label htmlFor="link-url" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">URL</label>
            <input id="link-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" autoFocus />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900">Insertar</button>
        </div>
      </form>
    </div>
  )
}

export default function TicketReply({ ticketId }) {
  const [message, setMessage] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [sending, setSending] = useState(false)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [pendingLink, setPendingLink] = useState(null)
  const textareaRef = useRef(null)
  const replyMutation = useReplyTicket()

  const wrapSelection = (before, after) => {
    const el = textareaRef.current
    if (!el) return
    const { selectionStart, selectionEnd } = el
    const selected = message.slice(selectionStart, selectionEnd)
    const replacement = before + selected + after
    const newText =
      message.slice(0, selectionStart) + replacement + message.slice(selectionEnd)
    setMessage(newText)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(
        selectionStart + before.length,
        selectionStart + before.length + selected.length,
      )
    })
  }

  const insertLink = (text, url) => {
    const el = textareaRef.current
    if (!el) return
    const { selectionStart, selectionEnd } = el
    const selected = message.slice(selectionStart, selectionEnd)
    const linkText = selected || text
    const replacement = `<a href="${url}">${linkText}</a>`
    const newText =
      message.slice(0, selectionStart) + replacement + message.slice(selectionEnd)
    setMessage(newText)
    el.focus()
  }

  const handleFormat = (action) => {
    switch (action) {
      case 'bold':
        wrapSelection('<strong>', '</strong>')
        break
      case 'italic':
        wrapSelection('<em>', '</em>')
        break
      case 'list':
        wrapSelection('<ul>\n  <li>', '</li>\n</ul>')
        break
      case 'link':
        setPendingLink({
          selectionStart: textareaRef.current?.selectionStart,
          selectionEnd: textareaRef.current?.selectionEnd,
        })
        setLinkModalOpen(true)
        break
    }
  }

  const handleLinkSubmit = (text, url) => {
    insertLink(text, url)
    setLinkModalOpen(false)
    setPendingLink(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return

    setSending(true)
    try {
      const data = { message: message.trim() }
      if (newStatus) {
        data.status = newStatus
      }
      await replyMutation.mutateAsync({ id: ticketId, data })
      setMessage('')
      setNewStatus('')
      toast.success('Respuesta enviada')
    } catch (err) {
      toast.error(err.message || 'Error al enviar la respuesta')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <LinkModal open={linkModalOpen} onClose={() => setLinkModalOpen(false)} onSubmit={handleLinkSubmit} />
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <HtmlToolbar textareaRef={textareaRef} onFormat={handleFormat} />

        <div className="p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Send className="w-4 h-4" />
            Enviar respuesta
          </h3>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Escribe tu respuesta aquí… (soporta HTML)"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-y"
            required
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="reply-status" className="text-xs text-gray-500 dark:text-gray-400">
                Estado tras respuesta:
              </label>
              <select
                id="reply-status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-2 py-1 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">Sin cambio</option>
                <option value="open">Abierto</option>
                <option value="resolved">Resuelto</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {sending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar respuesta
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </>
  )
}
