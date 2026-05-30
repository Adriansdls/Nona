// THE TRANSITION — Home → Intake, no page reload, cinematic.
// 5 phases. Each one removes/reveals UI deliberately.
// Provides step controls so the user can scrub through phases.

// Phases:
// 0 — HOME            full chrome + hero + input
// 1 — FOCUSED         hero/nav/footer fade out; input slides up & stays
// 2 — USER_SENT       user's first message appears as text (NOT a black bubble)
// 3 — NONA_TYPING     agent shows a "thinking…" line
// 4 — NONA_WORKING    agent responds; activity panel slides in from right

function HomeToIntake() {
  const [phase, setPhase] = React.useState(0);
  const phases = [
    { id: 0, label: 'Home',      caption: 'A página de entrada.' },
    { id: 1, label: 'Foco',      caption: 'Tudo desaparece. Só o teu pensamento.' },
    { id: 2, label: 'Enviar',    caption: 'A tua mensagem fica.' },
    { id: 3, label: 'A pensar',  caption: 'A Nona ouve.' },
    { id: 4, label: 'A trabalhar', caption: 'O painel de actividade aparece quando há algo para mostrar.' },
  ];

  // Auto-advance toggle (off by default — manual)
  return (
    <div style={{
      width: '100%', height: '100%', background: N.paper,
      position: 'relative', overflow: 'hidden',
    }} className="nn">
      {/* The stage */}
      <Stage phase={phase}/>

      {/* Step controls (overlaid bottom) */}
      <div style={{
        position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(11,12,16,0.92)', backdropFilter: 'blur(8px)',
        color: N.paper, borderRadius: 999,
        padding: '8px 10px 8px 16px', display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 12px 32px rgba(0,0,0,0.18)', zIndex: 50,
      }}>
        <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          fase {phase + 1}/{phases.length} · {phases[phase].label}
        </span>
        <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.18)' }}/>
        <span style={{ fontSize: 12, color: N.paper, opacity: 0.85 }}>{phases[phase].caption}</span>
        <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.18)' }}/>
        <div style={{ display: 'flex', gap: 4 }}>
          {phases.map((p, i) => (
            <button key={p.id} onClick={() => setPhase(i)} style={{
              width: 28, height: 28, border: 'none', borderRadius: 999, cursor: 'pointer',
              background: i === phase ? N.paper : 'transparent',
              color: i === phase ? N.ink : N.paper, opacity: i === phase ? 1 : 0.55,
              fontSize: 11, fontWeight: 600, fontFamily: N.mono,
            }}>{i + 1}</button>
          ))}
        </div>
        <button onClick={() => setPhase(0)} style={{
          padding: '6px 10px', borderRadius: 999, border: 'none', cursor: 'pointer',
          background: 'rgba(255,255,255,0.12)', color: N.paper, fontSize: 11, fontFamily: N.mono,
        }}>↺ reset</button>
      </div>
    </div>
  );
}

// ─── Stage — animates between phases ────────────────────────────────
function Stage({ phase }) {
  // We compute each layer's appearance from `phase`.
  const homeChromeOpacity = phase === 0 ? 1 : 0;
  const inputCentered = phase >= 1;
  const hasMessage = phase >= 2;
  const nonaThinking = phase === 3;
  const nonaResponded = phase >= 4;
  const panelIn = phase >= 4;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>

      {/* HOME CHROME — fades out at phase 1 */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: phase === 0 ? 'auto' : 'none',
        opacity: homeChromeOpacity,
        transition: 'opacity .7s cubic-bezier(.4,0,.2,1)',
      }}>
        <NonaNav on="casos"/>
      </div>

      {/* Footer — also fades */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '20px 32px', borderTop: `1px solid ${N.rule}`,
        opacity: homeChromeOpacity,
        transition: 'opacity .7s cubic-bezier(.4,0,.2,1)',
        display: 'flex', justifyContent: 'space-between',
        fontFamily: N.mono, fontSize: 11, color: N.ink3,
      }}>
        <span>nona · open source · made in algarve</span>
        <span>privacidade · como funciona · parceiros</span>
      </div>

      {/* HOME HERO — fades out at phase 1 */}
      <div style={{
        position: 'absolute', top: '14%', left: '50%', transform: 'translateX(-50%)',
        width: 720, textAlign: 'center', pointerEvents: 'none',
        opacity: phase === 0 ? 1 : 0,
        transition: 'opacity .7s cubic-bezier(.4,0,.2,1)',
      }}>
        <p style={{ margin: 0, fontFamily: N.mono, fontSize: 11, color: N.ink3, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          agente para cães perdidos · algarve
        </p>
        <h1 style={{
          margin: '20px 0 0', fontFamily: N.display, fontWeight: 400, fontSize: 76,
          letterSpacing: '-0.025em', lineHeight: 0.98, color: N.ink,
        }}>
          Diz-me o que se passou.<br/>
          <span className="display-italic" style={{ fontStyle: 'italic' }}>Eu trato de tudo.</span>
        </h1>
      </div>

      {/* RECENT REUNIDOS strip (home only) */}
      <div style={{
        position: 'absolute', bottom: 72, left: '50%', transform: 'translateX(-50%)',
        width: 900, opacity: phase === 0 ? 1 : 0,
        transition: 'opacity .5s ease',
        pointerEvents: 'none',
      }}>
        <p style={{ margin: '0 0 10px', fontFamily: N.mono, fontSize: 10.5, color: N.ink3, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          reunidos esta semana · 14
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {['rose','moss','sand','cocoa','cream','slate','midnight'].map((t, i) => (
            <div key={i} style={{ borderRadius: 8, overflow: 'hidden', height: 64 }}>
              <PhotoPlaceholder tone={t}/>
            </div>
          ))}
        </div>
      </div>

      {/* THE CHAT SURFACE — slides up & centers across phases */}
      <ChatSurface
        inputCentered={inputCentered}
        hasMessage={hasMessage}
        nonaThinking={nonaThinking}
        nonaResponded={nonaResponded}
        squeezed={panelIn}
      />

      {/* ACTIVITY PANEL — slides in from right at phase 4 */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, right: 0, width: 360,
        transform: panelIn ? 'translateX(0)' : 'translateX(100%)',
        opacity: panelIn ? 1 : 0,
        transition: 'transform .65s cubic-bezier(.4,0,.2,1), opacity .65s ease .05s',
        background: N.paper, borderLeft: `1px solid ${N.rule}`,
        padding: '24px 20px', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: N.mono, fontSize: 10.5, color: N.ink3, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            atividade da nona
          </span>
          <Pill kind="live" size="xs"/>
        </div>
        <AgentFeed
          title="Acabou de fazer"
          events={INTAKE_EVENTS.slice(0, 6)}
          footer={false}
          style={{ flex: 1, minHeight: 0 }}
        />
        <p style={{ margin: 0, fontFamily: N.mono, fontSize: 10.5, color: N.ink4, lineHeight: 1.5 }}>
          o painel só aparece quando há algo para mostrar. assim mantemos a tua atenção na conversa.
        </p>
      </div>
    </div>
  );
}

// ─── Chat surface — same input grows into a thread ─────────────────
function ChatSurface({ inputCentered, hasMessage, nonaThinking, nonaResponded, squeezed }) {
  // Position calc: in phase 0, input sits at ~62% (under hero).
  //                in phases 1+, it slides to a vertically-centered chat column.
  //                in phase 4 (panel in), the column nudges left.

  // We use one container with flex-column and let CSS push it.
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: inputCentered ? 'flex-end' : 'flex-start',
      paddingTop: inputCentered ? 24 : 380,
      paddingBottom: inputCentered ? 32 : 0,
      paddingLeft: squeezed ? 0 : 0,
      paddingRight: squeezed ? 360 : 0,
      transition: 'padding-right .6s cubic-bezier(.4,0,.2,1)',
      pointerEvents: 'none',
    }}>
      {/* The thread above the input */}
      <div style={{
        flex: inputCentered ? 1 : 'none',
        width: '100%', maxWidth: 640,
        padding: '0 28px', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        opacity: inputCentered ? 1 : 0,
        transition: 'opacity .4s ease .2s',
        pointerEvents: 'auto',
      }}>
        {hasMessage && <UserMessage/>}
        {(nonaThinking || nonaResponded) && <NonaThinking active={nonaThinking}/>}
        {nonaResponded && <NonaResponse/>}
      </div>

      {/* The input — same component throughout */}
      <div style={{
        width: '100%', maxWidth: 640, padding: '0 28px', pointerEvents: 'auto',
        transition: 'transform .65s cubic-bezier(.4,0,.2,1)',
      }}>
        <InputBar variant={inputCentered ? 'thread' : 'hero'}/>
      </div>
    </div>
  );
}

// ─── The input bar ─────────────────────────────────────────────────
function InputBar({ variant = 'hero' }) {
  const isHero = variant === 'hero';
  return (
    <div style={{
      background: N.white, border: `1px solid ${N.rule}`,
      borderRadius: 18, padding: isHero ? '20px 22px 14px' : '14px 16px 12px',
      boxShadow: isHero
        ? '0 1px 0 rgba(11,12,16,.02), 0 14px 36px -10px rgba(11,12,16,.10)'
        : '0 1px 0 rgba(11,12,16,.02), 0 8px 24px -8px rgba(11,12,16,.10)',
      transition: 'all .5s cubic-bezier(.4,0,.2,1)',
    }}>
      <div contentEditable suppressContentEditableWarning style={{
        minHeight: isHero ? 48 : 22, outline: 'none',
        fontSize: isHero ? 18 : 15, color: isHero ? N.ink : N.ink4, lineHeight: 1.45,
      }}>
        {isHero
          ? <span><strong style={{ fontWeight: 600 }}>O Bento</strong> saiu do quintal por volta das 17h. Labrador castanho, coleira castanha, zona do Lidl em Faro.</span>
          : <span>escreve a resposta…</span>}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: isHero ? 12 : 6,
        paddingTop: isHero ? 10 : 4,
        borderTop: isHero ? `1px solid ${N.ruleSoft}` : 'none',
      }}>
        <div style={{ display: 'flex', gap: 2 }}>
          {['photo', 'pin', 'clock'].map(i => (
            <button key={i} style={{
              padding: '6px 9px', borderRadius: 7, border: 'none', background: 'transparent', color: N.ink3,
              display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontFamily: N.sans,
            }}>
              <Icon name={i} size={13} color={N.ink3}/>
              {isHero && <span>{i === 'photo' ? 'foto' : i === 'pin' ? 'local' : 'quando'}</span>}
            </button>
          ))}
        </div>
        <button style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: isHero ? '8px 14px' : '6px 8px',
          width: isHero ? 'auto' : 30, height: isHero ? 'auto' : 30,
          borderRadius: isHero ? 8 : 8, border: 'none',
          background: N.ink, color: N.paper, fontSize: 13, fontWeight: 500,
          gap: 7,
        }}>
          {isHero && <span>começar</span>}
          <Icon name={isHero ? 'enter' : 'arrowUp'} size={12} color={N.paper}/>
        </button>
      </div>
    </div>
  );
}

// ─── Chat treatments — NO BLACK BUBBLES ────────────────────────────
// User message: a quoted block with a left rule + name label.
// Agent message: free text with name label + the editorial display serif.

function UserMessage() {
  return (
    <div style={{ marginBottom: 24, paddingLeft: 12, borderLeft: `2px solid ${N.ink}`, animation: 'nn-fadeUp .55s ease both' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
        <span style={{ width: 20, height: 20, borderRadius: '50%', background: N.surface, color: N.ink, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 600, fontFamily: N.mono }}>M</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: N.ink }}>Maria</span>
        <span style={{ fontFamily: N.mono, fontSize: 10.5, color: N.ink3 }}>· tu · 17:14</span>
      </div>
      <p style={{ margin: 0, fontSize: 15.5, color: N.ink, lineHeight: 1.55, letterSpacing: '-0.005em' }}>
        O Bento saiu do quintal por volta das 17h. Labrador castanho, coleira castanha, zona do Lidl em Faro.
      </p>
      <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
        <div style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden' }}>
          <PhotoPlaceholder tone="cocoa"/>
        </div>
        <div style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden' }}>
          <PhotoPlaceholder tone="sand"/>
        </div>
      </div>
    </div>
  );
}

function NonaThinking({ active }) {
  return (
    <div style={{ marginBottom: 24, animation: 'nn-fadeUp .5s ease both' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
        <Logo size={12}/>
        <span style={{ fontFamily: N.mono, fontSize: 10.5, color: N.ink3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>nona · a ouvir</span>
      </div>
      <p style={{
        margin: 0, fontFamily: N.display, fontStyle: 'italic', fontSize: 20, fontWeight: 400,
        color: N.ink3, letterSpacing: '-0.01em',
      }}>
        a ler as fotos
        <span style={{ display: 'inline-flex', gap: 3, marginLeft: 8 }}>
          {[0,1,2].map(i => (
            <span key={i} style={{
              width: 4, height: 4, borderRadius: '50%', background: N.ink3,
              animation: `nn-pulse 1.2s ease-in-out infinite`, animationDelay: `${i * 0.15}s`,
            }}/>
          ))}
        </span>
      </p>
    </div>
  );
}

function NonaResponse() {
  return (
    <div style={{ marginBottom: 24, animation: 'nn-fadeUp .55s ease both' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <Logo size={12}/>
        <span style={{ fontFamily: N.mono, fontSize: 10.5, color: N.ink3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>nona · 17:14</span>
      </div>
      <p style={{ margin: 0, fontSize: 15.5, color: N.ink, lineHeight: 1.6, letterSpacing: '-0.005em' }}>
        <span style={{ fontFamily: N.display, fontStyle: 'italic', fontSize: 24, lineHeight: 1, color: N.ink, letterSpacing: '-0.015em' }}>Vi o Bento.</span> Labrador castanho, macho, ~5 anos. Coleira castanha — combinaste. Já criei a página e o cartaz, e estou a publicar nos grupos do Algarve.
      </p>
      <p style={{ margin: '14px 0 0', fontSize: 14.5, color: N.ink2, lineHeight: 1.55 }}>
        Antes de continuar — o Bento tem chip? Se souberes, ajuda os últimos 4 dígitos.
      </p>
      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {['Sim — sei o número', 'Tem chip, não sei', 'Não tem chip', 'Não sei'].map(l => (
          <button key={l} style={{
            padding: '7px 13px', borderRadius: 999, border: `1px solid ${N.rule}`,
            background: N.white, color: N.ink, fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
          }}>{l}</button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { HomeToIntake, Stage, InputBar });
