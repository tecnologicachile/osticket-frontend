import apiRequest from './client.js'

export function getStats(period = 'today') {
  return apiRequest(`/stats?period=${period}`)
}
