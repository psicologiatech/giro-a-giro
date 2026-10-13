import { useEffect, useRef, useState } from 'react';
import { Cube3D } from '../components/Cube3D';
import { Speech } from '../components/Mascot';
import { Confetti } from '../components/Confetti';
import type { CubeScene } from '../cube/CubeScene';
import { applyMove, clone, facelets, invertMove, type CubeState } from '../cube/model';
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
    { n: 3, titulo: 'Bônus (opcional): montagem completa', texto: 'Nos dias de mais tempo: o seu cubo do começo ao fim, com pausa e dica se precisar.', ir: () => { marcarParte(3); onMontar(); } },
  ];
  // o treino do dia fica completo com as partes 1 e 2; a 3 é bônus
  const tudo = feitas.includes(1) && feitas.includes(2);
  return (
    <div className="screen treino-dia">
      <button className="back-btn self-start" onClick={onVoltar}>‹ Praticar</button>
      {tudo
        ? <><Confetti /><Speech mood="sequencia">Treino de hoje completo! {feitas.includes(3) ? 'E ainda fez o bônus!' : 'Se sobrar tempo, tem o bônus.'} Amanhã as situações que você errou voltam.</Speech></>
        : <Speech mood="estudando">Uns 5 minutos por dia, em vários dias, ensinam mais do que uma maratona. Bora?</Speech>}
      <ol className="partes">
        {PARTES.map(p => (
          <li key={p.n}>
            <button className={`parte ${feitas.includes(p.n) ? 'ok' : ''} ${p.n === 3 ? 'bonus' : ''}`} onClick={p.ir}>
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
  const [fazendo, setFazendo] = useState(false);
  const [fez, setFez] = useState(false);
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
    setI(i + 1); setEscolha(null); setOpcoes(opcoesPara(ids[i + 1])); setFazendo(false); setFez(false);
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
      <Situacao key={sit.id} passo={sit.passo} caso={sit.caso} animar={escolha !== null} praticar={fazendo}
        onFeito={() => { setFez(true); if (sound) sfx.good(); buzz([20, 30]); }} />
      {fez && <p className="vez-msg sua"><b>Isso! Você fez.</b> A mão também aprende assim.</p>}
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
          <div className="row">
            <button className="btn" onClick={() => { setFez(false); setFazendo(false); setTimeout(() => setFazendo(true), 0); }}>{fazendo ? 'Fazer de novo' : 'Agora eu faço'}</button>
            <button className="btn btn-pop" onClick={proxima}>{i + 1 >= ids.length ? 'Ver resultado' : 'Próxima'}</button>
          </div>
        </>
      )}
    </div>
  );
}

/** o cubo da situação; com "animar", mostra a solução giro a giro; com "praticar", a pessoa faz arrastando as faces */
function Situacao({ passo, caso, animar, praticar, onFeito }: {
  passo: Parameters<typeof setupOf>[0]; caso: Parameters<typeof setupOf>[1]; animar: boolean; praticar?: boolean; onFeito?: () => void;
}) {
  const scene = useRef<CubeScene | null>(null);
  const inicio = useRef<CubeState>(setupOf(passo, caso));
  const estado = useRef<CubeState>(clone(inicio.current));
  const vivo = useRef(true), ocupado = useRef(false);
  const [giro, setGiro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  // o caminho em quartos de volta (um giro duplo vira dois)
  const caminho = useRef<string[]>(movesOf(caso).flatMap(m => (m.endsWith('2') ? [m[0], m[0]] : [m])));
  const pos = useRef(0), fora = useRef<string[]>([]);
  const praticarRef = useRef(!!praticar); praticarRef.current = !!praticar;
  const [inteiro, setInteiro] = useState<string | null>(null);   // próximo giro é do cubo inteiro
  useEffect(() => { vivo.current = true; return () => { vivo.current = false; }; }, []);
  const pintar = (st: CubeState) => { scene.current?.setGrey(greyKeys(st, passo.foco)); scene.current?.paint(facelets(st)); };
  const dica = () => {
    const prox = fora.current.length ? invertMove(fora.current[fora.current.length - 1]) : caminho.current[pos.current] ?? null;
    scene.current?.hint(prox);
    setInteiro(prox && 'xyz'.includes(prox[0]) ? prox : null);
  };

  useEffect(() => {
    if (!animar || praticar) return;
    (async () => {
      const st = clone(inicio.current);
      await sleep(400);
      for (const m of movesOf(caso)) {
        if (!vivo.current || !scene.current || praticarRef.current) return;
        setGiro(describe(m)); scene.current.hint(m); await sleep(400); scene.current.hint(null);
        applyMove(st, m);
        await scene.current.turn(m, facelets(st), m.endsWith('2') ? 750 : 550, greyKeys(st, passo.foco));
      }
      if (vivo.current) setGiro(null);
    })();
  }, [animar, praticar, caso, passo]);

  // modo "agora eu faço": volta para a situação e mostra a seta do próximo giro
  useEffect(() => {
    if (!praticar) return;
    estado.current = clone(inicio.current); pos.current = 0; fora.current = []; setMsg(null); setGiro(null);
    pintar(estado.current); dica();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [praticar]);

  const onMove = async (m: string) => {
    if (!praticarRef.current || ocupado.current || pos.current >= caminho.current.length) return;
    setInteiro(null);
    ocupado.current = true; scene.current?.hint(null);
    applyMove(estado.current, m);
    await scene.current!.turn(m, facelets(estado.current), 'xyz'.includes(m[0]) ? 550 : 260, greyKeys(estado.current, passo.foco));
    if (fora.current.length && m === invertMove(fora.current[fora.current.length - 1])) fora.current.pop();
    else if (!fora.current.length && m === caminho.current[pos.current]) pos.current++;
    else fora.current.push(m);
    setMsg(fora.current.length ? 'Esse giro saiu do caminho. A seta mostra como voltar.' : null);
    ocupado.current = false;
    if (pos.current >= caminho.current.length && !fora.current.length) { setMsg(null); onFeito?.(); return; }
    dica();
  };

  return (
    <>
      <div className="stage stage-sm">
        <Cube3D onReady={s => { scene.current = s; pintar(inicio.current); }} options={{ canTurn: () => !!praticar && !ocupado.current, onMove }} />
        {giro && <span className="demo-giro">{giro}</span>}
        {praticar && inteiro && <button className="btn btn-pop demo-btn" onClick={() => onMove(inteiro)}>↻ Girar o cubo inteiro</button>}
        <span className="stage-hint">{praticar ? 'Arraste a face para girar. A seta mostra o próximo giro.' : 'Arraste o fundo para virar a vista.'}</span>
      </div>
      {msg && <p className="warn-msg">{msg}</p>}
    </>
  );
}
