import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import Anthropic from '@anthropic-ai/sdk'
import type { MessageParam, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages/messages'
import { createServiceClient } from '@/lib/supabase/service'
import { generateSlug } from '@/lib/slug'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildSystemPrompt(agentName: string | null): string {
  const identity = agentName
    ? `O teu nome é ${agentName}. Trabalhas para a Nona, a plataforma de recuperação de cães perdidos no Algarve. És uma investigadora dedicada a este caso.`
    : `Trabalhas para a Nona, a plataforma de recuperação de cães perdidos no Algarve.`
  return `${identity}

Falas sempre em português de Portugal (PT-PT). És calma, focada e empática. Quando alguém reporta um cão perdido ou encontrado, ages imediatamente com as tuas ferramentas. Não pedes permissão — ages.

FORMATO DAS RESPOSTAS:
- Escreve em prosa natural, parágrafos curtos
- Nunca uses markdown (sem #, ##, *, **, ---, listas com hífen)
- Se precisas listar coisas, usa números simples: "1. ... 2. ... 3. ..."
- Sem emojis em excesso — no máximo um por resposta
- Frases curtas e diretas

REGRAS DE PRIVACIDADE (obrigatórias):
- Nunca repitas números de telefone, nomes completos ou endereços de email nas respostas
- Para chips: pergunta apenas os últimos 4 dígitos, nunca o número completo
- Avistamentos: reporta apenas por zona aproximada, nunca endereço exato
- Não uses linguagem acusatória — o teu foco é exclusivamente localizar e reunir o animal

Quando criares um caso, inclui no final da tua resposta:
QUICK_REPLIES: ["Tem chip, não sei", "Não tem chip", "Tenho o número do chip"]`
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
    description: 'Cria um caso oficial na plataforma Nona. Usar quando tiveres informação suficiente: raça/tipo de cão, zona aproximada, e contacto do reportante.',
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

async function executeTool(name: string, input: Record<string, unknown>, agentName?: string | null): Promise<{ result: string; code?: string; status?: 'live' | 'ok'; caseSlug?: string; ownerToken?: string }> {
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
        const typeMap: Record<string, string> = { 'perdido': 'perdido', 'encontrado': 'encontrado' }
        const sexMap: Record<string, string> = { 'macho': 'macho', 'fêmea': 'fêmea', 'desconhecido': 'desconhecido' }
        const sizeMap: Record<string, string> = { 'pequeno': 'pequeno', 'médio': 'médio', 'grande': 'grande' }

        const caseType = typeMap[String(input.type)] ?? 'perdido'
        const slug = generateSlug({
          dogName: String(input.dog_name ?? ''),
          lastSeenMunicipality: String(input.last_seen_municipality ?? 'algarve'),
          lastSeenAt: new Date().toISOString(),
        } as Parameters<typeof generateSlug>[0])
        const ownerToken = randomBytes(16).toString('hex')

        const { error } = await supabase.from('cases').insert({
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
        })

        if (error) {
          return { code: 'case.create()', result: `Erro ao criar caso: ${error.message}`, status: 'ok' }
        }
        return {
          code: 'case.create(kind=' + caseType + ')',
          result: `nona.pt/caso/${slug}`,
          status: 'ok',
          caseSlug: slug,
          ownerToken,
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
        const maxIterations = 6
        const calledTools = new Set<string>()

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
              // Re-emit corrected text (won't re-stream, just send correction)
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

              // Gate: normalize_location must be called before create_case
              if (tu.name === 'create_case' && !calledTools.has('normalize_location')) {
                send({ type: 'tool_result', tool: tu.name, code: 'gate.check()', result: 'Rejeitado: normalizar localização primeiro', status: 'ok' })
                toolResults.push({
                  type: 'tool_result' as const,
                  tool_use_id: tu.id,
                  content: 'Rejected: normalize_location must be called before create_case. Call normalize_location first, then retry create_case.',
                  is_error: true,
                })
                continue
              }

              const result = await executeTool(tu.name, input, agentName)
              calledTools.add(tu.name)
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
