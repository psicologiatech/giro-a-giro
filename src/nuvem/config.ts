/**
 * Configuração do Firebase (projeto da Karol). Esses valores não são segredo: o Firebase
 * protege os dados pelas regras do banco (cada pessoa só lê e grava o próprio documento).
 * Enquanto estiver vazio, o login fica escondido e o app funciona só no aparelho.
 */
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyD5tF7uL7xgrKCNdJP_6EHhp1aF8wK4CFo',
  authDomain: 'giro-a-giro.firebaseapp.com',
  projectId: 'giro-a-giro',
  appId: '1:957070502819:web:9d1885bdfab6e1d74f8816',
};
export const nuvemDisponivel = () => !!FIREBASE_CONFIG.apiKey && !!FIREBASE_CONFIG.projectId;
