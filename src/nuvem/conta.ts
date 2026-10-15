/**
 * Conta opcional com Google e progresso na nuvem (Firebase: Authentication + Firestore).
 * O Firebase só é carregado quando a pessoa usa a conta, para o app continuar leve.
 * No banco, cada pessoa tem um documento só: usuarios/{uid}, com o progresso (sem foto, sem contatos).
 */
import { useEffect, useRef, useState } from 'react';
import { FIREBASE_CONFIG, nuvemDisponivel } from './config';
import { gravarLocal, igual, lerLocal, mesclar, type Dados } from './sync';

const LOGADO = 'giroagiro.nuvem.v1';

/** aberto como app instalado (Play Store ou "adicionar à tela inicial"), e não numa aba do navegador */
const appInstalado = () => {
  try {
    return window.matchMedia('(display-mode: standalone)').matches
      || document.referrer.startsWith('android-app://');
  } catch { return false; }
};
export interface Usuario { uid: string; nome: string; email: string }
type Estado = 'sem-nuvem' | 'carregando' | 'fora' | 'dentro' | 'erro';

let fb: Promise<{
  auth: import('firebase/auth').Auth;
  db: import('firebase/firestore').Firestore;
  A: typeof import('firebase/auth');
  F: typeof import('firebase/firestore');
}> | null = null;
function firebase() {
  fb ??= (async () => {
    const [{ initializeApp }, A, F] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore')]);
    const app = initializeApp(FIREBASE_CONFIG);
    const auth = A.getAuth(app);
    await A.setPersistence(auth, A.browserLocalPersistence);
    return { auth, db: F.getFirestore(app), A, F };
  })();
  return fb;
}

/** traz o progresso da nuvem, junta com o do aparelho e grava nos dois lugares; true se mudou algo aqui */
async function sincronizar(uid: string): Promise<boolean> {
  const { db, F } = await firebase();
  const ref = F.doc(db, 'usuarios', uid);
  const snap = await F.getDoc(ref);
  const local = lerLocal();
  const remoto = (snap.exists() ? snap.data().dados : {}) as Dados;
  const junto = mesclar(local, remoto);
  await F.setDoc(ref, { dados: junto, atualizado: F.serverTimestamp() });
  const mudou = !igual(mesclar(local, {}), junto);
  if (mudou) gravarLocal(junto);
  return mudou;
}
/** recarrega a tela para mostrar o progresso trazido da nuvem, no máximo uma vez seguida */
const RECARREGOU = 'giroagiro.nuvem.recarregou';
function recarregarUmaVez() {
  try {
    const ultima = Number(sessionStorage.getItem(RECARREGOU) || 0);
    if (Date.now() - ultima < 60000) return;
    sessionStorage.setItem(RECARREGOU, String(Date.now()));
  } catch { return; }
  window.location.reload();
}
async function enviar(uid: string) {
  const { db, F } = await firebase();
  await F.setDoc(F.doc(db, 'usuarios', uid), { dados: mesclar(lerLocal(), {}), atualizado: F.serverTimestamp() });
}

export function useConta() {
  const [estado, setEstado] = useState<Estado>(nuvemDisponivel() ? 'fora' : 'sem-nuvem');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  // quem já entrou antes: reconecta sozinho ao abrir o app
  useEffect(() => {
    if (!nuvemDisponivel()) return;
    let lembrado = false; try { lembrado = localStorage.getItem(LOGADO) === '1'; } catch { /* */ }
    if (!lembrado) return;
    setEstado('carregando');
    let parar = () => {};
    firebase().then(async ({ auth, A }) => {
      await A.getRedirectResult(auth).catch(e => { console.warn(e); setErro('Não deu para entrar agora. Tente de novo.'); });
      parar = A.onAuthStateChanged(auth, async u => {
        if (!u) { setUsuario(null); setEstado('fora'); return; }
        setUsuario({ uid: u.uid, nome: u.displayName ?? '', email: u.email ?? '' });
        setEstado('dentro');
        try { if (await sincronizar(u.uid)) recarregarUmaVez(); } catch (e) { console.warn(e); }
      });
    }).catch(e => { console.warn(e); setEstado('erro'); setErro('Não consegui falar com a nuvem agora.'); });
    return () => parar();
  }, []);

  const entrar = async () => {
    setErro(null); setEstado('carregando');
    try {
      const { auth, A } = await firebase();
      const provedor = new A.GoogleAuthProvider();
      try { localStorage.setItem(LOGADO, '1'); } catch { /* */ }
      // no app instalado (Android/Play Store) a janelinha do Google abre como outra tela e não volta:
      // lá o login abre no lugar do app e retorna para ele
      if (appInstalado()) { await A.signInWithRedirect(auth, provedor); return; }
      let r: import('firebase/auth').UserCredential;
      try { r = await A.signInWithPopup(auth, provedor); }
      catch (e) {
        const code = (e as { code?: string }).code ?? '';
        if (code.includes('popup-blocked') || code.includes('operation-not-supported')) { await A.signInWithRedirect(auth, provedor); return; }
        throw e;
      }
      const u = r.user;
      setUsuario({ uid: u.uid, nome: u.displayName ?? '', email: u.email ?? '' });
      setEstado('dentro');
      if (await sincronizar(u.uid)) recarregarUmaVez();
    } catch (e) {
      const code = (e as { code?: string }).code ?? '';
      try { localStorage.removeItem(LOGADO); } catch { /* */ }
      setEstado('fora');
      if (!code.includes('popup-closed') && !code.includes('cancelled-popup')) { console.warn(e); setErro('Não deu para entrar agora. Tente de novo.'); }
    }
  };

  /** depois de cada mudança no progresso, guarda na nuvem (espera uns segundos para juntar várias) */
  const salvarDepois = () => {
    if (estado !== 'dentro' || !usuario) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { enviar(usuario.uid).catch(e => console.warn(e)); }, 3000);
  };

  // ao sair do app (trocar de aba, bloquear a tela), guarda na hora
  useEffect(() => {
    if (estado !== 'dentro' || !usuario) return;
    const h = () => { if (document.visibilityState === 'hidden') enviar(usuario.uid).catch(() => null); };
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, [estado, usuario]);

  const sair = async () => {
    const { auth, A } = await firebase();
    if (usuario) await enviar(usuario.uid).catch(() => null);
    await A.signOut(auth);
    try { localStorage.removeItem(LOGADO); } catch { /* */ }
    setUsuario(null); setEstado('fora');
  };

  /** apaga o documento da pessoa e a conta; o progresso continua só no aparelho */
  const apagar = async () => {
    const { auth, db, A, F } = await firebase();
    const u = auth.currentUser; if (!u) return;
    await F.deleteDoc(F.doc(db, 'usuarios', u.uid));
    try { await A.deleteUser(u); }
    catch (e) {
      if ((e as { code?: string }).code === 'auth/requires-recent-login') {
        await A.reauthenticateWithPopup(u, new A.GoogleAuthProvider());
        await A.deleteUser(u);
      } else throw e;
    }
    try { localStorage.removeItem(LOGADO); } catch { /* */ }
    setUsuario(null); setEstado('fora');
  };

  return { estado, usuario, erro, entrar, sair, apagar, salvarDepois };
}
