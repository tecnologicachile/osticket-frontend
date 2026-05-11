import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as ticketsApi from '../api/tickets.js'

export function useBulkActions() {
  const [selectedIds, setSelectedIds] = useState([])
  const queryClient = useQueryClient()

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }, [])

  const selectAll = useCallback((ids) => {
    setSelectedIds(ids)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds([])
  }, [])

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, status }) => ticketsApi.bulkStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      toast.success('Estado actualizado correctamente')
      clearSelection()
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  })

  const bulkAssignMutation = useMutation({
    mutationFn: ({ ids, agentId }) => ticketsApi.bulkAssign(ids, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      toast.success('Tickets asignados correctamente')
      clearSelection()
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: ({ ids }) => ticketsApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      toast.success('Tickets eliminados correctamente')
      clearSelection()
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  })

  const bulkTransferMutation = useMutation({
    mutationFn: ({ ids, departmentId }) => ticketsApi.bulkTransfer(ids, departmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      toast.success('Tickets transferidos correctamente')
      clearSelection()
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  })

  const bulkMergeMutation = useMutation({
    mutationFn: ({ targetId, sourceIds }) => ticketsApi.bulkMerge(targetId, sourceIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      toast.success('Tickets fusionados correctamente')
      clearSelection()
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  })

  const bulkTopicMutation = useMutation({
    mutationFn: ({ ids, topicId }) => ticketsApi.bulkTopic(ids, topicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      toast.success('Tema asignado correctamente')
      clearSelection()
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  })

  return {
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    bulkStatus: (status, options) => bulkStatusMutation.mutate({ ids: selectedIds, status }, options),
    bulkAssign: (agentId, options) => bulkAssignMutation.mutate({ ids: selectedIds, agentId }, options),
    bulkDelete: (options) => bulkDeleteMutation.mutate({ ids: selectedIds }, options),
    bulkTransfer: (departmentId, options) => bulkTransferMutation.mutate({ ids: selectedIds, departmentId }, options),
    bulkMerge: (targetId, options) => bulkMergeMutation.mutate({ targetId, sourceIds: selectedIds }, options),
    bulkTopic: (topicId, options) => bulkTopicMutation.mutate({ ids: selectedIds, topicId }, options),
  }
}
