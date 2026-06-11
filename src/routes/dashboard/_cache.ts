import type { ReactNode } from 'react'
import { useSyncExternalStore } from 'react'

export type SelectItem = { id: string; label: string; sub?: string }

type ListApi = {
  queryFn: () => Promise<unknown>
}

type CacheMap = {
  properties: { data: any[] | undefined; loading: boolean; error: Error | null }
  tenants: { data: any[] | undefined; loading: boolean; error: Error | null }
  units: { data: any[] | undefined; loading: boolean; error: Error | null }
}

const cache: CacheMap = {
  properties: { data: undefined, loading: false, error: null },
  tenants: { data: undefined, loading: false, error: null },
  units: { data: undefined, loading: false, error: null },
}

type Key = keyof CacheMap

async function fetchList(
  source: 'properties' | 'tenants' | 'units',
  queryFn: ListApi['queryFn'],
) {
  if (cache[source].loading) return cache[source].data
  cache[source].loading = true
  cache[source].error = null
  try {
    const res = await queryFn()
    cache[source].data = Array.isArray(res)
      ? res
      : (res as any)?.items || []
  } catch (e) {
    cache[source].error = e as Error
  } finally {
    cache[source].loading = false
  }
  return cache[source].data
}

function subscribe(cb: () => void) {
  let timer: any
  return () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      cb()
    }, 100)
  }
}

const snapshot = () => true

export function useSelectCache<K extends Key>(
  key: K,
  queryFn: ListApi['queryFn'],
) {
  const items = cache[key].data ?? []
  const loading = cache[key].loading && !cache[key].data
  const error = cache[key].error

  useSyncExternalStore(subscribe, snapshot, snapshot)

  if (!cache[key].data && !cache[key].loading && !cache[key].error) {
    fetchList(key, queryFn).catch(() => {})
    return { data: undefined, loading: true, error: null }
  }

  const res = {
    data: cache[key].data,
    loading: cache[key].loading,
    error: cache[key].error,
  }

  const refresh = () => {
    cache[key].data = undefined
    fetchList(key, queryFn).catch(() => {})
  }

  return { ...res, refresh }
}

export const selectCache = {
  properties: (queryFn: ListApi['queryFn']) => useSelectCache('properties', queryFn),
  tenants: (queryFn: ListApi['queryFn']) => useSelectCache('tenants', queryFn),
  units: (queryFn: ListApi['queryFn']) => useSelectCache('units', queryFn),
  refreshAll: () => {
    cache.properties.data = undefined
    cache.tenants.data = undefined
    cache.units.data = undefined
  },
}
