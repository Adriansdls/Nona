'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  caseId: string
  currentStatus: string
  locale: string
}

export function AdminCaseActions({ caseId, currentStatus, locale }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  const update = async (body: Record<string, unknown>) => {
    setLoading(true)
    const res = await fetch(`/api/admin/cases/${caseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setLoading(false)
    if (res.ok) router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {currentStatus !== 'resolvido' && (
          <button
            onClick={() => update({ status: 'resolvido' })}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Marcar resolvido
          </button>
        )}
        {currentStatus !== 'ativo' && (
          <button
            onClick={() => update({ status: 'ativo' })}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            Reativar
          </button>
        )}
        {currentStatus !== 'arquivado' && (
          <button
            onClick={() => update({ status: 'arquivado' })}
            disabled={loading}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-accent disabled:opacity-50"
          >
            Arquivar
          </button>
        )}
        <button
          onClick={() => update({ sensitivity: 'restringido' })}
          disabled={loading}
          className="px-3 py-1.5 text-sm border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 disabled:opacity-50"
        >
          Restringir
        </button>
        <button
          onClick={() => setShowNotes((v) => !v)}
          className="px-3 py-1.5 text-sm border rounded-lg hover:bg-accent"
        >
          Notas admin
        </button>
      </div>

      {showNotes && (
        <div className="space-y-2">
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
            placeholder="Notas internas (nunca publicadas)..."
            className="w-full border rounded-md px-3 py-2 text-sm resize-none"
          />
          <button
            onClick={() => update({ admin_notes: adminNotes })}
            disabled={loading || !adminNotes}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
          >
            Guardar nota
          </button>
        </div>
      )}
    </div>
  )
}
