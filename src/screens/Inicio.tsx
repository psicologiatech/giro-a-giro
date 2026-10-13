import { Speech, type Mood } from '../components/Mascot';
import { TODOS } from '../aulas/aulas';
import { formatar, loadTempos } from './Praticar';
import type { Progress } from '../progress';
import { partesHoje } from '../aulas/revisao';
import { diasSemTreino, estrelas, loadDominio, loadTreino, naSemana, passoMaisFraco, setMeta, totalEstrelas } from '../aulas/dominio';
import { IconCamera, IconCube, IconPath } from '../components/Icons';

/** a tela inicial: onde você está, seus números e atalhos */
export function Inicio({ p, feitos, atual, onContinuar, onTrilha, onScan, onPraticar, onIntro, onOpenPasso, onTreinoDia, conta }: {
  onOpenPasso: (n: number) => void; onTreinoDia: () => void;
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
  const dom = loadDominio(), treino = loadTreino(), semana = naSemana(treino.dias), parado = diasSemTreino(treino.dias);
  const fraco = passoMaisFraco(dom), fracoT = TODOS.find(t => t.n === fraco);
  const tudoSei = totalEstrelas(dom) === 24;

  let mood: Mood = 'oi', fala = `${oi}! Que bom te ver por aqui.`;
  if (atual === 0) fala = `${oi}! Eu sou o Pingo. Vamos aprender a montar o cubo mágico juntos?`;
  else if (parado !== null && parado >= 3) { mood = 'dormindo'; fala = `${oi}! Faz ${parado} dias que a gente não treina. Bora acordar o cubo?`; }
  else if (semana >= treino.meta) { mood = 'sequencia'; fala = `${oi}! Meta da semana batida: ${semana} ${semana === 1 ? 'dia' : 'dias'} de treino. É assim que a mão aprende!`; }
  else if (montou) { mood = 'trofeu'; fala = `${oi}! Você já sabe montar o cubo. Bora treinar?`; }
  else if (semana > 0) { mood = 'sequencia'; fala = `${oi}! ${semana} de ${treino.meta} dias de treino nesta semana.`; }

  return (
    <div className="screen inicio">
      <Speech mood={mood}>{fala}</Speech>

      <button className="card continuar-card" onClick={montou ? onTreinoDia : onContinuar}>
        <span className="passo-kicker">{montou ? 'Treino do dia' : atual === 0 ? 'Antes de começar' : feitos.length > 1 ? 'Continuar de onde parou' : 'Começar'}</span>
        <b>{montou ? (partesHoje().length === 3 ? 'Treino de hoje completo ✓' : partesHoje().length ? `${partesHoje().length} de 3 partes feitas` : 'Começar o treino de hoje') : atual === 0 ? 'Conheça o cubo' : `Passo ${atual} · ${vez?.titulo}`}</b>
        <span className="trilha-mini" aria-label={`${passosFeitos} de 8 passos feitos`}>
          {TODOS.filter(t => t.n >= 1).map(t => (
            <i key={t.n} className={feitos.includes(t.n) ? 'ok' : t.n === atual ? 'agora' : ''}
              style={{ ['--c' as string]: `var(--${t.cor})` }} />
          ))}
        </span>
        <span className="continuar-sub">{montou ? (tudoSei ? 'Você domina os 8 passos. Agora é ganhar velocidade.' : `Lembrar as fórmulas, treinar o passo ${fraco} (${fracoT?.titulo}, ${estrelas(dom, fraco)} de 3 ★) e montar uma vez.`) : `${passosFeitos} de 8 passos feitos`}</span>
        <span className="continuar-go" aria-hidden="true">›</span>
      </button>

      <div className="stats stats-4">
        <div><small>Treino nesta semana</small><b>{semana} de {treino.meta} dias</b></div>
        <div><small>Domínio</small><b>{totalEstrelas(dom)} de 24 ★</b></div>
        <div><small>Melhor tempo</small><b>{melhor !== null ? formatar(melhor) : '–'}</b></div>
        <div><small>Cubos montados</small><b>{p.solves}</b></div>
      </div>

      <div className="meta-semana" role="group" aria-label="Meta de treino por semana">
        <span>Minha meta: treinar</span>
        {[2, 3, 5].map(m => <button key={m} className={treino.meta === m ? 'on' : ''} onClick={() => setMeta(m)} aria-pressed={treino.meta === m}>{m}</button>)}
        <span>dias por semana</span>
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
