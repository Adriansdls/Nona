// WS1 — Guided step sequencer (WEB mirror).
//
// IMPORTANT: the BOT Python sequencer (apps/bot/agent/pi_tools.py build_step_sequence)
// is the SINGLE SOURCE OF TRUTH for step order in the live Telegram flow. This web
// version is used ONLY for the cosmetic HandoffCard preview + the web dashboard
// fallback. A parity test (apps/bot/tests/test_sequencer_parity.py) asserts the two
// produce identical step titles for the same (bucket, isHard) — if you edit one, edit
// both and keep STEP_TITLES below in sync with the bot.
//
// Reshapes the existing field-guide content (do[]) into an ordered list of single
// actions. Hard/passive cases (galgo/podenco/panic/xenophobic) get a short prep
// sequence then a DESIGNED WAIT step — the wait is the active intervention, not a void.

export type GuideBucket = 'h0_6' | 'h6_24' | 'd2_4' | 'd5_10' | 'd10_plus'

export type StepKind = 'action' | 'wait'

export interface GuidedStep {
  idx: number
  kind: StepKind
  title: string
  why?: string
}

// Step titles per bucket — MUST stay identical to the bot's STEP_TITLES.
// (These are the do[] items, lightly imperative-cased for one-at-a-time delivery.)
const STEP_TITLES: Record<GuideBucket, string[]> = {
  h0_6: [
    'Deixa uma peça de roupa com o teu cheiro (sem perfume) no ponto exacto onde desapareceu',
    'Coloca uma tigela de comida e água nesse mesmo ponto',
    'Põe um cartaz A4 com foto nas 10 lojas ou paragens mais próximas',
    'Avisa o canil municipal e 3 clínicas veterinárias próximas',
    'Publica no grupo de Facebook local com o cruzamento mais próximo (sem GPS)',
  ],
  h6_24: [
    'Vai em pessoa ao canil municipal — leva foto, não telefones (2.1× mais recuperação, Lord 2007)',
    'Verifica o chip no SIAC (siac.vet.pt) e confirma que os dados estão actualizados',
    'Expande os cartazes a um raio de 5km e às clínicas veterinárias da área',
    'Regista o desaparecimento na GNR/PSP local',
    'Verifica a estação às 6h e às 22h apenas — comida consumida = cão na zona',
  ],
  d2_4: [
    'Instala no mínimo 2 câmaras de movimento na estação (+22-400% detecção)',
    'Coloca isca no chão: salsichas, frango, liquid smoke — nunca urina',
    'Verifica as câmaras remotamente — não visites o local entre reabastecimentos',
    'Visita o canil em pessoa cada 48h com fotos novas',
  ],
  d5_10: [
    'Se a câmara confirmar actividade, monta uma armadilha (jaula coberta com pano)',
    'Usa isca de roupa do dono + comida favorita; verifica a cada 2h, nunca preso mais de 2h',
    'Verifica os canis dos concelhos vizinhos e publica em grupos regionais do Algarve',
  ],
  d10_plus: [
    'Visita em pessoa todos os canis num raio de 60km',
    'Verifica adopções recentes (últimos 30 dias) — pode estar com outra família',
    'Contacta a AMAL, APPA e associações locais de resgate',
    'Repõe os cartazes antigos — desbotam',
    'Mantém a estação activa no mínimo 14 dias sem avistamento',
  ],
}

// Designed WAIT step appended for hard/passive cases — the reframe + next-check anchor.
const WAIT_STEPS: Record<GuideBucket, { title: string; why: string }> = {
  h0_6: {
    title: 'Agora, afasta-te e fica em silêncio. A estação e o cheiro trabalham por ti.',
    why: 'Um cão assustado aproxima-se quando não há ameaça. A tua tarefa é não pressionar.',
  },
  h6_24: {
    title: 'Não visites a estação fora das 6h e 22h. Descansa entre verificações.',
    why: 'Cada visita extra espanta o cão. A consistência é o que funciona.',
  },
  d2_4: {
    title: 'Deixa a câmara trabalhar. A tua tarefa: descansa para a busca ao amanhecer.',
    why: 'Pico de actividade 22h-06h. Vais precisar de energia — a câmara vigia por ti.',
  },
  d5_10: {
    title: 'Não te aproximes da armadilha. Verifica à distância e espera.',
    why: 'Presença humana na zona atrasa a captura. O equipamento faz o trabalho.',
  },
  d10_plus: {
    title: 'Mantém o ritmo sem desgastar-te. Isto é uma maratona, não um sprint.',
    why: 'Cães são encontrados semanas depois. A estação consistente é a tua âncora.',
  },
}

export function bucketFromHours(hours: number): GuideBucket {
  if (hours < 6) return 'h0_6'
  if (hours < 24) return 'h6_24'
  if (hours < 96) return 'd2_4'
  if (hours < 240) return 'd5_10'
  return 'd10_plus'
}

/**
 * Build the ordered single-step sequence for a case.
 * Hard cases: the action steps + a designed WAIT step at the end.
 * Soft cases: the action steps only (active search is safe).
 */
export function buildStepSequence(bucket: GuideBucket, isHard: boolean): GuidedStep[] {
  const titles = STEP_TITLES[bucket]
  const steps: GuidedStep[] = titles.map((title, i) => ({ idx: i, kind: 'action' as const, title }))
  if (isHard) {
    const w = WAIT_STEPS[bucket]
    steps.push({ idx: steps.length, kind: 'wait', title: w.title, why: w.why })
  }
  return steps
}

/** Step titles only — used by the parity test against the bot. */
export function stepTitles(bucket: GuideBucket, isHard: boolean): string[] {
  return buildStepSequence(bucket, isHard).map(s => s.title)
}
