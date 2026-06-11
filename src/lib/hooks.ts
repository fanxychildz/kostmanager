import { useState, useEffect, useCallback, useRef } from 'react'

// ─── In-memory cache ────────────────────────────────────────────────────────
const CACHE_TTL = 60_000 // 60 seconds

interface CacheEntry<T> {
  data: T
  timestamp: number
  inflight?: Promise<T>
}

const queryCache = new Map<string, CacheEntry<any>>()

function getCacheKey(queryFn: () => Promise<any>): string {
  return queryFn.toString()
}

function isFresh(entry: CacheEntry<any>): boolean {
  return Date.now() - entry.timestamp < CACHE_TTL
}

/** Invalidate all cache entries (call after mutations) */
export function invalidateCache(keySubstring?: string) {
  if (!keySubstring) {
    queryCache.clear()
    return
  }
  for (const key of queryCache.keys()) {
    if (key.includes(keySubstring)) queryCache.delete(key)
  }
}

// ─── useQuery ────────────────────────────────────────────────────────────────

interface UseQueryOptions<T> {
  queryFn: () => Promise<T>
  enabled?: boolean
  deps?: any[]
  cacheKey?: string   // optional explicit key; defaults to queryFn.toString()
}

interface UseQueryResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useQuery<T>({
  queryFn,
  enabled = true,
  deps = [],
  cacheKey,
}: UseQueryOptions<T>): UseQueryResult<T> {
  const key = cacheKey ?? getCacheKey(queryFn)
  const cached = queryCache.get(key)

  const [data, setData] = useState<T | null>(cached && isFresh(cached) ? cached.data : null)
  const [loading, setLoading] = useState<boolean>(enabled && !(cached && isFresh(cached)))
  const [error, setError] = useState<string | null>(null)

  const queryFnRef = useRef(queryFn)
  queryFnRef.current = queryFn

  const fetchData = useCallback(async () => {
    const k = cacheKey ?? getCacheKey(queryFnRef.current)
    const existing = queryCache.get(k)

    // Serve fresh cache instantly
    if (existing && isFresh(existing)) {
      setData(existing.data)
      setLoading(false)
      return
    }

    // Deduplicate concurrent requests
    if (existing?.inflight) {
      setLoading(true)
      try {
        const result = await existing.inflight
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
      return
    }

    setLoading(true)
    setError(null)

    const inflight = queryFnRef.current()
    queryCache.set(k, { data: existing?.data ?? null, timestamp: existing?.timestamp ?? 0, inflight })

    try {
      const result = await inflight
      queryCache.set(k, { data: result, timestamp: Date.now() })
      setData(result)
    } catch (err) {
      queryCache.delete(k)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [cacheKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled) return
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, fetchData, ...deps])

  return { data, loading, error, refetch: fetchData }
}

// ─── useMutation ─────────────────────────────────────────────────────────────

interface UseMutationOptions<T, V> {
  mutationFn: (variables: V) => Promise<T>
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
  /** Cache keys to invalidate after a successful mutation. Pass 'all' to clear everything. */
  invalidates?: string[] | 'all'
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
  invalidates,
}: UseMutationOptions<T, V>): UseMutationResult<T, V> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutationFnRef = useRef(mutationFn)
  mutationFnRef.current = mutationFn

  const mutate = useCallback(async (variables: V) => {
    setLoading(true)
    setError(null)
    try {
      const result = await mutationFnRef.current(variables)
      // Invalidate cache entries after success
      if (invalidates === 'all') {
        invalidateCache()
      } else if (invalidates) {
        invalidates.forEach((k) => invalidateCache(k))
      }
      onSuccess?.(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { mutate, loading, error }
}

// ─── useDebounce ─────────────────────────────────────────────────────────────

export function useDebounce<T>(value: T, delay = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
