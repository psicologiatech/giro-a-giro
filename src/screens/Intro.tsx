import { useEffect, useRef, useState } from 'react';
import { Cube3D } from '../components/Cube3D';
import { Mascot } from '../components/Mascot';
import type { CubeScene } from '../cube/CubeScene';
import { applyMove, faceOfNormal, faceletIndex, facelets, invertMove, type CubeState, type Face, type Piece } from '../cube/model';
import { describe } from '../cube/describe';
import { amareloEmCima } from '../aulas/aulas';
import { sfx, buzz } from '../feedback';

type Keep = (p: Piece, face: Face) => boolean;
/** uma tela da introdução: o que destacar no cubo e o que dizer */
interface Slide { titulo: string; texto: React.ReactNode; ciclo?: { nome: string; keep: Keep; base?: boolean }[]; keep?: Keep }

const tipo = (n: number): Keep => p => p.stickers.length === n;
const face = (f: Face): Keep => (_, fc) => fc === f;
const andar = (y: number): Keep => p => p.pos[1] === y;

const SLIDES: Slide[] = [
  {
    titulo: 'O cubo tem 3 tipos de peça', keep: () => true,
    texto: <>Olhe bem: cada quadradinho faz parte de uma <b>peça</b>. Algumas peças têm uma cor, outras duas, outras três. Vamos conhecer cada uma.</>,
  },
  {
    titulo: 'Centros', keep: tipo(1),
    texto: <>São <b>6</b>, um no meio de cada face, com <b>uma cor só</b>. Eles <b>nunca saem do lugar</b>: o centro diz de que cor aquela face vai ficar.</>,
  },
  {
    titulo: 'Meios', keep: tipo(2),
    texto: <>São <b>12</b>, com <b>duas cores</b>. Ficam entre duas quinas, no meio da beirada. A cruz branca é feita com 4 meios.</>,
  },
  {
    titulo: 'Quinas', keep: tipo(3),
    texto: <>São <b>8</b>, nos cantos, com <b>três cores</b>. Aqui, o lado de uma quina se chama <b>janela</b>: "janela branca à direita" é a quina com o branco virado para a direita.</>,
  },
  {
    titulo: 'As faces',
    ciclo: [
      { nome: 'Topo', keep: face('U') }, { nome: 'Frente', keep: face('F') },
      { nome: 'Direita', keep: face('R') }, { nome: 'Base', keep: face('D'), base: true },
    ],
    texto: <>O cubo tem 6 faces: <b>topo</b>, <b>base</b>, <b>frente</b>, <b>trás</b>, <b>direita</b> e <b>esquerda</b>. O nome vem de <b>onde a face está</b> na sua mão, não da cor. Se você virar o cubo, a frente muda.</>,
  },
  {
    titulo: 'Os andares',
    ciclo: [
      { nome: '1º andar (base)', keep: andar(-1), base: true }, { nome: '2º andar (meio)', keep: andar(0) },
      { nome: '3º andar (topo)', keep: andar(1) },
    ],
    texto: <>Pense no cubo como um <b>prédio de 3 andares</b>. O 1º andar fica embaixo, apoiado na mesa. A parte de cima do 3º andar é o <b>telhado</b>. Montamos de baixo para cima, um andar de cada vez.</>,
  },
  {
    titulo: 'Como segurar', keep: () => true,
    texto: <>Nas aulas, o cubo fica quase sempre com o <b>amarelo em cima</b> e o <b>branco embaixo</b>. Quando um passo pedir outro jeito, eu aviso.</>,
  },
];

/** os giros que aparecem nos passos 1 a 3, para treinar com o dedo */
const GIROS = ['R', "R'", 'U', "U'", "L'", 'F'];

export function Intro({ sound, onFinish }: { sound: boolean; onFinish: () => void }) {
  const [i, setI] = useState(0);
  const [c, setC] = useState(0);              // posição no ciclo de destaques
  const [g, setG] = useState(0);              // giro da vez no treino
  const [acertou, setAcertou] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const scene = useRef<CubeScene | null>(null);
  const state = useRef<CubeState>(amareloEmCima());
  const busy = useRef(false);
  const giros = i >= SLIDES.length;
  const slide = SLIDES[i];
  const fim = g >= GIROS.length;

  /** pinta só o que importa nesta tela */
  const destacar = (keep: Keep | null, base = false) => {
    const s = scene.current; if (!s) return;
    const grey: string[] = [];
    if (keep) for (const p of state.current) for (const t of p.stickers) {
      const f = faceOfNormal(t.n);
      if (!keep(p, f)) grey.push(`${f}${faceletIndex(f, p.pos)}`);
    }
    s.setGrey(grey); s.paint(facelets(state.current)); s.look(base);
  };

  useEffect(() => {
    if (giros) { destacar(null); return; }
    if (slide.ciclo) {
      const k = slide.ciclo[c % slide.ciclo.length]; destacar(k.keep, k.base);
      const t = setTimeout(() => setC(c + 1), 1800); return () => clearTimeout(t);
    }
    destacar(slide.keep ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, c, giros]);
  useEffect(() => { scene.current?.hint(giros && !fim && !acertou ? GIROS[g] : null); });

  const turn = async (m: string, dur = 420) => { applyMove(state.current, m); await scene.current!.turn(m, facelets(state.current), dur); };
  const ver = async () => {
    if (busy.current || fim) return; busy.current = true; scene.current?.hint(null);
    await turn(GIROS[g], 700); await new Promise(r => setTimeout(r, 350)); await turn(invertMove(GIROS[g]), 300);
    busy.current = false; setMsg(null); scene.current?.hint(GIROS[g]);
  };
  const onMove = async (m: string) => {
    if (!giros || busy.current || fim || acertou) return;
    busy.current = true; scene.current?.hint(null);
    await turn(m, 300);
    if (m === GIROS[g]) {
      setAcertou(true); setMsg(null); if (sound) sfx.good(); buzz(20);
      await new Promise(r => setTimeout(r, 700));
      await turn(invertMove(m), 250);
      setAcertou(false); setG(g + 1);
    } else {
      setMsg(`Esse foi "${describe(m).toLowerCase()}". Vou desfazer, tente de novo.`); if (sound) sfx.oops(); buzz([20, 40, 20]);
      await new Promise(r => setTimeout(r, 500)); await turn(invertMove(m), 250);
    }
    busy.current = false;
  };

  if (import.meta.env.DEV) (window as unknown as { __introMove: typeof onMove }).__introMove = onMove;
  const total = SLIDES.length + 1;
  const k = slide?.ciclo?.[c % slide.ciclo.length];
  return (
    <div className="screen intro">
      <div className="intro-head">
        <p className="passo-kicker">Antes de começar · {Math.min(i + 1, total)} de {total}</p>
        <div className="dots" aria-hidden="true">{Array.from({ length: total }, (_, n) => <i key={n} className={n === i ? 'now' : n < i ? 'ok' : ''} />)}</div>
      </div>
      <div className="stage stage-sm">
        <Cube3D onReady={s => { scene.current = s; destacar(null); }} options={{ canTurn: () => giros && !busy.current, onMove }} />
        {k && <span className="destaque">{k.nome}</span>}
        <span className="stage-hint">{giros ? 'Arraste a face com o dedo.' : 'Arraste o fundo para virar a vista.'}</span>
      </div>

      {!giros ? (
        <section className="card intro-card" aria-live="polite">
          <h2>{slide.titulo}</h2>
          <p>{slide.texto}</p>
        </section>
      ) : !fim ? (
        <section className="card intro-card" aria-live="polite">
          <h2>Agora, os giros</h2>
          <p>Nas aulas, cada giro tem um nome simples. Faça este no cubo da tela, arrastando a face:</p>
          <p className="giro-pedido">{acertou ? 'Isso!' : describe(GIROS[g])}</p>
          <p className="intro-sub">Giro {g + 1} de {GIROS.length}. A seta rosa mostra o caminho.</p>
          {msg && <p className="warn-msg">{msg}</p>}
          <button className="btn" onClick={ver}>Me mostra</button>
        </section>
      ) : (
        <section className="card intro-card fim-intro">
          <Mascot mood="trofeu" size={96} />
          <div><h2>Pronto!</h2><p>Você já conhece as peças, as faces, os andares e os giros. Agora é só seguir a trilha.</p></div>
        </section>
      )}

      <div className="row">
        {i > 0 && <button className="btn" onClick={() => { setI(i - 1); setC(0); setG(0); setMsg(null); }}>Voltar</button>}
        {!giros && <button className="btn btn-pop" onClick={() => { setI(i + 1); setC(0); }}>Próximo</button>}
        {giros && fim && <button className="btn btn-pop" onClick={onFinish}>Começar o passo 1</button>}
      </div>
      {giros && !fim && <button className="link-btn" onClick={() => setG(GIROS.length)}>Pular os giros</button>}
    </div>
  );
}
