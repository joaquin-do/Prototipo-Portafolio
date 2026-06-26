import { useEffect, useRef } from 'react'

// ponytail: setInterval polling; websockets if real-time becomes a requirement
export function usePolling(callback, intervalMs = 5000, enabled = true) {
  const saved = useRef(callback)

  useEffect(() => {
    saved.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return undefined

    saved.current()
    const id = setInterval(() => saved.current(), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs, enabled])
}
