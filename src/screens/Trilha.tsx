import { Speech } from '../components/Mascot';
import { IconLock } from '../components/Icons';
import { PASSOS, PROXIMOS } from '../aulas/aulas';

/** os 8 passos, na ordem das aulas do professor */
const TODOS = [...PASSOS.map(p => ({ n: p.n, titulo: p.titulo, cor: p.cor, pronto: true })), ...PROXIMOS.map(p => ({ ...p, pronto: false }))];

export function Trilha({ onOpen, onPlay, onSoon }: { onOpen: (n: number) => void; onPlay: () => void; onSoon: () => void }) {
  return (
    <div className="screen trilha">
      <Speech>Oi, eu sou o Pingo! Vamos montar o cubo um passo de cada vez, do jeito que o professor ensina.</Speech>
      <section className="about" aria-label="Como funciona">
        <h2>Feito para quem está começando</h2>
        <p>São 8 passos. Em cada um você vê:</p>
        <ol className="journey">
          <li><span><b>O objetivo</b> e como segurar o cubo.</span></li>
          <li><span><b>As situações</b> que podem aparecer no seu cubo, e o que fazer em cada uma.</span></li>
          <li><span><b>O treino</b>: você faz sozinha, até a mão lembrar.</span></li>
        </ol>
        <p className="note">Segue a ordem das aulas do Manual do Mundo (professor Renan Cerpe). Os passos 4 a 8 estão chegando.</p>
      </section>
      <ol className="path" aria-label="Os 8 passos">
        {TODOS.map((e, i) => (
          <li key={e.n} className="path-step" style={{ ['--x' as string]: `${Math.round(Math.sin(i * 1.1) * 72)}px` }}>
            <button className={`node ${e.pronto ? '' : 'locked'}`} onClick={() => (e.pronto ? onOpen(e.n) : onSoon())}
              aria-label={`Passo ${e.n}, ${e.titulo}${e.pronto ? '' : ': em breve'}`}
              style={{ ['--c' as string]: `var(--${e.cor})`, ['--lip' as string]: `var(--${e.cor}-lip)` }}>
              <span className="num">{e.n}</span>
              {!e.pronto && <span className="lock"><IconLock /></span>}
            </button>
            <span className="node-label">{e.titulo}</span>
          </li>
        ))}
      </ol>
      <button className="btn btn-big" onClick={onPlay}>Brincar com o cubo livre</button>
    </div>
  );
}
