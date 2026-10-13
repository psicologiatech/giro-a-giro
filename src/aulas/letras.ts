import { useEffect, useState } from 'react';

/** mostrar as letras dos giros (R, U, F…)? Começa ligado; a escolha fica guardada no aparelho */
const KEY = 'giroagiro.letras.v1';
export function useLetras(): [boolean, (v: boolean) => void] {
  const [v, setV] = useState(() => { try { return localStorage.getItem(KEY) !== '0'; } catch { return true; } });
  useEffect(() => { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* sem armazenamento */ } }, [v]);
  return [v, setV];
}
