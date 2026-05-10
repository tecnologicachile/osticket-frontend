import apiRequest from './client.js'

export function listDepartments() {
  return apiRequest('/departments')
}
