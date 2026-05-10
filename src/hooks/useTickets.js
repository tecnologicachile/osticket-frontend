import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as ticketsApi from '../api/tickets.js'

export function useTickets({
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
  const params = { queue, page, limit, status, dept_id, agent_id, priority, date_from, date_to, overdue, topic_name, sort_by, sort_dir }
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: () => ticketsApi.listTickets(params),
  })
}

export function useTicket(id) {
  const numId = Number(id)
  return useQuery({
    queryKey: ['tickets', numId],
    queryFn: () => ticketsApi.getTicket(numId),
    enabled: !!numId,
    select: (data) => data?.data || null,
  })
}

export function useSearchTickets(query, { limit = 25 } = {}) {
  return useQuery({
    queryKey: ['tickets', 'search', query, limit],
    queryFn: () => ticketsApi.searchTickets(query, { limit }),
    enabled: !!query && query.length >= 3,
  })
}

export function useCreateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ticketsApi.createTicket,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tickets'] }),
  })
}

export function useReplyTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => ticketsApi.replyTicket(id, data),
    onSuccess: (_, { id }) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['tickets', id] })
        queryClient.invalidateQueries({ queryKey: ['tickets'] })
      }, 500)
    },
  })
}

export function useAddNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => ticketsApi.addNote(id, data),
    onSuccess: (_, { id }) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['tickets', id] })
      }, 500)
    },
  })
}

export function useAssignTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, agentId }) => ticketsApi.assignTicket(id, agentId),
    onSuccess: (_, { id }) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['tickets', id] })
        queryClient.invalidateQueries({ queryKey: ['tickets'] })
      }, 500)
    },
  })
}

export function useTransferTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, departmentId }) => ticketsApi.transferTicket(id, departmentId),
    onSuccess: (_, { id }) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['tickets', id] })
        queryClient.invalidateQueries({ queryKey: ['tickets'] })
      }, 500)
    },
  })
}

export function useChangeStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => ticketsApi.changeStatus(id, status),
    onSuccess: (_, { id }) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['tickets', id] })
        queryClient.invalidateQueries({ queryKey: ['tickets'] })
      }, 500)
    },
  })
}

export function useClaimTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ticketsApi.claimTicket,
    onSuccess: (_, id) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['tickets', id] })
        queryClient.invalidateQueries({ queryKey: ['tickets'] })
      }, 500)
    },
  })
}

export function useMergeTickets() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ targetId, sourceIds }) => ticketsApi.mergeTickets(targetId, sourceIds),
    onSuccess: () => {
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ['tickets'] }), 500)
    },
  })
}

export function useDeleteTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ticketsApi.deleteTicket,
    onSuccess: () => {
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ['tickets'] }), 500)
    },
  })
}

export function useEditTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, fields }) => ticketsApi.editTicket(id, fields),
    onSuccess: (_, { id }) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['tickets', id] })
        queryClient.invalidateQueries({ queryKey: ['tickets'] })
      }, 500)
    },
  })
}
