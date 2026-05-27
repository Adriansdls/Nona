'use client'
import React, { useMemo } from 'react'
import { N } from './tokens'

interface QRTileProps {
  size?: number
}

export function QRTile({ size = 120 }: QRTileProps) {
  const cells = 21
  const cellSize = size / cells

  const pattern = useMemo(() => {
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
    return grid
  }, [])

  const Finder = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x * cellSize}, ${y * cellSize})`}>
      <rect width={cellSize * 7} height={cellSize * 7} fill={N.ink}/>
      <rect x={cellSize} y={cellSize} width={cellSize * 5} height={cellSize * 5} fill={N.white}/>
      <rect x={cellSize * 2} y={cellSize * 2} width={cellSize * 3} height={cellSize * 3} fill={N.ink}/>
    </g>
  )

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', borderRadius: 6 }}>
      <rect width={size} height={size} fill={N.white}/>
      {pattern.flatMap((row, y) =>
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
