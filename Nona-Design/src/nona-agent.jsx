// Agent activity — the BREAKTHROUGH from the terminal aesthetic.
// Same technical content, but presented as a clean activity feed.
// Each entry is a card-like row with mono accents — not a console blob.
// Two variants: AgentFeed (full, structured) + LiveBadge (compact pulsing inline)

// ─── Atomic event row ────────────────────────────────────────────────
// Looks like a Linear/Granola activity row: small monogram, label, mono detail, time.
function EventRow({ ev, fresh = false, animate = false, delay = 0 }) {
  const [shown, setShown] = React.useState(!animate);
  React.useEffect(() => {
    if (!animate) return;
    const id = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(id);
  }, [delay, animate]);

  const kindMeta = {
    tool:    { bg: N.indigoBg,  fg: N.indigo,    glyph: '⌘' },
    think:   { bg: N.surface,   fg: N.ink3,      glyph: '…' },
    share:   { bg: N.surface,   fg: N.ink2,      glyph: '↗' },
    visit:   { bg: N.surface,   fg: N.ink2,      glyph: '○' },
    sighting:{ bg: N.amberBg,   fg: N.amber,     glyph: '◆' },
    resolve: { bg: N.emeraldBg, fg: N.emerald,   glyph: '✓' },
    error:   { bg: N.roseBg,    fg: N.rose,      glyph: '!' },
  }[ev.kind] || { bg: N.surface, fg: N.ink2, glyph: '·' };

  const isLive = ev.status === 'live';

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '26px 1fr auto', gap: 12,
      padding: '10px 0', borderBottom: `1px solid ${N.ruleSoft}`,
      alignItems: 'flex-start',
      opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateY(3px)',
      transition: 'opacity .35s ease, transform .35s ease',
      position: 'relative',
    }}>
      {/* fresh-event vertical accent */}
      {fresh && (
        <span style={{
          position: 'absolute', left: -16, top: 12, width: 2, height: 12, borderRadius: 1,
          background: N.amber,
        }}/>
      )}

      {/* glyph cell */}
      <span style={{
        width: 22, height: 22, borderRadius: 6,
        background: kindMeta.bg, color: kindMeta.fg,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: N.mono, fontSize: 11, fontWeight: 600, marginTop: 1,
      }}>
        {isLive ? (
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: kindMeta.fg,
            animation: 'nn-pulse 1.6s ease-in-out infinite',
          }}/>
        ) : kindMeta.glyph}
      </span>

      {/* body */}
      <span style={{ minWidth: 0 }}>
        {ev.kind === 'tool' && (
          <span style={{ fontSize: 13.5, color: N.ink, lineHeight: 1.45 }}>
            <span style={{ fontWeight: 500 }}>{ev.label}</span>
            {ev.code && (
              <span style={{ marginLeft: 8, fontFamily: N.mono, fontSize: 12, color: N.ink3, background: N.surface, padding: '1px 6px', borderRadius: 4 }}>
                {ev.code}
              </span>
            )}
            {ev.result && (
              <span style={{ display: 'block', marginTop: 4, fontFamily: N.mono, fontSize: 11.5, color: N.ink3 }}>
                <span style={{ color: N.emerald, marginRight: 6 }}>↳</span>{ev.result}
              </span>
            )}
            {isLive && (
              <span style={{ marginLeft: 8, fontFamily: N.mono, fontSize: 10.5, color: N.amber, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                · streaming
              </span>
            )}
          </span>
        )}
        {ev.kind === 'think' && (
          <span style={{ fontSize: 13, color: N.ink3, fontStyle: 'italic', lineHeight: 1.45 }}>{ev.label}</span>
        )}
        {['share','visit','sighting','resolve'].includes(ev.kind) && (
          <span style={{ fontSize: 13.5, color: N.ink, lineHeight: 1.45 }}>
            <span style={{ fontWeight: 500 }}>{ev.label}</span>
            {ev.detail && (
              <span style={{ marginLeft: 8, fontSize: 12.5, color: N.ink3 }}>{ev.detail}</span>
            )}
          </span>
        )}
      </span>

      {/* time */}
      <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3, whiteSpace: 'nowrap', paddingTop: 3 }}>
        {ev.t}
      </span>
    </div>
  );
}

// ─── Agent feed (light, elegant) ────────────────────────────────────
// Used in case page + intake right rail. NO terminal aesthetic.
function AgentFeed({ events, title = 'Atividade', subtitle, animate = false, dense = false, footer, style = {} }) {
  const counts = React.useMemo(() => ({
    total: events.length,
    live: events.filter(e => e.status === 'live').length,
  }), [events]);

  return (
    <section style={{
      background: N.white, border: `1px solid ${N.rule}`, borderRadius: 14,
      overflow: 'hidden', ...style,
    }}>
      {/* header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', borderBottom: `1px solid ${N.ruleSoft}`, background: N.paper,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 24, height: 24, borderRadius: 6, background: N.ink,
            color: N.paper, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="activity" size={13} color={N.paper} sw={2}/>
          </span>
          <span style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.005em' }}>{title}</span>
          {subtitle && <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>· {subtitle}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {counts.live > 0 && <Pill kind="live" size="xs">{counts.live} live</Pill>}
          <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>auto-atualizado</span>
        </div>
      </header>

      {/* events */}
      <div style={{ padding: dense ? '4px 18px' : '6px 18px 10px' }}>
        {events.map((ev, i) => (
          <EventRow key={i} ev={ev} fresh={ev.fresh} animate={animate} delay={i * 200}/>
        ))}
      </div>

      {footer !== false && (
        <footer style={{
          padding: '10px 18px', borderTop: `1px solid ${N.ruleSoft}`, background: N.paper,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
          fontFamily: N.mono, fontSize: 11, color: N.ink3,
        }}>
          <span>{counts.total} ações</span>
          <span style={{ display: 'flex', gap: 14 }}>
            <a href="#" style={{ color: N.ink3, textDecoration: 'none' }}>filtros</a>
            <a href="#" style={{ color: N.ink3, textDecoration: 'none' }}>exportar</a>
            <a href="#" style={{ color: N.indigo, textDecoration: 'none' }}>chamadas técnicas →</a>
          </span>
        </footer>
      )}
    </section>
  );
}

// ─── Intake events (the onboarding sequence) ───────────────────────
const INTAKE_EVENTS = [
  { t: '17:14:02', kind: 'think', label: 'recebi o pedido — cão perdido, 2 fotos' },
  { t: '17:14:03', kind: 'tool', label: 'Identifiquei o cão',
    code: 'vision.identify_breed(img_4821)',
    result: 'labrador · castanho · macho · ~5 anos · confiança 0.94' },
  { t: '17:14:05', kind: 'tool', label: 'Verifiquei contra cães encontrados',
    code: 'pgvector.search(k=20, region=algarve)',
    result: '0 coincidências acima do limiar (0.82)' },
  { t: '17:14:06', kind: 'tool', label: 'Normalizei a localização',
    code: 'geocode.normalize("perto do Lidl, Faro")',
    result: '37.020 N, −7.930 W · raio aproximado 600m' },
  { t: '17:14:07', kind: 'tool', label: 'Criei a página pública',
    code: 'case.create(kind=lost, region=faro)',
    result: 'nona.pt/bento-faro-26mai' },
  { t: '17:14:09', kind: 'tool', label: 'Gerei o cartaz A4',
    code: 'poster.generate_a4(template=pt-pt)',
    result: 'poster.pdf · 1.4 MB · QR incluído' },
  { t: '17:14:11', kind: 'tool', label: 'Publiquei em 4 grupos do Facebook',
    code: 'facebook.post(groups=[…])',
    result: '4 / 4 publicados · 3.2k membros alcançáveis' },
  { t: '17:14:13', kind: 'tool', label: 'Notifiquei voluntários da zona',
    code: 'volunteers.notify(radius=8km)',
    result: '3 voluntários ativos · push enviado' },
  { t: '17:14:14', kind: 'think', label: 'a abrir canais de avistamento' },
  { t: '17:14:14', kind: 'tool', label: 'Canal de avistamentos aberto',
    code: 'sightings.open_channel()', status: 'live' },
];

// ─── Lifetime events (case page — feed never dies) ─────────────────
const LIFETIME_EVENTS = [
  { t: 'há 12s',   kind: 'sighting', label: 'Novo avistamento',
    detail: 'zona da Estação · Faro · credibilidade alta · a rever', fresh: true },
  { t: 'há 2 min', kind: 'share',    label: '+3 partilhas no Facebook',
    detail: 'SOS Animais Faro · Cães do Algarve · Faro Cãezitos' },
  { t: 'há 4 min', kind: 'tool',     label: 'Nova verificação visual',
    code: 'vision.recheck(threshold=0.75)',
    result: '2 candidatos parciais — abaixo do limiar' },
  { t: 'há 6 min', kind: 'visit',    label: '+18 visitas',
    detail: 'maioria via WhatsApp · cartaz QR · 4 via Instagram' },
  { t: 'há 14 min', kind: 'tool',    label: 'Voluntário a caminho',
    code: 'volunteers.dispatch(@joao_silva)',
    result: 'a chegar à zona da Estação em ~8 min' },
  { t: 'há 22 min', kind: 'sighting', label: 'Avistamento confirmado',
    detail: 'parque do Lidl · 17:35 · credibilidade alta' },
  { t: 'há 31 min', kind: 'share',   label: '+12 partilhas no WhatsApp',
    detail: 'cluster: zona da estação' },
  { t: 'há 1 h',   kind: 'tool',     label: 'Cartaz partilhado em mais 2 grupos',
    code: 'facebook.post(group="albufeira-caes")',
    result: '+1.1k membros alcançáveis' },
  { t: 'há 1h 12', kind: 'visit',    label: 'Pico de visitas',
    detail: '+82 em 10 min · primeira partilha viral · @paulasilva' },
  { t: 'há 1h 38', kind: 'tool',     label: 'Caso criado',
    code: 'case.create()', result: 'bento-faro-26mai' },
];

Object.assign(window, { AgentFeed, EventRow, INTAKE_EVENTS, LIFETIME_EVENTS });
