import { useEffect, useRef, useState } from 'react';
import { Cube3D } from '../components/Cube3D';
import { Mascot, Speech } from '../components/Mascot';
import { Confetti } from '../components/Confetti';
import type { CubeScene } from '../cube/CubeScene';
import { applyAlg, applyMove, facelets, invertMove, randomScramble, type CubeState } from '../cube/model';
import { describe } from '../cube/describe';
import { amareloEmCima, PASSOS, TODOS } from '../aulas/aulas';
import { FORMULAS } from '../aulas/formulas';
import { emQuePasso } from '../aulas/progresso';
import { formatar, loadTempos, saveTempos } from './Praticar';
import { sfx, buzz } from '../feedback';
import { subir, FIZ, SEI } from '../aulas/dominio';

/** passou do passo de para o passo ate: estrela de Sei se não abriu a dica, de Fiz se abriu */
function estrelasAoPassar(de: number, ate: number, comDica: Set<number>) {
  for (let k = Math.max(1, de); k < Math.min(ate, 9); k++) subir(k, comDica.has(k) ? FIZ : SEI);
}

/** o que usar em cada passo, só pelos nomes */
const USAR: Record<number, string> = {
  1: 'Sem fórmula: suba os meios brancos para perto do amarelo.',
  2: 'Sem fórmula: alinhe a cor com o centro e gire a frente duas vezes (F2).',
};
const formulasDo = (n: number) => FORMULAS.filter(f => f.passo === n && f.nome !== 'Sexy move');
const GIROS_CUBO = ['x', "x'", 'y', "y'", 'z', "z'"];

/** montar do começo ao fim sem a aula: o app mostra só o passo e o nome da fórmula */
export function Sozinha({ sound, onVoltar, onOpenPasso, onSolve, modoInicial }: {
  modoInicial?: 'real' | 'tela';
  sound: boolean; onVoltar: () => void; onOpenPasso: (n: number) => void; onSolve: () => void;
}) {
  const [modo, setModo] = useState<'tela' | 'real' | null>(modoInicial ?? null);
  if (modo === 'tela') return <NaTela sound={sound} onVoltar={() => setModo(null)} onOpenPasso={onOpenPasso} onSolve={onSolve} />;
  if (modo === 'real') return <NoMeuCubo sound={sound} onVoltar={() => setModo(null)} onSolve={onSolve} />;
  return (
    <div className="screen sozinha">
      <button className="back-btn self-start" onClick={onVoltar}>‹ Praticar</button>
      <Speech mood="cubo">Agora é com você! Eu mostro só o nome do passo e da fórmula. A ajuda fica escondida, para quando precisar.</Speech>
      <button className="praticar-item" onClick={() => setModo('real')} style={{ ['--c' as string]: 'var(--green)', ['--lip' as string]: 'var(--green-lip)' }}>
        <span className="praticar-ico" aria-hidden="true" />
        <span><b>No meu cubo</b><small>Cronômetro e a lista dos 8 passos. Você marca cada passo ao terminar.</small></span>
        <span className="caso-go" aria-hidden="true">›</span>
      </button>
      <button className="praticar-item" onClick={() => setModo('tela')} style={{ ['--c' as string]: 'var(--blue)', ['--lip' as string]: 'var(--blue-lip)' }}>
        <span className="praticar-ico" aria-hidden="true" />
        <span><b>No cubo da tela</b><small>Eu embaralho; você monta arrastando as faces. Eu reconheço o passo sozinho.</small></span>
        <span className="caso-go" aria-hidden="true">›</span>
      </button>
    </div>
  );
}

/** o cartão do passo da vez: nome, fórmula pelo nome e a dica escondida */
function PassoDaVez({ n, onAula, onDica }: { n: number; onAula?: () => void; onDica?: (n: number) => void }) {
  const [dica, setDica] = useState(false);
  useEffect(() => setDica(false), [n]);
  const t = TODOS.find(x => x.n === n)!, passo = PASSOS.find(x => x.n === n)!;
  const fs = formulasDo(n);
  return (
    <section className="card da-vez" aria-live="polite" style={{ ['--c' as string]: `var(--${t.cor})` }}>
      <p className="passo-kicker">Passo {n} de 8 · {passo.cubista}</p>
      <h3>{t.titulo}</h3>
      <p className="usar">{USAR[n] ?? <>Use: {fs.map((f, i) => <span key={f.nome}>{i > 0 && ' ou '}<b>{f.nome}</b></span>)}</>}</p>
      {dica ? (
        <div className="dica-aberta">
          <p>{passo.dica}</p>
          {fs.map(f => <p key={f.nome}><b>{f.nome}:</b> <code className="formula">{f.alg}</code><br /><small>{f.quando}</small></p>)}
          {onAula && <button className="link-btn" onClick={onAula}>Ver a aula deste passo</button>}
        </div>
      ) : <button className="link-btn" onClick={() => { setDica(true); onDica?.(n); }}>Mostrar a dica</button>}
    </section>
  );
}

function Caminho({ atual }: { atual: number }) {
  return (
    <div className="trilha-mini sozinha-mini" aria-label={`Passo ${Math.min(atual, 8)} de 8`}>
      {TODOS.filter(t => t.n >= 1).map(t => <i key={t.n} className={t.n < atual ? 'ok' : t.n === atual ? 'agora' : ''} style={{ ['--c' as string]: `var(--${t.cor})` }} />)}
    </div>
  );
}

/* ---------- no meu cubo ---------- */

function NoMeuCubo({ sound, onVoltar, onSolve }: { sound: boolean; onVoltar: () => void; onSolve: () => void }) {
  const [sugestao, setSugestao] = useState<string | null>(null);
  const [inicio, setInicio] = useState<number | null>(null);   // rodando desde
  const [guardado, setGuardado] = useState(0);                 // tempo antes da pausa
  const [pausado, setPausado] = useState(false);
  const [comecou, setComecou] = useState(false);
  const [agora, setAgora] = useState(0);
  const [n, setN] = useState(1);
  const [parciais, setParciais] = useState<number[]>([]);
  const [fim, setFim] = useState<number | null>(null);
  useEffect(() => {
    if (inicio === null || fim !== null) return;
    let raf = 0; const tick = () => { setAgora(guardado + performance.now() - inicio); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [inicio, guardado, fim]);
  const decorrido = () => inicio !== null ? guardado + performance.now() - inicio : guardado;
  const pausar = () => { const t = decorrido(); setGuardado(t); setAgora(t); setInicio(null); setPausado(true); buzz(10); };
  const continuar = () => { setPausado(false); setInicio(performance.now()); buzz(10); };

  const comDica = useRef(new Set<number>());
  const feito = () => {
    if (!comecou || pausado) return;
    estrelasAoPassar(n, n + 1, comDica.current);
    const t = decorrido();
    setParciais(p => [...p, t]);
    if (n < 8) { setN(n + 1); if (sound) sfx.click(); buzz(15); return; }
    const ms = Math.round(t); setFim(ms); setInicio(null);
    saveTempos([{ ms, quando: Date.now(), embaralhar: sugestao ?? '' }, ...loadTempos()]);
    if (sound) sfx.win(); buzz([30, 50, 70]); onSolve();
  };

  if (fim !== null) return (
    <div className="screen sozinha">
      <Confetti />
      <Speech mood="melhor">Montou sem ajuda! {formatar(fim)}. O tempo foi para o seu histórico.</Speech>
      <section className="card parciais">
        <h3>Tempo de cada passo</h3>
        <ol>{parciais.map((t, i) => <li key={i}><span>{TODOS.find(x => x.n === i + 1)?.titulo}</span><b>{formatar(t - (parciais[i - 1] ?? 0))}</b></li>)}</ol>
      </section>
      <button className="btn btn-pop btn-big" onClick={onVoltar}>Voltar</button>
    </div>
  );

  return (
    <div className="screen sozinha">
      {!comecou && <button className="back-btn self-start" onClick={onVoltar}>‹ Montar sem ajuda</button>}
      {!comecou ? (
        <>
          <Speech mood="cubo">Embaralhe o seu cubo do seu jeito, girando à vontade. Quando estiver pronto, toque em começar.</Speech>
          {sugestao ? (
            <section className="card embaralhar">
              <p className="passo-kicker">Embaralhamento sugerido (verde de frente, branco em cima)</p>
              <p className="alg-grande">{sugestao}</p>
              <button className="link-btn" onClick={() => setSugestao(null)}>Não preciso</button>
            </section>
          ) : <button className="link-btn self-start" onClick={() => setSugestao(randomScramble(20).join(' '))}>Quero um embaralhamento sugerido</button>}
        </>
      ) : <Caminho atual={n} />}
      <div className={`relogio relogio-sm ${inicio !== null ? 'rodando' : ''} ${pausado ? 'pausado' : ''}`}>
        <span className="relogio-tempo">{formatar(comecou ? agora : 0)}</span>
        {pausado && <span className="relogio-dica">Pausado</span>}
      </div>
      {!comecou
        ? <button className="btn btn-pop btn-big" onClick={() => { setComecou(true); setInicio(performance.now()); if (sound) sfx.click(); }}>Já embaralhei: começar</button>
        : pausado
          ? <button className="btn btn-pop btn-big" onClick={continuar}>▶ Continuar</button>
          : <>
              <PassoDaVez n={n} onDica={k => comDica.current.add(k)} />
              <button className="btn btn-pop btn-big" onClick={feito}>{n < 8 ? `Passo ${n} feito ✓` : 'Cubo montado! ✓'}</button>
              <button className="btn" onClick={pausar}>⏸ Pausar</button>
            </>}
    </div>
  );
}

/* ---------- no cubo da tela ---------- */

function NaTela({ sound, onVoltar, onOpenPasso, onSolve }: { sound: boolean; onVoltar: () => void; onOpenPasso: (n: number) => void; onSolve: () => void }) {
  const novo = () => applyAlg(amareloEmCima(), randomScramble(22));
  const scene = useRef<CubeScene | null>(null);
  const state = useRef<CubeState>(novo());
  const hist = useRef<string[]>([]);
  const comDica = useRef(new Set<number>());
  const busy = useRef(false);
  const [n, setN] = useState(() => emQuePasso(state.current));
  const [giros, setGiros] = useState(0);
  const [inicio, setInicio] = useState<number | null>(null);
  const [agora, setAgora] = useState(0);
  const [fim, setFim] = useState<number | null>(null);
  useEffect(() => {
    if (inicio === null || fim !== null) return;
    let raf = 0; const tick = () => { setAgora(performance.now() - inicio); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [inicio, fim]);

  const girar = async (m: string, gravar = true) => {
    if (busy.current || fim !== null) return;
    busy.current = true;
    if (inicio === null) setInicio(performance.now());
    applyMove(state.current, m);
    if (gravar) hist.current.push(m);
    if (!'xyz'.includes(m[0])) setGiros(g => g + (gravar ? 1 : -1));
    if (sound) sfx.click(); buzz(8);
    await scene.current!.turn(m, facelets(state.current), 'xyz'.includes(m[0]) ? 450 : 220);
    busy.current = false;
    const agoraN = emQuePasso(state.current);
    if (agoraN > n) estrelasAoPassar(n, agoraN, comDica.current);
    if (agoraN > n && agoraN <= 9) { if (sound) sfx.good(); buzz(25); }
    setN(agoraN);
    if (agoraN === 9 && inicio !== null) { setFim(performance.now() - inicio); if (sound) sfx.win(); buzz([30, 50, 70]); onSolve(); }
  };
  const girarRef = useRef(girar); girarRef.current = girar;
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toUpperCase();
      if (k.length === 1 && 'RLUDFB'.includes(k)) { e.preventDefault(); girarRef.current(e.shiftKey ? k + "'" : k); }
      else if (k.length === 1 && 'XYZ'.includes(k)) { e.preventDefault(); const r = k.toLowerCase(); girarRef.current(e.shiftKey ? r + "'" : r); }
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, []);
  const desfazer = () => { const m = hist.current.pop(); if (m) girar(invertMove(m), false); };
  const recomecar = () => {
    if (busy.current) return;
    state.current = novo(); hist.current = [];
    scene.current?.paint(facelets(state.current));
    setN(emQuePasso(state.current)); setGiros(0); setInicio(null); setAgora(0); setFim(null);
  };

  return (
    <div className="screen sozinha">
      <div className="sozinha-topo">
        <button className="back-btn" onClick={onVoltar}>‹ Montar sem ajuda</button>
        <span className="chip">{formatar(fim ?? (inicio === null ? 0 : agora))}</span>
        <span className="chip">{giros} giros</span>
      </div>
      <Caminho atual={n} />
      <div className="stage stage-player">
        <Cube3D onReady={s => { scene.current = s; s.paint(facelets(state.current)); }} options={{ canTurn: () => fim === null, onMove: m => girar(m) }} />
        <button className="view-btn" onClick={() => scene.current?.resetView()}>Endireitar</button>
        <span className="stage-hint">Arraste uma face para girar. Fora do cubo, vira a vista.</span>
      </div>
      {fim !== null ? (
        <section className="card feito">
          <Confetti />
          <Mascot mood="melhor" size={96} />
          <div><h3>Montou sem ajuda!</h3><p>{formatar(fim)} e {giros} giros.</p></div>
          <button className="btn btn-pop btn-big" onClick={recomecar}>Montar outro</button>
        </section>
      ) : (
        <>
          <PassoDaVez n={n} onDica={k => comDica.current.add(k)} onAula={() => { comDica.current.add(n); onOpenPasso(n); }} />
          <div className="girar-cubo" role="group" aria-label="Girar o cubo inteiro">
            <span>Girar o cubo inteiro</span>
            {GIROS_CUBO.map(m => <button key={m} className="key key-giro" onClick={() => girar(m)} title={describe(m)} aria-label={`${m}: ${describe(m)}`}><b>{m}</b></button>)}
          </div>
          <div className="row">
            <button className="btn" onClick={desfazer} disabled={!hist.current.length}>Desfazer</button>
            <button className="btn" onClick={recomecar}>Outro cubo</button>
          </div>
        </>
      )}
    </div>
  );
}
