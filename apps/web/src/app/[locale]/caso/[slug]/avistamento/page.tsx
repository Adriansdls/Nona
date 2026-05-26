'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { sightingCreateSchema, type SightingCreateInput } from '@/lib/validation/sighting.schema'
import { ALGARVE_MUNICIPALITIES } from '@salvacao/types'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'

export default function AvistamentoPage() {
  const params = useParams()
  const caseId = params['slug'] as string
  const locale = params['locale'] as string
  const t = useTranslations('sighting')
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SightingCreateInput>({
    resolver: zodResolver(sightingCreateSchema),
    defaultValues: { seenAt: new Date().toISOString() },
  })

  const onSubmit = async (data: SightingCreateInput) => {
    // We need the actual case ID, not the slug — fetch it first
    const caseRes = await fetch(`/api/cases/${caseId}`)
    const caseData = await caseRes.json()
    if (!caseData.data?.id) return

    const res = await fetch(`/api/sightings/${caseData.data.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-4xl mb-4">🐾</div>
        <h1 className="text-xl font-bold mb-2">{t('thanks')}</h1>
        <p className="text-muted-foreground">{t('thanksDetail')}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      <h1 className="text-xl font-bold mb-2">{t('title')}</h1>
      <p className="text-muted-foreground mb-6">{t('description')}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Município *</label>
          <select
            {...register('municipality')}
            className="w-full border rounded-md px-3 py-2 bg-background text-sm"
          >
            <option value="">Selecionar...</option>
            {ALGARVE_MUNICIPALITIES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          {errors.municipality && (
            <p className="text-destructive text-xs mt-1">{errors.municipality.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Zona aproximada *</label>
          <textarea
            {...register('zoneApprox')}
            rows={2}
            placeholder="Ex: Junto ao Lidl de Faro, Praia de Meia Praia..."
            className="w-full border rounded-md px-3 py-2 text-sm resize-none"
          />
          {errors.zoneApprox && (
            <p className="text-destructive text-xs mt-1">{errors.zoneApprox.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Quando foi visto? *</label>
          <input
            type="datetime-local"
            {...register('seenAt')}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descrição (opcional)</label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="O cão estava sozinho, parecia com fome..."
            className="w-full border rounded-md px-3 py-2 text-sm resize-none"
          />
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register('wasMoving')} />
            Estava em movimento
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register('seemedInjured')} />
            Parecia ferido
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Contacto (opcional, privado)
          </label>
          <input
            {...register('reporterContact')}
            type="text"
            placeholder="Telemóvel ou email para o caso de precisarem contactar"
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Nunca será publicado. Só usado se necessário.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'A enviar...' : t('submit')}
        </button>
      </form>
    </div>
  )
}
