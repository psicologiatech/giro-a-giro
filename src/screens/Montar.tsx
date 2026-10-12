import { useEffect, useMemo, useRef, useState } from 'react';
import { Cube3D } from '../components/Cube3D';
import { Mascot } from '../components/Mascot';
import { Confetti } from '../components/Confetti';
import type { CubeScene } from '../cube/CubeScene';
import { STICKER_COLORS } from '../cube/CubeScene';
import { applyMove, clone, facelets, invertMove, type CubeState, type Face } from '../cube/model';
import { solve, STAGES, type Chunk, type StageId } from '../cube/solver';
import { describe, isWholeCube } from '../cube/describe';
import { sfx, buzz } from '../feedback';

const KEY = 'giroagiro.montar.v1';
export function loadMontar(): CubeState | null { try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null; } catch { return null; } }
export function clearMontar() { try { localStorage.removeItem(KEY); } catch { /* */ } }
const saveMontar = (s: CubeState) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* */ } };

const STAGE_ORDER: StageId[] = ['cruz', 'cantos', 'virar', 'meio', 'cruzAmarela', 'meiosAmarelos', 'posCantos', 'oriCantos'];
const PICK = ['R', "R'", 'L', "L'", 'U', "U'", 'D', "D'", 'F', "F'", 'B', "B'"];
type Step = { chunk: number; move: string; fix?: boolean };

export function Montar({ start, sound, onDone, onRescan, onExit }: {
  start: CubeState; sound: boolean; onDone: () => void; onRescan: () => void; onExit: () => void;
}) {
  const plan = useMemo(() => { try { return { chunks: solve(start), error: null as string | null }; } catch (e) { return { chunks: [] as Chunk[], error: (e as Error).message }; } }, [start]);
  const [steps, setSteps] = useState<Step[]>(() => plan.chunks.flatMap((c, k) => c.moves.map(move => ({ chunk: k, move }))));
  const [i, setI] = useState(0);
  const [intro, setIntro] = useState(true);
  const [stageDone, setStageDone] = useState<StageId | null>(null);
  const [errei, setErrei] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [done, setDone] = useState(plan.chunks.length === 0 && !plan.error);
  const state = useRef<CubeState>(clone(start));
  const scene = useRef<CubeScene | null>(null);
  const busy = useRef(false);

  const cur = steps[i];
  const chunk = cur ? plan.chunks[cur.chunk] : null;
  const stageIdx = chunk ? STAGE_ORDER.indexOf(chunk.stage) : STAGE_ORDER.length;
  const chunkSteps = cur ? steps.filter(s => s.chunk === cur.chunk) : [];
  const posInChunk = cur ? steps.slice(0, i).filter(s => s.chunk === cur.chunk).length : 0;

  useEffect(() => { scene.current?.hint(!intro && !stageDone && !errei && cur ? cur.move : null); }, [i, intro, stageDone, errei, cur]);

  const animate = (m: string, dur?: number) => { applyMove(state.current, m); return scene.current!.turn(m, facelets(state.current), dur); };

  const feito = async () => {
    if (busy.current || !cur) return;
    busy.current = true; scene.current?.hint(null);
    if (sound) sfx.click(); buzz(10);
    await animate(cur.move, isWholeCube(cur.move) ? 380 : 300);
    saveMontar(state.current);
    const next = steps[i + 1];
    setNote(null);
    if (!next) { clearMontar(); if (sound) sfx.win(); buzz([40, 60, 80]); setDone(true); onDone(); }
    else if (plan.chunks[next.chunk].stage !== chunk!.stage) {
      if (sound) sfx.good();
      if (chunk!.stage === 'virar') setNote('Isso! Agora o amarelo fica em cima até o fim.');
      else setStageDone(chunk!.stage);
    }
    else if (next.chunk !== cur.chunk) { if (sound) sfx.good(); setNote('Peça no lugar! Próximo lance.'); }
    setI(i + 1); busy.current = false;
  };
  const voltar = async () => {
    if (busy.current || i === 0) return;
    busy.current = true;
    const prev = steps[i - 1];
    await animate(invertMove(prev.move));
    saveMontar(state.current); setI(i - 1); setNote(null); busy.current = false;
  };
  const verDeNovo = async () => {
    if (busy.current || !cur) return;
    busy.current = true; scene.current?.hint(null);
    await animate(cur.move, 650); await new Promise(r => setTimeout(r, 350)); await animate(invertMove(cur.move), 250);
    scene.current?.hint(cur.move); busy.current = false;
  };
  /** a pessoa fez outro giro na mão: a tela faz o mesmo e entra um passo para desfazer */
  const fizOutro = async (x: string) => {
    setErrei(false); setStageDone(null);
    busy.current = true;
    await animate(x, 450);
    saveMontar(state.current);
    const fix: Step = { chunk: cur ? cur.chunk : steps[steps.length - 1].chunk, move: invertMove(x), fix: true };
    setSteps(s => [...s.slice(0, i), fix, ...s.slice(i)]);
    setNote('Sem problema! Agora a tela está igual ao seu cubo. Primeiro, desfaça aquele giro.');
    if (sound) sfx.oops();
    busy.current = false;
  };

  if (plan.error) return (
    <div className="screen montar">
      <div className="speech"><Mascot mood="hmm" size={92} /><p className="bubble">Hmm, não consegui achar um caminho para este cubo. Talvez alguma cor tenha sido lida errada.</p></div>
      <button className="btn btn-pop btn-big" onClick={onRescan}>Ler o cubo de novo</button>
      <button className="link-btn" onClick={onExit}>Voltar</button>
    </div>
  );

  return (
    <div className="screen montar">
      <div className="montar-head">
        <div className="stage-pill">Etapa {Math.min(stageIdx + 1, 8)} de 8 · {chunk ? STAGES[chunk.stage].nome : 'Pronto!'}</div>
        <div className="bar" aria-hidden="true"><i style={{ width: `${(i / Math.max(1, steps.length)) * 100}%` }} /></div>
      </div>
      <div className="stage stage-montar">
        <Cube3D onReady={s => { scene.current = s; s.paint(facelets(state.current)); }} options={{ canTurn: () => false }} />
        <button className="view-btn" onClick={() => scene.current?.resetView()}>Endireitar</button>
      </div>

      {cur && chunk && (
        <section className="card lance" aria-live="polite">
          <p className="lance-n">{cur.fix ? 'Desfazendo o engano' : `Lance: ${chunk.title}`}</p>
          <div className="move-now">
            <span className={`move-big ${isWholeCube(cur.move) ? 'whole' : ''}`}>{isWholeCube(cur.move) ? '↻' : cur.move}</span>
            <span className="move-desc">{describe(cur.move)}</span>
          </div>
          <p className="lance-tip">{note ?? chunk.tip}</p>
          <div className="seq" aria-label={`Giro ${posInChunk + 1} de ${chunkSteps.length} deste lance`}>
            {chunkSteps.map((st, k) => (
              <span key={k} className={k < posInChunk ? 'done' : k === posInChunk ? 'now' : ''}>{isWholeCube(st.move) ? '↻' : st.move}</span>
            ))}
          </div>
        </section>
      )}

      {cur && (
        <>
          <div className="row">
            <button className="btn" onClick={voltar} disabled={i === 0}>Voltar</button>
            <button className="btn" onClick={verDeNovo}>Ver de novo</button>
          </div>
          <button className="btn btn-pop btn-big" onClick={feito}>Feito no meu cubo</button>
          <button className="link-btn" onClick={() => setErrei(true)}>Errei um giro</button>
        </>
      )}

      {intro && !done && cur && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Como funciona">
          <div className="sheet">
            <Mascot mood="aponta" size={130} />
            <h2>Vamos montar o seu cubo!</h2>
            <p>Segure o cubo <b>igual à tela</b>. A seta rosa mostra cada giro. Faça no seu cubo e toque em <b>Feito</b>.</p>
            <p>Errou? Tudo bem. Toque em <b>Errei um giro</b> e eu te ajudo a voltar.</p>
            <button className="btn btn-pop btn-big" onClick={() => setIntro(false)}>Começar</button>
          </div>
        </div>
      )}

      {stageDone && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Etapa concluída">
          <Confetti />
          <div className="sheet">
            <Mascot mood="trofeu" size={130} />
            <h2>{STAGES[stageDone].nome}: pronta!</h2>
            <p>Confira: o seu cubo está igual ao da tela?</p>
            {chunk && <p className="next-stage"><b>Próxima etapa:</b> {STAGES[chunk.stage].nome}. {STAGES[chunk.stage].ideia}</p>}
            <button className="btn btn-pop btn-big" onClick={() => setStageDone(null)}>Sim, está igual</button>
            <button className="btn" onClick={() => { setStageDone(null); setErrei(true); }}>Não, ficou diferente</button>
          </div>
        </div>
      )}

      {errei && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Errei um giro">
          <div className="sheet errei">
            <Mascot mood="hmm" size={100} />
            <h2>O que você girou?</h2>
            {cur && !cur.move.endsWith('2') && !isWholeCube(cur.move) && (
              <button className="btn btn-pop" onClick={() => fizOutro(invertMove(cur.move))}>Girei para o lado contrário ({invertMove(cur.move)})</button>
            )}
            <p>Ou toque no giro que você fez:</p>
            <div className="pick">
              {PICK.map(m => (
                <button key={m} className="key" onClick={() => fizOutro(m)} aria-label={`${m}: ${describe(m)}`}>
                  <span className="dot" style={{ background: STICKER_COLORS[m[0] as Face] }} /><b>{m}</b><small>{describe(m)}</small>
                </button>
              ))}
            </div>
            <button className="btn" onClick={() => { setErrei(false); onRescan(); }}>Não sei o que fiz: ler o cubo de novo</button>
            <button className="link-btn" onClick={() => setErrei(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {done && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Cubo montado">
          <Confetti />
          <div className="sheet">
            <Mascot mood="festa" size={150} />
            <h2>Você montou o seu cubo!</h2>
            <p>Que conquista. Embaralhe e monte de novo: a cada vez, a mão aprende mais um pouco.</p>
            <button className="btn btn-pop btn-big" onClick={onRescan}>Embaralhar e ler de novo</button>
            <button className="btn" onClick={onExit}>Voltar</button>
          </div>
        </div>
      )}
    </div>
  );
}
