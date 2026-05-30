// INTAKE A — Inline conversation + side trace panel (right rail)
// Matches Home A/C aesthetic. The hero input morphs into a thread.
// On the right: a sticky agent console showing what's happening RIGHT NOW.

function ChatBubble({ from, children, timestamp, mono }) {
  const isUser = from === 'user';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6,
      alignItems: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 18, animation: 'nn-fade-up .4s ease both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: N.mono, fontSize: 10.5, color: N.ink3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {!isUser && <Logo size={12}/>}
        <span>{isUser ? 'tu' : 'nona'}</span>
        {timestamp && <span style={{ color: N.ink4 }}>· {timestamp}</span>}
      </div>
      <div style={{
        maxWidth: '85%',
        padding: isUser ? '12px 16px' : '0', borderRadius: isUser ? 16 : 0,
        background: isUser ? N.ink : 'transparent',
        color: isUser ? N.cream : N.ink,
        fontFamily: mono ? N.mono : N.sans, fontSize: 15, lineHeight: 1.5,
        letterSpacing: '-0.005em',
      }}>
        {children}
      </div>
    </div>
  );
}

function AgentActionCard({ title, items, accent = N.coral }) {
  return (
    <div style={{
      maxWidth: '85%', marginTop: 10, marginBottom: 10,
      background: N.card, border: `1px solid ${N.rule}`, borderRadius: 14, padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, animation: 'nn-pulse 1.6s ease-in-out infinite' }}/>
        <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{title}</span>
      </div>
      <AgentInlineStatus items={items}/>
    </div>
  );
}

function IntakeA() {
  return (
    <div className="nn" style={{ background: N.cream, minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <NonaNav/>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', minHeight: 0 }}>
        {/* LEFT — conversation */}
        <section style={{
          padding: '32px 56px 24px',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: N.mono, fontSize: 11, color: N.ink3, marginBottom: 16 }}>
            <span>← voltar</span><span>·</span>
            <span>caso novo · perdido</span>
            <span style={{ marginLeft: 'auto' }}>
              <Pill kind="active" size="xs"/>
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxWidth: 720, width: '100%' }}>
            <ChatBubble from="agent" timestamp="17:14">
              <span style={{ fontFamily: N.display, fontSize: 26, fontWeight: 360, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Conta-me o que se passou. <span className="display-italic" style={{ fontStyle: 'italic', color: N.coralDeep }}>Faço tudo a seguir.</span>
              </span>
            </ChatBubble>

            <ChatBubble from="user" timestamp="17:14">
              O Bento saiu do quintal esta tarde. É um labrador castanho, 5 anos, coleira castanha.
              Última vez foi visto perto do Lidl em Faro às 17h.
              <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                <div style={{ width: 84, height: 84, borderRadius: 10, overflow: 'hidden' }}>
                  <PhotoPlaceholder tone="cocoa" label="bento"/>
                </div>
                <div style={{ width: 84, height: 84, borderRadius: 10, overflow: 'hidden' }}>
                  <PhotoPlaceholder tone="sand" label="bento_2"/>
                </div>
              </div>
            </ChatBubble>

            <ChatBubble from="agent" timestamp="17:14">
              Recebido. Já vi as fotos — labrador castanho macho, ~5 anos, coleira castanha visível.
              Vou começar a procurar.
              <AgentActionCard
                title="a fazer agora"
                items={[
                  { ok: true,  txt: 'identifiquei o cão · labrador castanho · macho · ~5a' },
                  { ok: true,  txt: 'verifiquei contra 247 cães encontrados · 0 coincidências' },
                  { ok: true,  txt: 'criei a página · /bento-faro-26mai' },
                  { ok: true,  txt: 'gerei o cartaz A4 ·' , extra: <a href="#" style={{ color: N.coralDeep, textDecoration: 'underline' }}>poster.pdf</a> },
                  { live: true, txt: 'a publicar nos grupos de facebook do algarve' },
                ]}
              />
              <span style={{ display: 'block', marginTop: 12, color: N.ink2 }}>
                Antes de continuar, só uma coisa: tem chip? Se sim, sabes os últimos 4 dígitos?
              </span>
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['sim — sei o número', 'tem chip — não sei', 'não tem chip', 'não sei'].map(l => (
                  <button key={l} style={{
                    padding: '8px 14px', borderRadius: 999, border: `1px solid ${N.rule}`,
                    background: N.card, color: N.ink, fontSize: 13, fontWeight: 500,
                  }}>{l}</button>
                ))}
              </div>
            </ChatBubble>
          </div>

          {/* input */}
          <div style={{
            marginTop: 12, background: N.card, border: `1.5px solid ${N.rule}`, borderRadius: 18,
            padding: '12px 14px', boxShadow: '0 1px 2px rgba(0,0,0,0.02), 0 6px 18px rgba(26,24,20,0.05)',
            maxWidth: 720, width: '100%',
          }}>
            <div contentEditable suppressContentEditableWarning style={{
              minHeight: 24, outline: 'none', fontSize: 15, color: N.ink4, lineHeight: 1.4,
            }}>
              escreve a resposta…
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {['photo', 'camera', 'pin'].map(i => (
                  <button key={i} style={{ padding: 7, borderRadius: 7, border: 'none', background: 'transparent', color: N.ink3 }}>
                    <Icon name={i} size={15} color={N.ink3}/>
                  </button>
                ))}
              </div>
              <button style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34,
                borderRadius: 10, border: 'none', background: N.ink, color: N.cream,
              }}>
                <Icon name="arrowUp" size={16} color={N.cream} sw={2}/>
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT — agent trace rail */}
        <aside style={{
          background: N.paper, borderLeft: `1px solid ${N.rule}`,
          padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              o que estou a fazer
            </span>
            <Pill kind="live" size="xs"/>
          </div>

          <AgentPanel
            dark
            animate={false}
            title="nona.run"
            subtitle="bento · faro · 26mai"
            footer={false}
            style={{ flex: 1, minHeight: 0 }}
            trace={SAMPLE_TRACE}
          />

          {/* mcps */}
          <div>
            <p style={{ margin: '0 0 10px', fontFamily: N.mono, fontSize: 11, color: N.ink3, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              ferramentas (mcp)
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                { l: 'vision', s: 'ok' },
                { l: 'pgvector', s: 'ok' },
                { l: 'geocode', s: 'ok' },
                { l: 'poster', s: 'ok' },
                { l: 'facebook', s: 'ok' },
                { l: 'volunteers', s: 'ok' },
                { l: 'sightings', s: 'live' },
                { l: 'whatsapp', s: 'idle' },
                { l: 'sip-numero', s: 'idle' },
              ].map(m => {
                const c = m.s === 'live' ? N.coral : m.s === 'ok' ? N.sage : N.ink4;
                return (
                  <span key={m.l} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 10px', borderRadius: 7,
                    background: N.card, border: `1px solid ${N.rule}`,
                    fontFamily: N.mono, fontSize: 11, color: N.ink2,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: c,
                                   animation: m.s === 'live' ? 'nn-pulse 1.4s ease-in-out infinite' : 'none' }}/>
                    {m.l}
                  </span>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

Object.assign(window, { IntakeA, ChatBubble, AgentActionCard });
