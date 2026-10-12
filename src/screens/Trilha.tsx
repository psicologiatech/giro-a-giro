import { Speech } from '../components/Mascot';
import { IconLock } from '../components/Icons';

/** as etapas do método das camadas, na ordem em que se aprende */
const ETAPAS = [
  { nome: 'Conheça o cubo', cor: '#14A85A' },
  { nome: 'Os giros', cor: '#E8352B' },
  { nome: 'A cruz branca', cor: '#F7F7F2' },
  { nome: 'Cantos brancos', cor: '#1F5FE0' },
  { nome: 'Segunda camada', cor: '#FF8A12' },
  { nome: 'Cruz amarela', cor: '#FFD233' },
  { nome: 'Face amarela', cor: '#FFD233' },
  { nome: 'Última camada', cor: '#14A85A' },
];

export function Trilha({ onPlay, onSoon }: { onPlay: () => void; onSoon: () => void }) {
  return (
    <div className="screen trilha">
      <Speech>Oi, eu sou o Gira! As fases estão sendo montadas. Enquanto isso, que tal brincar com o cubo?</Speech>
      <button className="btn btn-pop btn-big" onClick={onPlay}>Brincar com o cubo</button>
      <ol className="path" aria-label="Trilha de fases">
        {ETAPAS.map((e, i) => (
          <li key={e.nome} className="path-step" style={{ ['--x' as string]: `${Math.sin(i * 1.1) * 32}%` }}>
            <button className="node locked" onClick={onSoon} aria-label={`${e.nome}: em breve`}>
              <span className="node-face" style={{ background: e.cor }}><IconLock /></span>
            </button>
            <span className="node-label">{e.nome}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
