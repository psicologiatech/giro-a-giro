import { useEffect, useMemo, useRef, useState } from 'react';
import { Cube3D } from '../components/Cube3D';
import { Mascot, Speech } from '../components/Mascot';
import { Confetti } from '../components/Confetti';
import type { CubeScene } from '../cube/CubeScene';
import { applyMove, clone, facelets, FACES, invertMove, type CubeState } from '../cube/model';
import { describe, isWholeCube } from '../cube/describe';
import { demoInicio, greyKeys, setupOf, type Caso, type Passo } from '../aulas/aulas';
import { sfx, buzz } from '../feedback';
import { loadPecas, savePecas } from '../aulas/progresso';
import { useLetras } from '../aulas/letras';

/** a tela de um passo: objetivo, como segurar, as situações e o treino */
export function PassoView({ passo, feito, sound, onEarn, onFinish }: {
  passo: Passo; feito: boolean; sound: boolean; onEarn: (xp: number) => void; onFinish: () => void;
}) {
  const [caso, setCaso] = useState<Caso | null>(null);
  const [treino, setTreino] = useState(false);
  const fim = useMemo(passo.fim, [passo]);
  const total = passo.total ?? 4;
  const ultimo = passo.n === 8;
  const [letras, setLetras] = useLetras();
  const [pecas, setPecas] = useState(() => loadPecas(passo.n));
  useEffect(() => savePecas(passo.n, pecas), [passo.n, pecas]);
  /** mais uma peça pronta no cubo de verdade */
  const maisUma = () => { setCaso(null); setTreino(false); setPecas(k => Math.min(total, k + 1)); if (sound) sfx.good(); buzz(20); };

  if (caso) return (
    <Player key={`${caso.id}-${treino}`} passo={passo} caso={caso} treino={treino} sound={sound}
      onBack={() => { setCaso(null); setTreino(false); }}
      onSee={() => setTreino(false)}
      onDone={() => onEarn(treino ? 15 : 5)}
      onTrain={() => setTreino(true)}
      onFinish={onFinish}
      total={total}
      pecaN={Math.min(total, pecas + 1)}
      onPiece={maisUma}
      onAnother={() => { const others = passo.casos.filter(c => c !== caso); setCaso(others[Math.floor(Math.random() * others.length)] ?? caso); setTreino(true); }} />
  );

  return (
    <div className="screen passo">
      <div className="passo-head" style={{ ['--c' as string]: `var(--${passo.cor})`, ['--lip' as string]: `var(--${passo.cor}-lip)` }}>
        <span className="passo-n">{passo.n}</span>
        <div><p className="passo-kicker">Passo {passo.n} de 8 · {passo.cubista}</p><h2>{passo.titulo}</h2></div>
      </div>
      <section className="card objetivo">
        <p><b>Objetivo:</b> {passo.objetivo}</p>
        <p className="segurar"><span className="hold" aria-hidden="true"><i style={{ background: 'var(--yellow)' }} /><i style={{ background: '#F8F9FC' }} /></span><span><b>Como segurar:</b> {passo.segurar}</span></p>
      </section>
      <PassoDemo passo={passo} fim={fim} />
      {pecas >= total ? (
        <section className="card pecas-card completo">
          <Mascot mood="trofeu" size={84} />
          <div>
            <h3>{ultimo ? 'Cubo montado!' : `Passo ${passo.n} pronto no seu cubo!`}</h3>
            <p>{ultimo ? 'Você fez os 8 passos.' : total > 1 ? `As ${total} peças estão no lugar.` : 'Tudo certo neste passo.'}</p>
          </div>
          <button className="btn btn-pop btn-big" onClick={onFinish}>{ultimo ? 'Comemorar!' : `Ir para o passo ${passo.n + 1}`}</button>
          <button className="link-btn" onClick={() => setPecas(0)}>Começar este passo de novo</button>
        </section>
      ) : (
        <section className="card pecas-card">
          {total > 1 && <Pecas feitas={pecas} total={total} />}
          <p>{total > 1 && <b>{pecas === 0 ? `Vamos resolver um ${passo.peca} de cada vez. ` : `${pecas} de ${total} prontas! `}</b>}{passo.pergunta ?? `Como está o ${pecas === 0 ? 'primeiro' : 'próximo'} ${passo.peca} no seu cubo?`}</p>
          {total > 1 && <button className="link-btn" onClick={maisUma}>Esse {passo.peca} já está certo: pular para o próximo</button>}
          <button className="link-btn" onClick={onFinish}>{ultimo ? 'Meu cubo já está montado!' : feito ? `Ir para o passo ${passo.n + 1}` : `O passo inteiro já está pronto no meu cubo: ir para o passo ${passo.n + 1}`}</button>
        </section>
      )}
      <Speech mood="aponta">{passo.dica}</Speech>
      {pecas < total && <h3 className="sec-title">Escolha a situação igual à do seu cubo</h3>}
      {pecas < total && <label className="toggle toggle-lista"><input type="checkbox" checked={letras} onChange={e => setLetras(e.target.checked)} /> Mostrar a fórmula em letras (R, U, F…)</label>}
      {pecas < total && <ul className="casos">
        {passo.casos.map((c, i) => (
          <li key={c.id}>
            <button className="caso" onClick={() => { setTreino(false); setCaso(c); }}>
              <span className="caso-n">{String.fromCharCode(65 + i)}</span>
              <span><b>{c.nome}</b><small>{c.ver}</small>{letras && <code className="formula">{c.lances.map(l => l.m).join(' ')}</code>}</span>
              <span className="caso-go" aria-hidden="true">›</span>
            </button>
          </li>
        ))}
      </ul>}
      <button className="btn btn-big" onClick={() => { setTreino(true); setCaso(passo.casos[Math.floor(Math.random() * passo.casos.length)]); }}>Treinar este passo</button>
    </div>
  );
}

const key = (s: CubeState) => { const f = facelets(s); return FACES.map(x => f[x].join('')).join('|'); };
const QUARTER = FACES.flatMap(f => [f, f + "'"]);
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** mostra uma situação e a fórmula, giro a giro; no treino, a pessoa faz sozinha */
function Player({ passo, caso, treino, sound, onBack, onSee, onDone, onAnother, onTrain, onFinish, total, pecaN, onPiece }: {
  passo: Passo; caso: Caso; treino: boolean; sound: boolean;
  onBack: () => void; onSee: () => void; onDone: () => void; onAnother: () => void; onTrain: () => void; onFinish: () => void; total: number; pecaN: number; onPiece: () => void;
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
  /** onde o cubo está no caminho. Procura a partir da posição atual, porque o caminho pode
   *  passar duas vezes pelo mesmo estado (ex.: "volta a frente" seguido de "gira a frente") */
  const posRef = useRef(0);
  const onde = (k: string, de = posRef.current) => {
    let i = de >= 0 ? path.states.indexOf(k, de) : -1;
    if (i < 0) i = path.states.indexOf(k);
    posRef.current = i;
    return i;
  };
  const scene = useRef<CubeScene | null>(null);
  const busy = useRef(false);
  const alive = useRef(true);
  const last = useRef<string | null>(null);
  const [pos, setPos] = useState(0);          // posição no caminho (-1 = saiu do caminho)
  const [done, setDone] = useState(false);
  const [letras, setLetras] = useLetras();
  const parar = useRef(false);
  const [dica, setDica] = useState(!treino);
  const [msg, setMsg] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const listRef = useRef<HTMLOListElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (done) setTimeout(() => doneRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }), 300); }, [done]);
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
    const p = onde(key(state.current));
    setPos(p);
    if (passo.pronto(state.current, meta) || p === path.states.length - 1) {
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
  /** o próximo movimento é girar o cubo inteiro? (isso não dá para fazer arrastando uma face) */
  const giroInteiro = !done && !playing && pos >= 0 && pos < path.qs.length && isWholeCube(path.qs[pos].m) ? path.qs[pos] : null;
  const girarInteiro = async () => {
    if (!giroInteiro || busy.current) return;
    busy.current = true; scene.current?.hint(null);
    // faz o lance inteiro (um z2 são dois quartos)
    let p = pos;
    while (p >= 0 && p < path.qs.length && path.qs[p].lance === giroInteiro.lance) {
      last.current = path.qs[p].m;
      await turn(path.qs[p].m, 650);
      p = onde(key(state.current), p);
    }
    busy.current = false;
    settle(true);
  };

  /** o Pingo faz: anima a partir de onde está, um lance por vez, devagar */
  const mostrar = async (soUm: boolean, demo = false) => {
    if (busy.current || done) return;
    busy.current = true; setMsg(null); setDica(true);
    if (pos < 0) { await resetar(true); }
    let p = onde(key(state.current));
    setPlaying(true); scene.current?.hint(null);
    parar.current = false;
    while (alive.current && !parar.current && p >= 0 && p < path.qs.length) {
      const lance = path.qs[p].lance, m = caso.lances[lance].m;
      setPos(p);
      await sleep(soUm ? 150 : 500);
      if (!alive.current) return;
      if (parar.current) break;
      await turn(m, m.endsWith('2') ? 800 : 650);
      p = onde(key(state.current), p);
      if (soUm) break;
      await sleep(350);
    }
    if (!alive.current) return;
    const parou = parar.current; parar.current = false;
    if (demo) {
      if (!parou) { await sleep(1100); if (!alive.current) return; }
      setPlaying(false); await resetar(); setVisto(true);
      return;
    }
    setPlaying(false); busy.current = false; last.current = null;
    settle(false);
  };
  /** ao abrir a situação, o Pingo faz uma vez; depois o cubo volta e é a sua vez */
  const [visto, setVisto] = useState(treino);
  useEffect(() => {
    if (treino) return;
    const t = setTimeout(() => mostrar(false, true), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetar = async (keepBusy = false) => {
    busy.current = true;
    state.current = clone(start); last.current = null;
    scene.current?.setGrey(greyKeys(start, passo.foco)); scene.current?.paint(facelets(start));
    setPos(0); posRef.current = 0; setDone(false); setMsg(null); if (treino) setDica(false);
    document.querySelector('.content')?.scrollTo({ top: 0, behavior: 'smooth' });
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

      <div className={`stage stage-player ${done ? "solto" : ""}`}>
        <Cube3D onReady={s => { scene.current = s; s.setGrey(greyKeys(start, passo.foco)); s.paint(facelets(start)); }}
          options={{ canTurn: () => !busy.current && !done, onMove }} />
        <button className="view-btn" onClick={() => scene.current?.resetView()}>Endireitar</button>
        {playing
          ? <button className="btn demo-btn demo-parar" onClick={() => { parar.current = true; }}>■ Parar</button>
          : giroInteiro
          ? <button className="btn btn-pop demo-btn" onClick={girarInteiro}>↻ Girar o cubo inteiro</button>
          : <span className="stage-hint">{treino ? 'Faça você: arraste a face para girar.' : 'Você também pode girar a face com o dedo.'}</span>}
      </div>

      {msg && <p className="warn-msg" role="status">{msg}</p>}
      {!treino && !done && !msg && (
        <p className={`vez-msg ${visto ? 'sua' : ''}`} role="status">{visto
          ? giroInteiro ? <><b>Agora é a sua vez.</b> Primeiro gire o cubo inteiro: toque em ↻ Girar o cubo inteiro, em cima do cubo.</> : <><b>Agora é a sua vez.</b> Arraste a face no cubo da tela, ou toque em Só o próximo giro.</>
          : playing ? <><b>Olhe primeiro:</b> o Pingo faz, você só observa.</> : <>Preparando a situação…</>}</p>
      )}

      {!done && (!treino || dica) && (
        <>
          {playing
            ? <button className="btn btn-big btn-parar" onClick={() => { parar.current = true; }}>■ Parar a apresentação</button>
            : <button className="btn btn-pop btn-big" onClick={() => mostrar(false)}>{pos > 0 ? 'Continuar devagar' : visto && !treino ? 'Ver de novo devagar' : 'Mostrar devagar'}</button>}
          <div className="row">
            <button className="btn" onClick={() => resetar()} disabled={playing}>Do começo</button>
            <button className="btn" onClick={() => mostrar(true)} disabled={playing}>Só o próximo giro</button>
          </div>
        </>
      )}

      {done ? (
        treino ? (
          <section className="card feito" aria-live="polite">
            <Confetti />
            <Mascot mood="trofeu" size={96} />
            <div>
              <h3>Você fez sem ajuda!</h3>
              <p>É assim que a mão aprende. Mais uma?</p>
            </div>
            <div className="row">
              <button className="btn" onClick={() => resetar()}>De novo</button>
              <button className="btn btn-pop" onClick={onAnother}>Outra situação</button>
            </div>
            <button className="link-btn fim-passo" onClick={onBack}>Voltar ao passo {passo.n}</button>
          </section>
        ) : (
          <section className="card feito" aria-live="polite">
            <Confetti />
            <Mascot mood="festa" size={96} />
            <div>
              <h3>Isso! Agora no seu cubo</h3>
              <p>{caso.depois ?? passo.repetir}</p>
            </div>
            {caso.depois ? (
              <button className="btn btn-pop btn-big" onClick={onBack}>Fiz no meu cubo: escolher a próxima situação</button>
            ) : (
              <>
                {total > 1 && <Pecas feitas={pecaN - 1} agora={pecaN} total={total} />}
                <button className="btn btn-pop btn-big" onClick={onPiece}>{total === 1 ? 'Ficou pronto no meu cubo!' : pecaN >= total ? `Fiz! As ${total} estão prontas` : `Fiz no meu cubo: ${passo.peca} ${pecaN} de ${total}`}</button>
                {total === 1 && <button className="btn" onClick={onBack}>No meu cubo ainda não ficou: escolher a situação de novo</button>}
              </>
            )}
            <button className="link-btn fim-passo" onClick={() => resetar()}>Quero ver de novo</button>
          </section>
        )
      ) : treino && !dica ? (
        <section className="card treino-card">
          <p>Segure como no passo: <b>{passo.segurar.toLowerCase()}</b></p>
          <p>Reconheceu a situação? Faça a fórmula girando as faces.</p>
          <div className="row">
            <button className="btn" onClick={() => setDica(true)}>Me dá uma dica</button>
            <button className="btn" onClick={onSee}>Ver o Pingo fazer</button>
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

      <div ref={doneRef} aria-hidden="true" />
    </div>
  );
}

/** as peças do passo: prontas, a da vez e as que faltam */
function Pecas({ feitas, agora, total = 4 }: { feitas: number; agora?: number; total?: number }) {
  return (
    <div className="pecas" role="img" aria-label={`${feitas} de ${total} peças prontas`}>
      {Array.from({ length: total }, (_, i) => i + 1).map(k => <span key={k} className={k <= feitas ? 'ok' : k === agora ? 'now' : ''}>{k <= feitas ? '✓' : k}</span>)}
    </div>
  );
}

/** o cubo do passo: mostra como fica no fim e, num toque, o passo inteiro sendo feito */
function PassoDemo({ passo, fim }: { passo: Passo; fim: CubeState }) {
  const scene = useRef<CubeScene | null>(null);
  const alive = useRef(true);
  const [legenda, setLegenda] = useState<string | null>(null);
  const [giro, setGiro] = useState<string | null>(null);
  const [tocando, setTocando] = useState(false);
  const parar = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  /** parou no meio: volta a mostrar como fica no fim */
  const interromper = () => { scene.current?.hint(null); setGiro(null); setLegenda(null); mostrarFim(); setTocando(false); };

  const mostrarFim = () => { const s = scene.current; if (!s) return; s.setGrey(greyKeys(fim, passo.foco)); s.paint(facelets(fim)); s.look(passo.fimDeBaixo); };
  const tocar = async () => {
    const s = scene.current; if (!s || tocando) return;
    setTocando(true); parar.current = false;
    const st = demoInicio(passo);
    s.resetView(); s.setGrey(greyKeys(st, passo.foco)); s.paint(facelets(st));
    setLegenda('Assim começa'); setGiro(null);
    await sleep(1200);
    for (const parte of passo.demo.partes) {
      if (!alive.current) return;
      if (parar.current) return interromper();
      setLegenda(parte.legenda);
      for (const m of parte.m.split(' ')) {
        if (!alive.current) return;
        if (parar.current) return interromper();
        setGiro(describe(m)); s.hint(m); await sleep(450); s.hint(null);
        applyMove(st, m);
        await s.turn(m, facelets(st), m.endsWith('2') ? 900 : 700, greyKeys(st, passo.foco));
        await sleep(250);
      }
      setGiro(null); await sleep(700);
    }
    if (!alive.current) return;
    setLegenda('Pronto! Assim fica no fim.'); s.look(passo.fimDeBaixo);
    setTocando(false);
  };

  return (
    <div className="stage stage-sm passo-demo">
      <Cube3D onReady={s => { scene.current = s; mostrarFim(); }} options={{ canTurn: () => false }} />
      {legenda && <span className="destaque">{legenda}</span>}
      {giro && <span className="demo-giro">{giro}</span>}
      {tocando && <button className="btn demo-btn demo-parar" onClick={() => { parar.current = true; }}>■ Parar</button>}
      {!tocando && (
        <button className="btn btn-pop demo-btn" onClick={tocar}>▶ {legenda ? 'Ver de novo' : 'Ver o passo inteiro'}</button>
      )}
      {!tocando && !legenda && <span className="stage-hint">Assim fica no fim.{greyKeys(fim, passo.foco).length > 0 && ' Cinza é o que ainda não importa.'}</span>}
    </div>
  );
}
