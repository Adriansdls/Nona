'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  matchId: string
  sourceCaseId: string
}

export function MatchReviewButtons({ matchId, sourceCaseId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const review = async (action: 'confirm' | 'discard') => {
    setLoading(true)
    await fetch(`/api/admin/cases/${sourceCaseId}/visual-matches/${matchId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2 shrink-0">
      <button
        onClick={() => review('confirm')}
        disabled={loading}
        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        Confirmar
      </button>
      <button
        onClick={() => review('discard')}
        disabled={loading}
        className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
      >
        Descartar
      </button>
    </div>
  )
}
