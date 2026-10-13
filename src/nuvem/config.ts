/**
 * Configuração do Firebase (projeto da Karol). Esses valores não são segredo: o Firebase
 * protege os dados pelas regras do banco (cada pessoa só lê e grava o próprio documento).
 * Enquanto estiver vazio, o login fica escondido e o app funciona só no aparelho.
 */
export const FIREBASE_CONFIG = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  appId: '',
};
export const nuvemDisponivel = () => !!FIREBASE_CONFIG.apiKey && !!FIREBASE_CONFIG.projectId;
