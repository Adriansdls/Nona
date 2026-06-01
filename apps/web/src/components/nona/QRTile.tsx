'use client'
import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { N } from './tokens'

interface QRTileProps {
  size?: number
  /** The URL the QR should encode. When set, a REAL scannable QR is rendered. */
  url?: string
}

/**
 * Renders a REAL, scannable QR for `url` (via the qrcode lib, browser build).
 * Falls back to a decorative placeholder pattern only when no url is given or
 * generation fails — a placeholder that never claims to be scannable.
 */
export function QRTile({ size = 120, url }: QRTileProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!url) { setDataUrl(null); return }
    let alive = true
    QRCode.toDataURL(url, { width: size * 2, margin: 1, color: { dark: N.ink, light: N.white } })
      .then((d) => { if (alive) setDataUrl(d) })
      .catch(() => { if (alive) setDataUrl(null) })
    return () => { alive = false }
  }, [url, size])

  if (url && dataUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={dataUrl} alt="QR code do caso" width={size} height={size} style={{ display: 'block', borderRadius: 6 }} />
  }

  // Decorative fallback (no url / pre-generation) — deterministic, not scannable.
  const cells = 21
  const cellSize = size / cells
  const grid: number[][] = []
  let seed = 11
  const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280
  for (let y = 0; y < cells; y++) {
    const row: number[] = []
    for (let x = 0; x < cells; x++) {
      const inFinder = (x < 7 && y < 7) || (x >= cells - 7 && y < 7) || (x < 7 && y >= cells - 7)
      row.push(inFinder ? 0 : rand() > 0.52 ? 1 : 0)
    }
    grid.push(row)
  }
  const Finder = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x * cellSize}, ${y * cellSize})`}>
      <rect width={cellSize * 7} height={cellSize * 7} fill={N.ink}/>
      <rect x={cellSize} y={cellSize} width={cellSize * 5} height={cellSize * 5} fill={N.white}/>
      <rect x={cellSize * 2} y={cellSize * 2} width={cellSize * 3} height={cellSize * 3} fill={N.ink}/>
    </g>
  )
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', borderRadius: 6, opacity: 0.5 }}>
      <rect width={size} height={size} fill={N.white}/>
      {grid.flatMap((row, y) =>
        row.map((c, x) =>
          c ? <rect key={`${x}-${y}`} x={x * cellSize} y={y * cellSize} width={cellSize} height={cellSize} fill={N.ink}/> : null
        )
      )}
      <Finder x={0} y={0}/>
      <Finder x={cells - 7} y={0}/>
      <Finder x={0} y={cells - 7}/>
    </svg>
  )
}
