import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { STORAGE_API_KEY } from '../utils/constants.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_API_KEY) || '')
  const [agentName, setAgentName] = useState(() => localStorage.getItem('osticket_agent_name') || '')
  const [staffId, setStaffId] = useState(() => localStorage.getItem('osticket_staff_id') || '')
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem(STORAGE_API_KEY))

  const login = useCallback((key, name, sid) => {
    localStorage.setItem(STORAGE_API_KEY, key)
    localStorage.setItem('osticket_agent_name', name)
    localStorage.setItem('osticket_staff_id', sid)
    setApiKey(key)
    setAgentName(name)
    setStaffId(sid)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_API_KEY)
    localStorage.removeItem('osticket_agent_name')
    localStorage.removeItem('osticket_staff_id')
    setApiKey('')
    setAgentName('')
    setStaffId('')
    setIsAuthenticated(false)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_API_KEY)
    if (stored !== apiKey) {
      setApiKey(stored || '')
      setIsAuthenticated(!!stored)
    }
  }, [apiKey])

  return (
    <AuthContext.Provider value={{ apiKey, agentName, staffId, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
