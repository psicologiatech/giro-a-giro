import { Speech } from '../components/Mascot';
import { IconLock } from '../components/Icons';
import { TODOS } from '../aulas/aulas';

export function Trilha({ feitos, atual, onOpen, onPlay, onSoon }: {
  feitos: number[]; atual: number; onOpen: (n: number) => void; onPlay: () => void; onSoon: () => void;
}) {
  const vez = TODOS.find(e => e.n === atual);
  return (
    <div className="screen trilha">
      {atual === 0 ? (
        <Speech>Oi, eu sou o Pingo! Vamos montar o cubo um passo de cada vez, do jeito que o professor ensina. Antes, vamos conhecer o cubo.</Speech>
      ) : atual > 8 ? (
        <Speech mood="trofeu">Você passou pelos 8 passos! Agora é treinar até a mão fazer sozinha.</Speech>
      ) : vez?.pronto ? (
        <Speech mood="aponta">Que bom te ver de novo! Agora é a vez do <b>passo {atual}</b>.</Speech>
      ) : (
        <Speech mood="festa">Você terminou o passo {atual - 1}! O passo {atual} chega na próxima versão. Enquanto isso, treine os anteriores.</Speech>
      )}

      {vez?.pronto && (
        <button className="btn btn-pop btn-big continuar" onClick={() => onOpen(atual)}>
          <small>{atual === 0 ? 'Antes de começar' : feitos.length > 1 ? 'Continuar' : 'Começar'}</small>
          {atual === 0 ? vez.titulo : `Passo ${atual} · ${vez.titulo}`}
        </button>
      )}

      {feitos.length <= 1 && (
        <section className="about" aria-label="Como funciona">
          <h2>Feito para quem está começando</h2>
          <p>Primeiro você conhece o cubo. Depois vêm 8 passos, e em cada um você vê:</p>
          <ol className="journey">
            <li><span><b>O objetivo</b> e como segurar o cubo.</span></li>
            <li><span><b>As situações</b> que podem aparecer no seu cubo, e o que fazer em cada uma.</span></li>
            <li><span><b>O treino</b>: você faz sem ajuda, até a mão lembrar.</span></li>
          </ol>
          <p className="note">Segue a ordem das aulas do Manual do Mundo (professor Renan Cerpe). Os passos 5 a 8 estão chegando.</p>
        </section>
      )}

      <ol className="path" aria-label="Os 8 passos">
        {TODOS.map((e, i) => {
          const feito = feitos.includes(e.n), agora = e.n === atual && e.pronto;
          return (
            <li key={e.n} className={`path-step ${agora ? 'agora' : ''}`} style={{ ['--x' as string]: `${Math.round(Math.sin(i * 1.1) * 72)}px` }}>
              {agora && <span className="agora-tag">agora</span>}
              <button className={`node ${e.pronto ? '' : 'locked'} ${feito ? 'node-ok' : ''}`} onClick={() => (e.pronto ? onOpen(e.n) : onSoon())}
                aria-label={`${e.n === 0 ? 'Antes de começar' : `Passo ${e.n}`}, ${e.titulo}${feito ? ', feito' : agora ? ', é a vez dele' : ''}${e.pronto ? '' : ': em breve'}`}
                style={{ ['--c' as string]: `var(--${e.cor})`, ['--lip' as string]: `var(--${e.cor}-lip)` }}>
                <span className="num">{e.n === 0 ? '?' : e.n}</span>
                {feito ? <span className="check" aria-hidden="true">✓</span> : !e.pronto && <span className="lock"><IconLock /></span>}
              </button>
              <span className="node-label">{e.titulo}</span>
            </li>
          );
        })}
      </ol>
      <button className="btn btn-big" onClick={onPlay}>Brincar com o cubo livre</button>
    </div>
  );
}
