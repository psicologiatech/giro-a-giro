import { useEffect, useRef, useState } from 'react';
import { Cube3D } from '../components/Cube3D';
import { Mascot, Speech } from '../components/Mascot';
import type { CubeScene } from '../cube/CubeScene';
import { applyAlg, applyMove, facelets, invertAlg, randomScramble, type CubeState } from '../cube/model';
import { describe } from '../cube/describe';
import { amareloEmCima, TODOS } from '../aulas/aulas';
import { FORMULAS, type Formula } from '../aulas/formulas';
import { Brincar } from './Brincar';
import { Sozinha } from './Sozinha';
import { TreinoDia } from './TreinoDia';
import { partesHoje } from '../aulas/revisao';
import { sfx, buzz } from '../feedback';

export type Parte = 'menu' | 'treino' | 'sozinha' | 'cronometro' | 'caderno' | 'travei' | 'livre';

/** a área de prática: liberada depois do passo 8 */
export function Praticar({ passosTreino = [], liberado, sound, onSolve, onPratica, onTrilha, onOpenPasso, onTreinarPasso, onScan, inicial }: {
  inicial?: Parte; onTreinarPasso?: (n: number) => void; passosTreino?: number[];
  liberado: boolean; sound: boolean; onSolve: () => void; onPratica?: () => void;
  onTrilha: () => void; onOpenPasso: (n: number) => void; onScan: () => void;
}) {
  const [parte, setParte] = useState<Parte>(inicial ?? 'menu');
  const voltar = () => setParte('menu');

  const treino = <TreinoDia sound={sound} passos={passosTreino} onVoltar={voltar} onPratica={() => onPratica?.()}
    onTreinarPasso={n => (onTreinarPasso ?? onOpenPasso)(n)} />;
  // o Treino do dia abre antes do resto: a partir do passo 3 da trilha
  if (parte === 'treino' && passosTreino.length) return treino;

  if (!liberado) return (
    <div className="screen praticar">
      <Speech mood="cubo">A área de prática abre quando você terminar os 8 passos da trilha. Falta pouco!</Speech>
      <section className="card trancado">
        <h2>O que tem aqui</h2>
        <ul className="checklist">
          <li><b>Treino do dia</b>, para a mão e a memória aprenderem de vez.</li>
          <li><b>Montagem completa</b>, só com os nomes das fórmulas.</li>
          <li><b>Cronômetro</b> para medir seus tempos.</li>
          <li><b>Caderno de fórmulas</b>, com os nomes que os cubistas usam.</li>
          <li><b>Travei!</b> para voltar ao passo certo.</li>
          <li><b>Cubo livre</b> para mexer à vontade.</li>
        </ul>
      </section>
      {passosTreino.length > 0 && <button className="btn btn-pop btn-big" onClick={() => setParte('treino')}>Treino do dia (já aberto)</button>}
      <button className={`btn btn-big ${passosTreino.length ? '' : 'btn-pop'}`} onClick={onTrilha}>Ir para a trilha</button>
    </div>
  );

  if (parte === 'sozinha') return <Sozinha sound={sound} onVoltar={voltar} onOpenPasso={onOpenPasso} onSolve={onSolve} />;
  if (parte === 'cronometro') return <Cronometro sound={sound} onVoltar={voltar} onPratica={onPratica} />;
  if (parte === 'caderno') return <Caderno onVoltar={voltar} />;
  if (parte === 'travei') return <Travei onVoltar={voltar} onOpenPasso={onOpenPasso} onScan={onScan} />;
  if (parte === 'livre') return <Brincar sound={sound} onSolve={onSolve} onVoltar={voltar} />;

  const ITENS: { id: Parte; titulo: string; texto: string; cor: string }[] = [
    { id: 'treino', titulo: `Treino do dia${partesHoje().includes(1) && partesHoje().includes(2) ? ' ✓' : ''}`, texto: 'Uns 5 minutos: as situações no seu nível e o ponto fraco.', cor: 'pop' },
    { id: 'sozinha', titulo: 'Montagem completa', texto: 'Do começo ao fim, só com os nomes das fórmulas. A ajuda fica escondida.', cor: 'yellow' },
    { id: 'cronometro', titulo: 'Cronômetro', texto: 'Embaralhe o seu cubo, monte e veja quanto tempo levou.', cor: 'green' },
    { id: 'caderno', titulo: 'Caderno de fórmulas', texto: 'Todas as fórmulas, com o nome dos cubistas e o giro a giro no cubo.', cor: 'blue' },
    { id: 'travei', titulo: 'Travei!', texto: 'Não sabe o que fazer agora? Eu te levo ao passo certo.', cor: 'orange' },
    { id: 'livre', titulo: 'Cubo livre', texto: 'Um cubo na tela para mexer à vontade.', cor: 'red' },
  ];
  return (
    <div className="screen praticar">
      <Speech mood="trofeu">Você já sabe montar o cubo! Agora é treinar até a mão fazer sozinha.</Speech>
      <ul className="praticar-menu">
        {ITENS.map(it => (
          <li key={it.id}>
            <button className="praticar-item" onClick={() => setParte(it.id)} style={{ ['--c' as string]: `var(--${it.cor})`, ['--lip' as string]: `var(--${it.cor}-lip)` }}>
              <span className="praticar-ico" aria-hidden="true" />
              <span><b>{it.titulo}</b><small>{it.texto}</small></span>
              <span className="caso-go" aria-hidden="true">›</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Voltar({ onVoltar }: { onVoltar: () => void }) {
  return <button className="back-btn self-start" onClick={onVoltar}>‹ Praticar</button>;
}

/* ---------- cronômetro ---------- */

export interface Tempo { ms: number; quando: number; embaralhar: string }
const TKEY = 'giroagiro.tempos.v1';
export const loadTempos = (): Tempo[] => { try { return JSON.parse(localStorage.getItem(TKEY) || '[]'); } catch { return []; } };
export const saveTempos = (t: Tempo[]) => { try { localStorage.setItem(TKEY, JSON.stringify(t.slice(0, 200))); } catch { /* sem armazenamento */ } };
export function formatar(ms: number) {
  const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000), c = Math.floor((ms % 1000) / 10);
  return `${m ? `${m}:${String(s).padStart(2, '0')}` : s},${String(c).padStart(2, '0')}`;
}
/** média dos últimos 5, sem o melhor e o pior (como nas competições); null se tiver menos de 5 */
export function mediaDe5(t: Tempo[]): number | null {
  if (t.length < 5) return null;
  const ult = t.slice(0, 5).map(x => x.ms).sort((a, b) => a - b).slice(1, 4);
  return ult.reduce((a, b) => a + b, 0) / 3;
}

function Cronometro({ sound, onVoltar, onPratica }: { sound: boolean; onVoltar: () => void; onPratica?: () => void }) {
  const [sugestao, setSugestao] = useState<string | null>(null);   // embaralhamento sugerido (opcional)
  const [tempos, setTempos] = useState<Tempo[]>(loadTempos);
  const [inicio, setInicio] = useState<number | null>(null);        // rodando desde
  const [guardado, setGuardado] = useState(0);                      // tempo acumulado antes da pausa
  const [pausado, setPausado] = useState(false);
  const [agora, setAgora] = useState(0);
  const [ultimo, setUltimo] = useState<number | null>(null);
  useEffect(() => saveTempos(tempos), [tempos]);
  useEffect(() => {
    if (inicio === null) return;
    let raf = 0; const tick = () => { setAgora(guardado + performance.now() - inicio); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [inicio, guardado]);

  const emAndamento = inicio !== null || pausado;
  const comecar = () => { setUltimo(null); setAgora(0); setGuardado(0); setPausado(false); setInicio(performance.now()); if (sound) sfx.click(); buzz(15); };
  const pausar = () => { if (inicio === null) return; const t = guardado + performance.now() - inicio; setGuardado(t); setAgora(t); setInicio(null); setPausado(true); buzz(10); };
  const continuar = () => { setPausado(false); setInicio(performance.now()); buzz(10); };
  const descartar = () => { setInicio(null); setPausado(false); setGuardado(0); setAgora(0); };
  const terminar = () => {
    const ms = Math.round(inicio !== null ? guardado + performance.now() - inicio : guardado);
    setInicio(null); setPausado(false); setGuardado(0); setUltimo(ms);
    const melhorAntes = tempos.length ? Math.min(...tempos.map(t => t.ms)) : Infinity;
    setTempos(t => [{ ms, quando: Date.now(), embaralhar: sugestao ?? '' }, ...t]);
    onPratica?.();
    setSugestao(null);
    if (sound) (ms < melhorAntes ? sfx.win : sfx.good)(); buzz(ms < melhorAntes ? [30, 50, 70] : 20);
  };
  const tocar = () => { if (pausado) continuar(); else if (inicio === null) comecar(); else terminar(); };
  const tocarRef = useRef(tocar); tocarRef.current = tocar;
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); tocarRef.current(); } };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, []);

  const melhor = tempos.length ? Math.min(...tempos.map(t => t.ms)) : null;
  const media = mediaDe5(tempos);
  return (
    <div className="screen cronometro">
      {!emAndamento && <Voltar onVoltar={onVoltar} />}
      {!emAndamento && (ultimo !== null && ultimo === melhor
        ? <Speech mood="melhor">Novo recorde! {formatar(ultimo)} é o seu melhor tempo.</Speech>
        : <Speech mood="cronometro">Embaralhe o seu cubo do seu jeito, girando à vontade. Quando estiver com ele na mão, toque para começar.</Speech>)}
      {!emAndamento && (sugestao ? (
        <section className="card embaralhar">
          <p className="passo-kicker">Embaralhamento sugerido (verde de frente, branco em cima)</p>
          <p className="alg-grande">{sugestao}</p>
          <div className="row">
            <button className="link-btn" onClick={() => setSugestao(randomScramble(20).join(' '))}>Outro</button>
            <button className="link-btn" onClick={() => setSugestao(null)}>Não preciso</button>
          </div>
        </section>
      ) : (
        <button className="link-btn self-start" onClick={() => setSugestao(randomScramble(20).join(' '))}>Quero um embaralhamento sugerido</button>
      ))}
      <button className={`relogio ${inicio !== null ? 'rodando' : ''} ${pausado ? 'pausado' : ''}`} onClick={tocar}
        aria-label={pausado ? 'Continuar o cronômetro' : inicio !== null ? 'Parar: terminei' : 'Começar o cronômetro'}>
        <span className="relogio-tempo">{formatar(emAndamento ? agora : ultimo ?? 0)}</span>
        <span className="relogio-dica">{pausado ? 'Pausado. Toque para continuar' : inicio !== null ? 'Toque quando terminar' : ultimo !== null ? (ultimo === melhor ? 'Seu melhor tempo!' : 'Toque para começar de novo') : 'Toque para começar'}</span>
      </button>
      {inicio !== null && <button className="btn btn-big" onClick={pausar}>⏸ Pausar</button>}
      {pausado && (
        <div className="row">
          <button className="btn" onClick={descartar}>Descartar este tempo</button>
          <button className="btn btn-pop" onClick={terminar}>Terminei: salvar</button>
        </div>
      )}
      {!emAndamento && (
        <>
          <div className="stats">
            <div><small>Melhor</small><b>{melhor !== null ? formatar(melhor) : '–'}</b></div>
            <div><small>Média de 5</small><b>{media !== null ? formatar(media) : '–'}</b></div>
            <div><small>Montagens</small><b>{tempos.length}</b></div>
          </div>
          {tempos.length > 0 && (
            <section className="card tempos">
              <h3>Seus tempos</h3>
              <ol>
                {tempos.slice(0, 12).map((t, i) => (
                  <li key={t.quando}>
                    <span className={t.ms === melhor ? 'melhor' : ''}>{formatar(t.ms)}</span>
                    <small>{new Date(t.quando).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</small>
                    <button className="x" onClick={() => setTempos(ts => ts.filter((_, j) => j !== i))} aria-label={`Apagar o tempo ${formatar(t.ms)}`}>×</button>
                  </li>
                ))}
              </ol>
            </section>
          )}
          <p className="note">No computador, a barra de espaço começa, para e continua.</p>
        </>
      )}
    </div>
  );
}

/* ---------- caderno de fórmulas ---------- */

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function Caderno({ onVoltar }: { onVoltar: () => void }) {
  const [aberta, setAberta] = useState<Formula | null>(null);
  if (aberta) return <FormulaView f={aberta} onVoltar={() => setAberta(null)} />;
  const titulo = (n: number) => TODOS.find(t => t.n === n)?.titulo ?? '';
  const passos = [...new Set(FORMULAS.map(f => f.passo))].sort((a, b) => a - b);
  return (
    <div className="screen caderno">
      <Voltar onVoltar={onVoltar} />
      <Speech mood="estudando">Todas as fórmulas num lugar só. Toque em uma para ver o giro a giro no cubo.</Speech>
      <h2 className="sec-title">Caderno de fórmulas</h2>
      {passos.map(n => (
        <section key={n} className="caderno-grupo">
          <p className="passo-kicker">Passo {n} · {titulo(n)}</p>
          <ul className="casos">
            {FORMULAS.filter(f => f.passo === n).map(f => (
              <li key={f.nome}>
                <button className="caso" onClick={() => setAberta(f)}>
                  <span className="caso-n">{n}</span>
                  <span><b>{f.nome}</b><small>{f.apelido}</small><code className="formula">{f.alg}</code></span>
                  <span className="caso-go" aria-hidden="true">›</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function FormulaView({ f, onVoltar }: { f: Formula; onVoltar: () => void }) {
  const moves = f.alg.split(' ');
  const base = () => f.segurar === 'amarelo de frente' ? applyAlg(amareloEmCima(), "x'") : amareloEmCima();
  const inicio = () => applyAlg(base(), invertAlg(moves));
  const scene = useRef<CubeScene | null>(null);
  const state = useRef<CubeState>(inicio());
  const alive = useRef(true), parar = useRef(false);
  const [i, setI] = useState(-1);
  const [tocando, setTocando] = useState(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const resetar = () => { state.current = inicio(); scene.current?.paint(facelets(state.current)); setI(-1); };
  const tocar = async () => {
    if (tocando) return;
    resetar(); setTocando(true); parar.current = false;
    await sleep(600);
    for (let k = 0; k < moves.length; k++) {
      if (!alive.current) return;
      if (parar.current) break;
      setI(k); scene.current?.hint(moves[k]); await sleep(450); scene.current?.hint(null);
      applyMove(state.current, moves[k]);
      await scene.current!.turn(moves[k], facelets(state.current), moves[k].endsWith('2') ? 850 : 650);
      await sleep(200);
    }
    if (!alive.current) return;
    setTocando(false); if (!parar.current) setI(moves.length);
  };

  return (
    <div className="screen formula-view">
      <button className="back-btn self-start" onClick={onVoltar}>‹ Caderno</button>
      <div>
        <p className="passo-kicker">Passo {f.passo} · {f.apelido}</p>
        <h2 className="player-title">{f.nome}</h2>
      </div>
      <div className="stage stage-sm">
        <Cube3D onReady={s => { scene.current = s; s.paint(facelets(state.current)); }} options={{ canTurn: () => false }} />
        {tocando
          ? <button className="btn demo-btn demo-parar" onClick={() => { parar.current = true; }}>■ Parar</button>
          : <button className="btn btn-pop demo-btn" onClick={tocar}>▶ {i >= 0 ? 'Ver de novo' : 'Ver devagar'}</button>}
        {tocando && i >= 0 && i < moves.length && <span className="demo-giro">{describe(moves[i])}</span>}
      </div>
      <div className="alg-letras" aria-label="A fórmula em letras">
        {moves.map((m, k) => <span key={k} className={k < i ? 'done' : k === i && tocando ? 'now' : ''}>{m}</span>)}
      </div>
      <section className="card">
        <p><b>Como segurar:</b> {f.segurar}.</p>
        <p><b>Quando usar:</b> {f.quando}</p>
      </section>
    </div>
  );
}

/* ---------- travei ---------- */

function Travei({ onVoltar, onOpenPasso, onScan }: { onVoltar: () => void; onOpenPasso: (n: number) => void; onScan: () => void }) {
  return (
    <div className="screen travei">
      <Voltar onVoltar={onVoltar} />
      <Speech mood="travei">Calma, acontece com todo mundo! Você sabe em que passo o seu cubo está?</Speech>
      <section className="card">
        <h3 className="sec-title">Sei: me leva para o passo</h3>
        <div className="travei-passos">
          {TODOS.filter(t => t.n >= 1).map(t => (
            <button key={t.n} className="travei-passo" onClick={() => onOpenPasso(t.n)}
              style={{ ['--c' as string]: `var(--${t.cor})`, ['--lip' as string]: `var(--${t.cor}-lip)` }}>
              <b>{t.n}</b><small>{t.titulo}</small>
            </button>
          ))}
        </div>
      </section>
      <section className="card travei-camera">
        <Mascot mood="camera" size={72} />
        <div>
          <h3 className="sec-title">Não sei</h3>
          <p>Mostre o cubo para a câmera. Eu descubro o passo e te levo direto para ele.</p>
        </div>
        <button className="btn btn-pop btn-big" onClick={onScan}>Ler meu cubo com a câmera</button>
      </section>
    </div>
  );
}
