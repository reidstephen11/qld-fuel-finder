import { useEffect, useRef, useState, useCallback } from 'react'

// Draggable bottom sheet with snap points: peek | half | full.
// On desktop (≥1024px) the sheet becomes a fixed sidebar (see App.css).
export default function BottomSheet({ state, onChange, children }) {
  const sheetRef = useRef(null)
  const startY = useRef(null)
  const startHeight = useRef(null)
  const dragged = useRef(false)
  const [dragH, setDragH] = useState(null)
  const [, bumpRender] = useState(0)

  const isDesktop = useIsDesktop()

  // Re-render on viewport changes so heightFor() picks up the new innerHeight
  // (orientation flip, Android URL-bar show/hide, etc.).
  useEffect(() => {
    const handler = () => bumpRender((n) => n + 1)
    window.addEventListener('resize', handler)
    window.addEventListener('orientationchange', handler)
    return () => {
      window.removeEventListener('resize', handler)
      window.removeEventListener('orientationchange', handler)
    }
  }, [])

  const snap = {
    peek: 168,
    half: 0.46,   // fraction of viewport
    full: 0.92,
  }

  const heightFor = useCallback((s) => {
    const vh = window.innerHeight
    const v = snap[s]
    return typeof v === 'number' && v > 1 ? v : Math.round(vh * v)
  }, [])

  function onPointerDown(e) {
    if (isDesktop) return
    e.currentTarget.setPointerCapture(e.pointerId)
    startY.current = e.clientY
    startHeight.current = sheetRef.current.getBoundingClientRect().height
    dragged.current = false
  }

  function onPointerMove(e) {
    if (startY.current == null) return
    const dy = startY.current - e.clientY
    if (Math.abs(dy) > 4) dragged.current = true
    const next = Math.max(120, Math.min(window.innerHeight - 40, startHeight.current + dy))
    setDragH(next)
  }

  function onPointerUp(e) {
    if (startY.current == null) return
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch { /* already released */ }
    const final = dragH ?? sheetRef.current.getBoundingClientRect().height
    const heights = ['peek', 'half', 'full'].map((s) => [s, heightFor(s)])
    let nearest = heights[0]
    for (const [s, h] of heights) {
      if (Math.abs(h - final) < Math.abs(nearest[1] - final)) nearest = [s, h]
    }
    setDragH(null)
    startY.current = null
    if (nearest[0] !== state) onChange(nearest[0])
  }

  function handleClick() {
    if (isDesktop) return
    // A drag just finished — suppress the synthesized click that would
    // otherwise advance the snap state a second time.
    if (dragged.current) {
      dragged.current = false
      return
    }
    const next = state === 'peek' ? 'half' : state === 'half' ? 'full' : 'peek'
    onChange(next)
  }

  const style = isDesktop
    ? {}
    : { height: dragH ?? heightFor(state) }

  return (
    <div ref={sheetRef} className={`bottom-sheet ${dragH != null ? 'dragging' : ''}`} style={style}>
      <button
        type="button"
        className="sheet-handle"
        onClick={handleClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label="Resize sheet"
      >
        <div className="sheet-handle-bar" />
      </button>
      <div className="sheet-body">{children}</div>
    </div>
  )
}

function useIsDesktop() {
  const [d, setD] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const handler = () => setD(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return d
}
