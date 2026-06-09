'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { N } from '@/components/nona/tokens'
import { Icon } from '@/components/nona/Icon'
import type { GuidedStep } from '@/lib/guided/sequencer'

interface GuidedStepCardProps {
  steps: GuidedStep[]
  locale: string
}

export function GuidedStepCard({ steps, locale }: GuidedStepCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  if (!steps || steps.length === 0) return null

  const isComplete = currentIndex >= steps.length
  const currentStep = steps[currentIndex]

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, steps.length))
  }

  // --- Complete State ---
  if (isComplete || !currentStep) {
    return (
      <div className="mt-3 p-5 bg-emerald-50 border-2 border-emerald-200/50 rounded-2xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Icon name="check" />
          </div>
          <h3 className="font-bold text-emerald-800" style={{ fontFamily: N.display }}>
            {locale === 'en' ? 'Phase complete' : 'Fase concluída'}
          </h3>
        </div>
        <p className="text-sm text-emerald-700 leading-relaxed">
          {locale === 'en' 
            ? 'You have completed the critical actions for this phase. The system is monitoring.'
            : 'Concluíste as ações críticas para esta fase. Nona está a vigiar as redes e alertas.'}
        </p>
      </div>
    )
  }

  // --- The Wait State ---
  if (currentStep.type === 'wait') {
    return (
      <div className="mt-3 p-5 bg-indigo-50 border-2 border-indigo-200/50 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -mr-10 -mt-10 opacity-60 pointer-events-none" />
        
        <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          {locale === 'en' ? 'Active Monitoring' : 'Vigilância Ativa'}
        </p>

        <h3 className="text-lg font-bold text-indigo-950 leading-snug mb-2" style={{ fontFamily: N.display }}>
          {currentStep.action}
        </h3>
        
        {currentStep.detail && (
          <p className="text-sm text-indigo-800/80 leading-relaxed mb-6">
            {currentStep.detail}
          </p>
        )}

        <div className="bg-white/60 rounded-xl p-4 border border-indigo-100 backdrop-blur-sm">
          <p className="text-xs font-semibold text-indigo-900 mb-1">
            {locale === 'en' ? 'Your task now:' : 'A tua tarefa agora:'}
          </p>
          <p className="text-sm text-indigo-800">
            {locale === 'en' 
              ? 'Rest and wait. Do not search the area.' 
              : 'Descansa para a busca ao amanhecer. Não procures na área, o cão precisa de silêncio para se aproximar da estação.'}
          </p>
        </div>
      </div>
    )
  }

  // --- Active Step State ---
  const isDont = currentStep.type === 'dont'
  const theme = isDont 
    ? { bg: 'bg-rose-50', border: 'border-rose-200/60', text: 'text-rose-950', accent: 'text-rose-600', btnPrimary: 'bg-rose-600 hover:bg-rose-700', icon: 'close' }
    : { bg: 'bg-teal-50', border: 'border-teal-200/60', text: 'text-teal-950', accent: 'text-teal-600', btnPrimary: 'bg-teal-600 hover:bg-teal-700', icon: 'arrow' }

  return (
    <div className={`mt-3 p-5 ${theme.bg} border-2 ${theme.border} rounded-2xl transition-colors duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <p className={`text-[11px] font-bold ${theme.accent} uppercase tracking-wider`}>
          {locale === 'en' ? 'Action' : 'Ação'} {currentIndex + 1} / {steps.length}
        </p>
        {isDont && (
          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-md uppercase tracking-wide">
            {locale === 'en' ? 'Crucial' : 'Crítico'}
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <h3 className={`text-xl font-bold ${theme.text} leading-snug mb-6`} style={{ fontFamily: N.display }}>
            {currentStep.action}
          </h3>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleNext}
              className={`w-full py-3.5 px-4 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm ${theme.btnPrimary}`}
            >
              {locale === 'en' ? 'Done' : 'Feito'}
              <div className="w-4 h-4"><Icon name={theme.icon as any} /></div>
            </button>
            <button
              onClick={handleNext}
              className="w-full py-3 px-4 rounded-xl text-muted-foreground hover:bg-black/5 font-medium text-sm transition-colors"
            >
              {locale === 'en' ? 'Skip for now' : 'Agora não'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
