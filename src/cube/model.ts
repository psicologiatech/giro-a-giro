/**
 * Modelo lógico do cubo 3x3 (sem gráficos).
 * Cada peça tem uma posição (x,y,z ∈ {-1,0,1}) e adesivos com a direção para onde apontam.
 * Convenção: U = +y (cima), F = +z (frente), R = +x (direita).
 * Cores de fábrica: U branco, D amarelo, F verde, B azul, R vermelho, L laranja.
 */
export type Face = 'U' | 'D' | 'F' | 'B' | 'R' | 'L';
export type Vec = [number, number, number];
export interface Sticker { color: Face; n: Vec }
export interface Piece { id: string; home: Vec; pos: Vec; stickers: Sticker[] }
export type CubeState = Piece[];
/** cores vistas em cada face, 9 por face (ver faceletIndex) */
export type Facelets = Record<Face, Face[]>;

export const FACES: Face[] = ['U', 'D', 'F', 'B', 'R', 'L'];
type Axis = 0 | 1 | 2;
/** eixo, camada e sentido do giro "horário" (olhando de frente para a face) */
export const FACE_DEF: Record<Face, { axis: Axis; layer: number; dir: 1 | -1 }> = {
  R: { axis: 0, layer: 1, dir: -1 }, L: { axis: 0, layer: -1, dir: 1 },
  U: { axis: 1, layer: 1, dir: -1 }, D: { axis: 1, layer: -1, dir: 1 },
  F: { axis: 2, layer: 1, dir: -1 }, B: { axis: 2, layer: -1, dir: 1 },
};
export const NORMAL: Record<Face, Vec> = {
  R: [1, 0, 0], L: [-1, 0, 0], U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1],
};

export function faceOfNormal(n: Vec): Face {
  if (n[0] === 1) return 'R'; if (n[0] === -1) return 'L';
  if (n[1] === 1) return 'U'; if (n[1] === -1) return 'D';
  return n[2] === 1 ? 'F' : 'B';
}

/** gira um vetor 90° em torno de um eixo (s = +1 anti-horário pela regra da mão direita) */
export function rot(v: Vec, axis: Axis, s: number): Vec {
  const [x, y, z] = v;
  if (axis === 0) return s > 0 ? [x, -z, y] : [x, z, -y];
  if (axis === 1) return s > 0 ? [z, y, -x] : [-z, y, x];
  return s > 0 ? [-y, x, z] : [y, -x, z];
}

export function solved(): CubeState {
  const P: CubeState = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
    if (!x && !y && !z) continue;
    const st: Sticker[] = [];
    if (x) st.push({ color: x > 0 ? 'R' : 'L', n: [x, 0, 0] });
    if (y) st.push({ color: y > 0 ? 'U' : 'D', n: [0, y, 0] });
    if (z) st.push({ color: z > 0 ? 'F' : 'B', n: [0, 0, z] });
    P.push({ id: `${x},${y},${z}`, home: [x, y, z], pos: [x, y, z], stickers: st });
  }
  return P;
}

export const clone = (s: CubeState): CubeState =>
  s.map(p => ({ id: p.id, home: p.home, pos: [...p.pos] as Vec, stickers: p.stickers.map(t => ({ color: t.color, n: [...t.n] as Vec })) }));

/** sinal do ângulo (regra da mão direita) de um giro como "R", "R'" ou "R2" */
export function moveSign(m: string): number {
  const d = FACE_DEF[m[0] as Face];
  return m.endsWith("'") ? -d.dir : d.dir;
}

export function applyMove(state: CubeState, m: string): CubeState {
  const d = FACE_DEF[m[0] as Face];
  if (!d) throw new Error(`Giro desconhecido: ${m}`);
  const s = moveSign(m), times = m.endsWith('2') ? 2 : 1;
  for (let t = 0; t < times; t++) for (const p of state) if (p.pos[d.axis] === d.layer) {
    p.pos = rot(p.pos, d.axis, s);
    p.stickers.forEach(st => { st.n = rot(st.n, d.axis, s); });
  }
  return state;
}

export const parseAlg = (alg: string): string[] => alg.split(/\s+/).filter(Boolean);
export const invertMove = (m: string) => (m.endsWith('2') ? m : m.endsWith("'") ? m[0] : m + "'");
export const invertAlg = (moves: string[]) => moves.slice().reverse().map(invertMove);
export function applyAlg(state: CubeState, alg: string | string[]): CubeState {
  (typeof alg === 'string' ? parseAlg(alg) : alg).forEach(m => applyMove(state, m));
  return state;
}

const eq = (a: Vec, b: Vec) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
export const pieceSolved = (p: Piece) => eq(p.pos, p.home) && p.stickers.every(t => faceOfNormal(t.n) === t.color);
export const isSolved = (s: CubeState) => s.every(pieceSolved);

/** cor visível em cada posição de adesivo: facelets[face][0..8], lidos de cima-esquerda olhando para a face */
export function facelets(state: CubeState): Record<Face, Face[]> {
  const out = {} as Record<Face, Face[]>;
  for (const f of FACES) out[f] = Array(9).fill(f) as Face[];
  for (const p of state) for (const t of p.stickers) {
    const f = faceOfNormal(t.n);
    out[f][faceletIndex(f, p.pos)] = t.color;
  }
  return out;
}

/** índice 0..8 de um adesivo na face, linha por linha, olhando de frente para a face (U com F embaixo; D com F em cima) */
export function faceletIndex(f: Face, [x, y, z]: Vec): number {
  let col = 0, row = 0;
  switch (f) {
    case 'F': col = x + 1; row = 1 - y; break;
    case 'B': col = 1 - x; row = 1 - y; break;
    case 'R': col = 1 - z; row = 1 - y; break;
    case 'L': col = z + 1; row = 1 - y; break;
    case 'U': col = x + 1; row = z + 1; break;
    case 'D': col = x + 1; row = 1 - z; break;
  }
  return row * 3 + col;
}

const MOVES_ALL = FACES.flatMap(f => [f, f + "'", f + '2']);
/** embaralhamento aleatório sem giros redundantes seguidos */
export function randomScramble(n = 20, rnd = Math.random): string[] {
  const out: string[] = [];
  while (out.length < n) {
    const m = MOVES_ALL[Math.floor(rnd() * MOVES_ALL.length)];
    const last = out[out.length - 1];
    if (last && last[0] === m[0]) continue;
    out.push(m);
  }
  return out;
}
