import { useQuery } from '@tanstack/react-query'
import { listDepartments } from '../api/departments.js'

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: listDepartments,
    staleTime: 5 * 60 * 1000,
    select: (data) => data?.data || [],
  })
}
