/** Gira, o mascote: um cubinho com olhos. Original do Giro a Giro. */
export type Mood = 'feliz' | 'uau' | 'pensando';
const C = ['#14A85A', '#E8352B', '#1F5FE0', '#FFD233', '#F7F7F2', '#14A85A', '#FF8A12', '#14A85A', '#E8352B'];

export function Mascot({ mood = 'feliz', size = 96 }: { mood?: Mood; size?: number }) {
  return (
    <svg className={`mascot mood-${mood}`} width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <ellipse cx="60" cy="112" rx="34" ry="5" fill="var(--ink)" opacity=".15" />
      <g className="mascot-body">
        <rect x="14" y="10" width="92" height="92" rx="20" fill="var(--ink)" />
        {C.map((c, i) => (
          <rect key={i} x={21 + (i % 3) * 27} y={17 + Math.floor(i / 3) * 27} width="24" height="24" rx="6" fill={c} />
        ))}
        {/* olhos sobre a fileira do meio */}
        <g className="eyes">
          <circle cx="44" cy="56" r="11" fill="#fff" stroke="var(--ink)" strokeWidth="3" />
          <circle cx="76" cy="56" r="11" fill="#fff" stroke="var(--ink)" strokeWidth="3" />
          <circle className="pupil" cx={mood === 'pensando' ? 48 : 45} cy={mood === 'pensando' ? 52 : 57} r="5" fill="var(--ink)" />
          <circle className="pupil" cx={mood === 'pensando' ? 80 : 77} cy={mood === 'pensando' ? 52 : 57} r="5" fill="var(--ink)" />
        </g>
        {mood === 'uau'
          ? <ellipse cx="60" cy="84" rx="7" ry="8" fill="var(--ink)" />
          : mood === 'pensando'
            ? <path d="M50 85 h20" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
            : <path d="M47 80 q13 12 26 0" stroke="var(--ink)" strokeWidth="4" fill="none" strokeLinecap="round" />}
      </g>
    </svg>
  );
}

export function Speech({ children, mood = 'feliz' }: { children: React.ReactNode; mood?: Mood }) {
  return (
    <div className="speech">
      <Mascot mood={mood} size={72} />
      <p className="bubble">{children}</p>
    </div>
  );
}
