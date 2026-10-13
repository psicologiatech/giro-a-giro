/**
 * O que vai para a nuvem e como juntar com o que já está no aparelho.
 * Regra geral: nada se perde. Passos feitos se somam; tempos se juntam; pontos ficam com o maior.
 */
export const CHAVES = {
  app: 'giroagiro.app.v1',
  passos: 'giroagiro.passos.v1',
  tempos: 'giroagiro.tempos.v1',
  pecas: 'giroagiro.pecas.v1',
  letras: 'giroagiro.letras.v1',
} as const;

export interface Dados {
  app?: { xp?: number; streak?: number; lastDay?: string; solves?: number; sound?: boolean };
  passos?: number[];
  tempos?: { ms: number; quando: number; embaralhar: string }[];
  pecas?: Record<string, number>;
  letras?: string;
}

const ler = <T,>(k: string): T | undefined => { try { const v = localStorage.getItem(k); return v === null ? undefined : (k === CHAVES.letras ? v : JSON.parse(v)) as T; } catch { return undefined; } };
export function lerLocal(): Dados {
  return { app: ler(CHAVES.app), passos: ler(CHAVES.passos), tempos: ler(CHAVES.tempos), pecas: ler(CHAVES.pecas), letras: ler(CHAVES.letras) };
}
export function gravarLocal(d: Dados) {
  try {
    if (d.app) localStorage.setItem(CHAVES.app, JSON.stringify(d.app));
    if (d.passos) localStorage.setItem(CHAVES.passos, JSON.stringify(d.passos));
    if (d.tempos) localStorage.setItem(CHAVES.tempos, JSON.stringify(d.tempos));
    if (d.pecas) localStorage.setItem(CHAVES.pecas, JSON.stringify(d.pecas));
    if (d.letras !== undefined) localStorage.setItem(CHAVES.letras, d.letras);
  } catch { /* sem armazenamento */ }
}

/** junta o que está no aparelho (a) com o que está na nuvem (b) */
export function mesclar(a: Dados, b: Dados): Dados {
  const aa = a.app ?? {}, ba = b.app ?? {};
  const maisRecente = (aa.lastDay ?? '') >= (ba.lastDay ?? '') ? aa : ba;
  const app = {
    ...ba, ...aa,
    xp: Math.max(aa.xp ?? 0, ba.xp ?? 0),
    solves: Math.max(aa.solves ?? 0, ba.solves ?? 0),
    lastDay: maisRecente.lastDay ?? '',
    streak: maisRecente.streak ?? 0,
  };
  const passos = [...new Set([...(a.passos ?? []), ...(b.passos ?? [])])].sort((x, y) => x - y);
  const porQuando = new Map<number, NonNullable<Dados['tempos']>[number]>();
  for (const t of [...(b.tempos ?? []), ...(a.tempos ?? [])]) porQuando.set(t.quando, t);
  const tempos = [...porQuando.values()].sort((x, y) => y.quando - x.quando).slice(0, 200);
  const pecas: Record<string, number> = { ...(b.pecas ?? {}) };
  for (const [k, v] of Object.entries(a.pecas ?? {})) pecas[k] = Math.max(v, pecas[k] ?? 0);
  return { app, passos, tempos, pecas, letras: a.letras ?? b.letras };
}

/** os dois lados têm o mesmo conteúdo? (para saber se precisa recarregar a tela) */
export const igual = (x: Dados, y: Dados) => JSON.stringify(x) === JSON.stringify(y);
