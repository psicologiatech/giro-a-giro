import { useMemo, useState } from 'react';
import { Speech } from '../components/Mascot';
import { Cube3D } from '../components/Cube3D';
import { FaceNet, type Net } from '../components/FaceNet';
import { Camera } from '../scan/Camera';
import { classify, similarCenters, type RGB } from '../scan/color';
import { fromFacelets, COLOR_NAMES } from '../cube/fromFacelets';
import { FACES, type Face, type Facelets } from '../cube/model';
import { STICKER_COLORS } from '../cube/CubeScene';
import { loadMyCube, saveMyCube } from '../scan/store';
import { sfx, buzz } from '../feedback';
import { Montar, loadMontar, clearMontar } from './Montar';
import type { CubeState } from '../cube/model';
import { emQuePasso } from '../aulas/progresso';
import { TODOS } from '../aulas/aulas';

/** ordem de leitura. "cima"/"baixo" = cor do centro que deve aparecer na borda de cima/baixo da imagem */
const SCAN: { f: Face; titulo: string; dica: string; cima: Face; baixo: Face }[] = [
  { f: 'F', titulo: 'Verde de frente', dica: 'Segure o cubo com o branco em cima e o centro verde virado para a câmera.', cima: 'U', baixo: 'D' },
  { f: 'R', titulo: 'Agora o vermelho', dica: 'Gire o cubo inteiro para a esquerda: o vermelho fica de frente e o branco continua em cima.', cima: 'U', baixo: 'D' },
  { f: 'B', titulo: 'Agora o azul', dica: 'Mais uma vez para a esquerda, com o branco em cima.', cima: 'U', baixo: 'D' },
  { f: 'L', titulo: 'Agora o laranja', dica: 'Mais uma vez para a esquerda, com o branco em cima.', cima: 'U', baixo: 'D' },
  { f: 'U', titulo: 'Agora o branco', dica: 'Volte o verde para a frente. Depois vire o topo branco para a câmera: o verde fica embaixo.', cima: 'B', baixo: 'F' },
  { f: 'D', titulo: 'Por último, o amarelo', dica: 'Volte o verde para a frente. Depois vire a base amarela para a câmera: o verde fica em cima.', cima: 'F', baixo: 'B' },
];

type Mode = 'inicio' | 'ler' | 'revisar' | 'pronto' | 'montar';
const emptyNet = (): Net => Object.fromEntries(FACES.map(f => [f, Array.from({ length: 9 }, (_, i) => (i === 4 ? f : null))])) as Net;

export function MeuCubo({ sound, onSaved, onSolved, onOpenPasso, lerAgora }: { lerAgora?: boolean; sound: boolean; onSaved: () => void; onSolved: () => void; onOpenPasso: (n: number) => void }) {
  const saved = useMemo(loadMyCube, []);
  const [mode, setMode] = useState<Mode>(lerAgora ? 'ler' : saved ? 'pronto' : 'inicio');
  const [cube, setCube] = useState<Facelets | null>(saved);
  const [step, setStep] = useState(0);
  const [samples, setSamples] = useState<Partial<Record<Face, RGB[]>>>({});
  const [shot, setShot] = useState<RGB[] | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [net, setNet] = useState<Net>(emptyNet);
  const [msg, setMsg] = useState<string | null>(null);
  const [start, setStart] = useState<CubeState | null>(null);

  const startScan = () => { setSamples({}); setStep(0); setShot(null); setCamError(null); setMode('ler'); };
  const startPaint = () => { setNet(emptyNet()); setMsg(null); setMode('revisar'); };

  const capture = (rgb: RGB[]) => {
    if (rgb.length !== 9) return;
    if (sound) sfx.click(); buzz(15);
    setShot(rgb);
  };
  const acceptShot = () => {
    const cur = SCAN[step];
    const next = { ...samples, [cur.f]: shot! };
    const twin = similarCenters(next);
    if (twin && twin.includes(cur.f)) {
      setMsg(`O centro desta face ficou parecido com o ${COLOR_NAMES[twin[0] === cur.f ? twin[1] : twin[0]]}. Confira se é a face ${COLOR_NAMES[cur.f]} e leia de novo.`);
      setShot(null); return;
    }
    setMsg(null); setSamples(next); setShot(null);
    if (step < SCAN.length - 1) { setStep(step + 1); return; }
    // as 6 faces lidas: classifica comparando com os centros
    const got = classify(next as Record<Face, RGB[]>);
    setNet(got); setMode('revisar');
    check(got);
  };

  const check = (n: Net) => {
    if (FACES.some(f => n[f].some(c => !c))) { setMsg('Ainda faltam quadradinhos sem cor. Toque neles para escolher.'); return false; }
    const r = fromFacelets(n as Facelets);
    setMsg(r.ok ? null : r.message);
    return r.ok;
  };
  const confirm = () => {
    if (!check(net)) { if (sound) sfx.oops(); return; }
    saveMyCube(net as Facelets); setCube(net as Facelets); clearMontar();
    if (sound) sfx.good(); buzz([20, 30, 40]);
    setMode('pronto'); onSaved();
  };

  if (mode === 'inicio') return (
    <div className="screen meucubo">
      <Speech mood="camera">Me mostra o seu cubo? Assim eu ensino a partir dele, do jeitinho que ele está.</Speech>
      <section className="card">
        <h2>Antes de começar</h2>
        <ul className="checklist">
          <li>Fique num lugar bem iluminado, sem sol direto no cubo.</li>
          <li>Segure com o <b>centro branco em cima</b> e o <b>centro verde de frente</b>.</li>
          <li>Vou pedir as 6 faces, uma de cada vez. Leva cerca de um minuto.</li>
        </ul>
      </section>
      <button className="btn btn-pop btn-big" onClick={startScan}>Ler com a câmera</button>
      <button className="link-btn" onClick={startPaint}>Sem câmera? Pintar as cores tocando</button>
    </div>
  );

  if (mode === 'ler') {
    const cur = SCAN[step];
    return (
      <div className="screen meucubo">
        <div className="scan-head">
          <ol className="scan-steps" aria-label={`Face ${step + 1} de 6`}>
            {SCAN.map((s, i) => <li key={s.f} className={i < step ? 'done' : i === step ? 'now' : ''} style={{ background: i <= step ? STICKER_COLORS[s.f] : undefined }} />)}
          </ol>
          <h2>{cur.titulo}</h2>
          <p>{cur.dica}</p>
          <p className="orient">
            Na borda de cima da imagem: <b><i className="chip-dot" style={{ background: STICKER_COLORS[cur.cima] }} />{COLOR_NAMES[cur.cima]}</b>
          </p>
        </div>
        {camError ? (
          <section className="card">
            <p>{camError}</p>
            <button className="btn btn-pop" onClick={startPaint}>Pintar as cores</button>
          </section>
        ) : shot ? (
          <section className="card shot">
            <div className="shot-grid">{shot.map((c, i) => <span key={i} style={{ background: `rgb(${c.join(',')})` }} />)}</div>
            <p>Ficou nítido e com as 9 cores certas?</p>
            <div className="row">
              <button className="btn" onClick={() => setShot(null)}>Ler de novo</button>
              <button className="btn btn-pop" onClick={acceptShot}>{step < 5 ? 'Próxima face' : 'Terminar'}</button>
            </div>
          </section>
        ) : (
          <Camera onCapture={capture} onError={setCamError} />
        )}
        {msg && <p className="warn-msg" role="alert">{msg}</p>}
        <button className="link-btn" onClick={() => setMode('inicio')}>Cancelar</button>
      </div>
    );
  }

  if (mode === 'revisar') return (
    <div className="screen meucubo">
      <Speech mood={msg ? 'hmm' : 'aponta'}>{msg ?? 'Confira as cores. Se alguma estiver errada, toque nela para trocar.'}</Speech>
      <FaceNet net={net} onChange={n => { setNet(n); setMsg(null); }} />
      <p className="net-tip">O cubo aberto: branco em cima, verde no meio, amarelo embaixo.</p>
      <button className="btn btn-pop btn-big" onClick={confirm}>Está igual ao meu cubo</button>
      <button className="link-btn" onClick={startScan}>Ler tudo de novo com a câmera</button>
    </div>
  );

  if (mode === 'montar' && start) return (
    <Montar start={start} sound={sound} onDone={onSolved} onRescan={startScan} onExit={() => setMode('pronto')} />
  );

  const montar = () => {
    const resume = loadMontar();
    if (resume) { setStart(resume); setMode('montar'); return; }
    const r = fromFacelets(cube as Facelets);
    if (!r.ok) { setNet(cube as Net); setMsg(r.message); setMode('revisar'); return; }
    setStart(r.state); setMode('montar');
  };
  return <Pronto cube={cube!} onOpenPasso={onOpenPasso} resumable={!!loadMontar()} onMontar={montar} onRescan={startScan} onFix={() => { setNet(cube as Net); setMsg(null); setMode('revisar'); }}
    onForget={() => { saveMyCube(null); setCube(null); setMode('inicio'); }} />;
}

function Pronto({ cube, resumable, onMontar, onRescan, onFix, onForget, onOpenPasso }: { cube: Facelets; resumable: boolean; onOpenPasso: (n: number) => void; onMontar: () => void; onRescan: () => void; onFix: () => void; onForget: () => void }) {
  const r = fromFacelets(cube);
  const n = r.ok ? emQuePasso(r.state) : 0;
  const passo = TODOS.find(e => e.n === n);
  return (
    <div className="screen meucubo">
      <Speech mood="festa">Pronto! O cubo da tela está igual ao seu. Gire a vista para conferir as faces.</Speech>
      {n === 9 ? (
        <section className="card ja-assim ok"><p><b>Seu cubo está montado!</b> Embaralhe e leia de novo para treinar.</p></section>
      ) : passo && (
        <section className="card ja-assim">
          <p>Olhei o seu cubo: ele está no <b>passo {n} · {passo.titulo}</b>.{n === 2 ? ' O passo 1 já está feito.' : n > 2 && ` Os passos 1 ${n === 3 ? 'e 2' : `a ${n - 1}`} já estão feitos.`}</p>
          {passo.pronto
            ? <button className="btn btn-pop" onClick={() => onOpenPasso(n)}>Ir para o passo {n}</button>
            : <p className="note">A aula do passo {n} chega em breve. Enquanto isso, a montagem com o Pingo leva você até o fim.</p>}
        </section>
      )}
      <div className="stage stage-sm">
        <Cube3D onReady={s => s.paint(cube)} options={{ canTurn: () => false }} />
        <span className="stage-hint">Arraste para virar a vista.</span>
      </div>
      <button className="btn btn-pop btn-big" onClick={onMontar}>{resumable ? 'Continuar a montagem' : 'Montar meu cubo com o Pingo'}</button>
      <div className="row">
        <button className="btn" onClick={onFix}>Corrigir cores</button>
        <button className="btn" onClick={onRescan}>Ler de novo</button>
      </div>
      <button className="link-btn" onClick={onForget}>Apagar o cubo salvo</button>
    </div>
  );
}
