// INTAKE v2 — Elegant. Same conversational structure as before, but the trace
// panel on the right is a LIGHT card showing technical events as a feed,
// not a black terminal. The tripas are visible, gracefully.

function ChatBubble({ from, children, time, last }) {
  const isUser = from === 'user';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6,
      alignItems: isUser ? 'flex-end' : 'flex-start',
      marginBottom: last ? 8 : 22,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: N.mono, fontSize: 10.5, color: N.ink3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {!isUser && <Logo size={11}/>}
        <span>{isUser ? 'maria' : 'nona'}</span>
        {time && <span style={{ color: N.ink4 }}>· {time}</span>}
      </div>
      <div style={{
        maxWidth: '88%',
        padding: isUser ? '12px 16px' : '0',
        borderRadius: isUser ? 14 : 0,
        background: isUser ? N.ink : 'transparent',
        color: isUser ? N.paper : N.ink,
        fontSize: 15.5, lineHeight: 1.5, letterSpacing: '-0.005em',
      }}>
        {children}
      </div>
    </div>
  );
}

function InlineActionList({ items }) {
  return (
    <div style={{ marginTop: 12, padding: '12px 16px', background: N.white, border: `1px solid ${N.rule}`, borderRadius: 12 }}>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, color: N.ink2, lineHeight: 1.45 }}>
            <span style={{
              marginTop: 3, width: 14, height: 14, borderRadius: 4,
              background: it.live ? N.amberBg : N.emeraldBg,
              color: it.live ? N.amber : N.emerald,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {it.live ? (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: N.amber, animation: 'nn-pulse 1.4s ease-in-out infinite' }}/>
              ) : (
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={N.emerald} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 12.5 9 17.5 20 6.5"/>
                </svg>
              )}
            </span>
            <span><span style={{ color: N.ink, fontWeight: 500 }}>{it.label}</span> {it.detail && <span style={{ color: N.ink3 }}>· {it.detail}</span>}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Intake() {
  return (
    <div className="nn" style={{ background: N.paper, minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* compact top */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', borderBottom: `1px solid ${N.rule}`, background: N.paper,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Logo size={18}/>
          <span style={{ width: 1, height: 16, background: N.rule }}/>
          <span style={{ fontFamily: N.mono, fontSize: 11.5, color: N.ink3 }}>
            <span style={{ color: N.ink3 }}>caso · </span>
            <span style={{ color: N.ink }}>bento-faro-26mai</span>
          </span>
          <Pill kind="active" size="xs"/>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>
          <span><Icon name="sparkle" size={11} color={N.indigo}/></span>
          <span>nona · claude-haiku-4.5</span>
          <span style={{ color: N.ink4 }}>·</span>
          <span>7.0s · 11 ações</span>
        </div>
      </header>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 420px', minHeight: 0 }}>
        {/* LEFT — conversation */}
        <section style={{ padding: '24px 36px 16px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ flex: 1, overflow: 'auto', maxWidth: 720, width: '100%' }}>
            <ChatBubble from="agent" time="17:14:02">
              <span style={{ fontFamily: N.display, fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Conta-me o que se passou. <span className="display-italic" style={{ fontStyle: 'italic', color: N.indigo }}>Trato de tudo a seguir.</span>
              </span>
            </ChatBubble>

            <ChatBubble from="user" time="17:14:14">
              O Bento saiu do quintal por volta das 17h.
              É um labrador castanho, 5 anos, com coleira castanha.
              Última vez foi na zona do Lidl, em Faro.
              <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                <div style={{ width: 84, height: 84, borderRadius: 8, overflow: 'hidden' }}>
                  <PhotoPlaceholder tone="cocoa"/>
                </div>
                <div style={{ width: 84, height: 84, borderRadius: 8, overflow: 'hidden' }}>
                  <PhotoPlaceholder tone="sand"/>
                </div>
              </div>
            </ChatBubble>

            <ChatBubble from="agent" time="17:14:16">
              <p style={{ margin: 0 }}>
                Recebido. Vi as fotos — labrador castanho, macho, ~5 anos. Reconheço a coleira.
              </p>
              <InlineActionList items={[
                { label: 'Identifiquei o cão',          detail: 'labrador · castanho · ~5a · confiança 0.94' },
                { label: 'Procurei coincidências',      detail: '0 entre 247 cães encontrados' },
                { label: 'Criei a página pública',      detail: 'nona.pt/bento-faro-26mai' },
                { label: 'Gerei o cartaz A4',           detail: 'poster.pdf · QR incluído' },
                { label: 'Publiquei nos grupos do Facebook', detail: '4 grupos · 3.2k membros' },
                { label: 'Notifiquei voluntários',      detail: '3 ativos a 8km · push enviado' },
                { live:  true, label: 'A monitorizar avistamentos', detail: 'canal aberto · 15s polling' },
              ]}/>
              <p style={{ margin: '14px 0 0', fontSize: 14.5, color: N.ink2 }}>
                Antes que continue: o Bento tem chip? Se souberes, ajuda os últimos 4 dígitos.
              </p>
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['Sim — sei o número', 'Tem chip, não sei', 'Não tem chip', 'Não sei'].map(l => (
                  <button key={l} style={{
                    padding: '8px 14px', borderRadius: 999, border: `1px solid ${N.rule}`,
                    background: N.white, color: N.ink, fontSize: 13, fontWeight: 500,
                  }}>{l}</button>
                ))}
              </div>
            </ChatBubble>
          </div>

          {/* input */}
          <div style={{
            marginTop: 8, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 14,
            padding: '10px 14px', boxShadow: '0 1px 0 rgba(11,12,16,.02), 0 6px 20px -8px rgba(11,12,16,.08)',
            maxWidth: 720, width: '100%',
          }}>
            <div contentEditable suppressContentEditableWarning style={{
              minHeight: 22, outline: 'none', fontSize: 14.5, color: N.ink4, lineHeight: 1.4,
            }}>
              responde à nona…
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {['photo','camera','pin'].map(i => (
                  <button key={i} style={{ padding: 7, borderRadius: 7, border: 'none', background: 'transparent', color: N.ink3 }}>
                    <Icon name={i} size={14} color={N.ink3}/>
                  </button>
                ))}
              </div>
              <button style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30,
                borderRadius: 8, border: 'none', background: N.ink, color: N.paper,
              }}>
                <Icon name="arrowUp" size={15} color={N.paper} sw={2}/>
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT — light agent feed */}
        <aside style={{
          background: N.paper, borderLeft: `1px solid ${N.rule}`,
          padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden',
        }}>
          <AgentFeed
            title="Atividade da Nona"
            subtitle="11 ações · 7.0s"
            events={INTAKE_EVENTS}
            footer={false}
            style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
          />

          {/* MCP rail */}
          <div style={{ background: N.white, border: `1px solid ${N.rule}`, borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontFamily: N.mono, fontSize: 10.5, color: N.ink3, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                ferramentas conectadas
              </span>
              <span style={{ fontFamily: N.mono, fontSize: 10.5, color: N.ink4 }}>
                9 mcp servers
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {[
                ['vision.identify', 'ok'],
                ['pgvector.search', 'ok'],
                ['geocode', 'ok'],
                ['poster.gen', 'ok'],
                ['facebook.post', 'ok'],
                ['volunteers', 'ok'],
                ['sightings', 'live'],
                ['whatsapp', 'idle'],
                ['sipemicro.chip', 'idle'],
              ].map(([l, s]) => {
                const c = s === 'live' ? N.amber : s === 'ok' ? N.emerald : N.ink4;
                return (
                  <span key={l} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 8px', borderRadius: 6, background: N.paper,
                    border: `1px solid ${N.rule}`,
                    fontFamily: N.mono, fontSize: 10.5, color: N.ink2,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: c,
                                   animation: s === 'live' ? 'nn-pulse 1.4s ease-in-out infinite' : 'none' }}/>
                    {l}
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

Object.assign(window, { Intake, ChatBubble, InlineActionList });
