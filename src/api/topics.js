import apiRequest from './client.js'

export function listTopics() {
  return apiRequest('/topics')
}

export function createTopic(data) {
  return apiRequest('/topics', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateTopic(id, data) {
  return apiRequest(`/topics/${id}`, {
    method: 'POST', // The prompt says POST /topics/:id -> editar topic
    body: JSON.stringify(data),
  })
}

export function deleteTopic(id) {
  return apiRequest(`/topics/${id}`, {
    method: 'DELETE',
  })
}
