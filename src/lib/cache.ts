import { useSyncExternalStore, useEffect } from 'react'
import { api } from '~/lib/api'

export type SelectItem = { id: string; label: string; sub?: string }

type ListApi = {
  queryFn: () => Promise<unknown>
}

type CacheSlot = {
  data: any[] | undefined
  loading: boolean
  error: Error | null
  inflight?: Promise<any>
}

type CacheMap = {
  properties: CacheSlot
  tenants: CacheSlot
  units: CacheSlot
}

let cache: CacheMap = {
  properties: { data: undefined, loading: false, error: null },
  tenants: { data: undefined, loading: false, error: null },
  units: { data: undefined, loading: false, error: null },
}

type Key = keyof CacheMap

let cacheVersion = 0
let listeners: (() => void)[] = []
const controllers: Partial<Record<Key, AbortController>> = {}

function subscribe(cb: () => void) {
  listeners.push(cb)
  return () => {
    listeners = listeners.filter((l) => l !== cb)
  }
}

function notify() {
  cacheVersion++
  listeners.forEach((l) => l())
}

const getSnapshot = () => cacheVersion

async function fetchList(
  source: Key,
  queryFn: ListApi['queryFn'],
): Promise<any[] | undefined> {
  // Deduplicate: if there's already an in-flight request, wait on it
  if (cache[source].inflight) {
    return cache[source].inflight
  }

  // Abort previous request for the same key if exists and clear stale inflight ref
  if (controllers[source]) {
    controllers[source].abort()
    controllers[source] = undefined
  }
  cache[source].inflight = undefined

  const controller = new AbortController()
  controllers[source] = controller

  cache[source].loading = true
  cache[source].error = null
  notify()

  const task = (async () => {
    try {
      const res = await (queryFn as any)({ signal: controller.signal })

      // Ignore resolution from an aborted request and never clobber valid cache with []
      if (controller.signal.aborted) {
        if (!cache[source].data && !cache[source].error) {
          cache[source].loading = false
          notify()
        }
        return cache[source].data
      }

      cache[source].data = Array.isArray(res)
        ? res
        : (res as any)?.items || []
      cache[source].loading = false
      cache[source].inflight = undefined
      notify()
      return cache[source].data
    } catch (e) {
      if (controller.signal.aborted) {
        // on abort, just release the lock; preserve existing cache/data if any
        cache[source].loading = false
        cache[source].inflight = undefined
        notify()
        return cache[source].data
      }
      cache[source].error = e as Error
      cache[source].data = []
      cache[source].loading = false
      cache[source].inflight = undefined
      notify()
      return cache[source].data
    }
  })()

  cache[source].inflight = task
  return task
}

const CACHE_KEYS: Key[] = ['properties', 'tenants', 'units']

interface SelectCacheResult {
  data: any[] | undefined
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

export function useSelectCache<K extends Key>(key: K, queryFn: ListApi['queryFn']): SelectCacheResult {
  const state = cache[key]

  useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  useEffect(() => {
    if (!state.data && !state.loading && !state.error) {
      fetchList(key, queryFn).catch(() => {})
    }
  }, [key, queryFn, state.data, state.loading, state.error])

  const isLoading = state.loading || (!state.data && !state.error)

  return {
    data: state.data,
    loading: isLoading,
    error: state.error,
    refresh: async () => {
      if (cache[key].loading) return
      cache[key].data = undefined
      cache[key].inflight = undefined
      notify()
      await fetchList(key, queryFn).catch(() => {})
    },
  }
}

export const selectCache = {
  properties: (queryFn: ListApi['queryFn']) => useSelectCache('properties', queryFn),
  tenants: (queryFn: ListApi['queryFn']) => useSelectCache('tenants', queryFn),
  units: (queryFn: ListApi['queryFn']) => useSelectCache('units', queryFn),
  /** Properly re-fetches all entries using the real API */
  refreshAll: async () => {
    CACHE_KEYS.forEach((k) => {
      if (cache[k].loading) return
      cache[k].data = undefined
      cache[k].inflight = undefined
    })
    notify()
    await Promise.all([
      fetchList('properties', () => api.properties.list()),
      fetchList('tenants', () => api.tenants.list()),
      fetchList('units', () => api.units.list()),
    ]).catch(() => {})
  },
}
