import { Speech } from '../components/Mascot';

/**
 * Cubos que o Pingo recomenda: indicações com links de afiliada do Mercado Livre (identificados).
 * Preço "por volta de", porque muda o tempo todo. Sem fotos dos anúncios (são dos vendedores): a ilustração é nossa.
 */
export interface Cubo {
  nome: string; preco: number; para: string; texto: string; nota: string; link: string;
  cor: string; faces: [string, string, string];
}
export const CUBOS: Cubo[] = [
  {
    nome: 'Moyu Meilong M magnético', preco: 33, para: 'Para testar gastando pouco', cor: 'green',
    texto: 'Já é magnético e sem adesivos, e gira bem melhor do que os cubos de banca. Bom também para dar de presente.',
    nota: '★ 4,9 com quase 5 mil avaliações', link: 'https://meli.la/21WAD5B',
    faces: ['#FFFFFF', '#1DB863', '#F2453D'],
  },
  {
    nome: 'Moyu Meilong 3M V2 magnético', preco: 55, para: 'O que o Pingo usaria para começar', cor: 'blue',
    texto: 'Os ímãs ajudam o giro a parar no lugar certo, ele gira macio e as cores não descascam. Vem com um suporte e uma ferramenta de ajuste.',
    nota: '★ 5,0 no Mercado Livre', link: 'https://meli.la/2Poc7Li',
    faces: ['#FFCB1F', '#2F6BF0', '#FF9124'],
  },
  {
    nome: 'Moyu RS3M V5 magnético', preco: 78, para: 'Para quem pegou gosto e quer evoluir', cor: 'orange',
    texto: 'Gira mais rápido e corta melhor as quinas, então perdoa giro torto. A força dos ímãs é regulável e vem com chave de ajuste.',
    nota: '★ 4,9 com quase 3 mil avaliações', link: 'https://meli.la/1UXNhpE',
    faces: ['#FFFFFF', '#F2453D', '#1DB863'],
  },
  {
    nome: 'Cubo Mágico Professor (Manual do Mundo)', preco: 106, para: 'Um kit diferente, bom para presente', cor: 'red',
    texto: 'O cubo vem todo preto, com adesivos das 6 cores para colar. Dá para colar tudo de uma vez e seguir a trilha. Vem com saquinho e base. Não é magnético.',
    nota: '★ 4,7 no Mercado Livre', link: 'https://meli.la/1GsKHb4',
    faces: ['#2B2E38', '#2B2E38', '#2B2E38'],
  },
];

/** um cubo desenhado em perspectiva, nas cores dadas (topo, frente, lado) */
function CuboDesenho({ faces }: { faces: [string, string, string] }) {
  const [topo, frente, lado] = faces;
  const s = 15, out: React.ReactNode[] = [];
  // ponto no cubo: a ao longo da aresta da direita, b da esquerda, c para baixo
  const P = (a: number, b: number, c: number) => [50 + (a - b) * s * 0.87, 10 + (a + b) * s * 0.5 + c * s];
  const quad = (pts: number[][], fill: string, k: string) =>
    out.push(<polygon key={k} points={pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ')} fill={fill} stroke="#1E2252" strokeWidth="2.2" strokeLinejoin="round" />);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    quad([P(j, i, 0), P(j + 1, i, 0), P(j + 1, i + 1, 0), P(j, i + 1, 0)], topo, `t${i}${j}`);
    quad([P(j, 3, i), P(j + 1, 3, i), P(j + 1, 3, i + 1), P(j, 3, i + 1)], frente, `f${i}${j}`);
    quad([P(3, j, i), P(3, j + 1, i), P(3, j + 1, i + 1), P(3, j, i + 1)], lado, `l${i}${j}`);
  }
  return <svg viewBox="0 0 100 110" className="cubo-desenho" aria-hidden="true">{out}</svg>;
}

export function Cubos({ onVoltar, voltarTexto = '‹ Voltar' }: { onVoltar?: () => void; voltarTexto?: string }) {
  return (
    <div className="screen cubos">
      {onVoltar && <button className="back-btn self-start" onClick={onVoltar}>{voltarTexto}</button>}
      <Speech mood="presente">Ainda não tem um cubo bom? Separei os que eu recomendo, do mais em conta ao kit mais completo.</Speech>

      <p className="cubos-aviso">
        <b>Transparência:</b> estes são links de afiliada do Mercado Livre. Se você comprar por eles, o Giro a Giro ganha uma pequena comissão, e você não paga nada a mais. É isso que ajuda o app a continuar gratuito.
      </p>

      <ul className="cubos-lista">
        {CUBOS.map(c => (
          <li key={c.link} className="card cubo-card" style={{ ['--c' as string]: `var(--${c.cor})`, ['--lip' as string]: `var(--${c.cor}-lip)`, ['--cl' as string]: `var(--${c.cor}-lip)` }}>
            <div className="cubo-topo">
              <CuboDesenho faces={c.faces} />
              <div>
                <span className="cubo-para">{c.para}</span>
                <h2>{c.nome}</h2>
                <span className="cubo-preco">por volta de R$ {c.preco}</span>
              </div>
            </div>
            <p>{c.texto}</p>
            <small className="cubo-nota">{c.nota}</small>
            <a className="btn btn-big cubo-btn" href={c.link} target="_blank" rel="sponsored noopener noreferrer">
              Ver no Mercado Livre <span aria-hidden="true">↗</span>
            </a>
          </li>
        ))}
      </ul>

      <section className="card cubos-dica">
        <h2>O que faz um cubo ser bom para começar?</h2>
        <ul className="checklist">
          <li><b>Magnético:</b> os ímãs ajudam cada giro a parar no lugar certo, e o cubo não "trava" no meio.</li>
          <li><b>Sem adesivos</b> (stickerless): as cores fazem parte da peça e não descascam.</li>
          <li><b>Tamanho padrão</b> (uns 5,5 cm): cabe bem na mão de adultos e de crianças maiores.</li>
        </ul>
        <p className="cubos-rodape">Preços aproximados; o valor certo aparece no Mercado Livre.</p>
      </section>
    </div>
  );
}
