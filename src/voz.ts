/**
 * A voz do Pingo: usa a voz em português que já vem no aparelho (sem gravar nada, funciona sem internet).
 * Se o aparelho não tiver voz, os botões de ouvir simplesmente não aparecem.
 */
import { useEffect, useState } from 'react';

const VKEY = 'giroagiro.voz.v1';
export const temVoz = () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

let escolhida: SpeechSynthesisVoice | null = null;
function voz(): SpeechSynthesisVoice | null {
  if (escolhida || !temVoz()) return escolhida;
  const vs = window.speechSynthesis.getVoices();
  const pt = vs.filter(v => v.lang.toLowerCase().replace('_', '-').startsWith('pt'));
  // prefere português do Brasil, e as vozes do Google/naturais, que soam melhor
  escolhida = pt.find(v => /pt-br/i.test(v.lang) && /google|natural|online/i.test(v.name))
    ?? pt.find(v => /pt-br/i.test(v.lang)) ?? pt[0] ?? null;
  return escolhida;
}
if (temVoz()) window.speechSynthesis.onvoiceschanged = () => { escolhida = null; voz(); };

/** tira as marcações de destaque (*palavra*) antes de ler */
export const textoFalado = (t: string) => t.replace(/\*/g, '');

export function falar(texto: string) {
  if (!temVoz()) return;
  const s = window.speechSynthesis;
  s.cancel();
  const u = new SpeechSynthesisUtterance(textoFalado(texto));
  u.lang = 'pt-BR'; u.rate = 0.95; u.pitch = 1.05;
  const v = voz(); if (v) u.voice = v;
  s.speak(u);
}
export const calar = () => { if (temVoz()) window.speechSynthesis.cancel(); };

/** "o Pingo lê sozinho cada tela" (ligado/desligado), lembrado no aparelho */
export function useVozAuto(): [boolean, (v: boolean) => void] {
  const [on, setOn] = useState(() => { try { return localStorage.getItem(VKEY) === '1'; } catch { return false; } });
  useEffect(() => { try { localStorage.setItem(VKEY, on ? '1' : '0'); } catch { /* */ } if (!on) calar(); }, [on]);
  return [on, setOn];
}
