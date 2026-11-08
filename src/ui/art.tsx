import { useId, type ReactNode } from 'react';

/* Inline-SVG artwork for Startup Survivor. Colors come from CSS custom properties
   (--art-*) so the set themes in light and dark. No images, fonts or dependencies. */

const BODY = 'var(--art-body, #F2B33D)';
const ACCENT = 'var(--art-accent, #D9481E)';
const INK = 'var(--art-ink, #1F2A30)';
const CREAM = 'var(--art-cream, #FFF6E5)';
const TEAL = 'var(--art-teal, #1F7A6D)';
const SKY = 'var(--art-sky, #CFE8E4)';

type ArtProps = { className?: string; title?: string };
export type TruckVariant = 'used' | 'refurbished' | 'premium';

function Svg({
  vb,
  className,
  title,
  par,
  children,
}: ArtProps & { vb: [number, number]; par?: string; children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${vb[0]} ${vb[1]}`}
      width={vb[0]}
      height={vb[1]}
      preserveAspectRatio={par}
      className={className}
      fill="none"
      focusable="false"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

const useUid = () => useId().replace(/:/g, '');
const r1 = (n: number) => Math.round(n * 10) / 10;

/* ------------------------------------------------------------------ Trucks */

const SPEC: Record<TruckVariant, { W: number; bt: number; n: number; ww: number }> = {
  used: { W: 320, bt: 118, n: 1, ww: 150 },
  refurbished: { W: 380, bt: 100, n: 1, ww: 170 },
  premium: { W: 450, bt: 100, n: 2, ww: 130 },
};
const CAB = 110;
const GROUND = 302;
const truckWidth = (v: TruckVariant) => SPEC[v].W + CAB;

/** Side-view truck in local coordinates: x 0..W+110, wheels touch y=302. */
function TruckBody({ variant, name }: { variant: TruckVariant; name?: string }) {
  const uid = useUid();
  const { W, bt, n, ww } = SPEC[variant];
  const premium = variant === 'premium';
  const used = variant === 'used';
  const label = (name ?? '').trim().slice(0, 18);
  const signW = W - 40;
  const boardX = 24 + n * ww + (n - 1) * 16 + 20;
  const wheels = premium ? [W * 0.16, W * 0.16 + 80, W + 55] : [W * 0.2, W + 55];
  const cab = `M${W - 10} 270V140H${W + 60}Q${W + 76} 140 ${W + 86} 158L${W + 103} 202Q${W + 110} 214 ${W + 110} 232V270Z`;

  return (
    <g>
      <defs>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".3" />
          <stop offset="1" stopColor="#000" stopOpacity=".14" />
        </linearGradient>
        <clipPath id={`${uid}c`}>
          <rect x="0" y={bt} width={W} height={270 - bt} rx="18" />
          <path d={cab} />
        </clipPath>
      </defs>
      <ellipse cx={(W + CAB) / 2} cy={GROUND + 1} rx={(W + CAB) / 2 + 12} ry="9" fill={INK} opacity=".2" />
      <rect x="-4" y="264" width={W + CAB + 8} height="12" rx="6" fill={INK} />

      {/* body, stripe, shading (clipped to box + cab silhouette) */}
      <g clipPath={`url(#${uid}c)`}>
        <rect x="0" y={bt} width={W + CAB} height={270 - bt} fill={BODY} />
        <rect x="0" y="244" width={W + CAB} height="16" fill={ACCENT} />
        <rect x="0" y="260" width={W + CAB} height="10" fill={INK} opacity=".16" />
        <rect x="0" y={bt} width={W + CAB} height="170" fill={`url(#${uid}g)`} />
      </g>
      <path d={`M${W} 140V262`} stroke={INK} strokeOpacity=".25" strokeWidth="2" />
      <rect x={W * 0.6} y={bt - 8} width="40" height="8" rx="3" fill={INK} opacity=".55" />
      {premium && <rect x="10" y={bt - 6} width={W - 20} height="6" rx="3" fill={SKY} stroke={INK} strokeOpacity=".3" />}
      {premium && <rect x="0" y={bt + 134} width={W} height="3" fill={SKY} opacity=".9" />}

      {/* sign */}
      <rect x="20" y={bt + 10} width={signW} height="30" rx="10" fill={CREAM} stroke={INK} strokeOpacity=".2" />
      {label ? (
        <text
          x={W / 2}
          y={bt + 31}
          textAnchor="middle"
          fontFamily="inherit"
          fontSize="17"
          fontWeight="800"
          fill={INK}
          textLength={label.length > 14 ? Math.min(label.length * 10, signW - 28) : undefined}
          lengthAdjust="spacingAndGlyphs"
        >
          {label}
        </text>
      ) : (
        <rect x={W / 2 - 40} y={bt + 21} width="80" height="8" rx="4" fill={ACCENT} opacity=".7" />
      )}

      {/* serving windows with awnings */}
      {Array.from({ length: n }, (_, i) => {
        const x = 24 + i * (ww + 16);
        const cnt = Math.round((ww + 16) / 18);
        const sw = (ww + 16) / cnt;
        return (
          <g key={i}>
            <rect x={x} y={bt + 62} width={ww} height="58" rx="5" fill={INK} opacity=".92" />
            <rect x={x + 5} y={bt + 67} width={ww - 10} height="48" rx="3" fill={BODY} opacity=".22" />
            <path d={`M${x + 14} ${bt + 100}h${ww - 28}`} stroke={CREAM} strokeOpacity=".35" strokeWidth="3" strokeLinecap="round" />
            <rect x={x - 6} y={bt + 120} width={ww + 12} height="9" rx="3" fill={CREAM} stroke={INK} strokeOpacity=".2" />
            {Array.from({ length: cnt }, (_, k) => (
              <path
                key={k}
                d={`M${r1(x - 8 + k * sw)} ${bt + 48}h${r1(sw)}v16a${r1(sw / 2)} 7 0 0 1 ${r1(-sw)} 0z`}
                fill={k % 2 ? CREAM : ACCENT}
                stroke={INK}
                strokeOpacity=".15"
              />
            ))}
          </g>
        );
      })}

      {/* menu board (lines only, no text) */}
      <rect x={boardX} y={bt + 58} width="60" height="64" rx="6" fill={INK} />
      <circle cx={boardX + 12} cy={bt + 72} r="4" fill={BODY} />
      {[72, 86, 100, 112].map((dy, k) => (
        <path key={dy} d={`M${boardX + (k ? 10 : 22)} ${bt + dy}h${k % 2 ? 30 : 40}`} stroke={CREAM} strokeOpacity=".7" strokeWidth="3" strokeLinecap="round" />
      ))}

      {/* bowl roundel */}
      <circle cx={W - 34} cy="252" r="16" fill={CREAM} stroke={INK} strokeOpacity=".2" />
      <g transform={`translate(${W - 34 - 14.4} ${252 - 14.4}) scale(.6)`}>
        <BowlG />
      </g>

      {used && (
        <g>
          <rect x={W - 62} y={bt + 64} width="40" height="34" rx="4" fill={INK} fillOpacity=".12" stroke={INK} strokeOpacity=".4" strokeDasharray="3 2" />
          {[[W - 58, bt + 68], [W - 26, bt + 68], [W - 58, bt + 94], [W - 26, bt + 94]].map(([cx, cy]) => (
            <circle key={`${cx}${cy}`} cx={cx} cy={cy} r="1.6" fill={INK} opacity=".55" />
          ))}
          <path d={`M14 ${bt + 138}q16 -12 34 -2`} stroke={INK} strokeOpacity=".3" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}

      {/* cab details */}
      <path d={`M${W + 12} 152H${W + 58}Q${W + 65} 152 ${W + 70} 161L${W + 86} 196H${W + 12}Z`} fill={SKY} stroke={INK} strokeOpacity=".5" strokeWidth="2" strokeLinejoin="round" />
      <path d={`M${W + 20} 196L${W + 38} 152H${W + 50}L${W + 32} 196Z`} fill="#fff" opacity=".3" />
      <rect x={W + 66} y="212" width="14" height="4" rx="2" fill={INK} opacity=".6" />
      <circle cx={W + 102} cy="236" r="6" fill={CREAM} stroke={INK} strokeOpacity=".4" />
      <rect x={W + 90} y="258" width="26" height="10" rx="5" fill={premium ? SKY : INK} stroke={INK} strokeOpacity=".4" />

      {/* wheels */}
      {wheels.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="270" r="37" fill={INK} opacity=".55" />
          <circle cx={cx} cy="272" r="30" fill={INK} />
          <circle cx={cx} cy="272" r="14" fill={premium ? SKY : CREAM} />
          <circle cx={cx} cy="272" r="5" fill={INK} />
          <path d={`M${cx - 14} 272h28M${cx} 258v28`} stroke={INK} strokeOpacity=".3" strokeWidth="2" />
        </g>
      ))}
    </g>
  );
}

const SKYLINE_BACK: [number, number, number][] = [
  [0, 46, 80], [46, 40, 118], [86, 56, 70], [142, 38, 140], [180, 50, 96],
  [440, 44, 110], [484, 52, 74], [536, 40, 150], [576, 64, 100],
];

export function TruckHero({ name, size = 'refurbished', className, title }: ArtProps & { name: string; size?: TruckVariant }) {
  const uid = useUid();
  const x0 = (640 - truckWidth(size)) / 2;
  // string lights: quadratic curve with bulbs along it
  const P = (t: number, a: number, b: number, c: number) => (1 - t) ** 2 * a + 2 * (1 - t) * t * b + t * t * c;
  const bulbs = Array.from({ length: 15 }, (_, i) => {
    const t = (i + 0.5) / 15;
    return { x: r1(P(t, -10, 320, 650)), y: r1(P(t, 56, 100, 56)) + 5, c: [BODY, CREAM, ACCENT][i % 3] };
  });
  return (
    <Svg vb={[640, 360]} className={className} title={title}>
      <defs>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SKY} />
          <stop offset="1" stopColor={CREAM} />
        </linearGradient>
      </defs>
      <rect width="640" height="360" rx="20" fill={`url(#${uid}s)`} />
      <circle cx="528" cy="100" r="64" fill={BODY} opacity=".2" />
      <circle cx="528" cy="100" r="42" fill={BODY} />
      <circle cx="528" cy="100" r="42" fill={ACCENT} opacity=".12" />
      {SKYLINE_BACK.map(([x, w, h]) => (
        <rect key={x} x={x + 10} y={GROUND - h} width={w} height={h} rx="3" fill={TEAL} opacity=".2" />
      ))}
      <rect y={GROUND} width="640" height="58" fill={TEAL} opacity=".2" />
      <rect y={GROUND} width="640" height="3" fill={INK} opacity=".12" />
      <path d="M-10 56Q320 144 650 56" stroke={INK} strokeOpacity=".55" strokeWidth="1.6" />
      {bulbs.map((b) => (
        <g key={b.x}>
          <circle cx={b.x} cy={b.y} r="9" fill={b.c} opacity=".25" />
          <circle cx={b.x} cy={b.y} r="4.5" fill={b.c} stroke={INK} strokeOpacity=".3" />
        </g>
      ))}
      <g transform={`translate(${x0} 0)`}>
        <TruckBody variant={size} name={name} />
      </g>
    </Svg>
  );
}

export function TruckIcon({ variant, className, title }: ArtProps & { variant: TruckVariant }) {
  const s = 0.2;
  const total = truckWidth(variant) * s;
  return (
    <Svg vb={[120, 80]} className={className} title={title}>
      <g transform={`translate(${r1((120 - total) / 2)} ${r1(70 - (GROUND + 2) * s)}) scale(${s})`}>
        <TruckBody variant={variant} />
      </g>
    </Svg>
  );
}

/* ------------------------------------------------------------- Menu items */

function BowlG({ premium }: { premium?: boolean }) {
  return (
    <g>
      <ellipse cx="24" cy="42" rx="14" ry="2.6" fill={INK} opacity=".18" />
      <rect x="16" y="39" width="16" height="4" rx="2" fill={premium ? BODY : INK} />
      <path d="M6 22h36c0 11-7 19-18 19S6 33 6 22z" fill={premium ? ACCENT : TEAL} />
      <path d="M6 22h36c0 3-.4 5-1 7H7c-.6-2-1-4-1-7z" fill={INK} opacity=".14" />
      <ellipse cx="24" cy="22" rx="18" ry="4.5" fill={premium ? BODY : CREAM} />
      <path d="M9 22Q10 10 24 10Q38 10 39 22Q24 27 9 22z" fill={premium ? CREAM : BODY} />
      <circle cx="18" cy="15" r="2.6" fill={ACCENT} />
      <circle cx="28" cy="13.5" r="2.6" fill={ACCENT} />
      <circle cx="32" cy="18" r="2.2" fill={premium ? TEAL : ACCENT} />
      <ellipse cx="23" cy="17.5" rx="3.6" ry="1.6" transform="rotate(-20 23 17.5)" fill={TEAL} />
      {premium && <path d="M38 3l1.6 3.6L43 8l-3.4 1.4L38 13l-1.6-3.6L33 8l3.4-1.4z" fill={BODY} stroke={INK} strokeOpacity=".25" />}
    </g>
  );
}

export function Bowl({ className, title }: ArtProps) {
  return <Svg vb={[48, 48]} className={className} title={title}><BowlG /></Svg>;
}

export function PremiumBowl({ className, title }: ArtProps) {
  return <Svg vb={[48, 48]} className={className} title={title}><BowlG premium /></Svg>;
}

export function Wrap({ className, title }: ArtProps) {
  return (
    <Svg vb={[48, 48]} className={className} title={title}>
      <ellipse cx="24" cy="41" rx="17" ry="2.6" fill={INK} opacity=".18" />
      <g transform="rotate(-28 24 24)">
        <rect x="4" y="14" width="40" height="20" rx="10" fill={CREAM} stroke={INK} strokeOpacity=".25" />
        <ellipse cx="9" cy="24" rx="4.5" ry="7.5" fill={TEAL} />
        <circle cx="9" cy="21" r="2" fill={ACCENT} />
        <circle cx="10.5" cy="27" r="1.8" fill={BODY} />
        <path d="M20 14h14a10 10 0 0 1 0 20H20z" fill={BODY} />
        <path d="M25 14v20M30 14v20M35 14v20" stroke={ACCENT} strokeOpacity=".55" strokeWidth="2" />
        <path d="M20 14h14a10 10 0 0 1 9.5 7H20z" fill="#fff" opacity=".25" />
      </g>
    </Svg>
  );
}

/* --------------------------------------------------------------- UI glyphs */

export function Coin({ className, title }: ArtProps) {
  return (
    <Svg vb={[32, 32]} className={className} title={title}>
      <circle cx="16" cy="16" r="13" fill={BODY} stroke={INK} strokeOpacity=".35" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="9.5" stroke={INK} strokeOpacity=".3" strokeWidth="1.2" />
      <path d="M8 11a9.5 9.5 0 0 1 9-4.5" stroke="#fff" strokeOpacity=".6" strokeWidth="2" strokeLinecap="round" />
      <path d="M19 12.5q0-2-3-2t-3 2.5q0 2 3 3t3 3q0 2.5-3 2.5t-3-2M16 8.5v15" stroke={INK} strokeOpacity=".75" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function Ledger({ className, title }: ArtProps) {
  return (
    <Svg vb={[32, 32]} className={className} title={title}>
      <rect x="5" y="4" width="22" height="24" rx="3" fill={TEAL} />
      <rect x="8" y="4" width="17" height="22" rx="2" fill={CREAM} />
      <path d="M11 10h11M11 14h11M11 18h7" stroke={INK} strokeOpacity=".4" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M21 4v9l2-1.6 2 1.6V4z" fill={ACCENT} />
    </Svg>
  );
}

export function Calculator({ className, title }: ArtProps) {
  return (
    <Svg vb={[32, 32]} className={className} title={title}>
      <rect x="6" y="3" width="20" height="26" rx="4" fill={TEAL} />
      <rect x="9" y="6" width="14" height="6" rx="2" fill={SKY} />
      {[17, 22, 26.5].map((cy, r) =>
        [11, 16, 21].map((cx, c) => (
          <circle key={`${cx}${cy}`} cx={cx} cy={cy} r="1.8" fill={r === 2 && c === 2 ? ACCENT : CREAM} />
        )),
      )}
    </Svg>
  );
}

export function Chart({ className, title }: ArtProps) {
  return (
    <Svg vb={[32, 32]} className={className} title={title}>
      <rect x="4" y="4" width="24" height="24" rx="5" fill={CREAM} stroke={INK} strokeOpacity=".2" />
      <rect x="8" y="18" width="4" height="7" rx="1" fill={TEAL} />
      <rect x="14" y="13" width="4" height="12" rx="1" fill={BODY} />
      <rect x="20" y="8" width="4" height="17" rx="1" fill={ACCENT} />
    </Svg>
  );
}

/* ----------------------------------------------------------- Chapter icons */

export function ChapterIcon({ chapter, className, title }: ArtProps & { chapter: 1 | 2 | 3 | 4 | 5 }) {
  const truck = (v: TruckVariant, s: number, tx: number, bottom: number) => (
    <g transform={`translate(${tx} ${r1(bottom - (GROUND + 2) * s)}) scale(${s})`}>
      <TruckBody variant={v} />
    </g>
  );
  let art: ReactNode;
  switch (chapter) {
    case 1:
      art = (
        <>
          <circle cx="18" cy="17" r="6" stroke={ACCENT} strokeWidth="3.5" />
          <path d="M24 17h22M38 17v6M44 17v5" stroke={ACCENT} strokeWidth="3.5" strokeLinecap="round" />
          {truck('refurbished', 0.1, 7.5, 57)}
        </>
      );
      break;
    case 2:
      art = (
        <>
          <path d="M6 52h52" stroke={INK} strokeOpacity=".3" strokeWidth="2" strokeLinecap="round" />
          <rect x="10" y="40" width="11" height="12" rx="2" fill={TEAL} />
          <rect x="25" y="32" width="11" height="20" rx="2" fill={BODY} />
          <rect x="40" y="26" width="11" height="26" rx="2" fill={ACCENT} />
          <g transform="translate(33.5 3.5) scale(.5)"><BowlG /></g>
        </>
      );
      break;
    case 3:
      art = (
        <>
          <path d="M14 14q0-2 2-2h15q2 0 3.500 1.500L51 30q2 2 0 4L36 49q-2 2-4 0L15.500 32.500Q14 31 14 29z" fill={ACCENT} />
          <circle cx="23" cy="21" r="3.500" fill={SKY} />
          <path d="M34 39V26M28.500 31.500L34 26l5.500 5.500" stroke={CREAM} strokeWidth="3.200" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
      break;
    case 4:
      art = (
        <>
          <rect x="10" y="42" width="44" height="14" rx="3" fill={CREAM} stroke={INK} strokeOpacity=".3" />
          <path d="M32 42v14M15 47h12M37 47h12M15 51h9M37 51h9" stroke={INK} strokeOpacity=".4" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M18 34a8 8 0 0 1 3-15.500A11 11 0 0 1 42 20a7.500 7.500 0 0 1 2 14z" fill={INK} opacity=".82" />
          <path d="M34 30l-6 11h5l-3 9 10-13h-6l3-7z" fill={BODY} stroke={INK} strokeOpacity=".4" strokeLinejoin="round" />
          <path d="M20 38l-2 4M45 38l-2 4" stroke={SKY} strokeWidth="2" strokeLinecap="round" />
        </>
      );
      break;
    default:
      art = (
        <>
          {truck('premium', 0.062, 26, 45)}
          {truck('refurbished', 0.075, 4, 58)}
          <path d="M8 31L20 22l10 5L52 10M45 9h8v8" stroke={TEAL} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
  }
  return (
    <Svg vb={[64, 64]} className={className} title={title}>
      <rect width="64" height="64" rx="16" fill={SKY} />
      <rect width="64" height="64" rx="16" fill={CREAM} opacity=".35" />
      {art}
    </Svg>
  );
}

/* ------------------------------------------------------- Decorative strips */

// Deterministic pseudo-random city so server and client render identically.
const CITY = (() => {
  let s = 11;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const out: { layer: number; x: number; y: number; w: number; h: number }[] = [];
  const wins: { x: number; y: number }[] = [];
  for (const layer of [0, 1]) {
    for (let x = layer ? 20 : -10; x < 1200; ) {
      const w = Math.round(38 + r() * 48);
      const h = Math.round((layer ? 36 : 56) + r() * (layer ? 56 : 70));
      out.push({ layer, x, y: 148 - h, w, h });
      if (layer) {
        for (let wx = x + 8; wx < x + w - 10; wx += 14)
          for (let wy = 148 - h + 10; wy < 132; wy += 16) if (r() > 0.6) wins.push({ x: wx, y: wy });
      }
      x += w + Math.round(r() * 14);
    }
  }
  return { out, wins };
})();

export function Skyline({ className }: { className?: string }) {
  return (
    <Svg vb={[1200, 160]} className={className} par="xMidYMax slice">
      {CITY.out.map((b) => (
        <rect key={`${b.layer}-${b.x}`} x={b.x} y={b.y} width={b.w} height={b.h} rx="3" fill={TEAL} opacity={b.layer ? 0.17 : 0.1} />
      ))}
      {CITY.wins.map((w) => (
        <rect key={`${w.x}-${w.y}`} x={w.x} y={w.y} width="6" height="8" rx="1.500" fill={BODY} opacity=".35" />
      ))}
      <rect y="148" width="1200" height="12" fill={INK} opacity=".07" />
      <path d="M0 154H1200" stroke={CREAM} strokeOpacity=".5" strokeWidth="2" strokeDasharray="18 14" />
    </Svg>
  );
}

const CONFETTI = Array.from({ length: 22 }, (_, i) => {
  const a = Math.PI * (1.05 + 0.9 * (i / 21));
  const rad = 20 + ((i * 17) % 45);
  return {
    x: r1(100 + Math.cos(a) * rad * 1.4),
    y: r1(66 + Math.sin(a) * rad * 0.75),
    rot: (i * 47) % 180,
    kind: i % 3,
    c: [ACCENT, BODY, TEAL, SKY][i % 4],
  };
});

export function Confetti({ className }: { className?: string }) {
  return (
    <Svg vb={[200, 80]} className={className}>
      <circle cx="100" cy="68" r="5" fill={BODY} />
      {CONFETTI.map((p, i) =>
        p.kind === 0 ? (
          <rect key={i} x={p.x - 4} y={p.y - 2} width="8" height="4" rx="1" fill={p.c} transform={`rotate(${p.rot} ${p.x} ${p.y})`} />
        ) : p.kind === 1 ? (
          <circle key={i} cx={p.x} cy={p.y} r="2.800" fill={p.c} />
        ) : (
          <path key={i} d={`M${p.x} ${p.y - 4}l3.500 4l-3.500 4l-3.500 -4z`} fill={p.c} transform={`rotate(${p.rot} ${p.x} ${p.y})`} />
        ),
      )}
    </Svg>
  );
}
