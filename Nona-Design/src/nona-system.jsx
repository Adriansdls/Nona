// Nona v2 — fresh visual identity.
// Goal: break away from "warm editorial Anthropic" default.
// Now: paperwhite + electric indigo + vivid rose + emerald.
// Type: Instrument Serif (display, didone) + Inter Tight (UI) + JetBrains Mono (data).

const N = {
  // surfaces
  paper:    '#fafaf7',         // very faint warmth, not cream
  white:    '#ffffff',
  surface:  '#f4f4f1',         // surface variant
  ink:      '#0b0c10',         // cool near-black
  ink2:     '#3a3d45',
  ink3:     '#6b6e78',
  ink4:     '#9a9da6',
  rule:     '#e6e6e1',
  ruleSoft: '#eeeeea',
  // accents (functional only — ink is the primary)
  indigo:    '#4f46e5',        // utility — activity feed bullets only
  indigoBg:  '#eef2ff',
  indigoDeep:'#3730a3',
  rose:      '#e11d48',        // lost / urgent / active
  roseBg:    '#fff1f2',
  roseDeep:  '#9f1239',
  emerald:   '#059669',        // found / resolved / success
  emeraldBg: '#ecfdf5',
  emeraldDeep:'#065f46',
  amber:     '#d97706',        // live / streaming / attention
  amberBg:   '#fffbeb',
  // type
  display: '"Instrument Serif", "GT Sectra", Georgia, serif',
  sans:    '"Inter Tight", "Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  mono:    '"JetBrains Mono", "SF Mono", ui-monospace, monospace',
};

if (typeof document !== 'undefined' && !document.getElementById('nona-base')) {
  const s = document.createElement('style');
  s.id = 'nona-base';
  s.textContent = `
    .nn { font-family: ${N.sans}; color: ${N.ink}; -webkit-font-smoothing: antialiased; font-feature-settings: "cv11" on, "ss01" on; letter-spacing: -0.011em; }
    .nn h1, .nn h2, .nn h3, .nn .display { font-family: ${N.display}; font-weight: 400; letter-spacing: -0.018em; }
    .nn .display-italic { font-style: italic; }
    .nn .mono { font-family: ${N.mono}; font-feature-settings: "ss01" on, "cv11" on, "zero" on; }
    .nn button { font-family: inherit; cursor: pointer; }
    .nn ::selection { background: ${N.indigo}; color: white; }
    .nn input, .nn textarea, .nn button { font-family: inherit; }
    .nn .tabnum { font-variant-numeric: tabular-nums; }
    @keyframes nn-pulse  { 0%,100%{opacity:1} 50%{opacity:.35} }
    @keyframes nn-ping   { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.6);opacity:0} }
    @keyframes nn-tick   { 0%{transform:scale(.5);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
    @keyframes nn-spin   { from{transform:rotate(0)} to{transform:rotate(360deg)} }
    @keyframes nn-fadeUp { from{opacity:0; transform: translateY(6px)} to{opacity:1; transform: none} }
    @keyframes nn-blink  { 0%,49%{opacity:1} 50%,100%{opacity:0} }
    .nn .caret::after { content:''; display:inline-block; width:.5em; height:1em; vertical-align:-.15em; background:currentColor; margin-left:2px; animation: nn-blink 1.1s steps(1) infinite; }
  `;
  document.head.appendChild(s);
}

// ─── Wordmark ────────────────────────────────────────────────────────
function Logo({ size = 18, color, withMark = true }) {
  const c = color || N.ink;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: size * 0.4,
      fontFamily: N.display, fontWeight: 400, fontSize: size * 1.15,
      letterSpacing: '-0.025em', color: c, lineHeight: 1,
    }}>
      {withMark && (
        <span style={{
          width: size * 0.9, height: size * 0.9, borderRadius: 6,
          background: c, color: 'transparent', position: 'relative', display: 'inline-block',
        }}>
          {/* tiny cross of "+" — sym of a tag / find */}
          <span style={{
            position: 'absolute', inset: '24%', display: 'block',
            background: `linear-gradient(90deg, transparent 43%, ${N.paper} 43%, ${N.paper} 57%, transparent 57%),
                         linear-gradient(0deg,  transparent 43%, ${N.paper} 43%, ${N.paper} 57%, transparent 57%)`,
          }}/>
        </span>
      )}
      <span>nona</span>
    </span>
  );
}

// ─── Photo placeholder ───────────────────────────────────────────────
function PhotoPlaceholder({ tone = 'cocoa', label, sub, ratio, w, h, radius = 0, style = {} }) {
  const tones = {
    cocoa:    ['#a08a73', '#5e4d3e'],
    sand:     ['#cfb898', '#8f7a5e'],
    rose:     ['#c39684', '#8a5746'],
    moss:     ['#9ba78a', '#5e6c52'],
    slate:    ['#9c9d9e', '#5d5e60'],
    cream:    ['#dccfb9', '#b1a283'],
    midnight: ['#3e3a36', '#0f0e0c'],
  };
  const [a, b] = tones[tone] || tones.cocoa;
  const dims = ratio ? { width: w || '100%', aspectRatio: ratio } : { width: w || '100%', height: h || '100%' };
  return (
    <div style={{
      ...dims, borderRadius: radius, overflow: 'hidden', position: 'relative',
      background: `linear-gradient(135deg, ${a} 0%, ${b} 100%)`,
      ...style,
    }}>
      <div style={{ position: 'absolute', inset: 0,
                    background: `radial-gradient(ellipse at 40% 30%, rgba(255,255,255,0.18) 0%, transparent 50%),
                                 repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 22px, rgba(0,0,0,0.025) 22px 44px)` }}/>
      {label && (
        <div style={{
          position: 'absolute', left: 10, bottom: 8, right: 10,
          fontFamily: N.mono, fontSize: 9.5, letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase',
          display: 'flex', justifyContent: 'space-between', gap: 8,
        }}>
          <span>{label}</span>
          {sub && <span style={{ opacity: 0.7 }}>{sub}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Pill / status tag ───────────────────────────────────────────────
function Pill({ kind = 'active', children, dot = true, size = 'sm', mono = true, style = {} }) {
  const cfg = {
    active:   { bg: N.roseBg,    fg: N.roseDeep,    label: 'ATIVO' },
    lost:     { bg: N.roseBg,    fg: N.roseDeep,    label: 'PERDIDO' },
    found:    { bg: N.emeraldBg, fg: N.emeraldDeep, label: 'ENCONTRADO' },
    resolved: { bg: N.emeraldBg, fg: N.emeraldDeep, label: 'REUNIDO' },
    live:     { bg: N.amberBg,   fg: N.amber,       label: 'LIVE' },
    indigo:   { bg: N.indigoBg,  fg: N.indigoDeep,  label: '' },
    ghost:    { bg: 'transparent', fg: N.ink3, label: '', border: `1px solid ${N.rule}` },
  }[kind] || {};
  const sizes = {
    xs: { p: '2px 7px',  fs: 10,   dot: 5, gap: 5 },
    sm: { p: '3px 9px',  fs: 10.5, dot: 5, gap: 6 },
    md: { p: '5px 11px', fs: 11.5, dot: 6, gap: 7 },
  }[size];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: sizes.gap,
      padding: sizes.p, borderRadius: 999,
      background: cfg.bg, color: cfg.fg, border: cfg.border,
      fontFamily: mono ? N.mono : N.sans, fontSize: sizes.fs, fontWeight: 500,
      letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1, ...style,
    }}>
      {dot && <span style={{
        width: sizes.dot, height: sizes.dot, borderRadius: '50%', background: cfg.fg, flexShrink: 0,
        animation: ['live','active','lost'].includes(kind) ? 'nn-pulse 1.8s ease-in-out infinite' : 'none',
      }}/>}
      {children || cfg.label}
    </span>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────
function Icon({ name, size = 16, color = 'currentColor', sw = 1.5 }) {
  const p = {
    arrow:     <path d="M5 12h14M13 6l6 6-6 6"/>,
    arrowUp:   <path d="M5 12 12 5l7 7M12 19V5"/>,
    arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6"/>,
    enter:     <path d="M9 10v3a1 1 0 0 0 1 1h9m0 0-3-3m3 3-3 3M4 6h3"/>,
    plus:      <path d="M12 5v14M5 12h14"/>,
    check:     <polyline points="4 12.5 9 17.5 20 6.5"/>,
    spark:     <path d="M12 3 13.6 9.4 20 11l-6.4 1.6L12 19l-1.6-6.4L4 11l6.4-1.6L12 3z"/>,
    camera:    <g><path d="M3 8h3l2-3h8l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/></g>,
    photo:     <g><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="m3 17 5-5 5 5 3-3 5 5"/></g>,
    pin:       <g><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></g>,
    clock:     <g><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></g>,
    eye:       <g><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></g>,
    share:     <g><circle cx="6" cy="12" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="m9 11 7-4M9 13l7 4"/></g>,
    shareUp:   <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14"/>,
    download:  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>,
    chevron:   <path d="m9 6 6 6-6 6"/>,
    chevronDown:<path d="m6 9 6 6 6-6"/>,
    close:     <path d="M6 6l12 12M6 18 18 6"/>,
    info:      <g><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 8v.5"/></g>,
    search:    <g><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></g>,
    facebook:  <path d="M15 8h-2a1 1 0 0 0-1 1v3h3l-1 4h-2v6h-4v-6H6v-4h2V8a4 4 0 0 1 4-4h3z"/>,
    whatsapp:  <g><path d="M20.5 12a8.5 8.5 0 1 1-15.7-4.5L3.5 12.5l4.7-1.2A8.5 8.5 0 0 0 20.5 12z"/></g>,
    telegram:  <path d="m22 3-3 18-7-7-4 4v-5l11-10-13 8L2 9z"/>,
    chat:      <path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12z"/>,
    paw:       <g><circle cx="6.5" cy="11" r="2"/><circle cx="17.5" cy="11" r="2"/><circle cx="9" cy="6.5" r="2"/><circle cx="15" cy="6.5" r="2"/><path d="M7 17c0-3 2-5 5-5s5 2 5 5-2 3-5 3-5 0-5-3z"/></g>,
    bolt:      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>,
    sparkle:   <g><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/><path d="M5.6 5.6l4.2 4.2M14.2 14.2l4.2 4.2M5.6 18.4l4.2-4.2M14.2 9.8l4.2-4.2"/></g>,
    layers:    <g><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></g>,
    activity:  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>,
    radio:     <g><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 7.8a6 6 0 0 0 0 8.4M19 5a10 10 0 0 1 0 14M5 5a10 10 0 0 0 0 14"/></g>,
    globe:     <g><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></g>,
    sliders:   <g><path d="M4 8h12M20 8h0M4 16h4M12 16h8"/><circle cx="18" cy="8" r="2"/><circle cx="10" cy="16" r="2"/></g>,
    trending:  <path d="m23 6-9.5 9.5-5-5L1 18M17 6h6v6"/>,
    users:     <g><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M22 21a6 6 0 0 0-6-6"/><circle cx="17" cy="9" r="3"/></g>,
    map:       <g><path d="m1 6 7-3 8 3 7-3v15l-7 3-8-3-7 3z"/><path d="M8 3v15M16 6v15"/></g>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {p[name]}
    </svg>
  );
}

// ─── Button ──────────────────────────────────────────────────────────
function Btn({ variant = 'primary', size = 'md', tone = 'ink', icon, iconRight, children, full, onClick, style = {} }) {
  const toneFg = { ink: N.ink, indigo: N.indigo, rose: N.rose, emerald: N.emerald }[tone];
  const sizes = {
    sm: { p: '6px 11px', fs: 13, h: 32, r: 8 },
    md: { p: '9px 14px', fs: 13.5, h: 38, r: 9 },
    lg: { p: '13px 20px', fs: 15, h: 48, r: 11 },
  }[size];
  const v = {
    primary: { bg: toneFg, fg: 'white', bd: `1px solid ${toneFg}` },
    soft:    { bg: tone === 'indigo' ? N.indigoBg : tone === 'rose' ? N.roseBg : N.surface, fg: toneFg, bd: '1px solid transparent' },
    ghost:   { bg: N.white, fg: N.ink, bd: `1px solid ${N.rule}` },
    text:    { bg: 'transparent', fg: toneFg, bd: '1px solid transparent' },
  }[variant];
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
      padding: sizes.p, height: sizes.h, minHeight: sizes.h, width: full ? '100%' : 'auto',
      borderRadius: sizes.r, border: v.bd, background: v.bg, color: v.fg,
      fontSize: sizes.fs, fontWeight: 500, letterSpacing: '-0.005em',
      transition: 'transform .08s ease, opacity .15s ease',
      whiteSpace: 'nowrap', ...style,
    }}>
      {icon}{children}{iconRight}
    </button>
  );
}

// ─── Nav (top) ───────────────────────────────────────────────────────
function NonaNav({ on }) {
  const Item = ({ k, label }) => (
    <a href="#" style={{
      fontSize: 13, color: on === k ? N.ink : N.ink3, textDecoration: 'none',
      fontWeight: on === k ? 600 : 500,
    }}>{label}</a>
  );
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 32px', background: N.paper,
      borderBottom: `1px solid ${N.rule}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <Logo size={18}/>
        <nav style={{ display: 'flex', gap: 22 }}>
          <Item k="casos" label="Casos"/>
          <Item k="como"  label="Como funciona"/>
          <Item k="comm"  label="Comunidade"/>
          <Item k="api"   label="API · docs"/>
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ position: 'relative', display: 'inline-block', width: 7, height: 7 }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: N.emerald }}/>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: N.emerald, animation: 'nn-ping 2.2s cubic-bezier(0,0,.2,1) infinite' }}/>
          </span>
          agente online
        </span>
        <span style={{ color: N.ink4 }}>·</span>
        <span>pt</span>
      </div>
    </header>
  );
}

Object.assign(window, { N, Logo, PhotoPlaceholder, Pill, Icon, Btn, NonaNav });
