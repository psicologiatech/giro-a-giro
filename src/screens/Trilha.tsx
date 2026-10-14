import { Speech } from '../components/Mascot';
import { IconLock } from '../components/Icons';
import { useEffect, useState } from 'react';
import { TODOS } from '../aulas/aulas';
import { estrelas, loadDominio } from '../aulas/dominio';
import { Mascot } from '../components/Mascot';
import { LICOES, licaoFeita, licaoLiberada, licoesDo, proximaLicao } from '../licoes';

export function Trilha({ feitos, licoes, atual, onOpen, onLicao, onBloqueada, onPlay, onSoon, onRecomecar }: {
  onRecomecar: () => void; feitos: number[]; licoes: string[]; atual: number; onOpen: (n: number) => void;
  onLicao: (id: string) => void; onBloqueada: (texto: string) => void; onPlay: () => void; onSoon: () => void;
}) {
  const vez = TODOS.find(e => e.n === atual);
  const licaoVez = proximaLicao(atual, licoes, feitos);
  /** onde a pessoa parou: a lição da vez; ou, para quem já tinha os passos feitos, a primeira lição ainda não feita */
  const ondeParou = licaoVez ?? LICOES.find(l => !licoes.includes(l.id)) ?? null;
  // ao abrir a trilha, rola até onde parou (depois do "volta ao topo" das trocas de tela)
  useEffect(() => {
    if (!ondeParou) return;
    const t = setTimeout(() => document.querySelector(`[data-licao="${ondeParou.id}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 120);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  let zig = 0;
  const dom = loadDominio();
  const [confirmar, setConfirmar] = useState(false);
  return (
    <div className="screen trilha">
      {atual === 0 ? (
        <Speech>Oi, eu sou o Pingo! Vamos aprender a montar o cubo em lições curtinhas, um pedacinho de cada vez. A primeira é para conhecer o cubo.</Speech>
      ) : atual > 8 ? (
        <Speech mood="trofeu">Você passou pelos 8 passos! Agora é treinar até a mão fazer sozinha.</Speech>
      ) : vez?.pronto ? (
        <Speech mood="aponta">Que bom te ver de novo! Agora é a vez do <b>passo {atual}</b>.</Speech>
      ) : (
        <Speech mood="festa">Você terminou o passo {atual - 1}! O passo {atual} chega na próxima versão. Enquanto isso, treine os anteriores.</Speech>
      )}

      {!vez && ondeParou && (
        <button className="btn btn-pop btn-big continuar" onClick={() => onLicao(ondeParou.id)}>
          <small>Continuar de onde parou</small>
          {ondeParou.passo === 0 ? 'Conhecer o cubo' : `Passo ${ondeParou.passo}`} · {ondeParou.titulo}
        </button>
      )}
      {vez?.pronto && (
        <button className="btn btn-pop btn-big continuar" onClick={() => onOpen(atual)}>
          <small>{feitos.length > 0 || licoes.length > 0 ? 'Continuar' : 'Começar'}</small>
          {licaoVez ? licaoVez.titulo : atual === 0 ? vez.titulo : `Passo ${atual} · ${vez.titulo}`}
        </button>
      )}

      {feitos.length <= 1 && (
        <section className="about" aria-label="Como funciona">
          <h2>Feito para quem está começando</h2>
          <p>Nunca pegou num cubo? Ótimo. Cada lição leva uns 2 minutos e ensina uma coisa só:</p>
          <ol className="journey">
            <li><span><b>Primeiro você vê</b> o Pingo fazer no cubo da tela.</span></li>
            <li><span><b>Depois você faz</b>: toca nas peças e gira as faces com o dedo.</span></li>
            <li><span><b>E, se quiser, no seu cubo</b> de verdade também.</span></li>
          </ol>
          <p className="note">Usa o método de camadas, o mais usado por quem está começando.</p>
        </section>
      )}

      <ol className="path" aria-label="Os 8 passos">
        {TODOS.flatMap(e => {
          const feito = feitos.includes(e.n), agora = e.n === atual && e.pronto && !licaoVez;
          const i = licoesDo(e.n).length ? 0 : zig++;
          const temL = licoesDo(e.n).length > 0;
          const passoNo = temL ? (
            // passo com lições: vira um título de seção; as lições abaixo são o caminho
            <li key={e.n} className="path-secao">
              <button className={`passo-secao ${feito ? 'ok' : ''}`} onClick={() => (e.pronto ? onOpen(e.n) : onSoon())}
                style={{ ['--c' as string]: `var(--${e.cor})`, ['--lip' as string]: `var(--${e.cor}-lip)` }}
                aria-label={`${e.n === 0 ? 'Conhecer o cubo' : `Passo ${e.n}: ${e.titulo}`}${feito ? ', feito' : ''}`}>
                <span className="secao-n">{e.n === 0 ? '?' : e.n}</span>
                <span className="secao-txt"><small>{e.n === 0 ? 'Antes de tudo' : `Passo ${e.n} de 8`}</small><b>{e.n === 0 ? 'Conhecer o cubo' : e.titulo}</b></span>
                {e.n >= 1 && <span className="estrelas" aria-label={`${estrelas(dom, e.n)} de 3 estrelas`}>{[1, 2, 3].map(k => <i key={k} className={k <= estrelas(dom, e.n) ? 'on' : ''}>★</i>)}</span>}
                {feito && <span className="secao-ok" aria-hidden="true">✓</span>}
              </button>
            </li>
          ) : (
            <li key={e.n} className={`path-step ${agora ? 'agora' : ''}`} style={{ ['--x' as string]: `${Math.round(Math.sin(i * 1.1) * 72)}px` }}>
              {agora && <span className="agora-tag">agora</span>}
              <button className={`node ${e.pronto ? '' : 'locked'} ${feito ? 'node-ok' : ''}`} onClick={() => (e.pronto ? onOpen(e.n) : onSoon())}
                aria-label={`${e.n === 0 ? 'Antes de começar' : `Passo ${e.n}`}, ${e.titulo}${feito ? ', feito' : agora ? ', é a vez dele' : ''}${e.pronto ? '' : ': em breve'}`}
                style={{ ['--c' as string]: `var(--${e.cor})`, ['--lip' as string]: `var(--${e.cor}-lip)` }}>
                <span className="num">{e.n === 0 ? '?' : e.n}</span>
                {feito ? <span className="check" aria-hidden="true">✓</span> : !e.pronto && <span className="lock"><IconLock /></span>}
              </button>
              <span className="node-label">{e.titulo}</span>
              {e.n >= 1 && (
                <span className="estrelas" aria-label={`${estrelas(dom, e.n)} de 3 estrelas`}>
                  {[1, 2, 3].map(k => <i key={k} className={k <= estrelas(dom, e.n) ? 'on' : ''}>★</i>)}
                </span>
              )}
            </li>
          );
          // as lições do passo, em nós menores logo abaixo dele
          const lis = licoesDo(e.n).map((l, k) => {
            const ok = licaoFeita(l, licoes, feitos), livre = licaoLiberada(l, licoes, feitos), vezDela = ondeParou?.id === l.id;
            const j = zig++;
            return (
              <li key={l.id} data-licao={l.id} className={`path-step path-licao ${vezDela ? 'agora' : ''}`} style={{ ['--x' as string]: `${Math.round(Math.sin(j * 1.1) * 72)}px` }}>
                {vezDela && <span className="agora-tag">{licaoVez ? 'agora' : 'continuar'}</span>}
                <button className={`node node-licao ${ok ? 'node-ok' : ''} ${!ok && !livre ? 'locked' : ''}`}
                  onClick={() => (ok || livre ? onLicao(l.id) : onBloqueada('Faça as lições anteriores primeiro.'))}
                  aria-label={`Lição ${k + 1}: ${l.titulo}${ok ? ', feita' : vezDela ? ', é a vez dela' : !livre ? ', bloqueada' : ''}`}
                  style={{ ['--c' as string]: `var(--${e.cor})`, ['--lip' as string]: `var(--${e.cor}-lip)` }}>
                  <span className="num">{k + 1}</span>
                  {ok ? <span className="check" aria-hidden="true">✓</span> : !livre && <span className="lock"><IconLock /></span>}
                </button>
                <span className="node-label">{l.titulo}<small>{l.resumo}</small></span>
              </li>
            );
          });
          return [passoNo, ...lis];
        })}
      </ol>
      <section className="card legenda-estrelas">
        <p><b>As estrelas de cada passo</b></p>
        <p><span className="estrelas"><i className="on">★</i><i>★</i><i>★</i></span> Vi: assistiu às situações do passo</p>
        <p><span className="estrelas"><i className="on">★</i><i className="on">★</i><i>★</i></span> Fiz: completou o passo, com ajuda</p>
        <p><span className="estrelas"><i className="on">★</i><i className="on">★</i><i className="on">★</i></span> Sei: fez sem ajuda (treino ou Montagem completa)</p>
      </section>
      <button className="btn btn-big" onClick={onPlay}>{atual > 8 ? 'Praticar' : 'Praticar (abre depois do passo 8)'}</button>
      {feitos.length > 0 && <button className="link-btn recomecar" onClick={() => setConfirmar(true)}>Recomeçar a trilha do zero</button>}
      {confirmar && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Recomeçar a trilha" onClick={() => setConfirmar(false)}>
          <div className="sheet" onClick={ev => ev.stopPropagation()}>
            <Mascot mood="cubo" size={110} />
            <h2>Recomeçar a trilha?</h2>
            <p>Os passos feitos e as estrelas voltam para o zero. Seus tempos, dias de treino e cubos montados continuam.</p>
            <button className="btn btn-pop btn-big" onClick={() => { setConfirmar(false); onRecomecar(); }}>Sim, recomeçar</button>
            <button className="btn" onClick={() => setConfirmar(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
