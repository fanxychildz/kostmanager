import { useState, useEffect, useCallback, useRef } from 'react'

interface UseQueryOptions<T> {
  queryFn: () => Promise<T>
  enabled?: boolean
}

interface UseQueryResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useQuery<T>({ queryFn, enabled = true }: UseQueryOptions<T>): UseQueryResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  // Keep the latest queryFn in a ref so an inline arrow (new identity each
  // render) doesn't retrigger the effect — that caused an infinite refetch loop.
  const queryFnRef = useRef(queryFn)
  queryFnRef.current = queryFn

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await queryFnRef.current()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    fetchData()
  }, [enabled, fetchData])

  return { data, loading, error, refetch: fetchData }
}

interface UseMutationOptions<T, V> {
  mutationFn: (variables: V) => Promise<T>
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
}

interface UseMutationResult<T, V> {
  mutate: (variables: V) => Promise<void>
  loading: boolean
  error: string | null
}

export function useMutation<T, V = void>({
  mutationFn,
  onSuccess,
  onError,
}: UseMutationOptions<T, V>): UseMutationResult<T, V> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = async (variables: V) => {
    setLoading(true)
    setError(null)
    try {
      const result = await mutationFn(variables)
      onSuccess?.(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return { mutate, loading, error }
}
