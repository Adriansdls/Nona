'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { caseCreateSchema, type CaseCreateInput } from '@/lib/validation/case.schema'
import { ALGARVE_MUNICIPALITIES } from '@salvacao/types'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'

const DOG_SIZES = ['pequeno', 'medio', 'grande', 'gigante'] as const
const DOG_SEXES = ['macho', 'femea', 'desconhecido'] as const
const CASE_TYPES = ['perdido', 'encontrado', 'avistado', 'bienestar'] as const

const STEP_FIELDS: Record<number, (keyof CaseCreateInput)[]> = {
  1: ['type'],
  2: ['breed', 'sex', 'size', 'primaryColor'],
  3: ['lastSeenMunicipality', 'lastSeenZoneApprox', 'lastSeenAt'],
  4: ['reporterName', 'reporterEmail', 'privacyAccepted', 'photoPermission'],
}

export default function ReportarPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params['locale'] as string
  const t = useTranslations('report')
  const tCase = useTranslations('case')
  const [step, setStep] = useState(1)
  const [photos, setPhotos] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const TOTAL_STEPS = 4

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<CaseCreateInput>({
    resolver: zodResolver(caseCreateSchema),
    defaultValues: {
      type: 'perdido',
      sex: 'desconhecido',
      size: 'medio',
      lastSeenAt: new Date().toISOString().slice(0, 16),
      privacyAccepted: false,
      photoPermission: false,
    },
  })

  const selectedType = watch('type')

  const nextStep = async () => {
    const fields = STEP_FIELDS[step]
    if (!fields) return
    const valid = await trigger(fields)
    if (valid) setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  const prevStep = () => setStep((s) => Math.max(s - 1, 1))

  const onSubmit = async (data: CaseCreateInput) => {
    setSubmitting(true)
    setError(null)
    try {
      const body = new FormData()
      // Append all text fields
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null) body.append(k, String(v))
      })
      photos.forEach((f) => body.append('photos', f))

      const res = await fetch('/api/cases', { method: 'POST', body })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Erro desconhecido')
        setSubmitting(false)
        return
      }
      router.push(`/${locale}/caso/${json.data.slug}`)
    } catch {
      setError('Erro de rede. Por favor tente novamente.')
      setSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const added = Array.from(e.target.files).slice(0, 5 - photos.length)
      setPhotos((prev) => [...prev, ...added].slice(0, 5))
    }
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      {/* Progress */}
      <div className="mb-8">
        <p className="text-sm text-muted-foreground mb-2">
          {t('stepOf', { current: step, total: TOTAL_STEPS })}
        </p>
        <div className="h-2 bg-muted rounded-full">
          <div
            className="h-2 bg-primary rounded-full transition-all"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1 — Type */}
        {step === 1 && (
          <div>
            <h1 className="text-xl font-bold mb-1">{t('step1Title')}</h1>
            <p className="text-muted-foreground text-sm mb-6">{t('step1Description')}</p>
            <div className="grid grid-cols-2 gap-3">
              {CASE_TYPES.map((type) => (
                <label
                  key={type}
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                    selectedType === type
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input type="radio" {...register('type')} value={type} className="sr-only" />
                  <span className="text-2xl mb-2">
                    {type === 'perdido' ? '🔍' : type === 'encontrado' ? '🐶' : type === 'avistado' ? '👁️' : '❤️‍🩹'}
                  </span>
                  <span className="font-medium text-sm">{tCase(`type.${type}` as 'type.perdido')}</span>
                </label>
              ))}
            </div>
            {errors.type && <p className="text-destructive text-xs mt-2">{errors.type.message}</p>}
          </div>
        )}

        {/* Step 2 — Dog details */}
        {step === 2 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold mb-1">{t('step2Title')}</h1>
            <p className="text-muted-foreground text-sm mb-4">{t('step2Description')}</p>

            <div>
              <label className="block text-sm font-medium mb-1">Nome (opcional)</label>
              <input
                {...register('dogName')}
                type="text"
                placeholder="Ex: Rex, Bolinha..."
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Raça *</label>
              <input
                {...register('breed')}
                type="text"
                placeholder="Ex: Labrador, Pastor Alemão, Indefinida..."
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              {errors.breed && <p className="text-destructive text-xs mt-1">{errors.breed.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Sexo *</label>
                <select {...register('sex')} className="w-full border rounded-md px-3 py-2 bg-background text-sm">
                  {DOG_SEXES.map((s) => (
                    <option key={s} value={s}>{tCase(`sex.${s}` as 'sex.macho')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tamanho *</label>
                <select {...register('size')} className="w-full border rounded-md px-3 py-2 bg-background text-sm">
                  {DOG_SIZES.map((s) => (
                    <option key={s} value={s}>{tCase(`size.${s}` as 'size.medio')}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cor principal *</label>
                <input
                  {...register('primaryColor')}
                  type="text"
                  placeholder="Ex: Castanho"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
                {errors.primaryColor && (
                  <p className="text-destructive text-xs mt-1">{errors.primaryColor.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cor secundária</label>
                <input
                  {...register('secondaryColor')}
                  type="text"
                  placeholder="Ex: Preto"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Marcas distintivas</label>
              <textarea
                {...register('distinctiveMarks')}
                rows={2}
                placeholder="Ex: mancha branca no peito, orelha rasgada (separadas por vírgula)"
                className="w-full border rounded-md px-3 py-2 text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Estimativa de idade</label>
              <input
                {...register('ageEstimate')}
                type="text"
                placeholder="Ex: 2 anos, jovem adulto..."
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" {...register('neutered')} />
                Castrado/a
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" {...register('hasChip')} />
                Tem chip
              </label>
            </div>

            {watch('hasChip') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Últimos 3 dígitos do chip</label>
                  <input
                    {...register('chipLast3')}
                    type="text"
                    maxLength={3}
                    placeholder="Ex: 123"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Número completo (privado)</label>
                  <input
                    {...register('chipNumber')}
                    type="text"
                    placeholder="15 dígitos"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Descrição *</label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Descreva o cão com o máximo detalhe possível..."
                className="w-full border rounded-md px-3 py-2 text-sm resize-none"
              />
              {errors.description && (
                <p className="text-destructive text-xs mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Photos */}
            <div>
              <label className="block text-sm font-medium mb-1">Fotos (máximo 5)</label>
              <div
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {photos.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Clique para adicionar fotos</p>
                ) : (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {photos.map((f, i) => (
                      <div key={i} className="relative">
                        <img
                          src={URL.createObjectURL(f)}
                          alt=""
                          className="w-20 h-20 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPhotos((prev) => prev.filter((_, j) => j !== i))
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full text-xs flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {photos.length < 5 && (
                      <div className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground text-2xl">
                        +
                      </div>
                    )}
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        )}

        {/* Step 3 — Location + time */}
        {step === 3 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold mb-1">{t('step3Title')}</h1>
            <p className="text-muted-foreground text-sm mb-4">{t('step3Description')}</p>

            <div>
              <label className="block text-sm font-medium mb-1">Município *</label>
              <select
                {...register('lastSeenMunicipality')}
                className="w-full border rounded-md px-3 py-2 bg-background text-sm"
              >
                <option value="">Selecionar...</option>
                {ALGARVE_MUNICIPALITIES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              {errors.lastSeenMunicipality && (
                <p className="text-destructive text-xs mt-1">{errors.lastSeenMunicipality.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Zona aproximada *</label>
              <textarea
                {...register('lastSeenZoneApprox')}
                rows={2}
                placeholder="Ex: Junto ao Lidl de Faro, Praia de Meia Praia, EN125 km 23..."
                className="w-full border rounded-md px-3 py-2 text-sm resize-none"
              />
              {errors.lastSeenZoneApprox && (
                <p className="text-destructive text-xs mt-1">{errors.lastSeenZoneApprox.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Quando foi visto pela última vez? *</label>
              <input
                type="datetime-local"
                {...register('lastSeenAt')}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              {errors.lastSeenAt && (
                <p className="text-destructive text-xs mt-1">{errors.lastSeenAt.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contexto (opcional)</label>
              <textarea
                {...register('context')}
                rows={3}
                placeholder="Como aconteceu? O cão fugiu, foi roubado, encontrou-o na rua..."
                className="w-full border rounded-md px-3 py-2 text-sm resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 4 — Contact */}
        {step === 4 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold mb-1">{t('step4Title')}</h1>
            <p className="text-muted-foreground text-sm mb-4">{t('step4Description')}</p>

            <div>
              <label className="block text-sm font-medium mb-1">O seu nome *</label>
              <input
                {...register('reporterName')}
                type="text"
                placeholder="Nome completo"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              {errors.reporterName && (
                <p className="text-destructive text-xs mt-1">{errors.reporterName.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Nunca publicado. Só para uso interno.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                {...register('reporterEmail')}
                type="email"
                placeholder="email@exemplo.com"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              {errors.reporterEmail && (
                <p className="text-destructive text-xs mt-1">{errors.reporterEmail.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Para receber notificações do caso.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Telemóvel (opcional)</label>
              <input
                {...register('reporterPhone')}
                type="tel"
                placeholder="+351 912 345 678"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">Nunca publicado.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Contacto público (opcional)
              </label>
              <input
                {...register('reporterContactPublic')}
                type="text"
                placeholder="Ex: WhatsApp 912345678 (aparecerá na página pública)"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este campo é o único que pode ser publicado — só preencha se quiser.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3 mt-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" {...register('privacyAccepted')} className="mt-0.5" />
                <span className="text-sm">
                  Aceito a{' '}
                  <a href={`/${locale}/privacidade`} target="_blank" className="underline">
                    política de privacidade
                  </a>
                  . Os meus dados pessoais são usados apenas para gerir este caso e nunca partilhados
                  sem o meu consentimento. *
                </span>
              </label>
              {errors.privacyAccepted && (
                <p className="text-destructive text-xs">{errors.privacyAccepted.message}</p>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" {...register('photoPermission')} className="mt-0.5" />
                <span className="text-sm">
                  Confirmo que tenho direito a partilhar as fotos enviadas e autorizo a sua
                  utilização na divulgação deste caso. *
                </span>
              </label>
              {errors.photoPermission && (
                <p className="text-destructive text-xs">{errors.photoPermission.message}</p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="flex-1 py-3 border border-input bg-background font-medium rounded-lg hover:bg-accent transition-colors"
            >
              {t('back')}
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex-1 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              {t('next')}
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? t('submitting') : t('submit')}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
