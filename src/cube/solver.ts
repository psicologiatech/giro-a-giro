import { applyMove, clone, isSolvedAnyWay, parseAlg, type CubeState, type Face, type Piece, type Vec } from './model';

/**
 * Resolve o cubo pelo método das camadas, do jeito que se ensina a iniciantes.
 * O resultado vem em "lances": pequenos pedaços com um objetivo claro (ex.: "leve o meio branco e vermelho para cima").
 * Lances podem conter giros do cubo inteiro (y, z2): a pessoa vira o cubo na mão, e a tela vira junto.
 */
export type StageId = 'cruz' | 'cantos' | 'virar' | 'meio' | 'cruzAmarela' | 'meiosAmarelos' | 'posCantos' | 'oriCantos';
export interface Chunk { stage: StageId; title: string; tip: string; moves: string[] }

export const STAGES: Record<StageId, { nome: string; ideia: string }> = {
  cruz: { nome: 'A cruz branca', ideia: 'Os 4 meios brancos em cima, cada um combinando com o centro do lado.' },
  cantos: { nome: 'Cantos brancos', ideia: 'Completar a face branca: cada canto entra por baixo com R\' D\' R D.' },
  virar: { nome: 'Virar o cubo', ideia: 'A primeira camada está pronta. Agora o amarelo vai para cima.' },
  meio: { nome: 'Segunda camada', ideia: 'Os 4 meios da camada do meio, um de cada vez.' },
  cruzAmarela: { nome: 'Cruz amarela', ideia: 'Fazer uma cruz amarela em cima com F R U R\' U\' F\'.' },
  meiosAmarelos: { nome: 'Meios amarelos', ideia: 'Fazer os meios de cima combinarem com os centros dos lados.' },
  posCantos: { nome: 'Cantos no lugar', ideia: 'Levar cada canto amarelo para o seu lugar, mesmo que ainda torto.' },
  oriCantos: { nome: 'Girar os cantos', ideia: 'Desvirar os cantos amarelos com R\' D\' R D. A base bagunça e volta sozinha no fim.' },
};

export const COLOR: Record<Face, string> = { U: 'branco', D: 'amarelo', F: 'verde', B: 'azul', R: 'vermelho', L: 'laranja' };

const eq = (a: Vec, b: Vec) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** para onde aponta o centro de cada cor agora (muda quando o cubo inteiro é virado) */
function centers(s: CubeState): Record<Face, Vec> {
  const out = {} as Record<Face, Vec>;
  for (const p of s) if (p.stickers.length === 1) out[p.stickers[0].color] = p.stickers[0].n;
  return out;
}
/** cor do centro que está numa direção */
function centerAt(s: CubeState, n: Vec): Face {
  return s.find(p => p.stickers.length === 1 && eq(p.stickers[0].n, n))!.stickers[0].color;
}
const target = (s: CubeState, p: Piece): Vec => { const c = centers(s); return p.stickers.reduce<Vec>((acc, t) => add(acc, c[t.color]), [0, 0, 0]); };
function solvedNow(s: CubeState, p: Piece): boolean {
  const c = centers(s);
  return eq(p.pos, target(s, p)) && p.stickers.every(t => eq(t.n, c[t.color]));
}
const find = (s: CubeState, colors: Face[]) => s.find(p => p.stickers.length === colors.length && colors.every(c => p.stickers.some(t => t.color === c)))!;
const UP: Vec = [0, 1, 0], FRONT: Vec = [0, 0, 1], RIGHT: Vec = [1, 0, 0], LEFT: Vec = [-1, 0, 0];

/** junta giros seguidos da mesma face (U U → U2; U U' → nada) */
export function simplify(moves: string[]): string[] {
  const out: string[] = [];
  const amount = (m: string) => (m.endsWith('2') ? 2 : m.endsWith("'") ? 3 : 1);
  for (const m of moves) {
    const last = out[out.length - 1];
    if (last && last[0] === m[0]) {
      const k = (amount(last) + amount(m)) % 4;
      out.pop();
      if (k) out.push(m[0] + (k === 2 ? '2' : k === 3 ? "'" : ''));
    } else out.push(m);
  }
  return out;
}

class Plan {
  chunks: Chunk[] = [];
  constructor(public s: CubeState) {}
  begin(stage: StageId, title: string, tip: string) { this.chunks.push({ stage, title, tip, moves: [] }); }
  do(alg: string | string[]) {
    const ms = typeof alg === 'string' ? parseAlg(alg) : alg;
    const ch = this.chunks[this.chunks.length - 1];
    for (const m of ms) { applyMove(this.s, m); ch.moves.push(m); }
  }
  /** vira o cubo inteiro (giros y) até a condição valer; devolve false se não houver jeito */
  turnCubeUntil(ok: (s: CubeState) => boolean): boolean { return this.tryPrefix(['', 'y', "y'", 'y2'], ok); }
  /** gira o topo (U) até a condição valer */
  turnTopUntil(ok: (s: CubeState) => boolean): boolean { return this.tryPrefix(['', 'U', "U'", 'U2'], ok); }
  turnBottomUntil(ok: (s: CubeState) => boolean): boolean { return this.tryPrefix(['', 'D', "D'", 'D2'], ok); }
  private tryPrefix(opts: string[], ok: (s: CubeState) => boolean): boolean {
    for (const o of opts) {
      const t = clone(this.s); if (o) applyMove(t, o);
      if (ok(t)) { if (o) this.do(o); return true; }
    }
    return false;
  }
  finish(): Chunk[] {
    return this.chunks.map(c => ({ ...c, moves: simplify(c.moves) })).filter(c => c.moves.length);
  }
}

/* ---------- busca curta (para a cruz) ---------- */
type Lite = { pos: Vec; ns: Vec[] };
const FACE_MOVES = ['U', "U'", 'U2', 'D', "D'", 'D2', 'F', "F'", 'F2', 'B', "B'", 'B2', 'R', "R'", 'R2', 'L', "L'", 'L2'];
function moveLite(p: Lite, m: string): Lite {
  const t = solvedPieceLike(p); applyMove(t, m); return { pos: t[0].pos, ns: t[0].stickers.map(x => x.n) };
}
function solvedPieceLike(p: Lite): CubeState {
  return [{ id: '', home: [0, 0, 0], pos: [...p.pos] as Vec, stickers: p.ns.map(n => ({ color: 'U' as Face, n: [...n] as Vec })) }];
}
const key = (p: Lite) => p.pos.join() + '|' + p.ns.map(n => n.join()).join('|');

/** procura os giros mais curtos que deixam todas as peças acompanhadas no lugar */
function searchSolve(s: CubeState, pieces: Piece[], maxDepth = 10): string[] {
  const goals = pieces.map(p => ({ pos: target(s, p), ns: p.stickers.map(t => centers(s)[t.color]) }));
  // distância de cada peça sozinha até o lugar dela (serve de "estimativa" que nunca exagera)
  const dist = goals.map(g => {
    const d = new Map<string, number>([[key(g), 0]]); let frontier = [g];
    while (frontier.length) {
      const next: Lite[] = [];
      for (const st of frontier) for (const m of FACE_MOVES) {
        const n = moveLite(st, m), k = key(n);
        if (!d.has(k)) { d.set(k, d.get(key(st))! + 1); next.push(n); }
      }
      frontier = next;
    }
    return d;
  });
  const start: Lite[] = pieces.map(p => ({ pos: p.pos, ns: p.stickers.map(t => t.n) }));
  const h = (ps: Lite[]) => Math.max(...ps.map((p, i) => dist[i].get(key(p))!));
  const path: string[] = [];
  const opposite: Record<string, string> = { U: 'D', D: 'U', F: 'B', B: 'F', R: 'L', L: 'R' };
  const dfs = (ps: Lite[], g: number, bound: number, last: string): number | true => {
    const hh = h(ps); if (hh === 0) return true;
    if (g + hh > bound) return g + hh;
    let min = Infinity;
    for (const m of FACE_MOVES) {
      if (m[0] === last || (opposite[m[0]] === last && m[0] < last)) continue;
      path.push(m);
      const r = dfs(ps.map(p => moveLite(p, m)), g + 1, bound, m[0]);
      if (r === true) return true;
      if (r < min) min = r;
      path.pop();
    }
    return min;
  };
  for (let bound = h(start); bound <= maxDepth;) {
    const r = dfs(start, 0, bound, '');
    if (r === true) return path.slice();
    bound = r;
  }
  throw new Error('não achei solução curta para a cruz');
}

/* ---------- o método ---------- */
export function solve(input: CubeState): Chunk[] {
  if (isSolvedAnyWay(input)) return [];
  const P = new Plan(clone(input));
  const W = centerAt(P.s, UP);                     // branco, em cima no começo
  const Y = centerAt(P.s, [0, -1, 0]);             // amarelo, embaixo no começo
  const sides = (['F', 'R', 'B', 'L', 'U', 'D'] as Face[]).filter(c => c !== W && c !== Y);

  // 1) cruz branca: um meio de cada vez, com a cor dele de frente
  const crossDone: Face[] = [];
  for (const X of sides) {
    const e = () => find(P.s, [W, X]);
    if (!solvedNow(P.s, e())) {
      P.begin('cruz', `Meio branco e ${COLOR[X]}`, `Vire o cubo para o centro ${COLOR[X]} ficar de frente. Branco continua em cima.`);
      P.turnCubeUntil(s => eq(centers(s)[X], FRONT));
      P.do(searchSolve(P.s, [...crossDone.map(c => find(P.s, [W, c])), e()]));
    }
    crossDone.push(X);
  }

  // 2) cantos brancos: o lugar do canto na frente-direita, o canto embaixo dele, e R' D' R D até encaixar
  const cornerPairs = allCornerPairs(P.s, sides);
  for (const [A, B] of cornerPairs) {
    const c = () => find(P.s, [W, A, B]);
    if (solvedNow(P.s, c())) continue;
    P.begin('cantos', `Canto branco, ${COLOR[A]} e ${COLOR[B]}`, 'Vire o cubo para o lugar desse canto ficar em cima, na frente, à direita.');
    // se o canto está em cima, mas em outro lugar: tira ele de lá primeiro
    if (c().pos[1] === 1 && !eq(c().pos, target(P.s, c()))) {
      P.turnCubeUntil(s => eq(find(s, [W, A, B]).pos, [1, 1, 1]));
      P.do("R' D' R D");
    }
    P.turnCubeUntil(s => eq(target(s, find(s, [W, A, B])), [1, 1, 1]));
    if (c().pos[1] === -1) P.turnBottomUntil(s => eq(find(s, [W, A, B]).pos, [1, -1, 1]));
    for (let g = 0; g < 6 && !solvedNow(P.s, c()); g++) P.do("R' D' R D");
  }

  // 3) virar: amarelo para cima, verde continua de frente
  P.begin('virar', 'Vire o cubo de cabeça para baixo', 'Amarelo em cima. O verde continua de frente para você.');
  P.do('z2');

  // 4) segunda camada
  const midEdges = () => P.s.filter(p => p.stickers.length === 2 && p.stickers.every(t => t.color !== W && t.color !== Y));
  for (let guard = 0; guard < 16; guard++) {
    const wrong = midEdges().filter(p => !solvedNow(P.s, p));
    if (!wrong.length) break;
    const cand = midEdges().find(p => p.pos[1] === 1);
    if (cand) {
      const side = cand.stickers.find(t => t.n[1] === 0)!.color, top = cand.stickers.find(t => t.n[1] === 1)!.color;
      P.begin('meio', `Meio ${COLOR[side]} e ${COLOR[top]}`, `Vire o cubo para o centro ${COLOR[side]} ficar de frente e gire o topo até o meio ficar em cima dele.`);
      P.turnCubeUntil(s => eq(centers(s)[side], FRONT));
      P.turnTopUntil(s => eq(find(s, [side, top]).pos, [0, 1, 1]));
      if (eq(centers(P.s)[top], RIGHT)) P.do("U R U' R' U' F' U F");
      else P.do("U' L' U L U F U' F'");
    } else {
      const w = wrong[0];
      P.begin('meio', 'Tirar um meio do lugar errado', 'Vire o cubo para o meio errado ficar na frente, à direita. Ele sobe, e depois entra do jeito certo.');
      P.turnCubeUntil(s => eq(find(s, w.stickers.map(t => t.color)).pos, [1, 0, 1]));
      P.do("U R U' R' U' F' U F");
    }
  }

  // 5) cruz amarela
  const topEdges: Vec[] = [[0, 1, 1], [1, 1, 0], [0, 1, -1], [-1, 1, 0]];
  const yellowUp = (s: CubeState, pos: Vec) => { const e = s.find(p => p.stickers.length === 2 && eq(p.pos, pos))!; return e.stickers.some(t => t.color === Y && t.n[1] === 1); };
  for (let guard = 0; guard < 6; guard++) {
    const up = topEdges.filter(p => yellowUp(P.s, p));
    if (up.length === 4) break;
    if (up.length === 0) {
      P.begin('cruzAmarela', 'Cruz amarela: só o centro', 'Faça F R U R\' U\' F\'. Vai aparecer um "L" ou uma linha.');
    } else if (yellowUp(P.s, [0, 1, 1]) === yellowUp(P.s, [0, 1, -1]) && up.length === 2) {
      P.begin('cruzAmarela', 'Cruz amarela: a linha', 'Gire o topo até a linha ficar deitada (esquerda–direita) e faça F R U R\' U\' F\'.');
      P.turnTopUntil(s => yellowUp(s, [1, 1, 0]) && yellowUp(s, [-1, 1, 0]));
    } else {
      P.begin('cruzAmarela', 'Cruz amarela: o "L"', 'Gire o topo até o "L" apontar para trás e para a esquerda, e faça F R U R\' U\' F\'.');
      P.turnTopUntil(s => yellowUp(s, [0, 1, -1]) && yellowUp(s, [-1, 1, 0]));
    }
    P.do("F R U R' U' F'");
  }

  // 6) meios amarelos combinando com os lados
  const matches = (s: CubeState) => topEdges.filter(pos => {
    const e = s.find(p => p.stickers.length === 2 && eq(p.pos, pos))!; const side = e.stickers.find(t => t.n[1] === 0)!;
    return centerAt(s, side.n) === side.color;
  });
  const bestTop = () => ['', 'U', "U'", 'U2'].reduce((best, o) => { const t = clone(P.s); if (o) applyMove(t, o); const n = matches(t).length; return n > best.n ? { o, n } : best; }, { o: '', n: -1 });
  for (let guard = 0; guard < 8; guard++) {
    const b = bestTop();
    P.begin('meiosAmarelos', 'Meios amarelos combinando', 'Gire o topo até o máximo de meios combinar com os centros dos lados.');
    if (b.o) P.do(b.o);
    const m = matches(P.s);
    if (m.length === 4) break;
    if (m.length === 2 && !(eq(m[0], [0, 1, 1]) && eq(m[1], [0, 1, -1])) && !(eq(m[0], [1, 1, 0]) && eq(m[1], [-1, 1, 0]))) {
      P.begin('meiosAmarelos', 'Troque os dois meios da frente', 'Vire o cubo para os dois meios certos ficarem atrás e à direita, e faça R U R\' U R U2 R\'.');
      P.turnCubeUntil(s => { const mm = matches(s); return mm.some(p => eq(p, [0, 1, -1])) && mm.some(p => eq(p, [1, 1, 0])); });
    } else {
      P.begin('meiosAmarelos', 'Mexa nos meios de cima', 'Faça R U R\' U R U2 R\' e veja de novo quais meios combinam.');
    }
    P.do("R U R' U R U2 R'");
  }

  // 7) cantos amarelos no lugar (ainda que torcidos)
  const topCorners: Vec[] = [[1, 1, 1], [1, 1, -1], [-1, 1, -1], [-1, 1, 1]];
  const placed = (s: CubeState, pos: Vec) => { const c = s.find(p => p.stickers.length === 3 && eq(p.pos, pos))!; return eq(target(s, c), pos); };
  for (let guard = 0; guard < 6; guard++) {
    const ok = topCorners.filter(p => placed(P.s, p));
    if (ok.length === 4) break;
    if (ok.length) {
      P.begin('posCantos', 'Cantos amarelos no lugar', 'Vire o cubo para o canto que já está no lugar ficar na frente, à direita, e faça U R U\' L\' U R\' U\' L.');
      P.turnCubeUntil(s => placed(s, [1, 1, 1]));
    } else {
      P.begin('posCantos', 'Nenhum canto no lugar ainda', 'Faça U R U\' L\' U R\' U\' L uma vez e olhe de novo.');
    }
    P.do("U R U' L' U R' U' L");
  }

  // 8) girar os cantos amarelos: na frente-direita, R' D' R D até o amarelo ficar em cima; depois U para o próximo
  const yellowOk = (s: CubeState) => s.find(p => p.stickers.length === 3 && eq(p.pos, [1, 1, 1]))!.stickers.some(t => t.color === Y && t.n[1] === 1);
  for (let i = 0; i < 4; i++) {
    if (!yellowOk(P.s)) {
      P.begin('oriCantos', 'Desvire o canto da frente-direita', 'Repita R\' D\' R D até o amarelo desse canto ficar em cima. Não vire o cubo: a base bagunça e volta no fim.');
      for (let g = 0; g < 6 && !yellowOk(P.s); g++) P.do("R' D' R D");
    }
    P.begin('oriCantos', 'Próximo canto', 'Gire só o topo (U) para trazer o próximo canto para a frente-direita.');
    P.do('U');
  }
  P.begin('oriCantos', 'Último giro', 'Gire o topo até tudo combinar.');
  P.turnTopUntil(s => isSolvedAnyWay(s));

  if (!isSolvedAnyWay(P.s)) throw new Error('O método não fechou o cubo. Confira se as cores foram lidas certo.');
  return mergeChunks(P.finish());
}

/** junta lances seguidos de "girar o topo" para não picotar demais */
function mergeChunks(chunks: Chunk[]): Chunk[] {
  const out: Chunk[] = [];
  for (const c of chunks) {
    const last = out[out.length - 1];
    if (last && c.title === 'Próximo canto' && last.stage === 'oriCantos') { last.moves = simplify([...last.moves, ...c.moves]); continue; }
    out.push({ ...c });
  }
  return out;
}

function eqOpp(s: CubeState, a: Face, b: Face) { const c = centers(s); return eq(c[a], c[b].map(v => -v) as Vec); }
function allCornerPairs(s: CubeState, sides: Face[]): [Face, Face][] {
  const out: [Face, Face][] = [];
  for (let i = 0; i < sides.length; i++) for (let j = i + 1; j < sides.length; j++)
    if (!eqOpp(s, sides[i], sides[j])) out.push([sides[i], sides[j]]);
  return out;
}
