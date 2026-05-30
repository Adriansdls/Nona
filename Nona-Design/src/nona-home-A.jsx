// HOME A v3 — monochromatic ink + paper. No indigo CTA.
// The brand is carried by typography. Drop the "what I do, real time" mini-feed —
// that magic should be DISCOVERED in the intake, not advertised here.

function HomeA() {
  const [mode, setMode] = React.useState('lost');
  return (
    <div className="nn" style={{ background: N.paper, minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <NonaNav on="casos"/>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '88px 32px 48px' }}>
        <div style={{ width: '100%', maxWidth: 720, textAlign: 'center' }}>
          <p style={{ margin: 0, fontFamily: N.mono, fontSize: 11.5, color: N.ink3, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            agente para cães perdidos · algarve
          </p>

          <h1 style={{
            margin: '24px 0 0', fontFamily: N.display, fontWeight: 400, fontSize: 90,
            letterSpacing: '-0.025em', lineHeight: 0.98, color: N.ink, textWrap: 'balance',
          }}>
            Diz-me o que se passou.<br/>
            <span className="display-italic" style={{ fontStyle: 'italic', color: N.ink, fontWeight: 400 }}>
              Eu trato de tudo.
            </span>
          </h1>

          <p style={{ margin: '24px auto 0', maxWidth: 480, fontSize: 16, color: N.ink2, lineHeight: 1.55, textWrap: 'pretty' }}>
            Cartaz, redes sociais, voluntários, monitorização de avistamentos. Em segundos, sem formulários.
          </p>

          {/* toggle hint */}
          <div style={{ display: 'inline-flex', marginTop: 36, padding: 3, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 999, gap: 2 }}>
            {[
              { id: 'lost',  label: 'perdi um cão',    accent: N.rose },
              { id: 'found', label: 'encontrei um cão', accent: N.emerald },
            ].map(o => (
              <button key={o.id} onClick={() => setMode(o.id)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 999, border: 'none',
                background: mode === o.id ? N.ink : 'transparent',
                color: mode === o.id ? N.paper : N.ink2,
                fontSize: 13, fontWeight: 500, letterSpacing: '-0.005em',
                transition: 'all .15s ease',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: o.accent }}/>
                {o.label}
              </button>
            ))}
          </div>

          {/* INPUT */}
          <div style={{
            marginTop: 18, position: 'relative', textAlign: 'left',
            background: N.white, border: `1px solid ${N.rule}`,
            borderRadius: 18, padding: '20px 22px 14px',
            boxShadow: '0 1px 0 rgba(11,12,16,.02), 0 14px 36px -10px rgba(11,12,16,.10)',
          }}>
            <div contentEditable suppressContentEditableWarning style={{
              minHeight: 56, outline: 'none', fontSize: 18, color: N.ink, lineHeight: 1.45, letterSpacing: '-0.005em',
            }}>
              {mode === 'lost'
                ? <span>O <strong style={{ fontWeight: 600 }}>Bento</strong> saiu do quintal por volta das 17h. É um labrador castanho com coleira castanha, na zona do Lidl em Faro.</span>
                : <span>Encontrei um cão na zona da estação em Faro. Está bem, é dócil. Pequeno, cinzento, sem coleira.</span>}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12,
              paddingTop: 10, borderTop: `1px solid ${N.ruleSoft}`,
            }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  { icon: 'photo', label: 'foto' },
                  { icon: 'pin',   label: 'local' },
                  { icon: 'clock', label: 'quando' },
                ].map(t => (
                  <button key={t.icon} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '7px 10px', borderRadius: 7, border: 'none', background: 'transparent',
                    color: N.ink3, fontSize: 12.5,
                  }}>
                    <Icon name={t.icon} size={14} color={N.ink3}/> {t.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>
                <span>pt · en · es</span>
                <button style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', borderRadius: 8, border: 'none',
                  background: N.ink, color: N.paper, fontSize: 13, fontWeight: 500, fontFamily: N.sans,
                }}>
                  começar <Icon name="enter" size={12} color={N.paper}/>
                </button>
              </div>
            </div>
          </div>

          <p style={{ margin: '12px 0 0', fontFamily: N.mono, fontSize: 11, color: N.ink4 }}>
            ou <span style={{ color: N.ink, textDecoration: 'underline', textUnderlineOffset: 3 }}>cmd ↵</span>
            &nbsp;·&nbsp; prefere voz?{' '}
            <span style={{ color: N.ink, textDecoration: 'underline', textUnderlineOffset: 3 }}>telegram</span> · <span style={{ color: N.ink, textDecoration: 'underline', textUnderlineOffset: 3 }}>whatsapp</span>
          </p>
        </div>

        {/* Recent reunidos */}
        <div style={{ marginTop: 88, width: '100%', maxWidth: 980 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              reunidos esta semana · 14
            </span>
            <a href="#" style={{ fontSize: 12, color: N.ink2, textDecoration: 'none' }}>ver todos →</a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
            {[
              { n: 'Pipoca', tone: 'rose',  d: '2d', loc: 'Albufeira' },
              { n: 'Luna',   tone: 'moss',  d: '4d', loc: 'Portimão' },
              { n: 'Tito',   tone: 'sand',  d: '5d', loc: 'Lagos' },
              { n: 'Mila',   tone: 'cocoa', d: '6d', loc: 'Loulé' },
              { n: 'Bobi',   tone: 'cream', d: '6d', loc: 'Tavira' },
              { n: 'Suki',   tone: 'slate', d: '1sem', loc: 'Faro' },
              { n: 'Cacau',  tone: 'midnight', d: '1sem', loc: 'Olhão' },
            ].map((d, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <PhotoPlaceholder tone={d.tone} radius={10} ratio="1/1"/>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: N.display, fontSize: 16, letterSpacing: '-0.015em' }}>{d.n}</span>
                  <span style={{ fontFamily: N.mono, fontSize: 10, color: N.ink3 }}>{d.d}</span>
                </div>
                <span style={{ fontSize: 11, color: N.ink3 }}>{d.loc}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer style={{
        padding: '20px 32px', borderTop: `1px solid ${N.rule}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: N.mono, fontSize: 11, color: N.ink3,
      }}>
        <span>nona · open source · made in algarve · 2026</span>
        <span style={{ display: 'flex', gap: 18 }}>
          <span>privacidade</span><span>como funciona</span><span>parceiros</span>
        </span>
      </footer>
    </div>
  );
}

Object.assign(window, { HomeA });
