import { Speech } from '../components/Mascot';
import { IconLock } from '../components/Icons';

/** as etapas do método das camadas, na ordem em que se aprende */
const ETAPAS = [
  { nome: 'Conheça o cubo', cor: 'green' },
  { nome: 'Os giros', cor: 'red' },
  { nome: 'A cruz branca', cor: 'blue' },
  { nome: 'Cantos brancos', cor: 'orange' },
  { nome: 'Segunda camada', cor: 'yellow' },
  { nome: 'Cruz amarela', cor: 'green' },
  { nome: 'Face amarela', cor: 'red' },
  { nome: 'Última camada', cor: 'blue' },
];

export function Trilha({ onPlay, onSoon }: { onPlay: () => void; onSoon: () => void }) {
  return (
    <div className="screen trilha">
      <Speech>Oi, eu sou o Pingo! Vou te ajudar a montar o cubo pela primeira vez.</Speech>
      <section className="about" aria-label="Para quem é o Giro a Giro">
        <h2>Feito para quem está começando</h2>
        <p>Nunca montou um cubo mágico? Ótimo, é para você. O caminho tem três partes:</p>
        <ol className="journey">
          <li><span><b>Conhecer</b> as peças e os giros, sem pressa.</span></li>
          <li><span><b>Montar o cubo pela primeira vez</b>, uma etapa de cada vez.</span></li>
          <li><span><b>Treinar</b> até a mão e a lógica fazerem sozinhas.</span></li>
        </ol>
        <p className="note">As fases ainda estão sendo construídas. Enquanto isso, brinque com o cubo.</p>
      </section>
      <button className="btn btn-pop btn-big" onClick={onPlay}>Brincar com o cubo</button>
      <ol className="path" aria-label="Trilha de fases">
        {ETAPAS.map((e, i) => (
          <li key={e.nome} className="path-step" style={{ ['--x' as string]: `${Math.round(Math.sin(i * 1.1) * 72)}px` }}>
            <button className="node" onClick={onSoon} aria-label={`Fase ${i + 1}, ${e.nome}: em breve`}
              style={{ ['--c' as string]: `var(--${e.cor})`, ['--lip' as string]: `var(--${e.cor}-lip)` }}>
              <span className="num">{i + 1}</span>
              <span className="lock"><IconLock /></span>
            </button>
            <span className="node-label">{e.nome}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
