import { useEffect, useState } from 'react';
import { Trilha } from './screens/Trilha';
import { Brincar } from './screens/Brincar';
import { MeuCubo } from './screens/MeuCubo';
import { Mascot } from './components/Mascot';
import { Confetti } from './components/Confetti';
import { IconCamera, IconCube, IconFlame, IconPath, IconSound, IconStar } from './components/Icons';
import { earn, level, loadProgress, saveProgress, type Progress } from './progress';

type Tab = 'trilha' | 'meucubo' | 'brincar';
const TABS: { id: Tab; nome: string; icon: () => React.ReactElement }[] = [
  { id: 'trilha', nome: 'Trilha', icon: IconPath },
  { id: 'meucubo', nome: 'Meu cubo', icon: IconCamera },
  { id: 'brincar', nome: 'Brincar', icon: IconCube },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('trilha');
  const [p, setP] = useState<Progress>(loadProgress);
  const [toast, setToast] = useState<string | null>(null);
  const [win, setWin] = useState(false);
  useEffect(() => saveProgress(p), [p]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2400); return () => clearTimeout(t); }, [toast]);

  return (
    <div className="app">
      <header className="topbar">
        {tab !== 'trilha' && (
          <button className="back-btn" onClick={() => setTab('trilha')} aria-label="Voltar para a trilha">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            Início
          </button>
        )}
        <span className="chip" title="Dias seguidos"><IconFlame />{p.streak}</span>
        <span className="chip" title={`Pontos · nível ${level(p.xp)}`}><IconStar />{p.xp}</span>
        <button className="icon-btn" onClick={() => setP({ ...p, sound: !p.sound })} aria-label={p.sound ? 'Desligar sons' : 'Ligar sons'}>
          <IconSound on={p.sound} />
        </button>
      </header>

      <main className="content">
        {tab === 'trilha' && <Trilha onPlay={() => setTab('brincar')} onSoon={() => setToast('Esta fase chega na próxima versão.')} />}
        {tab === 'meucubo' && <MeuCubo sound={p.sound} onSaved={() => { setP(q => earn(q, 20)); setToast('Cubo lido! +20 pontos.'); }} />}
        {tab === 'brincar' && <Brincar sound={p.sound} onSolve={() => { setP(q => ({ ...earn(q, 50), solves: q.solves + 1 })); setWin(true); }} />}
      </main>

      <nav className="tabbar" aria-label="Seções">
        {TABS.map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
            <t.icon /><span>{t.nome}</span>
          </button>
        ))}
      </nav>

      {toast && <div className="toast" role="status">{toast}</div>}
      {win && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Cubo montado">
          <Confetti />
          <div className="sheet">
            <Mascot mood="uau" size={110} />
            <h2>Você montou o cubo!</h2>
            <p>+50 pontos. Já são {p.solves} {p.solves === 1 ? 'cubo montado' : 'cubos montados'}.</p>
            <button className="btn btn-pop btn-big" onClick={() => setWin(false)}>Continuar</button>
          </div>
        </div>
      )}
    </div>
  );
}
