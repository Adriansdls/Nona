'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ROLES = ['publico', 'voluntario', 'clinica', 'asociacion', 'admin'] as const

interface Props {
  userId: string
  currentRole: string
  verified: boolean
}

export function UserRoleForm({ userId, currentRole, verified }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const update = async (body: Record<string, unknown>) => {
    setLoading(true)
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={currentRole}
        disabled={loading}
        onChange={(e) => update({ role: e.target.value })}
        className="border rounded px-2 py-1 text-xs bg-background"
      >
        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <button
        onClick={() => update({ verified: !verified })}
        disabled={loading}
        className={`text-xs px-2 py-1 rounded border ${verified ? 'border-amber-300 text-amber-700 hover:bg-amber-50' : 'border-green-300 text-green-700 hover:bg-green-50'}`}
      >
        {verified ? 'Suspender' : 'Verificar'}
      </button>
    </div>
  )
}
