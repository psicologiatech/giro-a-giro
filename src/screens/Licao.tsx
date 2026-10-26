import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Cube3D } from '../components/Cube3D';
import { Mascot } from '../components/Mascot';
import { Confetti } from '../components/Confetti';
import type { CubeScene } from '../cube/CubeScene';
import { applyAlg, applyMove, clone, facelets, invertMove, type CubeState, type Face, type Piece } from '../cube/model';
import { describe } from '../cube/describe';
import { PASSOS, greyKeys, setupOf, type Caso } from '../aulas/aulas';
import { sfx, buzz } from '../feedback';
import { chavesDe, ehGiroInteiro, expandir, pecaEm, type Licao, type Tela } from '../licoes/tipos';
import { CuboMini } from '../components/CuboMini';
import { TopoMini } from '../components/TopoMini';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const ELOGIOS = ['Isso!', 'Certo!', 'Boa!', 'Muito bem!'];

/** texto com *destaques* em negrito */
export function Rico({ t }: { t: string }) {
  return <>{t.split('*').map((pedaco, i) => i % 2 ? <b key={i}>{pedaco}</b> : <Fragment key={i}>{pedaco}</Fragment>)}</>;
}

/** uma lição: telas curtas, cada uma com uma tarefa; só avança quando a pessoa faz */
export function LicaoView({ licao, sound, ultimaDoPasso, proxima, onSair, onConcluir, onProxima }: {
  licao: Licao; sound: boolean; ultimaDoPasso: boolean; proxima: Licao | null;
  /** (as letras aparecem a partir do passo 4, depois da lição das letras) */
  onSair: () => void; onConcluir: () => void; onProxima: () => void;
}) {
  const [i, setI] = useState(0);
  const [fim, setFim] = useState(false);
  const tela: Tela | undefined = licao.telas[i];
  /** os giros a fazer nesta tela, já com os duplos separados */
  const plano = useMemo(() => tela?.tarefa.tipo === 'girar' ? expandir(tela.tarefa.giros, tela.tarefa.falas, tela.tarefa.pausas) : null, [tela]);
  /** pausa entre uma parte e outra (texto), ou null */
  const [pausa, setPausa] = useState<string | null>(null);
  const letras = licao.passo >= 4;
  const nomeGiro = (m: string) => letras ? `${describe(m)} · ${m}` : describe(m);
  const [acertou, setAcertou] = useState<string | null>(null);   // texto do acerto (null = ainda fazendo)
  const [msg, setMsg] = useState<string | null>(null);
  const [achados, setAchados] = useState<string[]>([]);          // peças achadas (tocar)
  const [g, setG] = useState(0);                                  // giros feitos (girar)
  const [erradas, setErradas] = useState<number[]>([]);           // opções erradas (escolha)
  const [tocando, setTocando] = useState(false);                  // o Pingo está mostrando giros
  const [visto, setVisto] = useState(false);                      // já viu a demonstração (ver)
  const [legenda, setLegenda] = useState<string | null>(null);
  /** mostrar a seta rosa? (nas telas "sem seta", começa desligada) */
  const [comSeta, setComSeta] = useState(true);
  const [, setTick] = useState(0);

  const scene = useRef<CubeScene | null>(null);
  const state = useRef<CubeState>(licao.telas[0].cubo?.() ?? []);
  const inicioTela = useRef<CubeState>(clone(state.current));
  const busy = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  /** o foco vale até outra tela mudar (null = tudo colorido) */
  const foco = useMemo(() => {
    for (let k = i; k >= 0; k--) if (licao.telas[k].foco !== undefined) return licao.telas[k].foco ?? null;
    return null;
  }, [i, licao]);
  const grey = (s: CubeState) => foco ? greyKeys(s, foco) : [];

  /** pinta o cubo e os realces do momento */
  const animando = useRef(0);
  const pintar = () => {
    const sc = scene.current; if (!sc || !tela || animando.current) return;
    sc.setGrey(grey(state.current)); sc.paint(facelets(state.current));
    const ach = new Set(achados);
    sc.realce(tela.destaque ? chavesDe(state.current, tela.destaque) : [], chavesDe(state.current, p => ach.has(p.id)));
  };
  const turn = async (m: string, dur: number) => {
    applyMove(state.current, m);
    animando.current++;
    try { await scene.current?.turn(m, facelets(state.current), dur, grey(state.current)); }
    finally { animando.current--; }
    pintar();
  };

  // ao entrar numa tela: prepara o cubo, lê a fala e, se for de assistir, mostra
  useEffect(() => {
    if (!tela) return;
    if (tela.cubo) state.current = tela.cubo();
    inicioTela.current = clone(state.current);
    setAcertou(null); setMsg(null); setAchados([]); setG(0); setErradas([]); setVisto(false); setLegenda(null);
    setComSeta(!(tela.tarefa.tipo === 'girar' && tela.tarefa.semSeta)); setPausa(null);
    scene.current?.look(!!tela.base);
    pintar();
    if (tela.tarefa.tipo === 'ver') { const t = setTimeout(() => mostrar(), 900); return () => clearTimeout(t); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, licao]);
  useEffect(pintar);

  // seta rosa: o próximo giro a fazer, ou o giro da pergunta
  const seta = !tela || acertou || tocando || pausa ? null
    : plano ? (comSeta && plano.giros[g] && !ehGiroInteiro(plano.giros[g]) ? plano.giros[g] : null)
    : tela.tarefa.tipo === 'escolha' ? tela.tarefa.seta ?? null : null;
  useEffect(() => { scene.current?.hint(seta); }, [seta, i, comSeta]);

  const acerto = (texto?: string) => {
    const t = texto ?? ELOGIOS[Math.floor(Math.random() * ELOGIOS.length)];
    setAcertou(t); setMsg(null);
    if (sound) sfx.good(); buzz(25);
    setTimeout(() => document.querySelector('.licao-ok')?.scrollIntoView({ block: 'end', behavior: 'smooth' }), 80);
  };
  const erro = (t: string) => {
    setMsg(t); if (sound) sfx.oops(); buzz([20, 40, 20]);
  };
  const avancar = () => {
    if (i + 1 < licao.telas.length) { setI(i + 1); document.querySelector('.content')?.scrollTo({ top: 0, behavior: 'smooth' }); }
    else { setFim(true); onConcluir(); if (sound) sfx.win(); buzz([30, 50, 70]); }
  };

  /** o Pingo mostra os giros da tela (ver) */
  const mostrar = async () => {
    if (!tela || tela.tarefa.tipo !== 'ver' || busy.current) return;
    busy.current = true; setTocando(true);
    state.current = clone(inicioTela.current); pintar();
    await sleep(300);
    const longa = tela.tarefa.giros.length > 8;   // fórmula comprida: um pouco mais rápido
    for (const m of tela.tarefa.giros) {
      if (!alive.current) return;
      setLegenda(nomeGiro(m)); if (!ehGiroInteiro(m)) { scene.current?.hint(m); await sleep(longa ? 300 : 500); scene.current?.hint(null); }
      await turn(m, (m.endsWith('2') ? 900 : 750) * (longa ? 0.75 : 1));
      await sleep(longa ? 200 : 350);
    }
    if (!alive.current) return;
    setLegenda(null); setTocando(false); setVisto(true); busy.current = false;
  };

  /** "me mostra": o Pingo faz o próximo giro e desfaz, para a pessoa repetir */
  const mostrarProximo = async () => {
    if (!plano || busy.current) return;
    const m = plano.giros[g]; if (!m) return;
    busy.current = true; setTocando(true); setMsg(null);
    setLegenda(nomeGiro(m)); if (!ehGiroInteiro(m)) { scene.current?.hint(m); await sleep(500); scene.current?.hint(null); }
    await turn(m, 800); await sleep(600); await turn(invertMove(m), 450);
    setLegenda(null); setTocando(false); busy.current = false;
  };

  /** giro feito com o dedo */
  const onMove = async (m: string, dur = 280) => {
    if (!tela || !plano || busy.current || acertou || pausa) return;
    const certo = plano.giros[g];
    busy.current = true; setMsg(null);
    await turn(m, dur);
    if (m === certo) {
      const ng = g + 1; setG(ng);
      if (sound) sfx.click(); buzz(10);
      if (ng >= plano.giros.length) acerto(tela.acerto);
      else if (plano.pausas.has(ng)) { const t = plano.pausas.get(ng)!; setPausa(t); }
    } else {
      erro(`Esse foi *${describe(m).toLowerCase()}*. Vou desfazer. Tente: *${describe(certo).toLowerCase()}*.`);
      await sleep(550); await turn(invertMove(m), 300);
    }
    busy.current = false;
  };

  /** toque numa peça */
  const onTap = (face: Face, index: number) => {
    if (!tela || tela.tarefa.tipo !== 'tocar' || acertou || busy.current) return;
    const t = tela.tarefa, p = pecaEm(state.current, face, index); if (!p) return;
    if (t.alvo(p, face, state.current)) {
      const total = t.quantos ?? 1;
      if (achados.includes(p.id)) { setMsg(total > 1 ? 'Essa você já achou. Procure outra.' : null); return; }
      const novos = [...achados, p.id]; setAchados(novos);
      if (novos.length >= total) acerto(tela.acerto);
      else { setMsg(null); if (sound) sfx.click(); buzz(15); }
    } else {
      erro(t.erro?.(p, face, state.current) || 'Essa não. Tente outra.');
    }
  };

  const escolher = (k: number) => {
    if (!tela || tela.tarefa.tipo !== 'escolha' || acertou) return;
    const op = tela.tarefa.opcoes[k];
    if (op.certo) acerto(tela.acerto);
    else { setErradas(e => [...e, k]); erro(op.porque ?? 'Não é essa. Tente de novo.'); }
  };

  if (import.meta.env.DEV) Object.assign(window as object, { __licao: { onMove, onTap, state, tela, i,
    /** (só para testes) as posições que a tarefa de tocar aceita, uma por peça */
    alvos: () => {
      if (!tela || tela.tarefa.tipo !== 'tocar') return [];
      const t = tela.tarefa, out: [Face, number][] = [], vistos = new Set<string>();
      for (const f of ['U', 'F', 'R', 'D', 'B', 'L'] as Face[]) for (let k = 0; k < 9; k++) {
        const p = pecaEm(state.current, f, k);
        if (p && !vistos.has(p.id) && t.alvo(p, f, state.current)) { vistos.add(p.id); out.push([f, k]); }
      }
      return out;
    } } });

  /* ---------- fim da lição ---------- */
  if (fim) return (
    <div className="screen licao licao-fim">
      <Confetti />
      <Mascot mood={ultimaDoPasso ? (licao.passo === 8 ? 'magico' : 'trofeu') : 'festa'} size={150} />
      <h2>{ultimaDoPasso ? (licao.passo === 0 ? 'Você conhece o cubo!' : `Passo ${licao.passo} completo!`) : 'Lição concluída!'}</h2>
      <p>{ultimaDoPasso
        ? licao.passo === 0 ? 'Peças, faces e giros: agora você tem tudo para o passo 1.' : 'Mais uma parte do cubo no lugar. Bora para a próxima?'
        : <><b>{licao.titulo}</b>: feito. Uma de cada vez, sem pressa.</>}</p>
      {proxima
        ? <button className="btn btn-pop btn-big" onClick={onProxima}>Próxima: {proxima.titulo}</button>
        : <button className="btn btn-pop btn-big" onClick={onProxima}>Continuar</button>}
      <button className="btn" onClick={onSair}>Voltar à trilha</button>
    </div>
  );
  if (!tela) return null;

  const tf = tela.tarefa;
  const cont = tela.contador?.(state.current);
  const fazendo = !acertou;
  return (
    <div className="screen licao">
      <div className="licao-head">
        <button className="icon-btn licao-sair" onClick={onSair} aria-label="Sair da lição">✕</button>
        <div className="licao-barra" role="progressbar" aria-valuemin={0} aria-valuemax={licao.telas.length} aria-valuenow={i + (acertou ? 1 : 0)} aria-label={`Tela ${i + 1} de ${licao.telas.length}`}>
          {licao.telas.map((_, k) => <i key={k} className={k < i || (k === i && acertou) ? 'ok' : k === i ? 'now' : ''} />)}
        </div>
      </div>
      <p className="passo-kicker licao-kicker">{licao.passo === 0 ? 'Conhecer o cubo' : `Passo ${licao.passo}`} · {licao.titulo}</p>

      <div className="speech licao-fala">
        <Mascot mood={acertou ? 'festa' : tela.mood ?? 'oi'} size={84} />
        <div className="bubble">
          <p aria-live="polite"><Rico t={tela.fala} /></p>
        </div>
      </div>

      {tf.tipo !== 'missao' && (
        <div className={`stage stage-licao ${tf.tipo === 'tocar' && fazendo ? 'tocar' : ''} ${tf.tipo === 'escolha' || tf.tipo === 'nocubo' ? 'pequeno' : ''}`}>
          <Cube3D onReady={s => { scene.current = s; s.look(!!tela.base); pintar(); setTick(t => t + 1); }}
            options={{ canTurn: () => tf.tipo === 'girar' && fazendo && !busy.current && !pausa, onMove, onTap }} />
          {legenda && <span className="demo-giro">{legenda}</span>}
          {cont && <span className="destaque contador">{cont.n} de {cont.total} {cont.rotulo}</span>}
          {tf.tipo === 'tocar' && (tf.quantos ?? 1) > 1 && <span className="destaque contador">{achados.length} de {tf.quantos}</span>}
          {!legenda && <span className="stage-hint">{
            tf.tipo === 'girar' && fazendo ? (plano?.giros[g] && ehGiroInteiro(plano.giros[g]) ? 'Agora o cubo inteiro: use o botão abaixo.' : comSeta ? 'Arraste a camada com o dedo, seguindo a seta.' : 'Leia o giro pedido abaixo e arraste a camada.')
            : tf.tipo === 'tocar' && fazendo ? 'Toque no quadradinho. Arraste para virar o cubo.'
            : 'Arraste para virar o cubo.'}</span>}
        </div>
      )}

      {msg && fazendo && <p className="warn-msg" role="status"><Rico t={msg} /></p>}

      {fazendo && tf.tipo === 'ok' && <button className="btn btn-pop btn-big" onClick={avancar}>{tf.botao}</button>}

      {fazendo && tf.tipo === 'ver' && (
        tocando ? <p className="vez-msg">Olhe o cubo…</p> : (
          <div className="licao-acoes">
            <button className="btn btn-pop btn-big" onClick={avancar} disabled={!visto}>{tf.botao ?? 'Entendi'}</button>
            <button className="btn" onClick={mostrar} disabled={!visto}>Ver de novo</button>
          </div>
        )
      )}

      {fazendo && plano && pausa && (
        <section className="card licao-pausa" aria-live="polite">
          <p><Rico t={pausa} /></p>
          <button className="btn btn-pop btn-big" onClick={() => setPausa(null)}>Continuar</button>
        </section>
      )}

      {fazendo && plano && !pausa && (
        <div className="licao-acoes">
          <p className="giro-pedido">{tocando ? 'Olhe…' : <>Agora: <b>{nomeGiro(plano.giros[g] ?? '')}</b></>}{plano.giros.length > 1 && <small>giro {Math.min(g + 1, plano.giros.length)} de {plano.giros.length}</small>}</p>
          {plano.falas[g] && !tocando && <p className="giro-fala">{plano.falas[g]}</p>}
          {plano.giros[g] && ehGiroInteiro(plano.giros[g])
            ? <button className="btn btn-pop btn-big" onClick={() => onMove(plano.giros[g], 700)} disabled={tocando}>↻ {describe(plano.giros[g])}</button>
            : <button className="btn" onClick={mostrarProximo} disabled={tocando}>Me mostra</button>}
          {tf.tipo === 'girar' && tf.semSeta && (
            <label className="toggle toggle-seta"><input type="checkbox" checked={comSeta} onChange={e => setComSeta(e.target.checked)} /> Mostrar a seta</label>
          )}
        </div>
      )}

      {fazendo && tf.tipo === 'escolha' && (
        <ul className="opcoes licao-opcoes">
          {tf.opcoes.map((op, k) => (
            <li key={k}><button className={`opcao ${erradas.includes(k) ? 'errada' : ''}`} disabled={erradas.includes(k)} onClick={() => escolher(k)}>{op.texto}</button></li>
          ))}
        </ul>
      )}

      {fazendo && tf.tipo === 'nocubo' && (
        <div className="licao-acoes">
          <button className="btn btn-pop btn-big" onClick={avancar}>{tf.feito}</button>
          <button className="btn" onClick={avancar}>{tf.semCubo ?? 'Estou sem cubo: seguir'}</button>
        </div>
      )}

      {fazendo && tf.tipo === 'missao' && <Missao passo={tf.passo} letras={letras} sound={sound} onFeito={() => acerto(tela.acerto)} />}

      {acertou && (
        <section className="card licao-ok" aria-live="polite">
          <p><span className="licao-check" aria-hidden="true">✓</span><span><Rico t={acertou} /></span></p>
          <button className="btn btn-pop btn-big" onClick={avancar}>{i + 1 < licao.telas.length ? 'Continuar' : 'Concluir a lição'}</button>
        </section>
      )}
    </div>
  );
}

/** missão no cubo de verdade: escolhe pela imagem a situação do seu cubo, vê o que fazer, faz no cubo; repete até completar */
const DE_BAIXO = new Set(['1.base']);
function Missao({ passo, letras, sound, onFeito }: {
  passo: number; letras: boolean; sound: boolean; onFeito: () => void;
}) {
  const p = PASSOS.find(x => x.n === passo)!;
  const total = p.total ?? 4;
  const [feitas, setFeitas] = useState(0);
  const [caso, setCaso] = useState<Caso | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const scene = useRef<CubeScene | null>(null);
  const state = useRef<CubeState>([]);
  const [tocando, setTocando] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const foco = (x: Piece) => p.foco(x);
  const imagens = useMemo(() => p.casos.map(c => setupOf(p, c)), [p]);
  // do passo 5 em diante, a imagem é a face amarela vista de frente, com os lados em volta.
  // No passo 7 o amarelo fica de frente para você: tomba a imagem para mostrar essa face.
  const vistaTopo = useMemo(() => imagens.map(s => (passo === 7 ? applyAlg(s, 'x') : s)), [imagens, passo]);
  const nome = (m: string) => letras ? `${describe(m)} · ${m}` : describe(m);

  /** passo a passo: a pessoa faz um giro no cubo dela e toca em "Fiz"; o cubo da tela faz o mesmo giro */
  const [k, setK] = useState(0);
  const [naoIgual, setNaoIgual] = useState(false);
  const [cena, setCena] = useState(0);   // muda quando o cubo da tela fica pronto
  const pintarSetup = (c: Caso) => {
    const sc = scene.current; if (!sc) return;
    state.current = setupOf(p, c); sc.setGrey(greyKeys(state.current, foco)); sc.paint(facelets(state.current));
  };
  const girar = async (m: string, voltar = false) => {
    const sc = scene.current; if (!sc) return;
    setTocando(true);
    const qs = expandir([m]).giros.map(q => voltar ? invertMove(q) : q);
    for (const q of qs) {
      if (!alive.current) return;
      if (!ehGiroInteiro(q)) { sc.hint(q); await sleep(450); sc.hint(null); }
      applyMove(state.current, q);
      await sc.turn(q, facelets(state.current), ehGiroInteiro(q) ? 700 : 650, greyKeys(state.current, foco));
    }
    if (!alive.current) return;
    setTocando(false);
  };
  const proximo = async () => { if (!caso || tocando || k >= caso.lances.length) return; await girar(caso.lances[k].m); setK(k + 1); };
  const anterior = async () => { if (!caso || tocando || k === 0) return; await girar(caso.lances[k - 1].m, true); setK(k - 1); };
  const recomecar = () => { if (!caso) return; setK(0); setNaoIgual(false); pintarSetup(caso); setCena(c => c + 1); };
  const outraImagem = () => { setCaso(null); setK(0); setNaoIgual(false); };
  // a seta mostra o giro da vez no cubo da tela, para comparar com o seu
  useEffect(() => { if (caso && !tocando) scene.current?.hint(k < caso.lances.length && !ehGiroInteiro(caso.lances[k].m) ? caso.lances[k].m : null); }, [caso, k, tocando, cena]);
  useEffect(() => { if (caso) setTimeout(() => document.querySelector('.missao .stage')?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 80); }, [caso]);

  const contar = () => {
    const n = feitas + 1; setFeitas(n); setCaso(null); setAviso(null); setK(0); setNaoIgual(false);
    if (sound) sfx.good(); buzz(20);
    if (n >= total) onFeito();
  };
  const fiz = () => {
    if (caso?.depois) {
      setCaso(null); setK(0); setNaoIgual(false);
      setAviso(`Boa! ${caso.depois.replace(/^Faça igual no seu cubo\.\s*/, '')}`);
      if (sound) sfx.click(); return;
    }
    contar();
  };

  return (
    <div className="missao">
      {total > 1 && (
        <div className="pecas" role="img" aria-label={`${feitas} de ${total} prontas`}>
          {Array.from({ length: total }, (_, k) => <span key={k} className={k < feitas ? 'ok' : k === feitas ? 'now' : ''}>{k < feitas ? '✓' : k + 1}</span>)}
        </div>
      )}
      {!caso ? (
        <>
          {aviso && <p className="vez-msg sua">{aviso}</p>}
          <h3 className="sec-title">{total > 1 && feitas > 0 ? `${feitas} de ${total}! Qual imagem parece com a próxima peça no seu cubo?` : 'Qual imagem parece com o seu cubo?'}</h3>
          {passo >= 5 && (
            <p className="note casos-legenda">
              {passo === 7
                ? 'Desenhos da face amarela de frente para você. As faixas em volta são os lados do cubo; a de baixo é o lado apoiado na mesa.'
                : 'Desenhos do topo visto de cima. As faixas em volta são os lados do cubo; a de baixo é a frente, o lado virado para você.'}
            </p>
          )}
          <ul className="casos-img">
            {p.casos.map((c, k) => (
              <li key={c.id}>
                <button className="caso-img" onClick={() => { setK(0); setCaso(c); }}>
                  {passo >= 5
                    ? <TopoMini estado={vistaTopo[k]} foco={foco} modo={passo <= 6 ? 'amarelo' : 'cores'} tamanho={112} rotulo={c.nome} perto={passo === 7 ? 'embaixo' : 'frente'} />
                    : <CuboMini estado={imagens[k]} foco={foco} deBaixo={DE_BAIXO.has(`${passo}.${c.id}`)} tamanho={104} />}
                  <span>{c.nome}</span>
                </button>
              </li>
            ))}
          </ul>
          <button className="btn" onClick={contar}>{total > 1 ? 'Essa peça já está certa no meu cubo' : 'Já está pronto no meu cubo'}</button>
          <button className="link-btn" onClick={onFeito}>Estou sem cubo: terminar a lição</button>
        </>
      ) : (
        <>
          <div className="stage stage-licao pequeno">
            <Cube3D onReady={s => { scene.current = s; pintarSetup(caso); setCena(c => c + 1); }} options={{ canTurn: () => false }} />
            <span className="destaque">{caso.nome}</span>
            <span className="destaque contador">{Math.min(k + (k < caso.lances.length ? 1 : 0), caso.lances.length)} de {caso.lances.length}</span>
          </div>
          {k < caso.lances.length ? (
            <section className="card missao-agora" aria-live="polite">
              <small>Giro {k + 1} de {caso.lances.length}: faça no seu cubo</small>
              <b>{nome(caso.lances[k].m)}</b>
              <span>{caso.lances[k].fala}</span>
              <div className="row">
                <button className="btn" onClick={anterior} disabled={tocando || k === 0}>◀ Voltar</button>
                <button className="btn btn-pop" onClick={proximo} disabled={tocando}>Fiz ▶</button>
              </div>
            </section>
          ) : (
            <section className="card missao-agora pronto" aria-live="polite">
              {!naoIgual ? (
                <>
                  <b>Todos os giros feitos!</b>
                  <span>Seu cubo está igual ao da tela?</span>
                  <button className="btn btn-pop btn-big" onClick={fiz}>Sim, ficou igual</button>
                  <button className="btn" onClick={() => setNaoIgual(true)}>Não ficou igual</button>
                </>
              ) : (
                <>
                  <b>Sem problema, acontece muito.</b>
                  <span>Se o seu cubo mudou para outra situação, é só escolher a imagem de novo e seguir dela. Se acha que errou algum giro, veja os giros do começo.</span>
                  <button className="btn btn-pop btn-big" onClick={outraImagem}>Escolher a imagem de novo</button>
                  <button className="btn" onClick={recomecar}>Ver os giros do começo</button>
                </>
              )}
            </section>
          )}
          <button className="link-btn" onClick={outraImagem} disabled={tocando}>Escolher outra imagem</button>
        </>
      )}
    </div>
  );
}
