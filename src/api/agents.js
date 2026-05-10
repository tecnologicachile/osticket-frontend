import apiRequest from './client.js'

export function listAgents() {
  return apiRequest('/agents')
}
