import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '~/lib/api'
import { selectCache } from '~/lib/cache'

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
    for (const [key, entry] of queryCache.entries()) {
      queryCache.set(key, { ...entry, timestamp: 0 })
    }
    return
  }
  for (const [key, entry] of queryCache.entries()) {
    if (key.includes(keySubstring)) {
      queryCache.set(key, { ...entry, timestamp: 0 })
    }
  }
}

/** Preload data into the queryCache dynamically in the background */
export function preloadQuery(cacheKey: string, queryFn: () => Promise<any>) {
  const existing = queryCache.get(cacheKey)
  if (existing && isFresh(existing)) return

  const inflight = queryFn()
  queryCache.set(cacheKey, { data: existing?.data ?? null, timestamp: existing?.timestamp ?? 0, inflight })

  inflight.then(
    (result) => {
      queryCache.set(cacheKey, { data: result, timestamp: Date.now() })
    },
    () => {
      queryCache.delete(cacheKey)
    }
  )
}

/** Preload all dashboard queries and select caches concurrently */
export async function preloadDashboardData() {
  // Pemicu otomatis pembuatan tagihan H-7 sebelum preloading query lain
  try {
    await api.bills.autoGenerateUpcoming()
  } catch (err) {
    console.error('Auto-generate upcoming bills failed:', err)
  }

  await Promise.all([
    // Populate selectCache (properties, tenants, units)
    selectCache.refreshAll(),
    
    // Preload queryCache endpoints
    (async () => {
      try {
        const data = await api.properties.list()
        queryCache.set('properties.list', { data, timestamp: Date.now() })
      } catch (err) {
        console.error('Preload properties failed:', err)
      }
    })(),
    (async () => {
      try {
        const data = await api.units.list()
        queryCache.set('units.list', { data, timestamp: Date.now() })
      } catch (err) {
        console.error('Preload units failed:', err)
      }
    })(),
    (async () => {
      try {
        const data = await api.tenants.list()
        queryCache.set('tenants.list', { data, timestamp: Date.now() })
      } catch (err) {
        console.error('Preload tenants failed:', err)
      }
    })(),
    (async () => {
      try {
        const data = await api.bills.list()
        queryCache.set('bills.list', { data, timestamp: Date.now() })
      } catch (err) {
        console.error('Preload bills failed:', err)
      }
    })(),
    (async () => {
      try {
        const data = await api.payments.list()
        queryCache.set('payments.list', { data, timestamp: Date.now() })
      } catch (err) {
        console.error('Preload payments failed:', err)
      }
    })(),
    (async () => {
      try {
        const data = await api.expenses.list()
        queryCache.set('expenses.list', { data, timestamp: Date.now() })
      } catch (err) {
        console.error('Preload expenses failed:', err)
      }
    })(),
    (async () => {
      try {
        const data = await api.announcements.list()
        queryCache.set('announcements.list', { data, timestamp: Date.now() })
      } catch (err) {
        console.error('Preload announcements failed:', err)
      }
    })(),
    (async () => {
      try {
        const data = await api.maintenance.list()
        queryCache.set('maintenance.list', { data, timestamp: Date.now() })
      } catch (err) {
        console.error('Preload maintenance failed:', err)
      }
    })(),
    (async () => {
      try {
        const data = await api.meterReadings.list()
        queryCache.set('meterReadings.list', { data, timestamp: Date.now() })
      } catch (err) {
        console.error('Preload meter readings failed:', err)
      }
    })(),
    (async () => {
      try {
        const data = await api.chat.listConversations()
        queryCache.set('chat.conversations', { data, timestamp: Date.now() })
      } catch (err) {
        console.error('Preload chat conversations failed:', err)
      }
    })(),
  ])
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

  // SWR: Serve cached data immediately (even if stale) to avoid showing loading states
  const [data, setData] = useState<T | null>(cached ? cached.data : null)
  // We only show loading state if we do not have ANY cached data yet
  const [loading, setLoading] = useState<boolean>(enabled && !cached)
  const [error, setError] = useState<string | null>(null)

  const queryFnRef = useRef(queryFn)
  queryFnRef.current = queryFn

  const fetchData = useCallback(async (force = false) => {
    const k = cacheKey ?? getCacheKey(queryFnRef.current)
    const existing = queryCache.get(k)

    // Serve fresh cache instantly (avoid duplicate network requests if still fresh)
    if (force !== true && existing && isFresh(existing)) {
      setData(existing.data)
      setLoading(false)
      return
    }

    // Deduplicate concurrent requests
    if (existing?.inflight) {
      if (!existing.data) setLoading(true)
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

    // Only set loading to true if there is NO cached data at all to avoid flickering
    if (!existing?.data) {
      setLoading(true)
    }
    setError(null)

    const inflight = queryFnRef.current()
    queryCache.set(k, { data: existing?.data ?? null, timestamp: existing?.timestamp ?? 0, inflight })

    try {
      const result = await inflight
      queryCache.set(k, { data: result, timestamp: Date.now() })
      setData(result)
    } catch (err) {
      // If we already have stale data, keep it but report error
      if (!existing?.data) {
        queryCache.delete(k)
      }
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

  return { data, loading, error, refetch: () => fetchData(true) }
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
