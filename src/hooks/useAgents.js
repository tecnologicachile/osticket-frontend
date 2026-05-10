import { useQuery } from '@tanstack/react-query'
import { listAgents } from '../api/agents.js'

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: listAgents,
    staleTime: 5 * 60 * 1000,
    select: (data) => data?.data || [],
  })
}
