/** progresso guardado no próprio aparelho */
export interface Progress { xp: number; streak: number; lastDay: string; solves: number; sound: boolean }
const KEY = 'giroagiro.app.v1';
const today = () => new Date().toLocaleDateString('sv-SE'); // AAAA-MM-DD no fuso do aparelho

export function loadProgress(): Progress {
  const base: Progress = { xp: 0, streak: 0, lastDay: '', solves: 0, sound: true };
  try { return { ...base, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return base; }
}
export function saveProgress(p: Progress) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* sem armazenamento */ } }

/** soma XP e atualiza a sequência de dias seguidos */
export function earn(p: Progress, xp: number): Progress {
  const t = today();
  let streak = p.streak;
  if (p.lastDay !== t) {
    const y = new Date(); y.setDate(y.getDate() - 1);
    streak = p.lastDay === y.toLocaleDateString('sv-SE') ? streak + 1 : 1;
  }
  return { ...p, xp: p.xp + xp, streak, lastDay: t };
}
export const level = (xp: number) => Math.floor(xp / 100) + 1;
