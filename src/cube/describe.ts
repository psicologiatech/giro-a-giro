/** como dizer cada giro em português simples */
const SIMPLE: Record<string, string> = {
  R: 'Direita para cima', "R'": 'Direita para baixo',
  L: 'Esquerda para baixo', "L'": 'Esquerda para cima',
  U: 'Topo para a esquerda', "U'": 'Topo para a direita',
  D: 'Base para a direita', "D'": 'Base para a esquerda',
  F: 'Frente no sentido do relógio', "F'": 'Frente contra o relógio',
  B: 'Trás: topo vai para a esquerda', "B'": 'Trás: topo vai para a direita',
  y: 'Gire o cubo inteiro para a esquerda', "y'": 'Gire o cubo inteiro para a direita', y2: 'Gire o cubo inteiro meia volta',
  z2: 'Vire o cubo de cabeça para baixo', z: 'Gire o cubo inteiro no sentido do relógio', "z'": 'Gire o cubo inteiro contra o relógio', x: 'Tombe o cubo para trás', "x'": 'Tombe o cubo para a frente',
};
const HALF: Record<string, string> = { R: 'Direita', L: 'Esquerda', U: 'Topo', D: 'Base', F: 'Frente', B: 'Trás' };

export function describe(m: string): string {
  if (SIMPLE[m]) return SIMPLE[m];
  if (m.endsWith('2') && HALF[m[0]]) return `${HALF[m[0]]}: meia volta (2 giros)`;
  return m;
}
export const isWholeCube = (m: string) => 'xyz'.includes(m[0]);
