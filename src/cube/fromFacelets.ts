import { FACES, NORMAL, faceletIndex, solved, type CubeState, type Face, type Facelets, type Piece, type Vec } from './model';

/**
 * Monta o estado das peças a partir das 54 cores lidas e confere se é um cubo possível.
 * Um cubo "impossível" acontece quando alguma cor foi lida errada, ou quando o cubo foi desmontado e montado errado.
 */
export type CheckResult =
  | { ok: true; state: CubeState }
  | { ok: false; reason: 'contagem' | 'centros' | 'peca' | 'canto' | 'meio' | 'paridade'; message: string; counts?: Record<Face, number>; onde?: string[] };

const NAMES: Record<Face, string> = { U: 'branco', D: 'amarelo', F: 'verde', B: 'azul', R: 'vermelho', L: 'laranja' };
const plural: Record<Face, string> = { U: 'brancos', D: 'amarelos', F: 'verdes', B: 'azuis', R: 'vermelhos', L: 'laranjas' };

const slotNormals = ([x, y, z]: Vec): Vec[] => {
  const n: Vec[] = [];
  if (x) n.push([x, 0, 0]); if (y) n.push([0, y, 0]); if (z) n.push([0, 0, z]);
  return n;
};
const faceOf = (n: Vec): Face => (n[0] === 1 ? 'R' : n[0] === -1 ? 'L' : n[1] === 1 ? 'U' : n[1] === -1 ? 'D' : n[2] === 1 ? 'F' : 'B');

export function fromFacelets(f: Facelets): CheckResult {
  // 1) cada cor exatamente 9 vezes
  const counts = Object.fromEntries(FACES.map(c => [c, 0])) as Record<Face, number>;
  for (const face of FACES) for (const c of f[face]) counts[c]++;
  const over = FACES.filter(c => counts[c] > 9), under = FACES.filter(c => counts[c] < 9);
  if (over.length || under.length) {
    const parts = [...over.map(c => `${counts[c]} ${plural[c]}`), ...under.map(c => `${counts[c]} ${counts[c] === 1 ? NAMES[c] : plural[c]}`)];
    return { ok: false, reason: 'contagem', counts, message: `Cada cor aparece 9 vezes num cubo, mas li ${parts.join(' e ')}. Confira essas cores.` };
  }
  // 2) centros: cada face com o centro da sua cor (é assim que as faces são identificadas)
  for (const face of FACES) if (f[face][4] !== face)
    return { ok: false, reason: 'centros', message: 'Os centros não batem com a posição pedida. Segure o cubo com o branco em cima e o verde na frente.' };

  // 3) cada posição recebe a peça cujas cores batem com os adesivos vistos ali
  const pieces = solved();
  const used = new Set<string>();
  const out: CubeState = [];
  for (const home of pieces) {
    const slot = home.home;
    const normals = slotNormals(slot);
    const seen = normals.map(n => ({ n, color: f[faceOf(n)][faceletIndex(faceOf(n), slot)] }));
    const want = seen.map(s => s.color).sort().join('');
    const match = pieces.find(p => !used.has(p.id) && p.stickers.map(s => s.color).sort().join('') === want);
    if (!match) return { ok: false, reason: 'peca', onde: normals.map(n => `${faceOf(n)}${faceletIndex(faceOf(n), slot)}`), message: `Há uma peça com cores que não existem juntas (${seen.map(s => NAMES[s.color]).join(', ')}). Confira essa peça.` };
    used.add(match.id);
    const piece: Piece = { id: match.id, home: match.home, pos: [...slot] as Vec, stickers: seen.map(s => ({ color: s.color, n: [...s.n] as Vec })) };
    out.push(piece);
  }

  // 4) invariantes do cubo: torção dos cantos, virada dos meios e paridade
  if (cornerTwist(out) % 3 !== 0)
    return { ok: false, reason: 'canto', message: 'Parece que um canto está torcido (as cores não fecham). Confira as cores dos cantos, ou se o cubo foi desmontado.' };
  if (edgeFlip(out) % 2 !== 0)
    return { ok: false, reason: 'meio', message: 'Parece que um meio está virado ao contrário. Confira as cores dos meios.' };
  if (parity(out, 3) !== parity(out, 2))
    return { ok: false, reason: 'paridade', message: 'Duas peças parecem trocadas de lugar. Confira as cores lidas.' };
  return { ok: true, state: out };
}

const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** soma das torções dos cantos (0, 1 ou 2 cada), contando a partir do adesivo branco/amarelo */
export function cornerTwist(state: CubeState): number {
  let sum = 0;
  for (const p of state) {
    if (p.stickers.length !== 3) continue;
    const [x, y, z] = p.pos;
    const ny: Vec = [0, y, 0], nx: Vec = [x, 0, 0], nz: Vec = [0, 0, z];
    const order = dot(ny, cross(nx, nz)) < 0 ? [ny, nx, nz] : [ny, nz, nx];
    const ud = p.stickers.find(s => s.color === 'U' || s.color === 'D')!;
    sum += order.findIndex(n => dot(n, ud.n) === 1);
  }
  return sum;
}

/** quantos meios estão "virados" segundo a convenção de sempre (branco/amarelo, ou verde/azul no meio) */
export function edgeFlip(state: CubeState): number {
  let sum = 0;
  for (const p of state) {
    if (p.stickers.length !== 2) continue;
    const prim = p.stickers.find(s => s.color === 'U' || s.color === 'D') ?? p.stickers.find(s => s.color === 'F' || s.color === 'B')!;
    const axis = p.pos[1] !== 0 ? 1 : 2;
    if (prim.n[axis] === 0) sum++;
  }
  return sum;
}

/** paridade (0 par, 1 ímpar) da permutação dos cantos (k=3) ou dos meios (k=2) */
export function parity(state: CubeState, k: 2 | 3): number {
  const ps = state.filter(p => p.stickers.length === k);
  const slots = ps.map(p => p.home.join(','));
  const perm = ps.map(p => slots.indexOf(p.pos.join(',')));
  const seen = new Array(perm.length).fill(false);
  let swaps = 0;
  for (let i = 0; i < perm.length; i++) {
    if (seen[i]) continue;
    let j = i, len = 0;
    while (!seen[j]) { seen[j] = true; j = perm[j]; len++; }
    swaps += len - 1;
  }
  return swaps % 2;
}

export const COLOR_NAMES = NAMES;
export { NORMAL };
