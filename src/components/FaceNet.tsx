import { useState } from 'react';
import { STICKER_COLORS } from '../cube/CubeScene';
import { FACES, type Face } from '../cube/model';
import { COLOR_NAMES } from '../cube/fromFacelets';

export type Net = Record<Face, (Face | null)[]>;

/** cubo aberto (planificado): U em cima; L F R B no meio; D embaixo. Toque num quadradinho para trocar a cor. */
const LAYOUT: { f: Face; col: number; row: number }[] = [
  { f: 'U', col: 2, row: 1 }, { f: 'L', col: 1, row: 2 }, { f: 'F', col: 2, row: 2 },
  { f: 'R', col: 3, row: 2 }, { f: 'B', col: 4, row: 2 }, { f: 'D', col: 2, row: 3 },
];

export function FaceNet({ net, onChange, highlight }: { net: Net; onChange?: (n: Net) => void; highlight?: Set<string> }) {
  const [pick, setPick] = useState<{ f: Face; i: number } | null>(null);
  const set = (c: Face) => {
    if (!pick || !onChange) return;
    const n = { ...net, [pick.f]: net[pick.f].slice() } as Net;
    n[pick.f][pick.i] = c; onChange(n); setPick(null);
  };
  return (
    <div className="net-wrap">
      <div className="net" role="group" aria-label="Seu cubo aberto em 6 faces">
        {LAYOUT.map(({ f, col, row }) => (
          <div key={f} className="net-face" style={{ gridColumn: col, gridRow: row }}>
            {net[f].map((c, i) => {
              const center = i === 4, sel = pick?.f === f && pick.i === i;
              return (
                <button key={i} disabled={center || !onChange}
                  className={`sq ${c ? '' : 'empty'} ${sel ? 'sel' : ''} ${highlight?.has(`${f}${i}`) ? 'warn' : ''}`}
                  style={{ background: c ? STICKER_COLORS[c] : undefined }}
                  aria-label={`${COLOR_NAMES[f]}, quadradinho ${i + 1}: ${c ? COLOR_NAMES[c] : 'sem cor'}`}
                  onClick={() => setPick(sel ? null : { f, i })} />
              );
            })}
          </div>
        ))}
      </div>
      {pick && (
        <div className="palette" role="group" aria-label="Escolha a cor">
          {FACES.map(c => (
            <button key={c} className="swatch" style={{ background: STICKER_COLORS[c] }} onClick={() => set(c)} aria-label={COLOR_NAMES[c]}>
              <span>{COLOR_NAMES[c]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
