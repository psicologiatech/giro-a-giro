import type { Facelets } from '../cube/model';
const KEY = 'giroagiro.meucubo.v1';
export function loadMyCube(): Facelets | null {
  try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
export function saveMyCube(f: Facelets | null) {
  try { if (f) localStorage.setItem(KEY, JSON.stringify(f)); else localStorage.removeItem(KEY); } catch { /* sem armazenamento */ }
}

/** leitura ainda não confirmada (para não perder as 6 fotos se a pessoa sair da tela) */
const RASCUNHO = 'giroagiro.meucubo.rascunho.v1';
export function loadRascunho<T>(): T | null {
  try { const r = localStorage.getItem(RASCUNHO); return r ? JSON.parse(r) : null; } catch { return null; }
}
export function saveRascunho(n: unknown | null) {
  try { if (n) localStorage.setItem(RASCUNHO, JSON.stringify(n)); else localStorage.removeItem(RASCUNHO); } catch { /* sem armazenamento */ }
}
