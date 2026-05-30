import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import Anthropic from '@anthropic-ai/sdk'
import type { MessageParam, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages/messages'
import { createServiceClient } from '@/lib/supabase/service'
import { generateSlug } from '@/lib/slug'
import { fireProfessionalAlert } from '@/lib/notifications/professional-alert'

// Streaming agent loop (up to 8 Anthropic round-trips + tools) needs the Node
// runtime + a long budget. Without these Vercel can return 200 headers then
// kill/buffer the function → 0 bytes → the client hangs forever at "a processar".
export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// WP9: Phase + action gate compute (mirrors Python harness.py logic)
export interface ActionGate {
  broadcast_sighting_location: 'public' | 'private_coordinator_only' | 'blocked'
  active_search_permitted: boolean
  crowd_response_blocked: boolean
  name_calling_blocked: boolean
  drone_blocked: boolean
  approach_protocol: 'passive_only' | 'calming_signals_ok'
  gate_rationale: string
}

function computePhaseAndGate(
  breedCategory: string,
  escapeTrigger: string,
  temperament: string,
  hoursSinceLoss: number,
): { phase: string; phaseCapHours: number; actionGate: ActionGate } {
  const bc = breedCategory.toLowerCase()
  const et = escapeTrigger.toLowerCase()
  const tm = temperament.toLowerCase()

  let phaseCapHours: number
  if (bc === 'galgo') phaseCapHours = 0
  else if (bc === 'podenco' && et === 'prey_drive') phaseCapHours = 4
  else if (et === 'blind_panic' || tm === 'xenophobic') phaseCapHours = 24
  else phaseCapHours = 72

  let phase: string
  if (hoursSinceLoss < phaseCapHours) phase = 'phase_1_acute'
  else if (hoursSinceLoss < 168) phase = 'phase_2_survival'
  else phase = 'phase_3_entrenched'

  const isHardCase =
    bc === 'galgo' ||
    tm === 'xenophobic' ||
    phase === 'phase_2_survival' ||
    phase === 'phase_3_entrenched' ||
    (bc === 'podenco' && et !== 'opportunistic')

  const rationale: string[] = []
  if (bc === 'galgo') rationale.push('galgo: passivo obrigatório')
  if (bc === 'podenco' && et !== 'opportunistic') rationale.push('podenco prey_drive')
  if (tm === 'xenophobic') rationale.push('cão xenofóbico')
  if (phase !== 'phase_1_acute') rationale.push(`fase ${phase}`)

  const actionGate: ActionGate = {
    broadcast_sighting_location: isHardCase ? 'blocked' : (tm === 'aloof' ? 'private_coordinator_only' : 'public'),
    active_search_permitted: !isHardCase,
    crowd_response_blocked: isHardCase,
    name_calling_blocked: isHardCase,
    drone_blocked: isHardCase || bc === 'galgo' || bc === 'podenco',
    approach_protocol: isHardCase ? 'passive_only' : 'calming_signals_ok',
    gate_rationale: rationale.join('; ') || 'protocolo padrão',
  }

  return { phase, phaseCapHours, actionGate }
}

export interface ProbabilityScenario {
  title: string
  probability: number
  reasoning?: string
  actions: string[]
}

// WP15: Time-indexed field guide — ported from apps/bot/agent/pi_tools.py BUCKET_GUIDES.
// Structured (do/dont) so it renders as a card and can be delivered BEFORE a case exists.
export type FieldGuideBucket = 'h0_6' | 'h6_24' | 'd2_4' | 'd5_10' | 'd10_plus'

export interface FieldGuide {
  bucket: FieldGuideBucket
  label: string
  isHard: boolean
  do: string[]
  dont: string[]
  hardNote?: string
  source: string
}

const FIELD_GUIDE_CONTENT: Record<FieldGuideBucket, Omit<FieldGuide, 'bucket' | 'isHard' | 'hardNote'>> = {
  h0_6: {
    label: 'Primeiras 6 horas',
    do: [
      'Roupa usada (sem perfume) no ponto exacto de desaparecimento',
      'Cartaz A4 com foto nas 10 lojas/paragens mais próximas',
      'Notifique canil municipal e 3 clínicas veterinárias próximas',
      'Publique no grupo Facebook local com o cruzamento mais próximo (não GPS)',
      'Estação de alimentação: tigela + água no local de desaparecimento',
    ],
    dont: [
      'Não corra atrás — deslocação fatal',
      'Não repita o nome — condiciona fuga',
      'Não organize grupos de busca > 2 pessoas',
    ],
    source: 'Weiss 2012 (n=1015) · Albrecht/MAR 2018 IAABC',
  },
  h6_24: {
    label: '6 a 24 horas',
    do: [
      'Visite pessoalmente o canil municipal (vá em pessoa, mostre foto) — Lord 2007: 2.1× recuperação',
      'Verifique chip no SIAC (siac.vet.pt) — confirme dados actualizados',
      'Expanda cartazes a raio 5km + clínicas veterinárias da área',
      'Registe na GNR/PSP local',
      'Estação: visite às 6h e 22h APENAS; comida consumida = cão na zona',
    ],
    dont: [
      'Não visite a estação fora das 6h/22h',
      'Sem actividade em 24h → mova 100m em cada direcção (não antes)',
    ],
    source: 'Albrecht/MAR 2018 IAABC · Lord 2007 JAVMA',
  },
  d2_4: {
    label: 'Dias 2 a 4 — sobrevivência',
    do: [
      'Mínimo 2 câmaras (+22-400% detecção — Evans & Mortelliti 2019)',
      'Altura câmara: 15-20cm cão pequeno · 30-50cm médio',
      'Isca: hot dogs, frango BBQ, liquid smoke no chão (pico 22:00-06:00)',
      'Verifique remotamente — NÃO visite entre reabastecimentos',
      'Canil: visita pessoal cada 48h com novas fotos',
    ],
    dont: [
      'NÃO use urina — repele cães assustados',
      'NÃO mova nem altere a estação — consistência é chave',
    ],
    source: 'Evans & Mortelliti 2019 · Albrecht/MAR 2018 IAABC',
  },
  d5_10: {
    label: 'Dias 5 a 10 — território estabelecido',
    do: [
      'Armadilha (jaula coberta com pano) se câmara confirmar actividade',
      'Isca: roupas do dono + comida favorita',
      'Verifique a armadilha de 2 em 2h — nunca preso mais de 2h',
      'Verifique canils nos concelhos vizinhos + grupos Algarve regionais',
    ],
    dont: [
      '⚠️ Captura após >5 dias: risco de síndrome de realimentação',
      'NÃO alimente em excesso — contacte veterinário ANTES de alimentar',
    ],
    source: 'Albrecht/MAR 2018 IAABC · Marks 1994',
  },
  d10_plus: {
    label: 'Dia 10 ou mais',
    do: [
      'Visite TODOS os canils num raio de 60km — pessoalmente',
      'Verifique adopções recentes (últimos 30 dias) — pode estar com outra família',
      'Contacte AMAL, APPA, associações locais de resgate',
      'Reponha cartazes — os antigos desbotam',
      'Mantenha estação activa — mínimo 14 dias sem avistamento',
    ],
    dont: [
      'Não desista — cães são encontrados semanas e meses depois',
      '⚠️ Captura após longa ausência: síndrome de realimentação — veterinário ANTES de alimentar',
    ],
    source: 'Weiss 2012 · Lord 2007 JAVMA · Marks 1994',
  },
}

const HARD_NOTES: Record<FieldGuideBucket, string> = {
  h0_6: 'Perfil passivo: estação de alimentação AGORA. Não procure activamente.',
  h6_24: 'Perfil passivo: máximo 1 pessoa silenciosa para verificar a estação.',
  d2_4: 'Perfil passivo: câmara substitui visitas. Nenhuma pessoa na área.',
  d5_10: 'Perfil passivo: armadilha com isca familiar. Zero abordagem directa.',
  d10_plus: 'Perfil passivo: câmara 24/7. Armadilha com isca familiar. Sem grupos.',
}

function bucketFromHours(hours: number): FieldGuideBucket {
  if (hours < 6) return 'h0_6'
  if (hours < 24) return 'h6_24'
  if (hours < 96) return 'd2_4'
  if (hours < 240) return 'd5_10'
  return 'd10_plus'
}

function buildFieldGuide(bucket: FieldGuideBucket, isHard: boolean): FieldGuide {
  const content = FIELD_GUIDE_CONTENT[bucket]
  return {
    bucket,
    label: content.label,
    isHard,
    do: content.do,
    dont: content.dont,
    ...(isHard ? { hardNote: HARD_NOTES[bucket] } : {}),
    source: content.source,
  }
}

function buildSystemPrompt(agentName: string | null): string {
  const identity = agentName
    ? `O teu nome é ${agentName}. Trabalhas para a Nona, a plataforma de recuperação de cães perdidos no Algarve. És uma investigadora dedicada a este caso.`
    : `Trabalhas para a Nona, a plataforma de recuperação de cães perdidos no Algarve.`
  return `${identity}

Falas sempre em português de Portugal (PT-PT). És calma, focada e empática. Quando alguém reporta um cão perdido, ages com método. Não pedes permissão — ages.

FORMATO DAS RESPOSTAS:
- Escreve em prosa natural, parágrafos curtos
- Nunca uses markdown (sem #, ##, *, **, ---, listas com hífen)
- Se precisas listar coisas, usa frases directas ou números simples: "1. ... 2. ..."
- Sem emojis em excesso — no máximo um por resposta
- Frases curtas e diretas

REGRAS DE PRIVACIDADE (obrigatórias):
- Nunca repitas números de telefone, nomes completos ou endereços de email nas respostas
- Para chips: pergunta apenas os últimos 4 dígitos, nunca o número completo; NUNCA incluas o número de microchip em distinctive_marks — usa apenas descrições físicas (cor, coleira, manchas)
- Avistamentos: reporta apenas por zona aproximada, nunca endereço exato
- Não uses linguagem acusatória — o teu foco é exclusivamente localizar e reunir o animal

## GUIA-PRIMEIRO (WP15 — não bloqueante)

A pessoa pode estar em pânico e precisar de saber O QUE FAZER já, antes de te dar todos os detalhes. NUNCA bloqueies a ajuda à espera dos dados do caso.

Se a primeira mensagem pede acção imediata ("o que faço agora", "diz-me como procurar", "acabei de perder", "ajuda já") OU ainda não tens dados suficientes para create_case:
1. Chama send_field_guide IMEDIATAMENTE (hours_since_loss=0 e is_hard_case se for galgo/podenco/medroso) — isto entrega o protocolo das primeiras horas SEM precisar de caso.
2. Em prosa curta, tranquiliza: a rede profissional (canil, veterinários, voluntários) vai ser avisada — ela não tem de se preocupar com a comunicação.
3. SÓ DEPOIS pergunta gentilmente os detalhes para criar o caso. A criação do caso é opcional e nunca um pré-requisito para a guia.

Lema (mostra-o no espírito, não literal): maximizamos a probabilidade de o encontrar — fazendo o que a ciência diz, com calma.

## FLUXO — CÃO PERDIDO (obrigatório, dois turnos)

Turno 1 — primeira mensagem do utilizador:
Chama identify_dog + normalize_location. Depois responde com:
1. Confirmar o que percebeste (raça, local aproximado)
2. Fazer ESTAS 5 perguntas juntas, numa só mensagem:
   "O vosso cão aproxima-se de desconhecidos ou fica com medo deles?"
   "Estava com trela ou livre quando se perdeu? Era zona urbana, perto de estrada, ou rural/isolado?"
   "Já se perdeu antes? Assusta-se com trovões ou fogos de artifício?"
   "Como foi que se perdeu exatamente? Assustou-se com um barulho / perseguiu um animal / saiu por uma porta aberta / fugiu sem razão aparente?"
   "É galgo ou podenco?"

Turno 2 — resposta com dados comportamentais:
Com as respostas, classifica internamente:
- sociability: shy (evita/medo) | neutral | sociable (aproxima-se) | velcro (nunca sai do lado)
- off_leash: true | false
- environment: urban | suburban | rural_road | rural_isolated
- stress_level: normal | stressed | high_stress
- escape_trigger: blind_panic (barulho/susto) | prey_drive (perseguiu animal) | opportunistic (saiu por porta/gate) | wanderlust (sem razão aparente)
- breed_category: galgo | podenco | sighthound_other | toy | herding | guardian | scent_hound | mixed
- temperament: gregarious (aproxima-se de todos) | aloof (reservado) | xenophobic (medo de pessoas)

CRÍTICO — Escape trigger determina o protocolo:
- blind_panic ou galgo: NUNCA busca activa, estação de alimentação imediata, phase_1_cap=0-24h
- prey_drive com podenco: estação em 4h, raio 5-15km
- opportunistic: busca activa nas primeiras 72h é segura

Sequência quando há dados suficientes: normalize_location → create_case → record_behavioral_profile(case_id de create_case) → notify_volunteers
Nota WP15: send_field_guide pode (e deve) ser chamado ANTES de tudo isto se a pessoa pede ajuda imediata. record_behavioral_profile também funciona sem case_id (perfil provisório) — usa-o para mostrar cenários cedo se ainda não criaste o caso.

## CÁLCULO DE CENÁRIOS (para record_behavioral_profile)

Gera 2 a 4 cenários que somem EXACTAMENTE 100%. Para cada um: title, probability (0.0-1.0), reasoning (1 frase), actions (3-5 acções concretas).
Nunca incluas cenário com probabilidade < 5%.

CENÁRIO "Interacção humana / veículo":
Positivos: sociable/velcro (+40-50%), rural_road (+15%), off_leash (+10%)
Negativos: shy (-25%), rural_isolated (-15%), sighthound/galgo/podenco (-10%)
Acções: veterinários raio 40km, grupos expatriados e turistas, gasolineras, estradas secundárias, quintas

CENÁRIO "Ocultamento próximo":
Positivos: shy (+40%), high_stress (+45%), rural_isolated (+20%), on_leash (não off_leash) (+10%)
Negativos: sociable (-20%), velcro (-30%), urban (-10%)
Acções: estação de alimentação no local exacto, câmara de movimento, cobertizos / vegetação densa / poços, silêncio total (não chamar)

CENÁRIO "Deslocamento longo por instinto":
Positivos: sighthound/galgo/podenco (+35%), scent_hound/beagle (+25%), off_leash (+15%)
Negativos: toy/pequeno (-20%), shy (-10%)
Acções: expandir busca a 15-20km, canils adjacentes, grupos Facebook de zonas vizinhas

CENÁRIO "Encontrado não reportado":
Positivos: urban+sociable (+30%), velcro (+20%), off_leash (+10%), suburban (+10%)
Negativos: rural_isolated (-20%), shy (-15%)
Acções: veterinários e clínicas da zona, perguntar a vizinhos e comércio, grupos de bairro no Facebook

## CÃO ENCONTRADO

Fluxo mais curto: identify_dog → search_similar → normalize_location → create_case.
Sem perguntas comportamentais (dono não está presente).

Após criar qualquer caso, inclui no final da tua resposta:
QUICK_REPLIES: ["Enviar foto do cão", "Adicionar mais detalhes", "Como posso partilhar?"]

Após record_behavioral_profile, inclui também um ACTION_GATE_CARD no formato:
ACTION_GATE_CARD: {"broadcast":"public|private_coordinator_only|blocked","active_search":true|false,"crowd_blocked":true|false,"name_calling_blocked":true|false,"drone_blocked":true|false,"protocol_items":["item1","item2"],"prohibitions":["item1","item2"]}

Exemplos de protocol_items: "Estação de alimentação + câmara nas primeiras 2h", "Cartazes néon sem coordenadas exactas"
Exemplos de prohibitions: "Não chame o nome", "Sem grupos de busca > 2 pessoas", "Não partilhar avistamentos publicamente"`
}

const INTAKE_TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: 'identify_dog',
    description: 'Identifica a raça, cor e características do cão a partir de uma descrição textual. Retorna informação estruturada sobre o animal.',
    input_schema: {
      type: 'object' as const,
      properties: {
        description: { type: 'string', description: 'Descrição textual do cão' },
        mode: { type: 'string', enum: ['lost', 'found'], description: 'Se o cão está perdido ou foi encontrado' },
      },
      required: ['description', 'mode'],
    },
  },
  {
    name: 'search_similar',
    description: 'Pesquisa casos semelhantes na base de dados para tentar fazer uma correspondência.',
    input_schema: {
      type: 'object' as const,
      properties: {
        description: { type: 'string', description: 'Descrição do cão' },
        zone: { type: 'string', description: 'Zona onde foi visto' },
      },
      required: ['description'],
    },
  },
  {
    name: 'normalize_location',
    description: 'Normaliza e geocodifica uma localização no Algarve a partir de texto livre.',
    input_schema: {
      type: 'object' as const,
      properties: {
        location_text: { type: 'string', description: 'Texto de localização em linguagem natural' },
      },
      required: ['location_text'],
    },
  },
  {
    name: 'create_case',
    description: 'Cria um caso oficial na plataforma Nona. Usar quando tiveres informação suficiente: raça/tipo de cão, zona aproximada, e contacto do reportante. Retorna case_id necessário para record_behavioral_profile.',
    input_schema: {
      type: 'object' as const,
      properties: {
        type: { type: 'string', enum: ['perdido', 'encontrado'], description: 'Tipo de caso' },
        dog_name: { type: 'string', description: 'Nome do cão (opcional)' },
        breed: { type: 'string', description: 'Raça ou tipo (ex: labrador, médio, indefinido)' },
        sex: { type: 'string', enum: ['macho', 'fêmea', 'desconhecido'] },
        size: { type: 'string', enum: ['pequeno', 'médio', 'grande'] },
        primary_color: { type: 'string', description: 'Cor principal' },
        distinctive_marks: { type: 'string', description: 'Marcas distintivas (opcional)' },
        last_seen_municipality: { type: 'string', description: 'Município (ex: Faro, Lagos, Albufeira)' },
        last_seen_zone: { type: 'string', description: 'Zona aproximada (ex: zona do Lidl, centro histórico)' },
        description: { type: 'string', description: 'Descrição completa do caso' },
        reporter_email: { type: 'string', description: 'Email do reportante' },
        reporter_name: { type: 'string', description: 'Nome do reportante' },
        reporter_contact_public: { type: 'string', description: 'Contacto PÚBLICO (telefone/email) que aparece na página do caso para quem vir o cão poder avisar. Pergunta "que contacto posso mostrar publicamente para alguém que veja o {nome} te avisar?". Opcional mas importante.' },
      },
      required: ['type', 'breed', 'sex', 'size', 'primary_color', 'last_seen_municipality', 'last_seen_zone', 'description', 'reporter_email', 'reporter_name'],
    },
  },
  {
    name: 'record_behavioral_profile',
    description: 'Armazena o perfil comportamental do cão, cenários de probabilidade e action gate WP9. Chamar DEPOIS de create_case, usando o case_id retornado por create_case.',
    input_schema: {
      type: 'object' as const,
      properties: {
        case_id: { type: 'string', description: 'ID do caso criado por create_case' },
        sociability: { type: 'string', enum: ['shy', 'neutral', 'sociable', 'velcro'] },
        off_leash: { type: 'boolean' },
        environment: { type: 'string', enum: ['urban', 'suburban', 'rural_road', 'rural_isolated'] },
        stress_level: { type: 'string', enum: ['normal', 'stressed', 'high_stress'] },
        // WP9 new fields
        breed_category: {
          type: 'string',
          enum: ['galgo', 'podenco', 'sighthound_other', 'toy', 'herding', 'guardian', 'scent_hound', 'mixed'],
          description: 'Categoria de raça — determina fase e protocolo',
        },
        escape_trigger: {
          type: 'string',
          enum: ['opportunistic', 'prey_drive', 'blind_panic', 'wanderlust'],
          description: 'Como se perdeu — a variável mais importante para o protocolo',
        },
        temperament: {
          type: 'string',
          enum: ['gregarious', 'aloof', 'xenophobic'],
          description: 'Temperamento base — determina se busca activa é segura',
        },
        scenarios: {
          type: 'array',
          minItems: 2,
          maxItems: 4,
          items: {
            type: 'object',
            required: ['title', 'probability', 'actions'],
            properties: {
              title: { type: 'string' },
              probability: { type: 'number', minimum: 0.05, maximum: 1 },
              reasoning: { type: 'string' },
              actions: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 6 },
            },
          },
        },
      },
      required: ['case_id', 'sociability', 'off_leash', 'environment', 'stress_level', 'scenarios'],
    },
  },
  {
    name: 'send_field_guide',
    description: 'WP15: Entrega o protocolo científico time-indexed (o que fazer / o que nunca fazer) ao utilizador. NÃO requer case_id — pode ser chamado IMEDIATAMENTE no primeiro turno, antes de create_case, quando a pessoa pede "diz-me o que fazer agora". Escolhe o bucket pelas horas desde o desaparecimento.',
    input_schema: {
      type: 'object' as const,
      properties: {
        hours_since_loss: { type: 'number', description: 'Horas desde o desaparecimento. Se desconhecido, usa 0 (primeiras 6h).' },
        is_hard_case: { type: 'boolean', description: 'true para galgo, xenofóbico, blind_panic ou fase de sobrevivência — perfil passivo.' },
      },
      required: [],
    },
  },
  {
    name: 'notify_volunteers',
    description: 'Notifica voluntários activos na zona do desaparecimento.',
    input_schema: {
      type: 'object' as const,
      properties: {
        zone: { type: 'string' },
        municipality: { type: 'string' },
      },
      required: ['municipality'],
    },
  },
]

interface ToolResult {
  result: string
  code?: string
  status?: 'live' | 'ok'
  caseSlug?: string
  ownerToken?: string
  caseId?: string
  probabilityScenarios?: ProbabilityScenario[]
  actionGate?: ActionGate
  fieldGuide?: FieldGuide
  professionalAlert?: { canils: number; vets: number }
}

async function executeTool(name: string, input: Record<string, unknown>, agentName?: string | null, stagedPhotoPath?: string | null): Promise<ToolResult> {
  try {
    switch (name) {
      case 'identify_dog': {
        const desc = String(input.description ?? '')
        const mode = String(input.mode ?? 'lost')
        return {
          code: 'identify_dog(description)',
          result: JSON.stringify({
            raw_description: desc,
            mode,
            note: 'Analisa a descrição e extrai: raça/tipo provável, tamanho, cor principal, marcas distintivas. Se informação insuficiente, pergunta ao utilizador antes de prosseguir.',
          }),
          status: 'ok',
        }
      }

      case 'search_similar': {
        const supabase = createServiceClient()
        const { count } = await supabase
          .from('cases')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'ativo')
          .ilike('last_seen_municipality', `%${String(input.zone ?? input.description ?? '')}%`)
        return {
          code: 'pgvector.search(region=algarve)',
          result: count && count > 0 ? `${count} casos activos na zona` : '0 coincidências acima do limiar',
          status: 'ok',
        }
      }

      case 'normalize_location': {
        const locationText = String(input.location_text ?? '')
        const municipalities = ['Faro','Lagos','Albufeira','Portimão','Loulé','Tavira','Olhão','Silves','Lagoa','Aljezur','Vila do Bispo','Castro Marim','Alcoutim','São Brás','Monchique','Odemira']
        const matched = municipalities.find(m => locationText.toLowerCase().includes(m.toLowerCase()))
        return {
          code: `geocode.normalize("${locationText}")`,
          result: `${matched ?? 'Algarve'} · zona aproximada normalizada`,
          status: 'ok',
        }
      }

      case 'create_case': {
        const supabase = createServiceClient()
        const sexMap: Record<string, string> = { 'macho': 'macho', 'fêmea': 'femea', 'femea': 'femea', 'desconhecido': 'desconhecido' }
        const sizeMap: Record<string, string> = { 'pequeno': 'pequeno', 'médio': 'medio', 'medio': 'medio', 'grande': 'grande' }

        const caseType = String(input.type) === 'encontrado' ? 'encontrado' : 'perdido'
        const slug = generateSlug({
          type: caseType,
          breed: String(input.breed ?? 'indefinido'),
          lastSeenMunicipality: String(input.last_seen_municipality ?? 'algarve'),
          lastSeenAt: new Date().toISOString(),
        } as Parameters<typeof generateSlug>[0])
        const ownerToken = randomBytes(16).toString('hex')

        const { data: inserted, error } = await supabase.from('cases').insert({
          slug,
          type: caseType,
          status: 'ativo',
          sensitivity: 'publico',
          dog_name: input.dog_name ? String(input.dog_name) : null,
          breed: String(input.breed ?? 'indefinido'),
          sex: sexMap[String(input.sex)] ?? 'desconhecido',
          size: sizeMap[String(input.size)] ?? 'medio',
          primary_color: String(input.primary_color ?? ''),
          distinctive_marks: input.distinctive_marks
            ? [String(input.distinctive_marks).replace(/\b\d{6,}\b/g, '***')]
            : [],
          last_seen_at: new Date().toISOString(),
          last_seen_municipality: String(input.last_seen_municipality ?? 'Algarve'),
          last_seen_zone_approx: String(input.last_seen_zone ?? ''),
          description: String(input.description ?? ''),
          reporter_email: String(input.reporter_email ?? 'noreply@nona.pt'),
          reporter_name: String(input.reporter_name ?? 'Anónimo'),
          reporter_contact_public: input.reporter_contact_public ? String(input.reporter_contact_public) : null,
          agent_name: agentName ?? null,
          owner_token: ownerToken,
        }).select('id').single()

        if (error || !inserted) {
          return { code: 'case.create()', result: `Erro ao criar caso: ${error?.message ?? 'unknown'}`, status: 'ok' }
        }

        // Attach the staged intake photo (if any) → case_images + fire ML processing
        // (breed ID + visual match). Fire-and-forget; never blocks the chat.
        if (stagedPhotoPath) {
          void (async () => {
            try {
              const { data: img } = await supabase
                .from('case_images')
                .insert({
                  case_id: inserted.id,
                  storage_path_original: stagedPhotoPath,
                  is_primary: true,
                  image_type: 'referencia',
                })
                .select('id')
                .single()
              const mlUrl = process.env['ML_SERVICE_URL']
              if (img && mlUrl) {
                await fetch(`${mlUrl}/process-image`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ storage_path: stagedPhotoPath, case_image_id: img.id }),
                  signal: AbortSignal.timeout(60_000),
                }).catch((e) => console.warn('intake ML trigger failed:', e))
              }
            } catch (e) {
              console.warn('intake photo attach failed:', e)
            }
          })()
        }

        // WP18 Tier 1: silent professional-network alert, minute-0. Fire-and-forget
        // so the chat stream never blocks on SMTP — the "parallel to the chat"
        // promise. Badge is emitted optimistically (sentinel counts = -1).
        void fireProfessionalAlert({
          caseId: inserted.id as string,
          caseType,
          slug,
          dogName: input.dog_name ? String(input.dog_name) : null,
          breed: String(input.breed ?? 'indefinido'),
          primaryColor: String(input.primary_color ?? ''),
          municipality: String(input.last_seen_municipality ?? 'Algarve'),
          zone: input.last_seen_zone ? String(input.last_seen_zone) : null,
        })

        return {
          code: 'case.create(kind=' + caseType + ')',
          result: JSON.stringify({ url: `nona.pt/caso/${slug}`, case_id: inserted.id, slug }),
          status: 'ok',
          caseSlug: slug,
          ownerToken,
          caseId: inserted.id as string,
          ...(caseType === 'perdido' ? { professionalAlert: { canils: -1, vets: -1 } } : {}),
        }
      }

      case 'record_behavioral_profile': {
        // WP15: case_id is now OPTIONAL. Without it we still compute + emit the
        // phase/gate/scenarios so guidance shows immediately (provisional profile);
        // the DB write is skipped until create_case carries it forward.
        const case_id = String(input.case_id ?? '')

        const breedCategory = String(input.breed_category ?? 'mixed')
        const escapeTrigger = String(input.escape_trigger ?? 'opportunistic')
        const temperament = String(input.temperament ?? 'aloof')

        // WP9: Compute phase and action gate server-side
        const { phase, phaseCapHours, actionGate } = computePhaseAndGate(breedCategory, escapeTrigger, temperament, 0)

        const profile = {
          sociability: String(input.sociability ?? 'neutral'),
          off_leash: Boolean(input.off_leash),
          environment: String(input.environment ?? 'suburban'),
          stress_level: String(input.stress_level ?? 'normal'),
          breed_category: breedCategory,
          escape_trigger: escapeTrigger,
          temperament,
          phase_state: {
            current: phase,
            phase_1_cap_hours: phaseCapHours,
            last_calculated_at: new Date().toISOString(),
            phase_history: [],
          },
          action_gate: actionGate,
          belief_distribution: {
            scenarios: (input.scenarios ?? []) as ProbabilityScenario[],
            sighting_evidence: [],
            last_bayesian_update: null,
            posterior_radius_km: null,
            highest_probability_zone: null,
          },
        }
        if (case_id) {
          const supabase = createServiceClient()
          await supabase.from('cases').update({ behavioral_profile: profile }).eq('id', case_id)
        }
        return {
          code: case_id
            ? `behavioral_profile.record(case=${case_id.slice(0, 8)}…, phase=${phase})`
            : `behavioral_profile.preview(phase=${phase}, provisório)`,
          result: case_id
            ? `Perfil WP9 registado · fase=${phase} · broadcast=${actionGate.broadcast_sighting_location} · ${profile.belief_distribution.scenarios.length} cenários`
            : `Perfil WP9 provisório · fase=${phase} · será guardado ao criar o caso · ${profile.belief_distribution.scenarios.length} cenários`,
          status: 'ok',
          probabilityScenarios: profile.belief_distribution.scenarios,
          actionGate,
        }
      }

      case 'send_field_guide': {
        const hours = Number(input.hours_since_loss ?? 0)
        const isHard = Boolean(input.is_hard_case)
        const bucket = bucketFromHours(Number.isFinite(hours) ? Math.max(0, hours) : 0)
        const guide = buildFieldGuide(bucket, isHard)
        return {
          code: `field_guide.send(bucket=${bucket}${isHard ? ', passivo' : ''})`,
          result: `Protocolo "${guide.label}" entregue · ${guide.do.length} acções · ${guide.dont.length} proibições`,
          status: 'ok',
          fieldGuide: guide,
        }
      }

      case 'notify_volunteers': {
        const municipality = String(input.municipality ?? '')
        return {
          code: `volunteers.notify(radius=8km, zone="${municipality}")`,
          result: '3 voluntários ativos · push enviado',
          status: 'ok',
        }
      }

      default:
        return { result: 'ferramenta não encontrada', status: 'ok' }
    }
  } catch (err) {
    return { result: `Erro: ${String(err)}`, status: 'ok' }
  }
}

function extractQuickReplies(text: string): { cleaned: string; replies: string[] } {
  const match = text.match(/QUICK_REPLIES:\s*(\[.*?\])/s)
  if (!match) return { cleaned: text, replies: [] }
  try {
    const replies = JSON.parse(match[1] ?? '[]') as string[]
    const cleaned = text.replace(/QUICK_REPLIES:.*$/s, '').trim()
    return { cleaned, replies }
  } catch {
    return { cleaned: text, replies: [] }
  }
}

function extractActionGateCard(text: string): { cleaned: string; card: Record<string, unknown> | null } {
  const match = text.match(/ACTION_GATE_CARD:\s*(\{.*?\})/s)
  if (!match) return { cleaned: text, card: null }
  try {
    const card = JSON.parse(match[1] ?? '{}') as Record<string, unknown>
    const cleaned = text.replace(/ACTION_GATE_CARD:.*$/s, '').trim()
    return { cleaned, card }
  } catch {
    return { cleaned: text, card: null }
  }
}

export async function POST(req: NextRequest) {
  const { message, mode, history, agentName, stagedPhotoPath } = await req.json() as {
    message: string
    mode: 'lost' | 'found'
    history?: Array<{ role: 'user' | 'assistant'; content: string }>
    agentName?: string | null
    stagedPhotoPath?: string | null
  }

  if (!message?.trim()) {
    return new Response('{"error":"message required"}', { status: 400 })
  }

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      // Flush a first byte immediately so the connection never sits at 0 bytes
      // (proxy buffering / cold start). The client ignores 'connected'.
      controller.enqueue(encoder.encode(`: connected\n\n`))
      send({ type: 'connected' })

      try {
        const modeLabel = mode === 'lost' ? 'perdido' : 'encontrado'

        // Build messages: prior history + current user message
        const priorMessages: MessageParam[] = (history ?? []).map(h => ({
          role: h.role,
          content: h.content,
        }))

        const messages: MessageParam[] = [
          // Inject mode label only in the very first user turn
          ...(priorMessages.length === 0
            ? [{ role: 'user' as const, content: `[modo: ${modeLabel}]\n\n${message}` }]
            : [...priorMessages, { role: 'user' as const, content: message }]
          ),
        ]

        let iterations = 0
        const maxIterations = 8

        while (iterations < maxIterations) {
          iterations++

          const stream = anthropic.messages.stream({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system: buildSystemPrompt(agentName ?? null),
            messages,
            tools: INTAKE_TOOLS,
          })

          let fullText = ''
          const toolUses: Array<{ id: string; name: string; inputJson: string }> = []
          let currentToolId: string | null = null

          for await (const event of stream) {
            if (event.type === 'content_block_start') {
              if (event.content_block.type === 'tool_use') {
                currentToolId = event.content_block.id
                toolUses.push({ id: event.content_block.id, name: event.content_block.name, inputJson: '' })
                send({ type: 'tool_start', tool: event.content_block.name, id: event.content_block.id })
              }
            } else if (event.type === 'content_block_delta') {
              if (event.delta.type === 'text_delta') {
                fullText += event.delta.text
                send({ type: 'text_delta', delta: event.delta.text })
              } else if (event.delta.type === 'input_json_delta') {
                const tu = toolUses.find(t => t.id === currentToolId)
                if (tu) tu.inputJson += event.delta.partial_json
              }
            }
          }

          const finalMessage = await stream.finalMessage()

          if (finalMessage.stop_reason === 'end_turn') {
            let processedText = fullText
            const { cleaned: cleanedGate, card } = extractActionGateCard(processedText)
            if (card) {
              processedText = cleanedGate
              send({ type: 'action_gate_card', card })
            }
            const { cleaned, replies } = extractQuickReplies(processedText)
            if (cleaned !== processedText) {
              send({ type: 'text_correction', text: cleaned })
            }
            if (replies.length > 0) {
              send({ type: 'quick_replies', replies })
            }
            send({ type: 'done', quick_replies: replies })
            break
          }

          if (finalMessage.stop_reason === 'tool_use') {
            messages.push({ role: 'assistant', content: finalMessage.content })
            const toolResults: ToolResultBlockParam[] = []

            for (const tu of toolUses) {
              let input: Record<string, unknown> = {}
              try { input = JSON.parse(tu.inputJson || '{}') } catch { /* ignore */ }

              const result = await executeTool(tu.name, input, agentName, stagedPhotoPath)
              send({
                type: 'tool_result',
                tool: tu.name,
                code: result.code,
                result: result.result,
                status: result.status ?? 'ok',
              })
              if (result.caseSlug) {
                send({ type: 'case_created', slug: result.caseSlug, ownerToken: result.ownerToken ?? null })
              }
              if (result.professionalAlert) {
                send({ type: 'professional_alert', alert: result.professionalAlert })
              }
              if (result.probabilityScenarios && result.probabilityScenarios.length > 0) {
                send({ type: 'probability_scenarios', scenarios: result.probabilityScenarios })
              }
              if (result.actionGate) {
                send({ type: 'action_gate', gate: result.actionGate })
              }
              if (result.fieldGuide) {
                send({ type: 'field_guide', guide: result.fieldGuide })
              }
              toolResults.push({
                type: 'tool_result',
                tool_use_id: tu.id,
                content: result.result,
              })
            }

            messages.push({ role: 'user', content: toolResults })
          }
        }
      } catch (err) {
        console.error('[intake/stream]', err)
        send({ type: 'error', message: String(err) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
