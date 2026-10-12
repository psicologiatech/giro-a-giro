/** sons curtos gerados na hora (sem arquivos) e vibração no celular */
let ctx: AudioContext | null = null;
function tone(freq: number, dur: number, type: OscillatorType = 'triangle', gain = 0.08, when = 0) {
  try {
    ctx ??= new AudioContext();
    const t = ctx.currentTime + when, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur);
  } catch { /* áudio indisponível */ }
}
export const sfx = {
  click: () => tone(520, 0.06, 'square', 0.03),
  good: () => { tone(660, 0.12); tone(880, 0.16, 'triangle', 0.08, 0.08); },
  oops: () => tone(220, 0.18, 'sawtooth', 0.04),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.09, i * 0.11)),
};
export const buzz = (ms: number | number[]) => { try { navigator.vibrate?.(ms); } catch { /* sem vibração */ } };
