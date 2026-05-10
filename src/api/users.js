import apiRequest from './client.js'

export function searchUsers(query) {
  return apiRequest(`/users/search?query=${encodeURIComponent(query)}`)
}

export function getUser(id) {
  return apiRequest(`/users/${id}`)
}
