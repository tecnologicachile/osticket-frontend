import { useState, useEffect, useCallback } from 'react'

export function useDraft(key) {
  const storageKey = `draft_${key}`

  const [draft, setDraft] = useState(() => {
    try { return localStorage.getItem(storageKey) || '' }
    catch { return '' }
  })

  useEffect(() => {
    try { localStorage.setItem(storageKey, draft) }
    catch { /* quota exceeded */ }
  }, [storageKey, draft])

  const clearDraft = useCallback(() => {
    setDraft('')
  }, [storageKey])

  return { draft, saveDraft: setDraft, clearDraft }
}
