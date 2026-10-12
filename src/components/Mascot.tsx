/** Pingo, o mascote: um pinguinzinho que segura um cubo. Original do Giro a Giro. */
export type Mood = 'feliz' | 'uau' | 'pensando';

const NAVY = '#262B57';
const ORANGE = '#FF9A1F';

export function Mascot({ mood = 'feliz', size = 96 }: { mood?: Mood; size?: number }) {
  const look = mood === 'pensando' ? { dx: 2.5, dy: -3 } : { dx: 0, dy: 0 };
  const eyeR = mood === 'uau' ? 7.5 : 6;
  return (
    <svg className={`mascot mood-${mood}`} width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <ellipse cx="60" cy="114" rx="30" ry="4.5" fill="#000" opacity=".14" />
      <g className="mascot-body">
        {/* pés */}
        <ellipse cx="47" cy="108" rx="10" ry="5" fill={ORANGE} stroke="var(--ink)" strokeWidth="2.5" />
        <ellipse cx="73" cy="108" rx="10" ry="5" fill={ORANGE} stroke="var(--ink)" strokeWidth="2.5" />
        {/* asas */}
        <g className="wing-l"><ellipse cx="25" cy="74" rx="8" ry="20" transform="rotate(18 25 74)" fill={NAVY} stroke="var(--ink)" strokeWidth="2.5" /></g>
        <ellipse className="wing-r" cx="95" cy="74" rx="8" ry="20" transform="rotate(-18 95 74)" fill={NAVY} stroke="var(--ink)" strokeWidth="2.5" />
        {/* corpo e barriga */}
        <path d="M60 10c22 0 36 20 36 48 0 30-15 49-36 49S24 88 24 58C24 30 38 10 60 10z" fill={NAVY} stroke="var(--ink)" strokeWidth="3" />
        <path d="M60 34c-7-7-24-5-24 12 0 9 3 15 5 19-2 6-3 11-3 16 0 15 9 21 22 21s22-6 22-21c0-5-1-10-3-16 2-4 5-10 5-19 0-17-17-19-24-12z" fill="#fff" />
        {/* bochechas */}
        <ellipse cx="40" cy="60" rx="5" ry="3" fill="#FF8FB8" opacity=".85" />
        <ellipse cx="80" cy="60" rx="5" ry="3" fill="#FF8FB8" opacity=".85" />
        {/* olhos */}
        <circle cx={47 + look.dx} cy={49 + look.dy} r={eyeR} fill={NAVY} />
        <circle cx={73 + look.dx} cy={49 + look.dy} r={eyeR} fill={NAVY} />
        <circle cx={49 + look.dx} cy={46.5 + look.dy} r="2" fill="#fff" />
        <circle cx={75 + look.dx} cy={46.5 + look.dy} r="2" fill="#fff" />
        {/* bico */}
        {mood === 'uau'
          ? <g><path d="M52 58 L68 58 L60 63 Z" fill={ORANGE} stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
              <path d="M53 66 L67 66 L60 71 Z" fill="#E66A00" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" /></g>
          : <path d="M52 59 Q60 56 68 59 Q60 68 52 59 Z" fill={ORANGE} stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />}
        {/* cubinho no colo */}
        <g transform="translate(48 80)">
          <rect width="24" height="24" rx="5" fill="#1D2140" />
          {['#14A85A', '#E8352B', '#FFD233', '#1F5FE0'].map((c, i) => (
            <rect key={c} x={3 + (i % 2) * 9.5} y={3 + Math.floor(i / 2) * 9.5} width="8.5" height="8.5" rx="2" fill={c} />
          ))}
        </g>
      </g>
    </svg>
  );
}

export function Speech({ children, mood = 'feliz' }: { children: React.ReactNode; mood?: Mood }) {
  return (
    <div className="speech">
      <Mascot mood={mood} size={80} />
      <p className="bubble">{children}</p>
    </div>
  );
}
