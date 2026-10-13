import { useEffect, useState } from 'react';
import { Trilha } from './screens/Trilha';
import { Inicio } from './screens/Inicio';
import { Praticar, type Parte } from './screens/Praticar';
import { MeuCubo } from './screens/MeuCubo';
import { PassoView } from './screens/Aulas';
import { Intro } from './screens/Intro';
import { PASSOS, TODOS } from './aulas/aulas';
import { loadFeitos, marcarAte, passoAtual, saveFeitos } from './aulas/progresso';
import { Mascot } from './components/Mascot';
import { CartaoConta, JanelaConta } from './components/Conta';
import { useConta } from './nuvem/conta';
import { Confetti } from './components/Confetti';
import { IconCamera, IconCube, IconFlame, IconHome, IconPath, IconSound, IconStar } from './components/Icons';
import { earn, loadProgress, saveProgress, type Progress } from './progress';
import { FIZ, loadDominio, loadTreino, marcarTreino, naSemana, subir, totalEstrelas, zerarTrilha } from './aulas/dominio';

type Tab = 'inicio' | 'trilha' | 'meucubo' | 'praticar';
const TABS: { id: Tab; nome: string; icon: () => React.ReactElement }[] = [
  { id: 'inicio', nome: 'Início', icon: IconHome },
  { id: 'trilha', nome: 'Trilha', icon: IconPath },
  { id: 'meucubo', nome: 'Meu cubo', icon: IconCamera },
  { id: 'praticar', nome: 'Praticar', icon: IconCube },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('inicio');
  const [p, setP] = useState<Progress>(loadProgress);
  const [toast, setToast] = useState<string | null>(null);
  const [win, setWin] = useState(false);
  const [passo, setPasso] = useState<number | null>(null);
  const [lerAgora, setLerAgora] = useState(0);
  const [treinoAgora, setTreinoAgora] = useState(false);
  const [praticarEm, setPraticarEm] = useState<{ parte?: Parte; k: number }>({ k: 0 });
  const conta = useConta();
  // estrelas e dias de treino vivem fora do React: a tela se atualiza quando mudam
  const [, setVer] = useState(0);
  useEffect(() => { const h = () => setVer(v => v + 1); window.addEventListener('giroagiro:progresso', h); return () => window.removeEventListener('giroagiro:progresso', h); }, []);
  /** a pessoa praticou de verdade hoje (conta para a meta da semana) */
  const praticou = () => { if (marcarTreino()) { setToast('Meta da semana batida! 🔥'); } };
  const treino = loadTreino(), semana = naSemana(treino.dias), estrelasTotal = totalEstrelas(loadDominio());
  const recomecar = () => { zerarTrilha(); setFeitos([]); setPasso(null); setTab('trilha'); setToast('Trilha recomeçada. Bora de novo!'); };
  const [verConta, setVerConta] = useState(false);
  const [feitos, setFeitos] = useState<number[]>(loadFeitos);
  useEffect(() => saveFeitos(feitos), [feitos]);
  useEffect(() => { document.querySelector('.content')?.scrollTo(0, 0); }, [tab, passo]);
  const go = (t: Tab) => { setTab(t); setPasso(null); setTreinoAgora(false); };
  /** terminou o passo n: marca e leva para o seguinte (ou volta à trilha, se ainda não existe) */
  const terminar = (n: number) => {
    setP(q => earn(q, 0));
    if (n >= 1) { subir(n, FIZ); praticou(); }
    if (n === 8) { setP(q => ({ ...q, solves: q.solves + 1 })); setWin(true); }
    setFeitos(f => marcarAte(f, n));
    const prox = TODOS.find(e => e.n === n + 1);
    if (prox?.pronto) { setPasso(n + 1); setToast(n === 0 ? 'Agora, o passo 1!' : `Passo ${n} feito! Agora, passo ${n + 1}.`); }
    else { setPasso(null); setToast(n === 0 ? 'Pronto!' : n >= 8 ? null : `Passo ${n} feito! O passo ${n + 1} chega em breve.`); }
  };
  /** o cubo lido pela câmera está no passo n */
  const abrirPasso = (n: number) => { setFeitos(f => marcarAte(f, n - 1)); setTab('trilha'); setPasso(TODOS.find(e => e.n === n)?.pronto ? n : null); };
  const aula = passo !== null ? PASSOS.find(x => x.n === passo) : undefined;
  useEffect(() => saveProgress(p), [p]);
  // guarda na nuvem depois de cada mudança (se a pessoa entrou com o Google)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { conta.salvarDepois(); }, [p, feitos, tab, passo]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2400); return () => clearTimeout(t); }, [toast]);

  return (
    <div className="app">
      <header className="topbar">
        {tab !== 'inicio' && (
          <button className="back-btn" onClick={() => go('inicio')} aria-label="Voltar para o início">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            Início
          </button>
        )}
        <span className="chip" title={`Dias de treino nesta semana (meta: ${treino.meta})`} aria-label={`${semana} de ${treino.meta} dias de treino nesta semana`}><IconFlame />{semana}/{treino.meta}</span>
        <span className="chip" title="Estrelas de domínio (3 por passo)" aria-label={`${estrelasTotal} de 24 estrelas de domínio`}><IconStar />{estrelasTotal}/24</span>
        <button className="icon-btn" onClick={() => setP({ ...p, sound: !p.sound })} aria-label={p.sound ? 'Desligar sons' : 'Ligar sons'}>
          <IconSound on={p.sound} />
        </button>
      </header>

      <main className="content">
        {tab === 'inicio' && <Inicio p={p} feitos={feitos} atual={passoAtual(feitos)}
          onContinuar={() => { setTab('trilha'); setPasso(passoAtual(feitos)); }} onTrilha={() => go('trilha')}
          onScan={() => { setLerAgora(k => k + 1); go('meucubo'); }} onPraticar={() => go('praticar')}
          onTreinoDia={() => { setPraticarEm(x => ({ parte: 'treino', k: x.k + 1 })); go('praticar'); }}
          onIntro={() => { setTab('trilha'); setPasso(0); }} onOpenPasso={n => { setTab('trilha'); setPasso(n); }}
          conta={<CartaoConta conta={conta} onAbrir={() => setVerConta(true)} />} />}
        {tab === 'trilha' && passo === 0 && <Intro sound={p.sound} onFinish={() => terminar(0)} />}
        {tab === 'trilha' && passo === null && <Trilha onRecomecar={recomecar} feitos={feitos} atual={passoAtual(feitos)} onOpen={n => setPasso(n)} onPlay={() => go('praticar')} onSoon={() => setToast('Este passo chega na próxima versão.')} />}
        {tab === 'trilha' && aula && <PassoView key={`${aula.n}-${treinoAgora}`} treinoAgora={treinoAgora} passo={aula} feito={feitos.includes(aula.n)} sound={p.sound} onPratica={praticou}
          onFinish={() => terminar(aula.n)} onScan={() => { setLerAgora(k => k + 1); go('meucubo'); }} />}
        {tab === 'meucubo' && <MeuCubo key={lerAgora} lerAgora={lerAgora > 0} sound={p.sound} onOpenPasso={abrirPasso} onSaved={() => setToast('Cubo lido!')} onSolved={() => { praticou(); setP(q => ({ ...earn(q, 0), solves: q.solves + 1 })); }} />}
        {tab === 'praticar' && <Praticar key={praticarEm.k} inicial={praticarEm.parte} onTreinarPasso={n => { setTab('trilha'); setPasso(n); setTreinoAgora(true); }} liberado={feitos.includes(8)} sound={p.sound}
          onSolve={() => { praticou(); setP(q => ({ ...earn(q, 0), solves: q.solves + 1 })); setWin(true); }} onPratica={praticou}
          onTrilha={() => go('trilha')} onOpenPasso={n => { setTab('trilha'); setPasso(n); }}
          onScan={() => { setLerAgora(k => k + 1); setTab('meucubo'); setPasso(null); }} />}
      </main>

      <nav className="tabbar" aria-label="Seções">
        {TABS.map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? 'on' : ''}`} onClick={() => { if (t.id === 'praticar') setPraticarEm(x => ({ parte: undefined, k: x.k + 1 })); go(t.id); }} aria-current={tab === t.id ? 'page' : undefined}>
            <t.icon /><span>{t.nome}</span>
          </button>
        ))}
      </nav>

      {verConta && <JanelaConta conta={conta} onFechar={() => setVerConta(false)} />}
      {toast && <div className="toast" role="status">{toast}</div>}
      {win && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Cubo montado">
          <Confetti />
          <div className="sheet">
            <Mascot mood="festa" size={150} />
            <h2>Você montou o cubo!</h2>
            <p>Já são {p.solves} {p.solves === 1 ? 'cubo montado' : 'cubos montados'}. Cada montagem deixa a mão mais esperta.</p>
            <button className="btn btn-pop btn-big" onClick={() => setWin(false)}>Continuar</button>
          </div>
        </div>
      )}
    </div>
  );
}
