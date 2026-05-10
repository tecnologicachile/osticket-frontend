import apiRequest from './client.js'

export function listTickets({
  queue = 'open',
  page = 1,
  limit = 25,
  status,
  dept_id,
  agent_id,
  priority,
  date_from,
  date_to,
  overdue,
  topic_name,
  sort_by,
  sort_dir,
} = {}) {
  const params = new URLSearchParams()
  params.set('queue', queue)
  params.set('page', String(page))
  params.set('limit', String(limit))
  if (status && status !== 'all') params.set('status', status)
  if (dept_id) params.set('dept_id', String(dept_id))
  if (agent_id) params.set('agent_id', String(agent_id))
  if (priority) params.set('priority', String(priority))
  if (date_from) params.set('date_from', date_from)
  if (date_to) params.set('date_to', date_to)
  if (overdue) params.set('overdue', '1')
  if (topic_name) params.set('topic_name', topic_name)
  if (sort_by) params.set('sort_by', sort_by)
  if (sort_dir) params.set('sort_dir', sort_dir)
  return apiRequest(`/tickets?${params.toString()}`)
}

export function getTicket(id) {
  return apiRequest(`/tickets/${id}`)
}

export function searchTickets({ query, limit = 10 }) {
  return apiRequest('/tickets/search', {
    method: 'POST',
    body: JSON.stringify({ query, limit }),
  })
}

export function createTicket(data) {
  return apiRequest('/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function replyTicket(id, data) {
  return apiRequest(`/tickets/${id}/reply`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function addNote(id, data) {
  return apiRequest(`/tickets/${id}/note`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function assignTicket(id, agentId) {
  return apiRequest(`/tickets/${id}/assign`, {
    method: 'POST',
    body: JSON.stringify({ agent_id: agentId }),
  })
}

export function transferTicket(id, departmentId) {
  return apiRequest(`/tickets/${id}/transfer`, {
    method: 'POST',
    body: JSON.stringify({ department_id: departmentId }),
  })
}

export function changeStatus(id, status) {
  return apiRequest(`/tickets/${id}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  })
}

export function claimTicket(id) {
  return apiRequest(`/tickets/${id}/claim`, {
    method: 'POST',
  })
}

export function mergeTickets(targetId, sourceIds) {
  return apiRequest(`/tickets/${targetId}/merge`, {
    method: 'POST',
    body: JSON.stringify({ source_ids: sourceIds }),
  })
}

export function deleteTicket(id) {
  return apiRequest(`/tickets/${id}`, {
    method: 'DELETE',
  })
}

export function editTicket(id, fields) {
  return apiRequest(`/tickets/${id}/edit`, {
    method: 'POST',
    body: JSON.stringify({ fields }),
  })
}

export function bulkStatus(ticketIds, status) {
  return apiRequest('/tickets/bulk/status', {
    method: 'POST',
    body: JSON.stringify({ ids: ticketIds, status }),
  })
}

export function bulkAssign(ticketIds, agentId) {
  return apiRequest('/tickets/bulk/assign', {
    method: 'POST',
    body: JSON.stringify({ ids: ticketIds, agent_id: agentId }),
  })
}

export function bulkDelete(ticketIds) {
  return apiRequest('/tickets/bulk/delete', {
    method: 'POST',
    body: JSON.stringify({ ids: ticketIds }),
  })
}

export function bulkTransfer(ticketIds, departmentId) {
  return apiRequest('/tickets/bulk/transfer', {
    method: 'POST',
    body: JSON.stringify({ ids: ticketIds, department_id: departmentId }),
  })
}

export function bulkMerge(targetId, sourceIds) {
  return apiRequest(`/tickets/${targetId}/merge`, {
    method: 'POST',
    body: JSON.stringify({ source_ids: sourceIds }),
  })
}
