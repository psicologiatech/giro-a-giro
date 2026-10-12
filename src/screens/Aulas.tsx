import { useEffect, useMemo, useRef, useState } from 'react';
import { Cube3D } from '../components/Cube3D';
import { Mascot, Speech } from '../components/Mascot';
import { Confetti } from '../components/Confetti';
import type { CubeScene } from '../cube/CubeScene';
import { applyMove, clone, facelets, FACES, invertMove, type CubeState } from '../cube/model';
import { describe } from '../cube/describe';
import { greyKeys, setupOf, type Caso, type Passo } from '../aulas/aulas';
import { sfx, buzz } from '../feedback';

/** a tela de um passo: objetivo, como segurar, as situações e o treino */
export function PassoView({ passo, sound, onEarn, onNext }: {
  passo: Passo; sound: boolean; onEarn: (xp: number) => void; onNext?: () => void;
}) {
  const [caso, setCaso] = useState<Caso | null>(null);
  const [treino, setTreino] = useState(false);
  const fim = useMemo(passo.fim, [passo]);

  if (caso) return (
    <Player key={`${caso.id}-${treino}`} passo={passo} caso={caso} treino={treino} sound={sound}
      onBack={() => { setCaso(null); setTreino(false); }}
      onSee={() => setTreino(false)}
      onDone={() => onEarn(treino ? 15 : 5)}
      onTrain={() => setTreino(true)}
      onAnother={() => { const others = passo.casos.filter(c => c !== caso); setCaso(others[Math.floor(Math.random() * others.length)] ?? caso); setTreino(true); }} />
  );

  return (
    <div className="screen passo">
      <div className="passo-head" style={{ ['--c' as string]: `var(--${passo.cor})`, ['--lip' as string]: `var(--${passo.cor}-lip)` }}>
        <span className="passo-n">{passo.n}</span>
        <div><p className="passo-kicker">Passo {passo.n} de 8</p><h2>{passo.titulo}</h2></div>
      </div>
      <section className="card objetivo">
        <p><b>Objetivo:</b> {passo.objetivo}</p>
        <p className="segurar"><span className="hold" aria-hidden="true"><i style={{ background: 'var(--yellow)' }} /><i style={{ background: '#F8F9FC' }} /></span><span><b>Como segurar:</b> {passo.segurar}</span></p>
      </section>
      <div className="stage stage-sm">
        <Cube3D onReady={s => { s.setGrey(greyKeys(fim, passo.foco)); s.paint(facelets(fim)); s.look(passo.fimDeBaixo); }} options={{ canTurn: () => false }} />
        <span className="stage-hint">Assim fica no fim. Cinza é o que ainda não importa.</span>
      </div>
      <Speech mood="aponta">{passo.dica}</Speech>
      <h3 className="sec-title">Como o seu cubo está?</h3>
      <ul className="casos">
        {passo.casos.map((c, i) => (
          <li key={c.id}>
            <button className="caso" onClick={() => { setTreino(false); setCaso(c); }}>
              <span className="caso-n">{String.fromCharCode(65 + i)}</span>
              <span><b>{c.nome}</b><small>{c.ver}</small></span>
              <span className="caso-go" aria-hidden="true">›</span>
            </button>
          </li>
        ))}
      </ul>
      <button className="btn btn-pop btn-big" onClick={() => { setTreino(true); setCaso(passo.casos[Math.floor(Math.random() * passo.casos.length)]); }}>Treinar este passo</button>
      {onNext && <button className="btn" onClick={onNext}>Ir para o passo {passo.n + 1}</button>}
    </div>
  );
}

const key = (s: CubeState) => { const f = facelets(s); return FACES.map(x => f[x].join('')).join('|'); };
const QUARTER = FACES.flatMap(f => [f, f + "'"]);
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** mostra uma situação e a fórmula do professor, giro a giro; no treino, a pessoa faz sozinha */
function Player({ passo, caso, treino, sound, onBack, onSee, onDone, onAnother, onTrain }: {
  passo: Passo; caso: Caso; treino: boolean; sound: boolean;
  onBack: () => void; onSee: () => void; onDone: () => void; onAnother: () => void; onTrain: () => void;
}) {
  const start = useMemo(() => setupOf(passo, caso), [passo, caso]);
  const meta = useMemo(passo.meta, [passo]);
  /** o caminho em quartos de volta (um giro duplo vira dois), com o estado depois de cada um */
  const path = useMemo(() => {
    const qs: { m: string; lance: number }[] = [];
    caso.lances.forEach((l, i) => { if (l.m.endsWith('2')) qs.push({ m: l.m[0], lance: i }, { m: l.m[0], lance: i }); else qs.push({ m: l.m, lance: i }); });
    const s = clone(start), states = [key(s)];
    qs.forEach(q => { applyMove(s, q.m); states.push(key(s)); });
    return { qs, states };
  }, [start, caso]);

  const state = useRef<CubeState>(clone(start));
  const scene = useRef<CubeScene | null>(null);
  const busy = useRef(false);
  const alive = useRef(true);
  const last = useRef<string | null>(null);
  const [pos, setPos] = useState(0);          // posição no caminho (-1 = saiu do caminho)
  const [done, setDone] = useState(false);
  const [letras, setLetras] = useState(false);
  const [dica, setDica] = useState(!treino);
  const [msg, setMsg] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => { listRef.current?.querySelector('li.now')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [pos]);

  const lanceAtual = pos >= 0 && pos < path.qs.length ? path.qs[pos].lance : -1;
  /** o próximo giro a sugerir: o do caminho, ou o que volta para ele */
  const sugestao = (): string | null => {
    if (done) return null;
    if (pos >= 0) return pos < path.qs.length ? path.qs[pos].m : null;
    for (const m of QUARTER) { const t = clone(state.current); applyMove(t, m); if (path.states.includes(key(t))) return m; }
    return last.current ? invertMove(last.current) : null;
  };
  useEffect(() => { scene.current?.hint(dica && !playing ? sugestao() : null); });

  const turn = async (m: string, dur: number) => {
    applyMove(state.current, m);
    await scene.current!.turn(m, facelets(state.current), dur, greyKeys(state.current, passo.foco));
  };
  const settle = (fromUser: boolean) => {
    const p = path.states.indexOf(key(state.current));
    setPos(p);
    if (passo.pronto(state.current, meta)) {
      setDone(true); setMsg(null);
      if (sound) sfx.win(); buzz([30, 50, 70]); onDone();
    } else if (fromUser) {
      if (p < 0) { setMsg('Esse giro saiu do caminho. A seta mostra como voltar.'); setDica(true); if (sound) sfx.oops(); buzz([20, 40, 20]); }
      else { setMsg(null); if (sound) sfx.click(); buzz(10); }
    }
  };

  /** giro feito com o dedo na tela */
  const onMove = async (m: string) => {
    if (busy.current || done) return;
    busy.current = true; scene.current?.hint(null);
    last.current = m;
    await turn(m, 260);
    busy.current = false;
    settle(true);
  };

  /** o professor faz: anima a partir de onde está, um lance por vez, devagar */
  const mostrar = async (soUm: boolean) => {
    if (busy.current || done) return;
    busy.current = true; setMsg(null); setDica(true);
    if (pos < 0) { await resetar(true); }
    let p = path.states.indexOf(key(state.current));
    setPlaying(true); scene.current?.hint(null);
    while (alive.current && p >= 0 && p < path.qs.length) {
      const lance = path.qs[p].lance, m = caso.lances[lance].m;
      setPos(p);
      await sleep(soUm ? 150 : 500);
      if (!alive.current) return;
      await turn(m, m.endsWith('2') ? 800 : 650);
      p = path.states.indexOf(key(state.current));
      if (soUm) break;
      await sleep(350);
    }
    if (!alive.current) return;
    setPlaying(false); busy.current = false; last.current = null;
    settle(false);
  };

  const resetar = async (keepBusy = false) => {
    busy.current = true;
    state.current = clone(start); last.current = null;
    scene.current?.setGrey(greyKeys(start, passo.foco)); scene.current?.paint(facelets(start));
    setPos(0); setDone(false); setMsg(null); if (treino) setDica(false);
    if (!keepBusy) busy.current = false;
  };

  return (
    <div className="screen player">
      <div className="player-head">
        <button className="back-btn" onClick={onBack} aria-label={`Voltar para o passo ${passo.n}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          Passo {passo.n}
        </button>
        <span className="stage-pill">{treino ? 'Treino' : 'Situação'}</span>
      </div>
      <h2 className="player-title">{caso.nome}</h2>
      {!treino && <p className="player-ver">{caso.ver}</p>}

      <div className="stage stage-player">
        <Cube3D onReady={s => { scene.current = s; s.setGrey(greyKeys(start, passo.foco)); s.paint(facelets(start)); }}
          options={{ canTurn: () => !busy.current && !done, onMove }} />
        <button className="view-btn" onClick={() => scene.current?.resetView()}>Endireitar</button>
        <span className="stage-hint">{treino ? 'Faça você: arraste a face para girar.' : 'Você também pode girar a face com o dedo.'}</span>
      </div>

      {msg && <p className="warn-msg" role="status">{msg}</p>}

      {!done && (!treino || dica) && (
        <>
          <button className="btn btn-pop btn-big" onClick={() => mostrar(false)} disabled={playing}>{playing ? 'Olhe o cubo…' : pos > 0 ? 'Continuar devagar' : 'Mostrar devagar'}</button>
          <div className="row">
            <button className="btn" onClick={() => resetar()} disabled={playing}>Do começo</button>
            <button className="btn" onClick={() => mostrar(true)} disabled={playing}>Só o próximo giro</button>
          </div>
        </>
      )}

      {done ? (
        <section className="card feito" aria-live="polite">
          <Confetti />
          <Mascot mood={treino ? 'trofeu' : 'festa'} size={96} />
          <div>
            <h3>{treino ? 'Você fez sozinha!' : 'Resolvido!'}</h3>
            <p>{treino ? 'É assim que a mão aprende. Mais uma?' : 'Agora faça no seu cubo de verdade. Depois, tente aqui sem ajuda.'}</p>
          </div>
          <div className="row">
            <button className="btn" onClick={() => resetar()}>De novo</button>
            {treino
              ? <button className="btn btn-pop" onClick={onAnother}>Outra situação</button>
              : <button className="btn btn-pop" onClick={onTrain}>Agora eu faço</button>}
          </div>
        </section>
      ) : treino && !dica ? (
        <section className="card treino-card">
          <p>Segure como no passo: <b>{passo.segurar.toLowerCase()}</b></p>
          <p>Reconheceu a situação? Faça a fórmula girando as faces.</p>
          <div className="row">
            <button className="btn" onClick={() => setDica(true)}>Me dá uma dica</button>
            <button className="btn" onClick={onSee}>Ver o professor fazer</button>
          </div>
        </section>
      ) : (
        <section className="card falas" aria-live="polite">
          <ol ref={listRef}>
            {caso.lances.map((l, i) => {
              const st = lanceAtual < 0 ? (pos === path.qs.length ? 'done' : '') : i < lanceAtual ? 'done' : i === lanceAtual ? 'now' : '';
              return (
                <li key={i} className={st}>
                  <span className="fala">{l.fala}</span>
                  <span className="como">{describe(l.m)}{letras && <b className="letra">{l.m}</b>}</span>
                </li>
              );
            })}
          </ol>
          <label className="toggle"><input type="checkbox" checked={letras} onChange={e => setLetras(e.target.checked)} /> Mostrar as letras (R, U, F…)</label>
        </section>
      )}

    </div>
  );
}
