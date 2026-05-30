// CASE PAGE v4 — smaller but smarter map.
// The map is now a "search guidance" tool: zonas quentes/mornas/frias,
// risk markers (linha do comboio, EN125, Ria Formosa), sighting clusters.
// Photo is the visual hero. Map sits below as a useful tool, not a hero.

// ─── Smart map ────────────────────────────────────────────────────
// Renders Google-Maps-like style, but layered with USEFUL annotations.
function SearchMap({ height = 380 }) {
  const mapBg     = '#F4F0E8';
  const mapPark   = '#D6E8C6';
  const mapWater  = '#C6DCE8';
  const roadMinor = '#FFFFFF';
  const roadMajor = '#FFDFAF';
  const roadHwy   = '#FFC960';
  const text      = '#5C5650';
  const textLight = '#8C8680';

  return (
    <div style={{ width: '100%', height, position: 'relative', overflow: 'hidden', background: mapBg }}>
      <svg viewBox="0 0 1200 480" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {/* parks */}
        <path d="M 80 60 Q 180 40 240 80 L 280 180 Q 200 220 100 200 Z" fill={mapPark} opacity="0.7"/>
        <path d="M 920 320 Q 1020 300 1100 360 L 1140 460 L 940 460 Z" fill={mapPark} opacity="0.55"/>
        <rect x="540" y="380" width="160" height="80" rx="6" fill={mapPark} opacity="0.55"/>
        {/* water (Ria) */}
        <path d="M -20 380 Q 200 360 420 400 T 820 380 T 1240 400 L 1240 540 L -20 540 Z" fill={mapWater} opacity="0.85"/>
        {/* buildings */}
        {[
          [120, 240, 60, 40], [200, 250, 80, 50], [320, 230, 70, 60],
          [450, 230, 90, 50], [580, 220, 60, 60], [680, 240, 80, 50],
          [820, 220, 90, 55], [940, 230, 60, 60], [1040, 220, 80, 50],
          [120, 100, 50, 30], [380, 90, 60, 40], [500, 110, 50, 30],
          [720, 100, 70, 40], [880, 90, 60, 45], [1000, 110, 50, 30],
        ].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx="2" fill="#E8DFCE" opacity="0.65"/>
        ))}
        {/* roads */}
        <path d="M -20 200 Q 320 220 600 200 T 1240 220" stroke={roadHwy} strokeWidth="14" fill="none" strokeLinecap="round"/>
        <path d="M 600 -20 L 580 200 L 620 460" stroke={roadMajor} strokeWidth="10" fill="none"/>
        <path d="M -20 320 Q 400 310 800 330 T 1240 310" stroke={roadMajor} strokeWidth="9" fill="none"/>
        <path d="M 100 -20 L 140 180 L 100 380 L 120 540" stroke={roadMajor} strokeWidth="8" fill="none"/>
        <path d="M 1080 -20 L 1040 200 L 1080 540" stroke={roadMajor} strokeWidth="8" fill="none"/>
        {[
          'M 220 -20 L 240 540',
          'M 360 -20 L 380 540',
          'M 760 -20 L 740 540',
          'M 880 -20 L 900 540',
          'M -20 80 L 1240 90',
          'M -20 280 L 1240 290',
          'M -20 420 L 1240 430',
        ].map((d, i) => <path key={i} d={d} stroke={roadMinor} strokeWidth="4" fill="none"/>)}

        {/* RAILWAY — risk marker */}
        <path d="M -20 360 Q 300 370 600 355 T 1240 355" stroke="#1f2937" strokeWidth="2.5" fill="none" strokeDasharray="0"/>
        <path d="M -20 360 Q 300 370 600 355 T 1240 355" stroke="#9ca3af" strokeWidth="2.5" fill="none" strokeDasharray="2 6"/>

        {/* ROAD LABELS */}
        <text x="640" y="195" fontSize="11" fill={text} fontFamily="Inter Tight, sans-serif" fontWeight="500">N125 — EN125</text>
        <text x="150" y="312" fontSize="10" fill={textLight} fontFamily="Inter Tight, sans-serif">R. de Santo António</text>
        <text x="600" y="410" fontSize="10" fill={textLight} fontFamily="Inter Tight, sans-serif">R. de Lisboa</text>
        <text x="200" y="100" fontSize="10" fill={textLight} fontFamily="Inter Tight, sans-serif">Parque da Alagoa</text>
        <text x="950" y="430" fontSize="11" fill="#5A7C9A" fontFamily="Inter Tight, sans-serif" fontStyle="italic">Ria Formosa</text>
        <text x="380" y="240" fontSize="11" fill={text} fontFamily="Inter Tight, sans-serif">Centro · Faro</text>
        <text x="820" y="320" fontSize="10" fill={textLight} fontFamily="Inter Tight, sans-serif">Estação Faro</text>
        <text x="660" y="350" fontSize="9" fill="#374151" fontFamily="Inter Tight, sans-serif" fontWeight="500" letterSpacing=".05em">LINHA DO COMBOIO</text>

        {/* SEARCH ZONES — concentric, value-add */}
        {/* hot zone — 1km radius */}
        <circle cx="380" cy="265" r="120" fill={N.rose} opacity="0.10" stroke={N.rose} strokeOpacity="0.5" strokeWidth="1.2" strokeDasharray="3 4"/>
        {/* warm zone */}
        <circle cx="380" cy="265" r="220" fill={N.amber} opacity="0.06" stroke={N.amber} strokeOpacity="0.45" strokeWidth="1" strokeDasharray="3 4"/>
        {/* cold zone */}
        <circle cx="380" cy="265" r="330" fill={N.ink3} opacity="0.03" stroke={N.ink3} strokeOpacity="0.3" strokeWidth="1" strokeDasharray="2 5"/>

        {/* zone labels */}
        <text x="380" y="155" fontSize="9.5" fill={N.roseDeep} fontFamily="JetBrains Mono, monospace" fontWeight="500" letterSpacing=".12em" textAnchor="middle">ZONA QUENTE · 0–1h</text>
        <text x="380" y="80" fontSize="9.5" fill={N.amber} fontFamily="JetBrains Mono, monospace" fontWeight="500" letterSpacing=".12em" textAnchor="middle">ZONA MORNA · 1–3h</text>
      </svg>

      {/* PINS */}
      {/* origin — last seen */}
      <MapPin x="31.5%" y="55%" kind="origin" label="Última vez visto" sub="Lidl · 17:00" pulsing/>

      {/* sightings */}
      <MapPin x="50%" y="48%" kind="sight" label="Av. 5 de Outubro" sub="17:10 · cred. média"/>
      <MapPin x="63%" y="68%" kind="sight" label="Estação · 17:35" sub="cred. alta"/>
      <MapPin x="72%" y="65%" kind="sight" fresh label="Estação · 17:42" sub="cred. alta · há 1 min"/>

      {/* RISK MARKERS — small icon pins */}
      <MapRisk x="60%" y="42%" icon="!"  label="EN125 · trânsito intenso"/>
      <MapRisk x="55%" y="74%" icon="~"  label="Linha do comboio"/>
      <MapRisk x="80%" y="86%" icon="~"  label="Ria Formosa (água)"/>

      {/* CHECKPOINTS — useful places */}
      <MapCheck x="13%" y="22%" label="Parque da Alagoa"/>
      <MapCheck x="48%" y="86%" label="Mercado Mun."/>
      <MapCheck x="68%" y="68%" label="Estação"/>

      {/* MAP UI */}
      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8 }}>
        <MapChip><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: N.ink }}><Icon name="layers" size={12}/> camadas</span></MapChip>
        <MapChip><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: N.ink }}><Icon name="sliders" size={12}/> zonas</span></MapChip>
      </div>
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <MapBtn>+</MapBtn>
        <MapBtn>−</MapBtn>
        <MapBtn>⌖</MapBtn>
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
        borderRadius: 8, padding: '8px 12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        display: 'grid', gridTemplateColumns: 'auto auto auto', columnGap: 14, rowGap: 4,
        fontSize: 10.5, color: N.ink2,
      }}>
        <LegendItem dot={N.rose}    label="última vez visto"/>
        <LegendItem dot={N.amber}   label="avistamento"/>
        <LegendItem dot="#1f2937"   label="risco"/>
        <LegendItem ring={N.rose}   label="zona quente · 1km"/>
        <LegendItem ring={N.amber}  label="zona morna · 3km"/>
        <LegendItem dot={N.emerald} label="lugar a verificar"/>
      </div>

      <div style={{
        position: 'absolute', bottom: 12, right: 12,
        background: 'rgba(255,255,255,0.94)',
        borderRadius: 6, padding: '4px 8px',
        fontFamily: N.mono, fontSize: 10, color: N.ink3,
      }}>
        500 m
        <div style={{ display: 'inline-block', verticalAlign: 'middle', width: 40, height: 2, background: N.ink2, marginLeft: 6 }}/>
      </div>
    </div>
  );
}

function MapPin({ x, y, kind = 'sight', label, sub, fresh, pulsing }) {
  const color = kind === 'origin' ? N.rose : N.amber;
  return (
    <div style={{
      position: 'absolute', left: x, top: y, transform: 'translate(-50%, -100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    }}>
      <div style={{
        background: N.ink, color: N.paper, padding: '4px 9px', borderRadius: 6,
        fontSize: 11, fontWeight: 500, lineHeight: 1.3, whiteSpace: 'nowrap', position: 'relative',
        boxShadow: '0 4px 10px rgba(0,0,0,0.18)',
      }}>
        <div>{label}</div>
        {sub && <div style={{ fontSize: 9.5, color: N.ink4, fontFamily: N.mono, marginTop: 1 }}>{sub}</div>}
        <span style={{
          position: 'absolute', bottom: -3, left: '50%', transform: 'translateX(-50%) rotate(45deg)',
          width: 5, height: 5, background: N.ink,
        }}/>
      </div>
      <div style={{ position: 'relative', marginTop: 4 }}>
        {(fresh || pulsing) && (
          <span style={{
            position: 'absolute', inset: -8, borderRadius: '50%',
            border: `2px solid ${color}`, animation: 'nn-ping 2s cubic-bezier(0,0,.2,1) infinite',
          }}/>
        )}
        <svg width="24" height="28" viewBox="0 0 28 32">
          <path d="M14 0 A 12 12 0 0 1 26 12 C 26 22 14 32 14 32 C 14 32 2 22 2 12 A 12 12 0 0 1 14 0 Z" fill={color} stroke="white" strokeWidth="2"/>
          <circle cx="14" cy="12" r="4" fill="white"/>
        </svg>
      </div>
    </div>
  );
}

function MapRisk({ x, y, icon, label }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: 4, background: '#1f2937', color: 'white',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
      }}>{icon}</span>
      <span style={{
        background: 'rgba(255,255,255,0.94)', padding: '3px 8px', borderRadius: 4,
        fontSize: 10.5, fontWeight: 500, color: '#1f2937', whiteSpace: 'nowrap',
        boxShadow: '0 2px 6px rgba(0,0,0,0.10)',
      }}>{label}</span>
    </div>
  );
}

function MapCheck({ x, y, label }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)',
      display: 'flex', alignItems: 'center', gap: 5,
    }}>
      <span style={{
        width: 12, height: 12, borderRadius: 3, background: N.emerald, border: '2px solid white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
      }}/>
      <span style={{
        background: 'rgba(255,255,255,0.92)', padding: '2px 7px', borderRadius: 4,
        fontSize: 10, color: N.emeraldDeep, whiteSpace: 'nowrap', fontWeight: 500,
      }}>{label}</span>
    </div>
  );
}

function MapChip({ children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
      borderRadius: 8, padding: '6px 10px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      display: 'inline-flex', alignItems: 'center',
    }}>{children}</div>
  );
}
function MapBtn({ children }) {
  return (
    <button style={{
      width: 30, height: 30, borderRadius: 6,
      background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
      border: 'none', color: N.ink, fontSize: 14, fontWeight: 500,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer',
    }}>{children}</button>
  );
}
function LegendItem({ dot, ring, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
      {ring
        ? <span style={{ width: 10, height: 10, borderRadius: '50%', border: `1.5px dashed ${ring}` }}/>
        : <span style={{ width: 8,  height: 8,  borderRadius: '50%', background: dot }}/>}
      <span>{label}</span>
    </span>
  );
}

function MetaRow({ label, value, mono }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12,
      padding: '10px 0', borderBottom: `1px solid ${N.ruleSoft}`,
      fontSize: 13.5, lineHeight: 1.4,
    }}>
      <span style={{ color: N.ink3, fontFamily: N.mono, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', paddingTop: 2 }}>
        {label}
      </span>
      <span style={{ color: N.ink, fontWeight: 500, fontFamily: mono ? N.mono : N.sans }}>{value}</span>
    </div>
  );
}

function QRTile({ size = 120 }) {
  const cells = 21;
  const cellSize = size / cells;
  const pattern = React.useMemo(() => {
    const grid = [];
    let seed = 11;
    const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let y = 0; y < cells; y++) {
      const row = [];
      for (let x = 0; x < cells; x++) {
        const inFinder = (x < 7 && y < 7) || (x >= cells-7 && y < 7) || (x < 7 && y >= cells-7);
        row.push(inFinder ? 0 : rand() > 0.52 ? 1 : 0);
      }
      grid.push(row);
    }
    return grid;
  }, []);
  const Finder = ({ x, y }) => (
    <g transform={`translate(${x*cellSize}, ${y*cellSize})`}>
      <rect width={cellSize*7} height={cellSize*7} fill={N.ink}/>
      <rect x={cellSize} y={cellSize} width={cellSize*5} height={cellSize*5} fill={N.white}/>
      <rect x={cellSize*2} y={cellSize*2} width={cellSize*3} height={cellSize*3} fill={N.ink}/>
    </g>
  );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', borderRadius: 6 }}>
      <rect width={size} height={size} fill={N.white}/>
      {pattern.flatMap((row, y) =>
        row.map((c, x) => c ? <rect key={`${x}-${y}`} x={x*cellSize} y={y*cellSize} width={cellSize} height={cellSize} fill={N.ink}/> : null)
      )}
      <Finder x={0} y={0}/>
      <Finder x={cells-7} y={0}/>
      <Finder x={0} y={cells-7}/>
    </svg>
  );
}

function LiveStat({ icon, n, label, sub, accent = N.ink, pulsing }) {
  return (
    <div style={{
      padding: '14px 16px', background: N.white, border: `1px solid ${N.rule}`,
      borderRadius: 12, position: 'relative',
    }}>
      {pulsing && (
        <span style={{
          position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%',
          background: accent, animation: 'nn-pulse 1.6s ease-in-out infinite',
        }}/>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name={icon} size={13} color={accent}/>
        <span style={{ fontFamily: N.mono, fontSize: 10.5, color: N.ink3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{
        marginTop: 6, fontFamily: N.display, fontSize: 36, fontWeight: 400,
        letterSpacing: '-0.025em', lineHeight: 1, color: N.ink,
      }} className="tabnum">
        {n}
      </div>
      {sub && <div style={{ marginTop: 4, fontFamily: N.mono, fontSize: 10.5, color: N.ink3 }}>{sub}</div>}
    </div>
  );
}

// ─── The case page ──────────────────────────────────────────────────
function CasePage() {
  return (
    <div className="nn" style={{ background: N.paper, minHeight: '100%' }}>
      <NonaNav on="casos"/>

      {/* breadcrumb */}
      <div style={{
        padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: N.mono, fontSize: 11.5, color: N.ink3, background: N.paper,
        borderBottom: `1px solid ${N.rule}`,
      }}>
        <a href="#" style={{ color: N.ink3, textDecoration: 'none' }}>casos</a>
        <span>/</span>
        <a href="#" style={{ color: N.ink3, textDecoration: 'none' }}>algarve · faro</a>
        <span>/</span>
        <span style={{ color: N.ink }}>bento-faro-26mai</span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 10, alignItems: 'center' }}>
          <Pill kind="active" size="xs"/>
          <span style={{ color: N.ink3 }}>aberto há 1h 38</span>
          <span style={{ color: N.ink4 }}>·</span>
          <span style={{ color: N.ink3 }}>visto há 12s</span>
        </span>
      </div>

      {/* HERO: photo + name + meta (photo is hero, not map) */}
      <section style={{ padding: '32px 32px 24px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 40 }}>
        <div>
          <PhotoPlaceholder tone="cocoa" label="bento · primary" sub="1600 × 1200" radius={14} ratio="4/3"/>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            {['cocoa','sand','rose'].map((t, i) => (
              <div key={t} style={{ flex: 1 }}>
                <PhotoPlaceholder tone={t} radius={8} ratio="4/3"
                  style={{ outline: i === 0 ? `2px solid ${N.ink}` : 'none', outlineOffset: 2 }}/>
              </div>
            ))}
            <div style={{ flex: 1, borderRadius: 8, border: `1px dashed ${N.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: N.ink3, fontFamily: N.mono, fontSize: 11 }}>
              + avistamento
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Pill kind="lost" size="sm"/>
            <Pill kind="ghost" size="sm" dot={false}>visto há 1h aprox.</Pill>
          </div>

          <h1 style={{
            margin: 0, fontFamily: N.display, fontSize: 104, fontWeight: 400,
            letterSpacing: '-0.04em', lineHeight: 0.9, color: N.ink,
          }}>
            Bento
          </h1>
          <p style={{
            margin: '-6px 0 0', fontFamily: N.display, fontStyle: 'italic',
            fontSize: 22, color: N.ink2, letterSpacing: '-0.01em',
          }}>
            Labrador castanho · macho · 5 anos
          </p>

          <div style={{ borderTop: `1px solid ${N.rule}`, borderBottom: `1px solid ${N.rule}`, marginTop: 4 }}>
            <MetaRow label="Última vez" value="Faro · zona do Lidl"/>
            <MetaRow label="Quando" value="26 mai 2026 · 17:00" mono/>
            <MetaRow label="Cor" value="Castanho dourado, peito branco"/>
            <MetaRow label="Marcas" value="Cicatriz no focinho · coleira castanha"/>
            <MetaRow label="Chip" value="·· ·· 482" mono/>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Btn size="lg" variant="primary" tone="ink" icon={<Icon name="eye" size={16} color={N.paper}/>}>Vi o Bento</Btn>
            <Btn size="lg" variant="ghost" icon={<Icon name="shareUp" size={15}/>}>Partilhar</Btn>
          </div>

          <p style={{ margin: 0, fontSize: 12.5, color: N.ink3, lineHeight: 1.5 }}>
            O contacto do proprietário não é público. Toda a comunicação passa pela equipa Nona.
          </p>
        </div>
      </section>

      {/* STATS — the case is alive */}
      <section style={{ padding: '8px 32px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          <LiveStat icon="trending" n="1 243" label="visitas" sub="+18 nesta hora" accent={N.ink3}/>
          <LiveStat icon="share"    n="47"    label="partilhas" sub="+3 há 2 min · WhatsApp" accent={N.ink3}/>
          <LiveStat icon="eye"      n="3"     label="avistamentos" sub="1 novo · a rever" accent={N.amber} pulsing/>
          <LiveStat icon="users"    n="4"     label="voluntários ativos" sub="1 a caminho · 8 min" accent={N.emerald}/>
          <LiveStat icon="radio"    n="3.2k"  label="alcance" sub="4 grupos FB · 2 IG" accent={N.ink3}/>
        </div>
      </section>

      {/* SEARCH GUIDANCE — map + zones + risks */}
      <section style={{ padding: '12px 32px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 style={{ margin: 0, fontFamily: N.display, fontSize: 26, fontWeight: 400, letterSpacing: '-0.02em' }}>
            Onde procurar.
          </h2>
          <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>
            zonas calculadas pela Nona com base em hora, terreno, avistamentos
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, alignItems: 'stretch' }}>
          {/* map card */}
          <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${N.rule}` }}>
            <SearchMap height={380}/>
          </div>

          {/* zone breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ZoneCard
              kind="hot"
              title="Zona quente"
              ring={N.rose}
              radius="0 – 1 km"
              window="primeira hora"
              instruct="Cães perdidos andam normalmente em círculos próximos do ponto inicial nos primeiros 60 min."
              checkpoints={['Lidl · pq estacionamento', 'R. Santo António', 'Mercado Mun.']}
            />
            <ZoneCard
              kind="warm"
              title="Zona morna"
              ring={N.amber}
              radius="1 – 3 km"
              window="1–3 h"
              instruct="Expandir para parques e zonas com sombra. Levar água."
              checkpoints={['Parque da Alagoa', 'Estação Faro', 'Praça Ferreira d\u2019Almeida']}
            />
            <RiskCard
              title="Riscos imediatos"
              items={[
                { label: 'Linha do comboio', note: 'a 200m sul · evitar' },
                { label: 'EN125', note: 'trânsito intenso · 17h–19h' },
                { label: 'Ria Formosa', note: 'água a 900m · pouco provável' },
              ]}
            />
          </div>
        </div>
      </section>

      {/* BODY: activity feed (lifetime) + sidebar */}
      <section style={{ padding: '8px 32px 48px', display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 32, alignItems: 'flex-start' }}>
        <article>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontFamily: N.display, fontSize: 26, fontWeight: 400, letterSpacing: '-0.02em' }}>
              O que está a acontecer.
            </h2>
            <div style={{ display: 'flex', gap: 6, fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>
              {['Tudo','Avistamentos','Partilhas','Visitas','Agente'].map((f, i) => (
                <button key={f} style={{
                  padding: '4px 10px', borderRadius: 6, border: `1px solid ${i === 0 ? N.ink : N.rule}`,
                  background: i === 0 ? N.ink : N.white, color: i === 0 ? N.paper : N.ink2,
                  fontFamily: N.mono, fontSize: 11, cursor: 'pointer',
                }}>{f}</button>
              ))}
            </div>
          </div>

          <AgentFeed
            title="Atividade do caso"
            subtitle="streaming · auto-refresh 15s"
            events={LIFETIME_EVENTS}
            footer={true}
          />

          {/* description */}
          <div style={{ marginTop: 32 }}>
            <h2 style={{ margin: 0, fontFamily: N.display, fontSize: 24, fontWeight: 400, letterSpacing: '-0.02em' }}>
              "Saiu do quintal."
            </h2>
            <p style={{ margin: '12px 0 0', fontSize: 15.5, color: N.ink2, lineHeight: 1.65, textWrap: 'pretty', maxWidth: 580 }}>
              O Bento é muito sociável e não morde. Conhece o nome mas pode estar
              assustado com o trânsito. Está habituado a comida húmida da Royal Canin.
              Tem uma cicatriz pequena por cima do focinho. Se o vir, por favor não tente
              apanhá-lo sozinho — chame-nos.
            </p>
          </div>
        </article>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 20 }}>
          <div style={{ padding: 20, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 14 }}>
            <h3 style={{ margin: 0, fontFamily: N.display, fontSize: 22, fontWeight: 400, letterSpacing: '-0.02em' }}>
              Partilha em 30 segundos.
            </h3>
            <p style={{ margin: '4px 0 14px', fontSize: 13, color: N.ink2, lineHeight: 1.45 }}>
              Cada partilha aumenta a probabilidade de o Bento voltar a casa.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Btn size="md" variant="ghost" icon={<Icon name="facebook" size={14}/>} full>Facebook</Btn>
              <Btn size="md" variant="ghost" icon={<Icon name="whatsapp" size={14}/>} full>WhatsApp</Btn>
              <Btn size="md" variant="ghost" icon={<Icon name="telegram" size={14}/>} full>Telegram</Btn>
              <Btn size="md" variant="ghost" icon={<Icon name="share" size={14}/>} full>Mais</Btn>
            </div>
            <div style={{
              marginTop: 14, padding: '9px 12px', borderRadius: 8, background: N.surface,
              fontFamily: N.mono, fontSize: 11.5, color: N.ink2,
              display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center',
            }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>nona.pt/r/bento-26mai</span>
              <button style={{ background: 'transparent', border: 'none', color: N.ink, fontFamily: N.mono, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>copiar</button>
            </div>
            <div style={{ marginTop: 10, fontFamily: N.mono, fontSize: 10.5, color: N.ink3, display: 'flex', justifyContent: 'space-between' }}>
              <span>↗ 47 partilhas · +3 nesta hora</span>
              <a href="#" style={{ color: N.ink3, textDecoration: 'none' }}>estatísticas →</a>
            </div>
          </div>

          <div style={{ padding: 18, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 14, display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ padding: 6, background: N.surface, borderRadius: 8 }}>
              <QRTile size={104}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ margin: 0, fontFamily: N.display, fontSize: 18, fontWeight: 400, letterSpacing: '-0.015em' }}>Cartaz pronto.</h4>
              <p style={{ margin: '4px 0 10px', fontSize: 12.5, color: N.ink2, lineHeight: 1.45 }}>
                A4 com QR. Para clínicas, paragens, mercearias.
              </p>
              <Btn size="sm" variant="ghost" icon={<Icon name="download" size={13}/>}>A4 · PT</Btn>
              <p style={{ margin: '8px 0 0', fontFamily: N.mono, fontSize: 10.5, color: N.ink3 }}>
                impressões registadas: 8
              </p>
            </div>
          </div>

          <div style={{ padding: 16, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 14 }}>
            <h4 style={{ margin: 0, fontFamily: N.display, fontSize: 16, fontWeight: 400, letterSpacing: '-0.015em' }}>Próximos passos automáticos</h4>
            <ul style={{ margin: '10px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 8, fontSize: 12.5, color: N.ink2 }}>
              {[
                'recheck visual se houver 5+ avistamentos',
                'update à comunidade em 24h se sem novidades',
                'alerta a clínicas veterinárias se passarem 48h',
              ].map((t, i) => (
                <li key={i} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ marginTop: 5, width: 5, height: 5, borderRadius: '50%', background: N.ink3, flexShrink: 0 }}/>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}

function ZoneCard({ kind, title, ring, radius, window, instruct, checkpoints }) {
  return (
    <div style={{ padding: '14px 16px', background: N.white, border: `1px solid ${N.rule}`, borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', border: `2px dashed ${ring}`, flexShrink: 0, marginTop: 4 }}/>
        <span style={{ fontFamily: N.display, fontSize: 17, fontWeight: 400, letterSpacing: '-0.015em', flex: 1 }}>{title}</span>
        <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>{radius}</span>
      </div>
      <p style={{ margin: '4px 0 8px', fontSize: 12.5, color: N.ink2, lineHeight: 1.45 }}>
        {instruct}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {checkpoints.map(c => (
          <span key={c} style={{
            padding: '3px 8px', borderRadius: 6, background: N.surface,
            fontFamily: N.mono, fontSize: 10.5, color: N.ink2,
          }}>{c}</span>
        ))}
      </div>
    </div>
  );
}

function RiskCard({ title, items }) {
  return (
    <div style={{ padding: '14px 16px', background: '#fff7ed', border: `1px solid #fed7aa`, borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          width: 16, height: 16, borderRadius: 4, background: '#1f2937', color: 'white',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: N.mono, fontSize: 10, fontWeight: 700,
        }}>!</span>
        <span style={{ fontFamily: N.display, fontSize: 17, fontWeight: 400, letterSpacing: '-0.015em' }}>{title}</span>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 5 }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: N.ink2, lineHeight: 1.45 }}>
            <span style={{ color: N.ink, fontWeight: 500 }}>{it.label}</span>
            <span style={{ fontFamily: N.mono, fontSize: 10.5, color: N.ink3 }}>{it.note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

Object.assign(window, { CasePage, SearchMap, QRTile, MetaRow, LiveStat, ZoneCard, RiskCard });
