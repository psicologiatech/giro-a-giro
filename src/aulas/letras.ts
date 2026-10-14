import { useEffect, useState } from 'react';

/** mostrar as letras dos giros (R, U, F…)? Começa desligado (quem está começando aprende pelos gestos); a escolha fica guardada no aparelho */
const KEY = 'giroagiro.letras.v1';
export function useLetras(): [boolean, (v: boolean) => void] {
  const [v, setV] = useState(() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } });
  useEffect(() => { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* sem armazenamento */ } }, [v]);
  return [v, setV];
}
