import { useState, useCallback, useRef } from 'react'

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : initialValue
    } catch {
      return initialValue
    }
  })

  const keyRef = useRef(key)
  keyRef.current = key

  const set = useCallback((updater) => {
    setValue(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      try {
        localStorage.setItem(keyRef.current, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  return [value, set]
}
