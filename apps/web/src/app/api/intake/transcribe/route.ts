import { NextRequest, NextResponse } from 'next/server'

// Web intake voice → text. Records in the browser (MediaRecorder), POSTs the audio
// blob here, we transcribe via OpenAI Whisper (same model the Telegram bot uses),
// return the text to fill the composer. Requires OPENAI_API_KEY in the web env.

export async function POST(req: NextRequest) {
  const apiKey = process.env['OPENAI_API_KEY']
  if (!apiKey) {
    return NextResponse.json({ error: 'transcription unavailable' }, { status: 503 })
  }

  const form = await req.formData()
  const audio = form.get('audio')
  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ error: 'audio required' }, { status: 400 })
  }

  // Forward to OpenAI Whisper. Pass the locale as a hint when available.
  const locale = String(form.get('locale') || 'pt')
  const upstream = new FormData()
  upstream.append('file', audio, audio.name || 'voice.webm')
  upstream.append('model', 'whisper-1')
  upstream.append('language', locale === 'en' ? 'en' : locale === 'es' ? 'es' : 'pt')

  try {
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) {
      return NextResponse.json({ error: `transcription failed ${res.status}` }, { status: 502 })
    }
    const data = (await res.json()) as { text?: string }
    return NextResponse.json({ text: (data.text || '').trim() })
  } catch (e) {
    return NextResponse.json({ error: `transcription error: ${String(e)}` }, { status: 502 })
  }
}
