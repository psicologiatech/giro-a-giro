import { useMemo } from 'react';
import type { CubeState, Piece } from '../cube/model';
import { STICKER_COLORS } from '../cube/CubeScene';

const CINZA = '#C9CED8';
const FUNDO = '#15171d';

/**
 * O topo do cubo visto de cima, com as faixas dos lados (o desenho que cubistas usam para o último andar).
 * Embaixo da imagem fica a frente (o lado virado para você); em cima, o de trás.
 * modo 'amarelo': só o amarelo aparece colorido (o resto fica cinza), para enxergar o desenho do topo.
 * modo 'cores': todas as cores, para comparar as quinas e os meios com os centros dos lados.
 */
export function TopoMini({ estado, foco, modo = 'cores', tamanho = 120, rotulo, perto = 'frente' }: {
  estado: CubeState; foco?: ((p: Piece) => boolean) | null; modo?: 'amarelo' | 'cores'; tamanho?: number; rotulo?: string;
  /** nome do lado que fica embaixo na imagem (o mais perto de você) */
  perto?: string;
}) {
  const quadros = useMemo(() => {
    const out: { x: number; y: number; w: number; h: number; cor: string }[] = [];
    const cor = (p: Piece, c: keyof typeof STICKER_COLORS, centro: boolean) => {
      if (!centro && foco && !foco(p)) return CINZA;
      if (modo === 'amarelo' && c !== 'D') return CINZA;
      return STICKER_COLORS[c];
    };
    const g = 0.08, lado = 1 - 2 * g;               // cada casa do topo mede 1, com folga para a borda preta
    const faixa = 0.34, afast = 0.16;                // faixas dos lados: finas e um pouco afastadas do topo
    for (const p of estado) {
      if (p.pos[1] !== 1) continue;
      const [x, , z] = p.pos;
      const col = x + 1, lin = z + 1;               // trás (z = -1) em cima; frente (z = +1) embaixo
      for (const t of p.stickers) {
        const [nx, ny, nz] = t.n;
        const c = cor(p, t.color, p.stickers.length === 1);
        if (ny === 1) out.push({ x: col + g, y: lin + g, w: lado, h: lado, cor: c });
        else if (nz === 1) out.push({ x: col + g, y: 3 + afast, w: lado, h: faixa, cor: c });
        else if (nz === -1) out.push({ x: col + g, y: -afast - faixa, w: lado, h: faixa, cor: c });
        else if (nx === 1) out.push({ x: 3 + afast, y: lin + g, w: faixa, h: lado, cor: c });
        else if (nx === -1) out.push({ x: -afast - faixa, y: lin + g, w: faixa, h: lado, cor: c });
      }
    }
    return out;
  }, [estado, foco, modo]);
  const m = 0.62;                                   // margem para as faixas e o rótulo "frente"
  return (
    <svg className="cubo-mini topo-mini" viewBox={`${-m} ${-m} ${3 + 2 * m} ${3 + 2 * m + 0.42}`} width={tamanho} height={tamanho * (3 + 2 * m + 0.42) / (3 + 2 * m)}
      role={rotulo ? 'img' : undefined} aria-label={rotulo} aria-hidden={rotulo ? undefined : true}>
      <rect x={-0.04} y={-0.04} width={3.08} height={3.08} rx={0.22} fill={FUNDO} />
      {quadros.map((q, k) => (
        <rect key={k} x={q.x} y={q.y} width={q.w} height={q.h} rx={0.1} fill={q.cor} stroke={FUNDO} strokeWidth={0.05} />
      ))}
      <text x={1.5} y={3 + m + 0.34} textAnchor="middle" fontSize={0.36} fontWeight={700} fill="#5B6390">▲ {perto}</text>
    </svg>
  );
}
