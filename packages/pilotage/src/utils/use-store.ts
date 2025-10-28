type Setter<T> = T | ((data: T) => void)

export function useStore<T>(data: T): {
  data: T
  subscribe: (listener: () => void) => () => void
  get: () => T
  set: (prop: Setter<T>) => void
} {
  let _data = structuredClone(data)
  let listeners: (() => void)[] = []

  function emitChange(): void {
    for (const listener of listeners) {
      listener()
    }
  }
  return {
    data,
    subscribe: (listener: () => void) => {
      listeners = [...listeners, listener]
      return () => {
        listeners = listeners.filter(l => l !== listener)
      }
    },
    get: () => _data,
    set: (prop: Setter<T>) => {
      if (typeof prop === 'function') {
        (prop as (data: T) => void)(_data)
      }
      else {
        _data = Object.assign({}, prop)
      }
      emitChange()
    },
  }
}
