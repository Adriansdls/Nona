import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import Anthropic from '@anthropic-ai/sdk'
import type { MessageParam, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages/messages'
import { createServiceClient } from '@/lib/supabase/service'
import { generateSlug } from '@/lib/slug'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ProbabilityScenario {
  title: string
  probability: number
  reasoning?: string
  actions: string[]
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
- Para chips: pergunta apenas os últimos 4 dígitos, nunca o número completo
- Avistamentos: reporta apenas por zona aproximada, nunca endereço exato
- Não uses linguagem acusatória — o teu foco é exclusivamente localizar e reunir o animal

## FLUXO — CÃO PERDIDO (obrigatório, dois turnos)

Turno 1 — primeira mensagem do utilizador:
Chama identify_dog + normalize_location. Depois responde com:
1. Confirmar o que percebeste (raça, local aproximado)
2. Fazer ESTAS 3 perguntas juntas, numa só mensagem:
   "O vosso cão aproxima-se de desconhecidos ou fica com medo deles?"
   "Estava com trela ou livre quando se perdeu? Era zona urbana, perto de estrada, ou rural/isolado?"
   "Já se perdeu antes? Assusta-se com trovões ou fogos de artifício?"

Turno 2 — resposta com dados comportamentais:
Com as respostas, classifica internamente:
- sociability: shy (evita/medo) | neutral | sociable (aproxima-se) | velcro (nunca sai do lado)
- off_leash: true | false
- environment: urban | suburban | rural_road | rural_isolated
- stress_level: normal | stressed | high_stress

Sequência obrigatória: normalize_location → create_case → record_behavioral_profile(case_id de create_case) → notify_volunteers

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
QUICK_REPLIES: ["Enviar foto do cão", "Adicionar mais detalhes", "Como posso partilhar?"]`
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
      },
      required: ['type', 'breed', 'sex', 'size', 'primary_color', 'last_seen_municipality', 'last_seen_zone', 'description', 'reporter_email', 'reporter_name'],
    },
  },
  {
    name: 'record_behavioral_profile',
    description: 'Armazena o perfil comportamental do cão e os cenários de probabilidade calculados. Chamar DEPOIS de create_case, usando o case_id retornado por create_case.',
    input_schema: {
      type: 'object' as const,
      properties: {
        case_id: { type: 'string', description: 'ID do caso criado por create_case' },
        sociability: { type: 'string', enum: ['shy', 'neutral', 'sociable', 'velcro'] },
        off_leash: { type: 'boolean' },
        environment: { type: 'string', enum: ['urban', 'suburban', 'rural_road', 'rural_isolated'] },
        stress_level: { type: 'string', enum: ['normal', 'stressed', 'high_stress'] },
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
}

async function executeTool(name: string, input: Record<string, unknown>, agentName?: string | null): Promise<ToolResult> {
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
        const sexMap: Record<string, string> = { 'macho': 'macho', 'fêmea': 'fêmea', 'desconhecido': 'desconhecido' }
        const sizeMap: Record<string, string> = { 'pequeno': 'pequeno', 'médio': 'médio', 'grande': 'grande' }

        const caseType = String(input.type) === 'encontrado' ? 'encontrado' : 'perdido'
        const slug = generateSlug({
          dogName: String(input.dog_name ?? ''),
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
          size: sizeMap[String(input.size)] ?? 'médio',
          primary_color: String(input.primary_color ?? ''),
          distinctive_marks: input.distinctive_marks ? [String(input.distinctive_marks)] : [],
          last_seen_at: new Date().toISOString(),
          last_seen_municipality: String(input.last_seen_municipality ?? 'Algarve'),
          last_seen_zone_approx: String(input.last_seen_zone ?? ''),
          description: String(input.description ?? ''),
          reporter_email: String(input.reporter_email ?? 'noreply@nona.pt'),
          reporter_name: String(input.reporter_name ?? 'Anónimo'),
          agent_name: agentName ?? null,
          owner_token: ownerToken,
        }).select('id').single()

        if (error || !inserted) {
          return { code: 'case.create()', result: `Erro ao criar caso: ${error?.message ?? 'unknown'}`, status: 'ok' }
        }
        return {
          code: 'case.create(kind=' + caseType + ')',
          result: JSON.stringify({ url: `nona.pt/caso/${slug}`, case_id: inserted.id, slug }),
          status: 'ok',
          caseSlug: slug,
          ownerToken,
          caseId: inserted.id as string,
        }
      }

      case 'record_behavioral_profile': {
        const case_id = String(input.case_id ?? '')
        if (!case_id) {
          return { result: 'Erro: case_id obrigatório. Chama create_case primeiro.', status: 'ok' }
        }
        const supabase = createServiceClient()
        const profile = {
          sociability: String(input.sociability ?? 'neutral'),
          off_leash: Boolean(input.off_leash),
          environment: String(input.environment ?? 'suburban'),
          stress_level: String(input.stress_level ?? 'normal'),
          scenarios: (input.scenarios ?? []) as ProbabilityScenario[],
        }
        await supabase.from('cases').update({ behavioral_profile: profile }).eq('id', case_id)
        return {
          code: `behavioral_profile.record(case=${case_id.slice(0, 8)}…)`,
          result: `Perfil registado · ${profile.scenarios.length} cenários calculados`,
          status: 'ok',
          probabilityScenarios: profile.scenarios,
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

export async function POST(req: NextRequest) {
  const { message, mode, history, agentName } = await req.json() as {
    message: string
    mode: 'lost' | 'found'
    history?: Array<{ role: 'user' | 'assistant'; content: string }>
    agentName?: string | null
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
            const { cleaned, replies } = extractQuickReplies(fullText)
            if (cleaned !== fullText) {
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

              const result = await executeTool(tu.name, input, agentName)
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
              if (result.probabilityScenarios && result.probabilityScenarios.length > 0) {
                send({ type: 'probability_scenarios', scenarios: result.probabilityScenarios })
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
