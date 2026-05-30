// HOME B v2 — "Two directions, one agent."
// Symmetric halves. New ID: cleaner architecture, indigo on one side, emerald on the other.
// Each side reveals the inline input on click; default state shows both choices full-height.

function HomeB() {
  const Side = ({ side, kind, accent, accentBg, deep, ribbon, title, italics, sub, count, countLabel, tone }) => {
    return (
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        padding: '88px 56px 56px', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', background: N.paper,
        borderRight: side === 'L' ? `1px solid ${N.rule}` : 'none',
        minHeight: 720,
      }}>
        {/* faint diagonal stripe of color in corner */}
        <div style={{
          position: 'absolute', top: 0, [side === 'L' ? 'left' : 'right']: 0,
          width: 220, height: 220, opacity: 0.10,
          background: `linear-gradient(${side === 'L' ? '135deg' : '225deg'}, ${accent} 0%, transparent 75%)`,
        }}/>

        {/* photo behind, faded */}
        <div style={{
          position: 'absolute',
          [side === 'L' ? 'right' : 'left']: -120,
          top: 96, width: 320, height: 320, opacity: 0.16,
          borderRadius: '50%', overflow: 'hidden',
        }}>
          <PhotoPlaceholder tone={tone}/>
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Pill kind={kind} size="sm"/>
          <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3, letterSpacing: '0.08em' }}>
            {ribbon}
          </span>
        </div>

        <div style={{ position: 'relative' }}>
          <h2 style={{
            margin: 0, fontFamily: N.display, fontWeight: 400, fontSize: 92,
            letterSpacing: '-0.028em', lineHeight: 0.95, color: N.ink,
          }}>
            {title}<br/>
            <span className="display-italic" style={{ fontStyle: 'italic', color: deep, fontWeight: 400 }}>
              {italics}
            </span>
          </h2>
          <p style={{ margin: '20px 0 0', fontSize: 16, color: N.ink2, lineHeight: 1.55, maxWidth: 380 }}>
            {sub}
          </p>
        </div>

        {/* count + CTA */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, marginBottom: 22 }}>
            <span style={{ fontFamily: N.display, fontSize: 64, color: deep, lineHeight: 1, letterSpacing: '-0.03em' }} className="tabnum">{count}</span>
            <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3, lineHeight: 1.4, maxWidth: 200, paddingBottom: 4 }}>{countLabel}</span>
          </div>

          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 14,
            padding: '14px 20px', background: N.ink, color: N.paper,
            border: 'none', borderRadius: 12, cursor: 'pointer',
            fontSize: 15, fontWeight: 500, fontFamily: N.sans,
            boxShadow: '0 1px 0 rgba(11,12,16,.04), 0 10px 24px -8px rgba(11,12,16,.18)',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: accent }}/>
            {side === 'L' ? 'começar a procurar' : 'começar a procurar dono'}
            <Icon name="arrow" size={15} color={N.paper}/>
          </button>
          <p style={{ margin: '12px 0 0', fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>
            sem cadastro · 30s · privado por defeito
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="nn" style={{ background: N.paper, minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* compact top */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 32px', background: N.paper, position: 'relative', zIndex: 2,
      }}>
        <Logo size={20}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <span style={{ position: 'relative', display: 'inline-block', width: 7, height: 7 }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: N.emerald }}/>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: N.emerald, animation: 'nn-ping 2.2s cubic-bezier(0,0,.2,1) infinite' }}/>
            </span>
            agente online
          </span>
          <a href="#" style={{ color: N.ink3, textDecoration: 'none' }}>casos</a>
          <a href="#" style={{ color: N.ink3, textDecoration: 'none' }}>github</a>
          <span>pt</span>
        </div>
      </header>

      {/* halves */}
      <main style={{ flex: 1, display: 'flex', position: 'relative' }}>
        <Side side="L" kind="lost"
              tone="cocoa"
              accent={N.rose} accentBg={N.roseBg} deep={N.roseDeep}
              ribbon="se o teu cão se perdeu"
              title="Perdi-o."
              italics="Encontra-o."
              sub="Tira uma foto, conta-me o que sabes. Faço cartaz, publico nos grupos do Algarve, notifico voluntários e fico de olho em avistamentos."
              count="12" countLabel="cães à procura agora · algarve"/>
        {/* center divider with node */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: 1, background: N.rule, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: N.paper,
            border: `1px solid ${N.rule}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: N.display, fontStyle: 'italic', fontSize: 18, color: N.ink3,
            boxShadow: '0 4px 14px rgba(11,12,16,0.05)',
          }}>ou</div>
        </div>
        <Side side="R" kind="found"
              tone="moss"
              accent={N.emerald} accentBg={N.emeraldBg} deep={N.emeraldDeep}
              ribbon="se encontraste um cão"
              title="Encontrei-o."
              italics="Devolve-o."
              sub="Uma foto chega. Comparo em segundos contra cães desaparecidos da zona e aviso os donos prováveis. Tu não tens de fazer mais nada."
              count="4" countLabel="cães à espera de dono · hoje"/>
      </main>

      {/* bottom: live snapshot strip — small, factual */}
      <footer style={{
        padding: '20px 32px', borderTop: `1px solid ${N.rule}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 14, background: N.paper, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', fontFamily: N.mono, fontSize: 11.5, color: N.ink3 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: N.indigo }}/>
            <span style={{ color: N.ink, fontWeight: 500 }}>237</span> reuniões em 2026
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: N.amber }}/>
            <span style={{ color: N.ink, fontWeight: 500 }}>12s</span> mediana até primeiro cartaz
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: N.emerald }}/>
            <span style={{ color: N.ink, fontWeight: 500 }}>16</span> municípios cobertos
          </span>
        </div>
        <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink4 }}>
          nona · open source · sem ads · sem login
        </span>
      </footer>
    </div>
  );
}

Object.assign(window, { HomeB });
