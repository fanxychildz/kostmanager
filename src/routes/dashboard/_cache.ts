import { useSyncExternalStore } from 'react'

export type SelectItem = { id: string; label: string; sub?: string }

type ListApi = {
  queryFn: () => Promise<unknown>
}

type CacheSlot = {
  data: any[] | undefined
  loading: boolean
  error: Error | null
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
  if (cache[source].loading) return cache[source].data

  cache[source].loading = true
  cache[source].error = null
  cache[source].data = undefined
  notify()

  try {
    const res = await queryFn()
    cache[source].data = Array.isArray(res)
      ? res
      : (res as any)?.items || []
  } catch (e) {
    cache[source].error = e as Error
    cache[source].data = []
  } finally {
    cache[source].loading = false
    notify()
  }

  return cache[source].data
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

  if (!state.data && !state.loading && !state.error) {
    fetchList(key, queryFn).catch(() => {})
    return {
      data: undefined,
      loading: true,
      error: null,
      refresh: async () => {
        const current = cache[key]
        if (current.loading) return
        current.data = undefined
        notify()
        await fetchList(key, queryFn).catch(() => {})
      },
    }
  }

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refresh: async () => {
      const current = cache[key]
      if (current.loading) return
      current.data = undefined
      notify()
      await fetchList(key, queryFn).catch(() => {})
    },
  }
}

export const selectCache = {
  properties: (queryFn: ListApi['queryFn']) => useSelectCache('properties', queryFn),
  tenants: (queryFn: ListApi['queryFn']) => useSelectCache('tenants', queryFn),
  units: (queryFn: ListApi['queryFn']) => useSelectCache('units', queryFn),
  refreshAll: async () => {
    cache.properties.data = undefined
    cache.tenants.data = undefined
    cache.units.data = undefined
    notify()
    await Promise.all(CACHE_KEYS.map((key) => fetchList(key, () => Promise.resolve([])).catch(() => {})))
  },
}
