import { useEffect, useRef, useState } from 'react';
import { STICKER_COLORS } from '../cube/CubeScene';
import { Cube3D } from '../components/Cube3D';
import type { CubeScene } from '../cube/CubeScene';
import { applyMove, facelets, invertMove, isSolved, randomScramble, solved, type CubeState, type Face } from '../cube/model';

const PAD: { m: string; dica: string }[] = [
  { m: 'R', dica: 'direita sobe' }, { m: "R'", dica: 'direita desce' },
  { m: 'L', dica: 'esquerda desce' }, { m: "L'", dica: 'esquerda sobe' },
  { m: 'U', dica: 'topo p/ esquerda' }, { m: "U'", dica: 'topo p/ direita' },
  { m: 'D', dica: 'base p/ direita' }, { m: "D'", dica: 'base p/ esquerda' },
  { m: 'F', dica: 'frente, horário' }, { m: "F'", dica: 'frente, anti-horário' },
  { m: 'B', dica: 'trás, horário' }, { m: "B'", dica: 'trás, anti-horário' },
];
import { sfx, buzz } from '../feedback';

export function Brincar({ sound, onSolve }: { sound: boolean; onSolve: () => void }) {
  const scene = useRef<CubeScene | null>(null);
  const state = useRef<CubeState>(solved());
  const history = useRef<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [mixed, setMixed] = useState(false);
  const busy = useRef(false);
  const [pad, setPad] = useState(false);

  const doMove = (m: string, opts: { record?: boolean; dur?: number; quiet?: boolean } = {}) => {
    applyMove(state.current, m);
    if (opts.record !== false) history.current.push(m);
    if (!opts.quiet && sound) sfx.click();
    return scene.current!.turn(m, facelets(state.current), opts.dur);
  };

  const onMove = (m: string) => {
    if (busy.current) return;
    buzz(8);
    doMove(m).then(() => {
      setMoves(n => n + 1);
      if (mixedRef.current && isSolved(state.current)) {
        mixedRef.current = false; setMixed(false);
        if (sound) sfx.win(); buzz([30, 40, 60]);
        onSolve();
      }
    });
  };
  const mixedRef = useRef(false);
  const onMoveRef = useRef(onMove); onMoveRef.current = onMove;

  // teclado no computador: R, L, U, D, F, B; com Shift faz ao contrário
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toUpperCase();
      if (k.length === 1 && 'RLUDFB'.includes(k)) { e.preventDefault(); onMoveRef.current(e.shiftKey ? k + "'" : k); }
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, []);

  const embaralhar = async () => {
    if (busy.current) return;
    busy.current = true;
    const seq = randomScramble(20);
    await Promise.all(seq.map(m => doMove(m, { record: false, dur: 70, quiet: true })));
    history.current = []; setMoves(0);
    mixedRef.current = true; setMixed(true); busy.current = false;
    if (sound) sfx.good();
  };
  const desfazer = () => {
    const m = history.current.pop(); if (!m || busy.current) return;
    doMove(invertMove(m), { record: false }).then(() => setMoves(n => Math.max(0, n - 1)));
  };
  const arrumar = () => {
    if (busy.current) return;
    state.current = solved(); history.current = []; setMoves(0);
    mixedRef.current = false; setMixed(false);
    scene.current!.paint(facelets(state.current));
  };

  return (
    <div className="screen brincar">
      <div className="stage">
        <Cube3D onReady={s => { scene.current = s; s.paint(facelets(state.current)); }}
          options={{ onMove, canTurn: () => true }} />
        <span className="stage-hint">Arraste uma face para girar. Fora do cubo, vira a vista.</span>
        <button className="view-btn" onClick={() => scene.current?.resetView()}>Verde na frente</button>
      </div>
      <p className="counter" aria-live="polite">{moves ? `${moves} ${moves === 1 ? 'giro' : 'giros'}` : mixed ? 'Cubo embaralhado: tente arrumar!' : 'Arraste uma face para girar'}</p>
      <div className="row">
        <button className="btn btn-pop" onClick={embaralhar}>Embaralhar</button>
        <button className="btn" onClick={desfazer} disabled={!moves}>Desfazer</button>
        <button className="btn" onClick={arrumar}>Arrumar</button>
      </div>
      <button className="link-btn" onClick={() => setPad(!pad)} aria-expanded={pad}>{pad ? 'Esconder botões de giro' : 'Prefere botões? Mostrar botões de giro'}</button>
      {pad && (
        <div className="pad">
          {PAD.map(({ m, dica }) => (
            <button key={m} className="key" onClick={() => onMove(m)} aria-label={`${m}: ${dica}`}>
              <span className="dot" style={{ background: STICKER_COLORS[m[0] as Face] }} />
              <b>{m}</b><small>{dica}</small>
            </button>
          ))}
          <p className="pad-tip">No computador, use as teclas R, L, U, D, F e B. Com Shift, o giro sai ao contrário.</p>
        </div>
      )}
    </div>
  );
}
