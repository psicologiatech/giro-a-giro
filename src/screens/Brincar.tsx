import { useRef, useState } from 'react';
import { Cube3D } from '../components/Cube3D';
import type { CubeScene } from '../cube/CubeScene';
import { applyMove, facelets, invertMove, isSolved, randomScramble, solved, type CubeState } from '../cube/model';
import { sfx, buzz } from '../feedback';

export function Brincar({ sound, onSolve }: { sound: boolean; onSolve: () => void }) {
  const scene = useRef<CubeScene | null>(null);
  const state = useRef<CubeState>(solved());
  const history = useRef<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [mixed, setMixed] = useState(false);
  const busy = useRef(false);

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
      </div>
      <p className="counter" aria-live="polite">{mixed ? `${moves} ${moves === 1 ? 'giro' : 'giros'} até agora` : 'Cubo arrumado'}</p>
      <div className="row">
        <button className="btn btn-pop" onClick={embaralhar}>Embaralhar</button>
        <button className="btn" onClick={desfazer} disabled={!moves}>Desfazer</button>
        <button className="btn" onClick={arrumar}>Arrumar</button>
      </div>
    </div>
  );
}
