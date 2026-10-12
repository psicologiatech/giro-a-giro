import type { Facelets } from '../cube/model';
const KEY = 'giroagiro.meucubo.v1';
export function loadMyCube(): Facelets | null {
  try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
export function saveMyCube(f: Facelets | null) {
  try { if (f) localStorage.setItem(KEY, JSON.stringify(f)); else localStorage.removeItem(KEY); } catch { /* sem armazenamento */ }
}
