import type { FieldGuide } from '@/app/api/intake/stream/route'

export interface GuidedStep {
  id: string
  action: string
  type: 'do' | 'dont' | 'wait'
  detail?: string
}

export function buildStepSequence(guide: FieldGuide): GuidedStep[] {
  const steps: GuidedStep[] = []
  let stepIndex = 1

  // 1. Add all the "do" actions as individual steps
  guide.do.forEach((actionText) => {
    steps.push({
      id: `step-${guide.bucket}-do-${stepIndex++}`,
      action: actionText,
      type: 'do',
    })
  })

  // 2. Add the critical "dont" actions.
  // In a high-stress situation, we don't want a wall of "don'ts", but rather active reframing.
  // We will map the "donts" into steps to ensure they are acknowledged.
  guide.dont.forEach((dontText) => {
    steps.push({
      id: `step-${guide.bucket}-dont-${stepIndex++}`,
      action: dontText,
      type: 'dont',
    })
  })

  // 3. The "Wait" state for hard profiles
  if (guide.isHard && guide.hardNote) {
    steps.push({
      id: `step-${guide.bucket}-wait-final`,
      action: 'A câmara está a trabalhar por ti agora.',
      detail: guide.hardNote,
      type: 'wait',
    })
  }

  return steps
}
