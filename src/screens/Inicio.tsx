import { Speech, type Mood } from '../components/Mascot';
import { TODOS } from '../aulas/aulas';
import { formatar, loadTempos } from './Praticar';
import { level, type Progress } from '../progress';
import { IconCamera, IconCube, IconPath } from '../components/Icons';

/** quantos dias desde o último treino (0 se nunca treinou) */
const diasSemTreinar = (ultimo: string) => {
  if (!ultimo) return 0;
  const d = (Date.now() - new Date(ultimo + 'T12:00:00').getTime()) / 86400000;
  return Math.max(0, Math.round(d));
};

/** a tela inicial: onde você está, seus números e atalhos */
export function Inicio({ p, feitos, atual, onContinuar, onTrilha, onScan, onPraticar, onIntro, conta }: {
  conta?: React.ReactNode; p: Progress; feitos: number[]; atual: number;
  onContinuar: () => void; onTrilha: () => void; onScan: () => void; onPraticar: () => void; onIntro: () => void;
}) {
  const hora = new Date().getHours();
  const oi = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const vez = TODOS.find(t => t.n === atual);
  const montou = atual > 8;
  const tempos = loadTempos();
  const melhor = tempos.length ? Math.min(...tempos.map(t => t.ms)) : null;
  const passosFeitos = feitos.filter(n => n >= 1).length;
  const liberado = feitos.includes(8);

  let mood: Mood = 'oi', fala = `${oi}! Que bom te ver por aqui.`;
  if (atual === 0) fala = `${oi}! Eu sou o Pingo. Vamos aprender a montar o cubo mágico juntos?`;
  else if (diasSemTreinar(p.lastDay) >= 3) { mood = 'dormindo'; fala = `${oi}! Faz ${diasSemTreinar(p.lastDay)} dias que a gente não treina. Bora acordar o cubo?`; }
  else if (montou) { mood = 'trofeu'; fala = `${oi}! Você já sabe montar o cubo. Bora treinar?`; }
  else if (p.streak > 1) { mood = 'sequencia'; fala = `${oi}! ${p.streak} dias seguidos. Continue assim!`; }

  return (
    <div className="screen inicio">
      <Speech mood={mood}>{fala}</Speech>

      <button className="card continuar-card" onClick={montou ? onPraticar : onContinuar}>
        <span className="passo-kicker">{montou ? 'Trilha completa' : atual === 0 ? 'Antes de começar' : feitos.length > 1 ? 'Continuar de onde parou' : 'Começar'}</span>
        <b>{montou ? 'Ir para a prática' : atual === 0 ? 'Conheça o cubo' : `Passo ${atual} · ${vez?.titulo}`}</b>
        <span className="trilha-mini" aria-label={`${passosFeitos} de 8 passos feitos`}>
          {TODOS.filter(t => t.n >= 1).map(t => (
            <i key={t.n} className={feitos.includes(t.n) ? 'ok' : t.n === atual ? 'agora' : ''}
              style={{ ['--c' as string]: `var(--${t.cor})` }} />
          ))}
        </span>
        <span className="continuar-sub">{passosFeitos} de 8 passos feitos</span>
        <span className="continuar-go" aria-hidden="true">›</span>
      </button>

      <div className="stats stats-4">
        <div><small>Dias seguidos</small><b>{p.streak}</b></div>
        <div><small>Pontos · nível {level(p.xp)}</small><b>{p.xp}</b></div>
        <div><small>Melhor tempo</small><b>{melhor !== null ? formatar(melhor) : '–'}</b></div>
        <div><small>Cubos montados</small><b>{p.solves}</b></div>
      </div>

      {conta}

      <h3 className="sec-title">Atalhos</h3>
      <div className="atalhos">
        <button className="atalho" onClick={onTrilha} style={{ ['--c' as string]: 'var(--green)', ['--lip' as string]: 'var(--green-lip)' }}>
          <span className="atalho-ico"><IconPath /></span><b>Trilha</b><small>Os 8 passos</small>
        </button>
        <button className="atalho" onClick={onScan} style={{ ['--c' as string]: 'var(--blue)', ['--lip' as string]: 'var(--blue-lip)' }}>
          <span className="atalho-ico"><IconCamera /></span><b>Ler meu cubo</b><small>Descubro o seu passo</small>
        </button>
        <button className="atalho" onClick={onPraticar} style={{ ['--c' as string]: 'var(--orange)', ['--lip' as string]: 'var(--orange-lip)' }}>
          <span className="atalho-ico"><IconCube /></span><b>Praticar</b><small>{liberado ? 'Cronômetro e fórmulas' : 'Abre depois do passo 8'}</small>
        </button>
        <button className="atalho" onClick={onIntro} style={{ ['--c' as string]: 'var(--red)', ['--lip' as string]: 'var(--red-lip)' }}>
          <span className="atalho-ico atalho-q" aria-hidden="true">?</span><b>Conheça o cubo</b><small>Peças, faces e giros</small>
        </button>
      </div>
    </div>
  );
}
