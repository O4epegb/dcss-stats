import { useRef, useState, useEffect } from 'react'

export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    function handleResize() {
      if (ref.current) {
        setWidth(ref.current.offsetWidth)
      }
    }

    handleResize()

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [ref])

  return [ref, width] as const
}
