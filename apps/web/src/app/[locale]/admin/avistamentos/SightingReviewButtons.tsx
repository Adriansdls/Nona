'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SightingReviewButtons({ sightingId }: { sightingId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const review = async (action: 'approve' | 'reject') => {
    setLoading(true)
    await fetch(`/api/admin/sightings/${sightingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex gap-2 shrink-0">
      <button
        onClick={() => review('approve')}
        disabled={loading}
        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        Aprovar
      </button>
      <button
        onClick={() => review('reject')}
        disabled={loading}
        className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
      >
        Rejeitar
      </button>
    </div>
  )
}
