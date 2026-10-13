/** o caderno de fórmulas: o nome que os cubistas usam, o apelido visual e as letras */
export interface Formula {
  nome: string;
  apelido: string;
  passo: number;
  alg: string;
  /** como segurar para fazer a fórmula */
  segurar: 'amarelo em cima' | 'amarelo de frente';
  quando: string;
}

export const FORMULAS: Formula[] = [
  { nome: 'Gatilho direito', apelido: 'Janela à direita', passo: 3, alg: "R U R'", segurar: 'amarelo em cima',
    quando: 'Quina branca no andar de cima, com o branco olhando para a direita.' },
  { nome: 'Gatilho esquerdo', apelido: 'Janela à esquerda', passo: 3, alg: "L' U' L", segurar: 'amarelo em cima',
    quando: 'Quina branca no andar de cima, com o branco olhando para a esquerda.' },
  { nome: 'Sexy move', apelido: 'Os quatro giros', passo: 5, alg: "R U R' U'", segurar: 'amarelo em cima',
    quando: 'Não é um passo sozinho: aparece dentro de outras fórmulas, como a da cruz amarela.' },
  { nome: 'Segunda camada (direita)', apelido: 'Parzinho e fachada para a direita', passo: 4, alg: "U R U' R' U' F' U F", segurar: 'amarelo em cima',
    quando: 'Meio sem amarelo formando um T na frente; a cor de cima é a do centro da direita.' },
  { nome: 'Segunda camada (esquerda)', apelido: 'Parzinho e fachada para a esquerda', passo: 4, alg: "U' L' U L U F U' F'", segurar: 'amarelo em cima',
    quando: 'Meio sem amarelo formando um T na frente; a cor de cima é a do centro da esquerda.' },
  { nome: 'Cruz amarela (F + sexy move + F\')', apelido: 'Ponto, L e linha', passo: 5, alg: "F R U R' U' F'", segurar: 'amarelo em cima',
    quando: 'Linha deitada vira cruz; L nas 12h e 9h vira linha; ponto vira L.' },
  { nome: 'Sune', apelido: 'Peixinho', passo: 6, alg: "R U R' U R U2 R'", segurar: 'amarelo em cima',
    quando: 'Peixinho com a cabeça na frente, à esquerda. Sem quina amarela: amarelo olhando para a esquerda. Com duas: olhando para você.' },
  { nome: 'A-perm', apelido: 'Terremoto no prédio', passo: 7, alg: "R U' R D2 R' U R D2 R2", segurar: 'amarelo de frente',
    quando: 'Amarelo de frente, com o lado das duas quinas iguais embaixo.' },
  { nome: 'U-perm (meio à direita)', apelido: 'Trocar os meios', passo: 8, alg: "F2 U L R' F2 L' R U F2", segurar: 'amarelo em cima',
    quando: 'Lado pronto atrás; o meio com a cor da frente está à direita.' },
  { nome: 'U-perm (meio à esquerda)', apelido: 'Trocar os meios', passo: 8, alg: "F2 U' L R' F2 L' R U' F2", segurar: 'amarelo em cima',
    quando: 'Lado pronto atrás; o meio com a cor da frente está à esquerda.' },
];
