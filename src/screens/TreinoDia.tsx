import { useEffect, useRef, useState } from 'react';
import { Cube3D } from '../components/Cube3D';
import { Speech } from '../components/Mascot';
import { Confetti } from '../components/Confetti';
import type { CubeScene } from '../cube/CubeScene';
import { applyMove, clone, facelets, invertMove, type CubeState } from '../cube/model';
import { describe } from '../cube/describe';
import { greyKeys, movesOf, setupOf, TODOS, type Caso, type Passo } from '../aulas/aulas';
import { estrelas, loadDominio, subir, SEI } from '../aulas/dominio';
import {
  LIMIAR, escolher, loadRevisao, marcarParte, nivelDe, NIVEIS, partesHoje, passoDominado, responder, saveRevisao, SITUACOES,
} from '../aulas/revisao';
import { sfx, buzz } from '../feedback';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Treino do dia: cresce com a trilha (só os passos já feitos, a partir do 3).
 * Cada situação tem um nível (1 a 5) e o aquecimento pede mais conforme o nível sobe.
 */
export function TreinoDia({ sound, passos, onVoltar, onTreinarPasso, onPratica }: {
  sound: boolean; passos: number[]; onVoltar: () => void; onTreinarPasso: (n: number) => void; onPratica: () => void;
}) {
  const [feitas, setFeitas] = useState(partesHoje);
  const [aquecendo, setAquecendo] = useState(false);
  const [plano, setPlano] = useState(false);
  const atualizar = () => setFeitas(partesHoje());
  const dom = loadDominio();
  // ponto fraco: entre os passos do treino, o de menos estrelas
  const fraco = passos.length ? passos.reduce((m, n) => (estrelas(dom, n) < estrelas(dom, m) ? n : m), passos[0]) : 3;
  const fracoT = TODOS.find(t => t.n === fraco)!;

  if (aquecendo) return <Aquecimento sound={sound} passos={passos} onFim={() => { marcarParte(1); onPratica(); atualizar(); setAquecendo(false); }} onSair={() => setAquecendo(false)} />;
  if (plano) return <MeuPlano passos={passos} onVoltar={() => setPlano(false)} />;

  const PARTES = [
    { n: 1, titulo: 'Aquecimento: qual é a situação?', texto: `Situações ${passos.length === 1 ? 'do passo 1' : `dos passos 1 a ${passos[passos.length - 1]}`}, cada uma no seu nível.`, ir: () => setAquecendo(true) },
    { n: 2, titulo: `Ponto fraco: passo ${fraco}`, texto: `${fracoT.titulo}, com ${estrelas(dom, fraco)} de 3 estrelas. Treine sem pedir dica.`, ir: () => { marcarParte(2); onTreinarPasso(fraco); } },
  ];
  const tudo = feitas.includes(1) && feitas.includes(2);
  return (
    <div className="screen treino-dia">
      <button className="back-btn self-start" onClick={onVoltar}>‹ Voltar</button>
      {tudo
        ? <><Confetti /><Speech mood="sequencia">Treino de hoje completo! Amanhã as situações que você errou voltam.</Speech></>
        : <Speech mood="estudando">Uns 5 minutos por dia, em vários dias, ensinam mais do que uma maratona. Bora?</Speech>}
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
      <button className="btn" onClick={() => setPlano(true)}>Meu plano: ver o nível de cada situação</button>
      <p className="note">O treino é uma escada: começa no passo 1. Quando todas as situações de um passo chegam ao nível {LIMIAR}, o próximo passo entra.</p>
    </div>
  );
}

/* ---------- meu plano ---------- */

function MeuPlano({ passos, onVoltar }: { passos: number[]; onVoltar: () => void }) {
  const rev = loadRevisao();
  return (
    <div className="screen treino-dia">
      <button className="back-btn self-start" onClick={onVoltar}>‹ Treino do dia</button>
      <Speech mood="estudando">Cada situação sobe de nível quando você acerta e desce um quando erra. No nível 5 de todas, o passo ganha a estrela "Sei".</Speech>
      <section className="card niveis-legenda">
        {NIVEIS.map(n => <p key={n.n}><span className={`nivel-dot n${n.n}`}>{n.n}</span><b>{n.nome}:</b> {n.texto}</p>)}
      </section>
      {[1, 2, 3, 4, 5, 6, 7, 8].map(n => {
        const t = TODOS.find(x => x.n === n)!, sits = SITUACOES.filter(s => s.passo.n === n), aberto = passos.includes(n);
        const no5 = sits.filter(s => rev[s.id] && nivelDe(rev, s.id) === 5).length;
        return (
          <section key={n} className={`card plano-passo ${aberto ? '' : 'fechado'}`}>
            <p className="passo-kicker">Passo {n} · {t.titulo}{aberto ? ` · ${no5} de ${sits.length} no nível 5` : n === passos.length + 1 ? ` · abre quando as situações do passo ${n - 1} chegarem ao nível ${LIMIAR}` : ''}</p>
            {aberto && (
              <ul>
                {sits.map(s => {
                  const nv = rev[s.id] ? nivelDe(rev, s.id) : 0;
                  return (
                    <li key={s.id}>
                      <span className="plano-nome">{s.caso.nome}</span>
                      <span className="plano-barra" aria-label={nv ? `nível ${nv}` : 'ainda não treinada'}>
                        {[1, 2, 3, 4, 5].map(k => <i key={k} className={k <= nv ? `n${nv}` : ''} />)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

/* ---------- aquecimento ---------- */

interface Opcao { id: string; falas: string[]; letras: string; certa: boolean }
/** a certa e outras de situações diferentes (do mesmo passo, se der), todas diferentes entre si */
function opcoesPara(id: string, qtd: number): Opcao[] {
  const sit = SITUACOES.find(s => s.id === id)!;
  const letras = (c: Caso) => movesOf(c).join(' ');
  const embaralha = <T,>(xs: T[]) => xs.map(x => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map(([, x]) => x);
  const mesmo = embaralha(SITUACOES.filter(s => s.passo.n === sit.passo.n && s.id !== id));
  const outros = embaralha(SITUACOES.filter(s => s.passo.n !== sit.passo.n));
  const vistas = new Set([letras(sit.caso)]); const erradas: typeof SITUACOES = [];
  for (const s of [...mesmo, ...outros]) { if (erradas.length === qtd - 1) break; const l = letras(s.caso); if (!vistas.has(l)) { vistas.add(l); erradas.push(s); } }
  const op = (s: typeof sit, ok: boolean): Opcao => ({ id: s.id, falas: s.caso.lances.map(x => x.fala), letras: letras(s.caso), certa: ok });
  return embaralha([op(sit, true), ...erradas.map(s => op(s, false))]);
}
const resumo = (falas: string[]) => falas.length <= 4 ? falas : [...falas.slice(0, 3), `… e mais ${falas.length - 3} giros`];

function Aquecimento({ sound, passos, onFim, onSair }: { sound: boolean; passos: number[]; onFim: () => void; onSair: () => void }) {
  const [itens] = useState(() => { const rev = loadRevisao(); return escolher(rev, 5, new Date(), Math.random, passos).map(id => ({ id, nivel: nivelDe(rev, id) })); });
  const [i, setI] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [subiram, setSubiram] = useState(0);
  const [fim, setFim] = useState(false);
  const item = itens[i];

  const responde = (ok: boolean) => {
    const antes = loadRevisao();
    const depois = responder(antes, item.id, ok);
    saveRevisao(depois);
    const sit = SITUACOES.find(s => s.id === item.id)!;
    if (passoDominado(depois, sit.passo.n)) subir(sit.passo.n, SEI);
    if (ok) { setAcertos(a => a + 1); if (nivelDe(depois, item.id) > item.nivel) setSubiram(x => x + 1); }
  };
  const proxima = () => { if (i + 1 >= itens.length) setFim(true); else setI(i + 1); };

  if (fim) return (
    <div className="screen treino-dia">
      <Speech mood={acertos >= itens.length - 1 ? 'melhor' : 'estudando'}>
        Você acertou {acertos} de {itens.length}! {subiram ? `${subiram} ${subiram === 1 ? 'situação subiu' : 'situações subiram'} de nível.` : ''} {acertos < itens.length ? 'As que errou voltam amanhã, um nível mais fácil.' : ''}
      </Speech>
      <button className="btn btn-pop btn-big" onClick={onFim}>Continuar o treino</button>
    </div>
  );
  if (!item) return (
    <div className="screen treino-dia">
      <Speech mood="cubo">Ainda não tem situação para treinar. Termine o passo 1 da trilha para começar.</Speech>
      <button className="btn btn-big" onClick={onSair}>Voltar</button>
    </div>
  );
  return (
    <div className="screen treino-dia">
      <div className="sozinha-topo">
        <button className="back-btn" onClick={onSair}>‹ Treino do dia</button>
        <span className="chip">{i + 1} de {itens.length}</span>
      </div>
      <Pergunta key={item.id} id={item.id} nivel={item.nivel} sound={sound} onResposta={responde} onProxima={proxima} ultima={i + 1 >= itens.length} />
    </div>
  );
}

/** uma situação, perguntada do jeito do nível dela */
function Pergunta({ id, nivel, sound, onResposta, onProxima, ultima }: {
  id: string; nivel: number; sound: boolean; onResposta: (ok: boolean) => void; onProxima: () => void; ultima: boolean;
}) {
  const sit = SITUACOES.find(s => s.id === id)!;
  const N = NIVEIS[nivel - 1];
  const [opcoes] = useState(() => (nivel <= 2 ? opcoesPara(id, nivel === 1 ? 2 : 3) : []));
  const [escolha, setEscolha] = useState<number | null>(null);
  const [ver, setVer] = useState(false);            // nível 3+: mostrou a resposta
  const [respondeu, setRespondeu] = useState<boolean | null>(null);
  const [fazendo, setFazendo] = useState(nivel >= 4);
  const [seta, setSeta] = useState(nivel < 4);
  const [fez, setFez] = useState(false);
  const ajuda = useRef(false);

  const registra = (ok: boolean) => {
    if (respondeu !== null) return;
    setRespondeu(ok); onResposta(ok);
    if (ok) { if (sound) sfx.good(); buzz(15); } else { if (sound) sfx.oops(); buzz([20, 40, 20]); }
  };
  const escolher_ = (k: number) => { if (escolha !== null) return; setEscolha(k); registra(opcoes[k].certa); };
  const terminouNoCubo = () => {
    setFez(true);
    if (nivel >= 4) registra(!ajuda.current); else { if (sound) sfx.good(); buzz([20, 30]); }
  };
  const pedirAjuda = () => { ajuda.current = true; setSeta(true); setVer(true); registra(false); };
  const mostrarResposta = respondeu !== null || ver;

  return (
    <>
      <div>
        <p className="passo-kicker">Passo {sit.passo.n} · {sit.passo.titulo} <span className={`nivel-chip n${nivel}`}>Nível {nivel} · {N.nome}</span></p>
        <h2 className="player-title">{nivel >= 5 ? sit.caso.nome : nivel >= 4 ? sit.caso.nome : 'O que fazer aqui?'}</h2>
      </div>
      <p className="player-ver">
        {nivel <= 2 && 'Olhe o cubo e escolha o que fazer.'}
        {nivel === 3 && 'Pense na fórmula. Depois confira.'}
        {nivel === 4 && 'Faça no cubo da tela, sem a seta. As falas estão aí embaixo para ajudar.'}
        {nivel === 5 && 'Faça no cubo da tela, só lembrando. Sem seta e sem falas.'}
        {' '}{sit.passo.n === 7 ? 'Amarelo de frente.' : 'Amarelo em cima.'}
      </p>

      <Situacao key={`${id}-${fazendo}`} passo={sit.passo} caso={sit.caso} animar={!fazendo && (escolha !== null || ver)}
        praticar={fazendo} seta={seta} onFeito={terminouNoCubo} />
      {fez && <p className="vez-msg sua"><b>{nivel >= 4 && !ajuda.current ? 'Isso! Você fez de memória.' : 'Isso! Você fez.'}</b> A mão também aprende assim.</p>}

      {/* níveis 1 e 2: opções */}
      {nivel <= 2 && (
        <>
          <h3 className="sec-title">{escolha === null ? 'O que fazer aqui?' : opcoes[escolha].certa ? 'Isso mesmo!' : 'Quase! A certa está em verde.'}</h3>
          <ul className="opcoes">
            {opcoes.map((o, k) => {
              const estado = escolha === null ? '' : o.certa ? 'certa' : k === escolha ? 'errada' : 'apagada';
              return (
                <li key={o.id}>
                  <button className={`opcao ${estado}`} onClick={() => escolher_(k)} disabled={escolha !== null}>
                    <span className="opcao-n">{String.fromCharCode(65 + k)}</span>
                    <span><ol>{resumo(o.falas).map((f, j) => <li key={j}>{f}</li>)}</ol><code className="formula">{o.letras}</code></span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* nível 3: lembrar e conferir */}
      {nivel === 3 && !ver && <button className="btn btn-pop btn-big" onClick={() => setVer(true)}>Mostrar a resposta</button>}

      {/* nível 4: as falas como apoio */}
      {nivel === 4 && !fez && !ver && (
        <section className="card falas-apoio"><ol>{sit.caso.lances.map((l, j) => <li key={j}>{l.fala}</li>)}</ol></section>
      )}
      {nivel >= 4 && !fez && !ver && <button className="link-btn" onClick={pedirAjuda}>Não lembro: me mostra</button>}

      {mostrarResposta && (
        <section className="card resposta">
          <h3>{sit.caso.nome}</h3>
          <p>{sit.caso.ver}</p>
          <ol className="resposta-falas">{sit.caso.lances.map((l, j) => <li key={j}>{l.fala}</li>)}</ol>
          <code className="formula">{movesOf(sit.caso).join(' ')}</code>
        </section>
      )}

      {nivel === 3 && ver && respondeu === null && (
        <>
          <p className="pergunta-lembrou">Você lembrou?</p>
          <div className="row">
            <button className="btn" onClick={() => registra(false)}>Não lembrei</button>
            <button className="btn btn-pop" onClick={() => registra(true)}>Lembrei!</button>
          </div>
        </>
      )}

      {respondeu !== null && (
        <div className="row">
          {nivel <= 3 && <button className="btn" onClick={() => { setFez(false); setFazendo(false); setTimeout(() => setFazendo(true), 0); }}>{fazendo ? 'Fazer de novo' : 'Agora eu faço'}</button>}
          <button className="btn btn-pop" onClick={onProxima}>{ultima ? 'Ver resultado' : 'Próxima'}</button>
        </div>
      )}
    </>
  );
}

/** o cubo da situação; "animar" mostra a solução; "praticar" deixa a pessoa fazer arrastando as faces (com ou sem seta) */
function Situacao({ passo, caso, animar, praticar, seta = true, onFeito }: {
  passo: Passo; caso: Caso; animar: boolean; praticar?: boolean; seta?: boolean; onFeito?: () => void;
}) {
  const scene = useRef<CubeScene | null>(null);
  const inicio = useRef<CubeState>(setupOf(passo, caso));
  const estado = useRef<CubeState>(clone(inicio.current));
  const vivo = useRef(true), ocupado = useRef(false);
  const [giro, setGiro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const caminho = useRef<string[]>(movesOf(caso).flatMap(m => (m.endsWith('2') ? [m[0], m[0]] : [m])));
  const pos = useRef(0), fora = useRef<string[]>([]);
  const praticarRef = useRef(!!praticar); praticarRef.current = !!praticar;
  const setaRef = useRef(seta); setaRef.current = seta;
  const [inteiro, setInteiro] = useState<string | null>(null);
  useEffect(() => { vivo.current = true; return () => { vivo.current = false; }; }, []);
  const pintar = (st: CubeState) => { scene.current?.setGrey(greyKeys(st, passo.foco)); scene.current?.paint(facelets(st)); };
  const dica = () => {
    const prox = fora.current.length ? invertMove(fora.current[fora.current.length - 1]) : caminho.current[pos.current] ?? null;
    scene.current?.hint(setaRef.current ? prox : null);
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

  useEffect(() => {
    if (!praticar) return;
    estado.current = clone(inicio.current); pos.current = 0; fora.current = []; setMsg(null); setGiro(null);
    pintar(estado.current); dica();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [praticar]);
  useEffect(() => { if (praticar) dica(); /* ligou a seta (pediu ajuda) */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seta]);

  const onMove = async (m: string) => {
    if (!praticarRef.current || ocupado.current || pos.current >= caminho.current.length) return;
    ocupado.current = true; scene.current?.hint(null); setInteiro(null);
    applyMove(estado.current, m);
    await scene.current!.turn(m, facelets(estado.current), 'xyz'.includes(m[0]) ? 550 : 260, greyKeys(estado.current, passo.foco));
    if (fora.current.length && m === invertMove(fora.current[fora.current.length - 1])) fora.current.pop();
    else if (!fora.current.length && m === caminho.current[pos.current]) pos.current++;
    else fora.current.push(m);
    setMsg(fora.current.length ? (setaRef.current ? 'Esse giro saiu do caminho. A seta mostra como voltar.' : 'Esse giro saiu do caminho. Desfaça o último giro, ou toque em "Não lembro".') : null);
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
        <span className="stage-hint">{praticar ? (seta ? 'Arraste a face para girar. A seta mostra o próximo giro.' : 'Arraste a face para girar.') : 'Arraste o fundo para virar a vista.'}</span>
      </div>
      {msg && <p className="warn-msg">{msg}</p>}
    </>
  );
}
