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
    { n: 1, titulo: 'Aquecimento: qual é a situação?', texto: '5 situações misturadas. Lembre a fórmula antes de ver a resposta.', ir: () => setAquecendo(true) },
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

/** lembrar antes de ver: o cubo mostra a situação; a pessoa pensa, vê a resposta e diz se lembrou */
function Aquecimento({ sound, onFim, onSair }: { sound: boolean; onFim: () => void; onSair: () => void }) {
  const [ids] = useState(() => escolher(loadRevisao()));
  const [i, setI] = useState(0);
  const [ver, setVer] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [fim, setFim] = useState(false);
  const sit = SITUACOES.find(s => s.id === ids[i]);

  const responde = (ok: boolean) => {
    saveRevisao(responder(loadRevisao(), ids[i], ok));
    if (ok) { setAcertos(a => a + 1); if (sound) sfx.good(); buzz(15); } else { if (sound) sfx.click(); }
    if (i + 1 >= ids.length) { setFim(true); return; }
    setI(i + 1); setVer(false);
  };

  if (fim) return (
    <div className="screen treino-dia">
      <Speech mood={acertos >= 4 ? 'melhor' : 'estudando'}>
        {acertos} de {ids.length} de memória! {acertos < ids.length ? 'As que você não lembrou voltam amanhã.' : 'As de hoje só voltam daqui a alguns dias.'}
      </Speech>
      <button className="btn btn-pop btn-big" onClick={onFim}>Continuar o treino</button>
    </div>
  );
  if (!sit) return null;
  return (
    <div className="screen treino-dia">
      <div className="sozinha-topo">
        <button className="back-btn" onClick={onSair}>‹ Treino do dia</button>
        <span className="chip">{i + 1} de {ids.length}</span>
      </div>
      <h2 className="player-title">Qual é a situação?</h2>
      <p className="player-ver">{sit.passo.n === 7 ? 'Amarelo de frente.' : 'Amarelo em cima.'} Que passo é, que situação é e qual fórmula você usa? Pense antes de ver a resposta.</p>
      <Situacao key={sit.id} passo={sit.passo} caso={sit.caso} animar={ver} />
      {!ver ? (
        <button className="btn btn-pop btn-big" onClick={() => setVer(true)}>Mostrar a resposta</button>
      ) : (
        <>
          <section className="card resposta">
            <p className="passo-kicker">Passo {sit.passo.n} · {sit.passo.cubista}</p>
            <h3>{sit.caso.nome}</h3>
            <p>{sit.caso.ver}</p>
            <code className="formula">{movesOf(sit.caso).join(' ')}</code>
          </section>
          <p className="pergunta-lembrou">Você lembrou?</p>
          <div className="row">
            <button className="btn" onClick={() => responde(false)}>Não lembrei</button>
            <button className="btn btn-pop" onClick={() => responde(true)}>Lembrei!</button>
          </div>
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
