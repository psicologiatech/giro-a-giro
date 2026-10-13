import { useEffect, useRef, useState } from 'react';
import { Cube3D } from '../components/Cube3D';
import { Speech } from '../components/Mascot';
import { Confetti } from '../components/Confetti';
import type { CubeScene } from '../cube/CubeScene';
import { applyMove, clone, facelets, type CubeState } from '../cube/model';
import { describe } from '../cube/describe';
import { greyKeys, movesOf, setupOf } from '../aulas/aulas';
import { loadDominio, passoMaisFraco, estrelas } from '../aulas/dominio';
import { escolher, loadRevisao, marcarParte, partesHoje, responder, saveRevisao, SITUACOES } from '../aulas/revisao';
import { TODOS } from '../aulas/aulas';
import { sfx, buzz } from '../feedback';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Treino do dia: aquecimento (lembrar antes de ver), ponto fraco e uma montagem completa */
export function TreinoDia({ sound, onVoltar, onTreinarPasso, onMontar, onPratica }: {
  sound: boolean; onVoltar: () => void; onTreinarPasso: (n: number) => void; onMontar: () => void; onPratica: () => void;
}) {
  const [feitas, setFeitas] = useState(partesHoje);
  const [aquecendo, setAquecendo] = useState(false);
  const atualizar = () => setFeitas(partesHoje());
  const fraco = passoMaisFraco(loadDominio());
  const fracoT = TODOS.find(t => t.n === fraco)!;

  if (aquecendo) return <Aquecimento sound={sound} onFim={() => { marcarParte(1); onPratica(); atualizar(); setAquecendo(false); }} onSair={() => setAquecendo(false)} />;

  const PARTES = [
    { n: 1, titulo: 'Aquecimento: qual é a situação?', texto: '5 situações misturadas: escolha o que fazer em cada uma.', ir: () => setAquecendo(true) },
    { n: 2, titulo: `Ponto fraco: passo ${fraco}`, texto: `${fracoT.titulo}, com ${estrelas(loadDominio(), fraco)} de 3 estrelas. Treine sem pedir dica.`, ir: () => { marcarParte(2); onTreinarPasso(fraco); } },
    { n: 3, titulo: 'Uma montagem completa', texto: 'No seu cubo, do começo ao fim, com cronômetro e sem ajuda.', ir: () => { marcarParte(3); onMontar(); } },
  ];
  const tudo = PARTES.every(p => feitas.includes(p.n));
  return (
    <div className="screen treino-dia">
      <button className="back-btn self-start" onClick={onVoltar}>‹ Praticar</button>
      {tudo
        ? <><Confetti /><Speech mood="sequencia">Treino de hoje completo! Volte amanhã: as situações que você errou vão aparecer de novo.</Speech></>
        : <Speech mood="estudando">Uns 10 minutos por dia, em vários dias, ensinam mais do que uma maratona. Bora?</Speech>}
      <ol className="partes">
        {PARTES.map(p => (
          <li key={p.n}>
            <button className={`parte ${feitas.includes(p.n) ? 'ok' : ''}`} onClick={p.ir}>
              <span className="parte-n">{feitas.includes(p.n) ? '✓' : p.n}</span>
              <span><b>{p.titulo}</b><small>{p.texto}</small></span>
              <span className="caso-go" aria-hidden="true">›</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

interface Opcao { id: string; falas: string[]; letras: string; certa: boolean }
/** 3 opções: a certa e duas de outras situações (do mesmo passo, se der), todas diferentes entre si */
function opcoesPara(id: string): Opcao[] {
  const sit = SITUACOES.find(s => s.id === id)!;
  const letras = (c: typeof sit.caso) => movesOf(c).join(' ');
  const certa = letras(sit.caso);
  const embaralha = <T,>(xs: T[]) => xs.map(x => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map(([, x]) => x);
  const mesmo = embaralha(SITUACOES.filter(s => s.passo.n === sit.passo.n && s.id !== id));
  const outros = embaralha(SITUACOES.filter(s => s.passo.n !== sit.passo.n));
  const vistas = new Set([certa]); const erradas: typeof SITUACOES = [];
  for (const s of [...mesmo, ...outros]) { const l = letras(s.caso); if (!vistas.has(l)) { vistas.add(l); erradas.push(s); } if (erradas.length === 2) break; }
  const op = (s: typeof sit, ok: boolean): Opcao => ({ id: s.id, falas: s.caso.lances.map(x => x.fala), letras: letras(s.caso), certa: ok });
  return embaralha([op(sit, true), ...erradas.map(s => op(s, false))]);
}
/** resume as falas: as 3 primeiras e quantos giros faltam */
const resumo = (falas: string[]) => falas.length <= 4 ? falas : [...falas.slice(0, 3), `… e mais ${falas.length - 3} giros`];

/** aquecimento: o passo e a situação no cubo; a pessoa escolhe entre 3 opções o que fazer */
function Aquecimento({ sound, onFim, onSair }: { sound: boolean; onFim: () => void; onSair: () => void }) {
  const [ids] = useState(() => escolher(loadRevisao()));
  const [i, setI] = useState(0);
  const [escolha, setEscolha] = useState<number | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [fim, setFim] = useState(false);
  const [opcoes, setOpcoes] = useState<Opcao[]>(() => (ids[0] ? opcoesPara(ids[0]) : []));
  const sit = SITUACOES.find(s => s.id === ids[i]);

  const escolher_ = (k: number) => {
    if (escolha !== null) return;
    const ok = opcoes[k].certa;
    setEscolha(k);
    saveRevisao(responder(loadRevisao(), ids[i], ok));
    if (ok) { setAcertos(a => a + 1); if (sound) sfx.good(); buzz(15); } else { if (sound) sfx.oops(); buzz([20, 40, 20]); }
  };
  const proxima = () => {
    if (i + 1 >= ids.length) { setFim(true); return; }
    setI(i + 1); setEscolha(null); setOpcoes(opcoesPara(ids[i + 1]));
  };

  if (fim) return (
    <div className="screen treino-dia">
      <Speech mood={acertos >= 4 ? 'melhor' : 'estudando'}>
        Você acertou {acertos} de {ids.length}! {acertos < ids.length ? 'As que errou voltam amanhã para mais uma chance.' : 'Estas só voltam daqui a alguns dias.'}
      </Speech>
      <button className="btn btn-pop btn-big" onClick={onFim}>Continuar o treino</button>
    </div>
  );
  if (!sit) return null;
  const acertou = escolha !== null && opcoes[escolha].certa;
  return (
    <div className="screen treino-dia">
      <div className="sozinha-topo">
        <button className="back-btn" onClick={onSair}>‹ Treino do dia</button>
        <span className="chip">{i + 1} de {ids.length}</span>
      </div>
      <div>
        <p className="passo-kicker">Passo {sit.passo.n} · {sit.passo.cubista}</p>
        <h2 className="player-title">{sit.passo.titulo}</h2>
      </div>
      <p className="player-ver">{sit.passo.objetivo}</p>
      <Situacao key={sit.id} passo={sit.passo} caso={sit.caso} animar={escolha !== null} />
      <h3 className="sec-title">{escolha === null ? 'O que fazer aqui?' : acertou ? 'Isso mesmo!' : 'Quase! A certa está em verde.'}</h3>
      <ul className="opcoes">
        {opcoes.map((o, k) => {
          const estado = escolha === null ? '' : o.certa ? 'certa' : k === escolha ? 'errada' : 'apagada';
          return (
            <li key={o.id}>
              <button className={`opcao ${estado}`} onClick={() => escolher_(k)} disabled={escolha !== null}>
                <span className="opcao-n">{String.fromCharCode(65 + k)}</span>
                <span>
                  <ol>{resumo(o.falas).map((f, j) => <li key={j}>{f}</li>)}</ol>
                  <code className="formula">{o.letras}</code>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {escolha !== null && (
        <>
          <section className="card resposta">
            <h3>{sit.caso.nome}</h3>
            <p>{sit.caso.ver}</p>
          </section>
          <button className="btn btn-pop btn-big" onClick={proxima}>{i + 1 >= ids.length ? 'Ver resultado' : 'Próxima'}</button>
        </>
      )}
    </div>
  );
}

/** o cubo da situação; com "animar", mostra a solução giro a giro */
function Situacao({ passo, caso, animar }: { passo: Parameters<typeof setupOf>[0]; caso: Parameters<typeof setupOf>[1]; animar: boolean }) {
  const scene = useRef<CubeScene | null>(null);
  const inicio = useRef<CubeState>(setupOf(passo, caso));
  const vivo = useRef(true);
  const [giro, setGiro] = useState<string | null>(null);
  useEffect(() => { vivo.current = true; return () => { vivo.current = false; }; }, []);
  useEffect(() => {
    if (!animar) return;
    (async () => {
      const st = clone(inicio.current);
      await sleep(400);
      for (const m of movesOf(caso)) {
        if (!vivo.current || !scene.current) return;
        setGiro(describe(m)); scene.current.hint(m); await sleep(400); scene.current.hint(null);
        applyMove(st, m);
        await scene.current.turn(m, facelets(st), m.endsWith('2') ? 750 : 550, greyKeys(st, passo.foco));
      }
      if (vivo.current) setGiro(null);
    })();
  }, [animar, caso, passo]);
  return (
    <div className="stage stage-sm">
      <Cube3D onReady={s => { scene.current = s; s.setGrey(greyKeys(inicio.current, passo.foco)); s.paint(facelets(inicio.current)); }} options={{ canTurn: () => false }} />
      {giro && <span className="demo-giro">{giro}</span>}
      <span className="stage-hint">Arraste o fundo para virar a vista.</span>
    </div>
  );
}
