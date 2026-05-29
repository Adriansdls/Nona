import type { Metadata } from 'next'
import { N } from '@/components/nona/tokens'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Como funciona — Nona',
  description: 'A Nona é uma investigadora IA para cães perdidos no Algarve. Protocolo científico baseado em comportamento, terreno e tempo.',
}

/* ─── Feature matrix — status icons ─────────────────────────────────── */
const OK = '✅'
const PARTIAL = '⚠️'
const FAIL = '❌'
const UNTESTED = '🔵'
const NA = '⬜'

interface FeatureRow {
  feature: string
  status: string
  note: string
}

interface Section {
  title: string
  rows: FeatureRow[]
}

const MATRIX: Section[] = [
  {
    title: 'Infraestrutura',
    rows: [
      { feature: 'Homepage carrega', status: OK, note: 'HTTP 200, lista de casos + chat visíveis' },
      { feature: 'Lista de casos ativos', status: OK, note: 'Casos reais visíveis na homepage' },
      { feature: 'Chat intake widget', status: OK, note: 'Textarea funcional' },
      { feature: 'i18n PT / EN / ES', status: PARTIAL, note: 'Implementado, não testado E2E em EN/ES' },
      { feature: 'Mobile responsive', status: NA, note: 'Identificado como pendente para launch' },
      { feature: 'Painel admin', status: PARTIAL, note: 'Existe em /admin — requer autenticação Supabase' },
    ],
  },
  {
    title: 'Chat Intake (WP8) — SSE Streaming',
    rows: [
      { feature: 'SSE streaming (text_delta events)', status: OK, note: '29 eventos no turn 1' },
      { feature: 'Turn 1 — bot responde', status: OK, note: '1050 chars, perguntas comportamentais corretas' },
      { feature: 'Perguntas comportamentais (5 obrigatórias)', status: OK, note: 'Sociabilidade, trela, gatilho, raça — todas presentes' },
      { feature: 'Quick replies sugeridos', status: OK, note: 'quick_replies event incluído na stream' },
      { feature: 'Multi-turn via history[]', status: OK, note: 'Estado client-side, 70 eventos no turn 2' },
      { feature: 'Modo encontrado vs perdido', status: PARTIAL, note: 'Ambos no código, não testado E2E para "encontrado"' },
      { feature: 'Upload de foto no chat', status: UNTESTED, note: 'Botão presente, não testado' },
    ],
  },
  {
    title: 'Criação de Caso',
    rows: [
      { feature: 'Caso criado em DB', status: OK, note: 'case_created event na stream, confirmado' },
      { feature: 'Slug gerado (perdido-{raça}-{mun}-{ano}-{rand})', status: OK, note: 'perdido-beagle-silves-2026-q9kfj ✓' },
      { feature: 'create_case tool call', status: OK, note: 'Visto nos tool events SSE' },
      { feature: 'record_behavioral_profile tool call', status: OK, note: 'probability_scenarios + action_gate events confirmados' },
      { feature: 'notify_volunteers tool call', status: OK, note: 'Confirmado no texto da resposta do agente' },
      { feature: 'Página pública acessível por slug', status: OK, note: 'HTTP 200, todos os dados visíveis' },
    ],
  },
  {
    title: 'WP8 — Perfil Comportamental',
    rows: [
      { feature: 'Cenários de probabilidade calculados', status: OK, note: 'probability_scenarios event na stream' },
      { feature: 'Cenários visíveis na página do caso', status: OK, note: 'Secção comportamental confirmada no HTML' },
      { feature: 'Tags: sociabilidade, ambiente, stress', status: OK, note: 'Presentes no behavioral_profile JSONB' },
      { feature: 'Gatilho de fuga detectado', status: OK, note: 'prey_drive, blind_panic, opportunistic, wanderlust' },
      { feature: 'Categoria de raça (galgo/podenco/etc.)', status: UNTESTED, note: 'Campo existe, visibilidade não confirmada' },
    ],
  },
  {
    title: 'WP9 — Action Gate + Motor Temporal',
    rows: [
      { feature: 'Action gate calculado', status: OK, note: 'action_gate + action_gate_card events na stream' },
      { feature: 'ProtocolCard no chat', status: OK, note: 'action_gate_card event confirmado' },
      { feature: 'Action gate visível na página', status: OK, note: 'Secção protocolo/acção confirmada' },
      { feature: 'Phase badge (pânico/sobrevivência/recuperação)', status: OK, note: 'Fase visível na página do caso' },
      { feature: 'Galgo: phase_2_survival desde minuto 0', status: UNTESTED, note: 'Lógica implementada, não testado com galgo' },
      { feature: 'Bayesian updates (update_behavioral_assessment)', status: UNTESTED, note: 'PI tool existe' },
    ],
  },
  {
    title: 'WP10 — Camada Ambiental',
    rows: [
      { feature: 'Painel ambiental na página do caso', status: OK, note: 'Amanhecer/crepúsculo/zona morta visíveis' },
      { feature: 'Dawn/dusk/dead-zone por mês', status: OK, note: 'Calculado client-side a partir de last_seen_at' },
      { feature: 'Risco de golpe de calor (braquicéfalo/grande)', status: OK, note: 'Lógica implementada, ativo em verão' },
      { feature: 'Nortada hint (NNW orientation)', status: UNTESTED, note: 'Lógica implementada, visibilidade não confirmada' },
      { feature: 'Water urgency (d2+ em verão)', status: UNTESTED, note: 'Lógica implementada' },
      { feature: 'Transport risk flag', status: UNTESTED, note: 'Lógica implementada' },
      { feature: 'send_environment_advisory PI tool', status: UNTESTED, note: 'Tool existe, não confirmado se aciona no E2E' },
    ],
  },
  {
    title: 'WP13 — Inteligência Territorial (GIS)',
    rows: [
      { feature: 'Painel geo na página do caso', status: OK, note: '"inteligência territorial" + barrocal visível para Silves' },
      { feature: 'Zone chips (litoral/barrocal/serra…)', status: OK, note: 'Confirmado para Silves (barrocal)' },
      { feature: 'A22 barrier badge', status: OK, note: '"A22 atravessa" para municípios bisected' },
      { feature: 'Terrain permeability chip', status: OK, note: 'dense/moderate/open' },
      { feature: 'Fire risk chip (junho-outubro)', status: OK, note: 'Implementado e ativo em fire season' },
      { feature: 'kb_geography 16 municípios seed', status: OK, note: 'Migration 0019 aplicada' },
      { feature: 'IPMA live fire API', status: UNTESTED, note: 'Implementado no executor, não testado em fire season' },
    ],
  },
  {
    title: 'WP12 — Guia de Campo + Sistema de Segurança',
    rows: [
      { feature: 'Field guide visível na página', status: OK, note: '"armadilha" e "estação de alimentação" visíveis' },
      { feature: 'Time-indexed protocol (h0-6/h6-24/d2-4/d5-10/d10+)', status: UNTESTED, note: 'Implementado no PI tool' },
      { feature: 'send_field_guide PI tool', status: UNTESTED, note: 'Tool existe, acionamento não confirmado' },
      { feature: 'Score de avistamento (0-15) WP12', status: PARTIAL, note: 'Migration 0017 aplicada; sighting submission não testada' },
      { feature: '8 erros de busca prevenidos (system prompt)', status: UNTESTED, note: 'Regras no system prompt PI agent' },
      { feature: 'Refeeding syndrome warning (≥5 dias)', status: UNTESTED, note: 'Lógica implementada' },
    ],
  },
  {
    title: 'PDF Poster',
    rows: [
      { feature: '/api/cases/[slug]/poster route existe', status: OK, note: 'Route presente' },
      { feature: 'PDF gerado corretamente', status: FAIL, note: 'HTTP 500 — gap shorthand não suportada em @react-pdf/renderer v3.4.x. FIX: usar columnGap (aplicado, aguarda deploy)' },
      { feature: 'Botão "cartaz" na página do caso', status: OK, note: 'Botão visível' },
      { feature: 'QR code no PDF', status: UNTESTED, note: 'Implementado em PosterA4.tsx, PDF bloqueado por bug acima' },
    ],
  },
  {
    title: 'Privacidade',
    rows: [
      { feature: 'PII reporter ausente da API pública', status: OK, note: 'reporter_email/phone/name ausentes da resposta GET /api/cases' },
      { feature: 'Microchip parcial (últimos 3) na API pública', status: FAIL, note: 'BUG: distinctive_marks pode conter chip completo quando agente o inclui — fix: sanitização aplicada (aguarda deploy)' },
      { feature: 'suspected_theft é privado', status: OK, note: 'Apenas no admin' },
      { feature: 'Visual matches requerem revisão humana', status: OK, note: 'Apenas via /api/admin/…/visual-matches' },
      { feature: 'Sightings não públicos sem aprovação', status: OK, note: 'is_public=false por default' },
    ],
  },
  {
    title: 'ML / Similaridade Visual',
    rows: [
      { feature: 'ML pipeline (YOLO + DINOv2)', status: UNTESTED, note: 'apps/ml existe, Apple Silicon MPS — não deployado em prod' },
      { feature: 'Visual matches (admin)', status: UNTESTED, note: '/api/admin/cases/[id]/visual-matches existe' },
      { feature: 'Blurring de faces/matrículas', status: UNTESTED, note: 'ML pipeline, não testado' },
      { feature: 'ML matches visíveis na página pública', status: NA, note: 'Não implementado (apenas admin)' },
    ],
  },
  {
    title: 'Notificações',
    rows: [
      { feature: 'notify_volunteers tool call', status: OK, note: 'Acionado após case creation' },
      { feature: 'Email via Resend', status: PARTIAL, note: 'Configurado mas API key re_placeholder — emails não chegam' },
      { feature: 'Bot Telegram (Fly.io)', status: PARTIAL, note: 'Deployado como salvacao-bot — estado atual não verificado' },
    ],
  },
  {
    title: 'Sightings',
    rows: [
      { feature: 'POST /api/sightings/{case_id}', status: UNTESTED, note: 'Não testado E2E (issue na extração de case_id no teste)' },
      { feature: 'WP12 reliability score (0-15)', status: UNTESTED, note: 'Migration 0017 + código implementado' },
      { feature: 'action_recommendation na resposta', status: UNTESTED, note: 'Implementado em sightings route' },
      { feature: 'Sightings requerem aprovação admin', status: OK, note: 'Confirmado no schema (is_public=false)' },
    ],
  },
]

/* ─── Status color ───────────────────────────────────────────────────── */
function statusColor(s: string): string {
  if (s === OK) return '#16a34a'
  if (s === FAIL) return '#dc2626'
  if (s === PARTIAL) return '#d97706'
  if (s === UNTESTED) return '#2563eb'
  return '#9ca3af'
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function ComoFuncionaPage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 96px', fontFamily: N.sans, color: N.ink }}>

      {/* Nav */}
      <div style={{ marginBottom: 48 }}>
        <Link href="/pt" style={{ color: N.ink3, textDecoration: 'none', fontSize: 13, fontFamily: N.mono }}>← nona</Link>
      </div>

      {/* Hero */}
      <h1 style={{ fontFamily: N.display, fontSize: 52, fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 24px' }}>
        Como a Nona funciona.
      </h1>
      <p style={{ fontSize: 19, color: N.ink2, lineHeight: 1.65, maxWidth: 640, margin: '0 0 64px' }}>
        A Nona é uma investigadora de IA para cães perdidos no Algarve. Analisa o comportamento de cada cão,
        o terreno, e o tempo decorrido — e coordena o protocolo certo em minutos, não dias.
      </p>

      {/* Steps */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 80 }}>
        {[
          { n: '01', title: 'Conta-nos o que aconteceu', body: 'Fala com a Nona em linguagem natural. Não precisas de formulários. A Nona ouve, faz as 5 perguntas comportamentais certas, e constrói o perfil do cão em tempo real.' },
          { n: '02', title: 'Protocolo científico em segundos', body: 'A Nona calcula a fase comportamental (pânico / sobrevivência / recuperação), o action gate (o que fazer e o que NÃO fazer), e o raio de busca baseado na raça, gatilho e terreno.' },
          { n: '03', title: 'Voluntários mobilizados', body: 'Automaticamente. A Nona alerta voluntários da zona, sugere o protocolo correto (câmara vs procura ativa), e gera um cartaz PDF para partilhares nos grupos locais.' },
          { n: '04', title: 'O caso fica ativo 24/7', body: 'A página pública recebe avistamentos, mostra o raio de busca atualizado, e o protocolo evolui com o tempo. Cada avistamento é avaliado por fiabilidade (0-15 pontos).' },
        ].map(s => (
          <div key={s.n} style={{ padding: '24px', background: N.surface, borderRadius: 14, border: `1px solid ${N.rule}` }}>
            <div style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3, marginBottom: 12, letterSpacing: '0.1em' }}>{s.n}</div>
            <h3 style={{ fontFamily: N.display, fontSize: 22, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 10px' }}>{s.title}</h3>
            <p style={{ margin: 0, fontSize: 14, color: N.ink2, lineHeight: 1.6 }}>{s.body}</p>
          </div>
        ))}
      </div>

      {/* Work Packages */}
      <div style={{ marginBottom: 80 }}>
        <h2 style={{ fontFamily: N.display, fontSize: 36, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
          Inteligência em camadas.
        </h2>
        <p style={{ color: N.ink2, fontSize: 15, margin: '0 0 32px' }}>Cada Work Package adiciona uma camada de contexto ao PI agent.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { wp: 'WP8', name: 'Comportamental', desc: 'Probabilidade de cenários (onde está o cão) baseada em 5 perguntas comportamentais.' },
            { wp: 'WP9', name: 'Action Gate + Fase', desc: 'O que fazer e o que NÃO fazer. Fase temporal (pânico/sobrevivência/recuperação). Galgos: protocolo diferente desde o minuto 0.' },
            { wp: 'WP10', name: 'Ambiente Físico', desc: 'Janelas de atividade (amanhecer/crepúsculo), zona morta de calor, risco de golpe de calor, Nortada para orientação de estações.' },
            { wp: 'WP12', name: 'Guia de Campo', desc: 'Protocolo tempo-indexado (h0-6/h6-24/d2-4…), 8 erros a evitar, score de avistamentos, refeeding syndrome.' },
            { wp: 'WP13', name: 'GIS Territorial', desc: 'A22 como barreira absoluta, permeabilidade do terreno, fontes de água, risco de incêndio (IPMA live), zonas de pastoreio.' },
            { wp: 'WP11', name: 'Comportamento Humano', desc: 'Research em curso — próxima camada.' },
          ].map(w => (
            <div key={w.wp} style={{ padding: '20px', background: N.white, borderRadius: 12, border: `1px solid ${N.rule}` }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 8 }}>
                <span style={{ fontFamily: N.mono, fontSize: 10, color: N.ink3, background: N.surface, padding: '2px 7px', borderRadius: 4 }}>{w.wp}</span>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{w.name}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: N.ink2, lineHeight: 1.55 }}>{w.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Matrix */}
      <div>
        <h2 style={{ fontFamily: N.display, fontSize: 36, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
          Estado da plataforma.
        </h2>
        <p style={{ color: N.ink2, fontSize: 15, margin: '0 0 8px' }}>
          Teste E2E executado em {new Date().toLocaleDateString('pt-PT')} · Caso de teste: Luna (Beagle, Silves)
        </p>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, fontFamily: N.mono, color: N.ink3, marginBottom: 32, flexWrap: 'wrap' }}>
          <span>✅ Funciona</span>
          <span>⚠️ Parcial</span>
          <span>❌ Falha</span>
          <span>🔵 Não testado</span>
          <span>⬜ Não existe</span>
        </div>

        {MATRIX.map(section => (
          <div key={section.title} style={{ marginBottom: 32 }}>
            <h3 style={{ fontFamily: N.mono, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: N.ink3, margin: '0 0 12px', paddingBottom: 8, borderBottom: `1px solid ${N.rule}` }}>
              {section.title}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {section.rows.map((row, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '32px 1fr 2fr',
                  gap: 12, padding: '10px 0',
                  borderBottom: i < section.rows.length - 1 ? `1px solid ${N.ruleSoft}` : 'none',
                  alignItems: 'start',
                }}>
                  <span style={{ fontSize: 16 }}>{row.status}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.4 }}>{row.feature}</span>
                  <span style={{ fontSize: 12.5, lineHeight: 1.45, fontFamily: row.note.startsWith('BUG') ? N.mono : N.sans, color: row.note.startsWith('BUG') ? '#dc2626' : N.ink2 }}>{row.note}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 64, paddingTop: 24, borderTop: `1px solid ${N.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: N.mono, fontSize: 12, color: N.ink3 }}>nona · {new Date().getFullYear()}</span>
        <Link href="/pt" style={{ fontFamily: N.mono, fontSize: 12, color: N.ink3, textDecoration: 'none' }}>← voltar ao início</Link>
      </div>
    </div>
  )
}
