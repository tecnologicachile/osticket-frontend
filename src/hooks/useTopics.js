import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listTopics, createTopic, updateTopic, deleteTopic } from '../api/topics.js'

export function useTopics() {
  return useQuery({
    queryKey: ['topics'],
    queryFn: listTopics,
    staleTime: 10 * 60 * 1000,
    select: (data) => data?.data || [],
  })
}

export function useCreateTopic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] })
    },
  })
}

export function useUpdateTopic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateTopic(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] })
    },
  })
}

export function useDeleteTopic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] })
    },
  })
}
