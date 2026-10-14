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
  dominio: 'giroagiro.dominio.v1',
  treino: 'giroagiro.treino.v1',
  zerada: 'giroagiro.zerada.v1',
  revisao: 'giroagiro.revisao.v1',
  licoes: 'giroagiro.licoes.v1',
} as const;

export interface Dados {
  app?: { xp?: number; streak?: number; lastDay?: string; solves?: number; sound?: boolean };
  passos?: number[];
  tempos?: { ms: number; quando: number; embaralhar: string }[];
  pecas?: Record<string, number>;
  letras?: string;
  dominio?: Record<string, number>;
  treino?: { meta: number; dias: string[] };
  /** quando a trilha foi recomeçada (ms); o lado mais recente manda nos passos, peças e estrelas */
  zerada?: number;
  revisao?: Record<string, { caixa: number; proxima: string; visto: number }>;
  /** lições feitas (ids) */
  licoes?: string[];
}

const ler = <T,>(k: string): T | undefined => { try { const v = localStorage.getItem(k); return v === null ? undefined : (k === CHAVES.letras ? v : JSON.parse(v)) as T; } catch { return undefined; } };
export function lerLocal(): Dados {
  return { app: ler(CHAVES.app), passos: ler(CHAVES.passos), tempos: ler(CHAVES.tempos), pecas: ler(CHAVES.pecas), letras: ler(CHAVES.letras),
    dominio: ler(CHAVES.dominio), treino: ler(CHAVES.treino), zerada: ler(CHAVES.zerada), revisao: ler(CHAVES.revisao), licoes: ler(CHAVES.licoes) };
}
export function gravarLocal(d: Dados) {
  try {
    if (d.app) localStorage.setItem(CHAVES.app, JSON.stringify(d.app));
    if (d.passos) localStorage.setItem(CHAVES.passos, JSON.stringify(d.passos));
    if (d.tempos) localStorage.setItem(CHAVES.tempos, JSON.stringify(d.tempos));
    if (d.pecas) localStorage.setItem(CHAVES.pecas, JSON.stringify(d.pecas));
    if (d.letras !== undefined) localStorage.setItem(CHAVES.letras, d.letras);
    if (d.dominio) localStorage.setItem(CHAVES.dominio, JSON.stringify(d.dominio));
    if (d.treino) localStorage.setItem(CHAVES.treino, JSON.stringify(d.treino));
    if (d.zerada) localStorage.setItem(CHAVES.zerada, String(d.zerada));
    if (d.revisao) localStorage.setItem(CHAVES.revisao, JSON.stringify(d.revisao));
    if (d.licoes) localStorage.setItem(CHAVES.licoes, JSON.stringify(d.licoes));
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
  // trilha: se um lado recomeçou depois do outro, vale só esse lado; senão, soma os dois
  const za = a.zerada ?? 0, zb = b.zerada ?? 0;
  const so = za > zb ? a : zb > za ? b : null;
  const passos = so ? [...(so.passos ?? [])] : [...new Set([...(a.passos ?? []), ...(b.passos ?? [])])].sort((x, y) => x - y);
  const porQuando = new Map<number, NonNullable<Dados['tempos']>[number]>();
  for (const t of [...(b.tempos ?? []), ...(a.tempos ?? [])]) porQuando.set(t.quando, t);
  const tempos = [...porQuando.values()].sort((x, y) => y.quando - x.quando).slice(0, 200);
  const maior = (x?: Record<string, number>, y?: Record<string, number>) => {
    const r: Record<string, number> = { ...(y ?? {}) };
    for (const [k, v] of Object.entries(x ?? {})) r[k] = Math.max(v, r[k] ?? 0);
    return r;
  };
  const pecas = so ? { ...(so.pecas ?? {}) } : maior(a.pecas, b.pecas);
  const dominio = so ? { ...(so.dominio ?? {}) } : maior(a.dominio, b.dominio);
  const treino = (a.treino || b.treino) ? {
    meta: a.treino?.meta ?? b.treino?.meta ?? 3,
    dias: [...new Set([...(a.treino?.dias ?? []), ...(b.treino?.dias ?? [])])].sort().slice(-120),
  } : undefined;
  const zerada = Math.max(za, zb) || undefined;
  // revisão: para cada situação, vale a resposta mais recente
  const revisao: NonNullable<Dados['revisao']> = { ...(b.revisao ?? {}) };
  for (const [k, v] of Object.entries(a.revisao ?? {})) if (!revisao[k] || v.visto >= revisao[k].visto) revisao[k] = v;
  const licoes = so ? [...(so.licoes ?? [])] : [...new Set([...(a.licoes ?? []), ...(b.licoes ?? [])])].sort();
  return { app, passos, tempos, pecas, letras: a.letras ?? b.letras, dominio, treino, zerada, revisao, licoes };
}

/** texto do conteúdo com as chaves sempre na mesma ordem (a nuvem devolve os campos em outra ordem) */
const estavel = (v: unknown): string =>
  Array.isArray(v) ? `[${v.map(estavel).join(',')}]`
  : v && typeof v === 'object' ? `{${Object.keys(v as object).sort().filter(k => (v as Record<string, unknown>)[k] !== undefined)
      .map(k => `${JSON.stringify(k)}:${estavel((v as Record<string, unknown>)[k])}`).join(',')}}`
  : JSON.stringify(v);
/** os dois lados têm o mesmo conteúdo? (para saber se precisa recarregar a tela) */
export const igual = (x: Dados, y: Dados) => estavel(x) === estavel(y);
