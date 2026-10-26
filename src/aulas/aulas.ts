/**
 * As aulas do método de camadas para iniciantes, com uma linguagem visual (andares, janela, parzinho, peixinho, terremoto).
 * O cubo fica com o AMARELO EM CIMA e o branco embaixo (no modelo, o branco é 'U'; viramos com z2).
 *
 * Cada situação ("caso") é a fórmula com uma fala simples em cada giro.
 * O cubo da situação é montado ao contrário: parte do cubo como fica no fim do passo
 * ("meta") e desfaz a fórmula. Assim a fórmula sempre resolve a situação mostrada.
 */
import { emQuePasso } from './progresso';
import { applyAlg, clone, faceOfNormal, faceletIndex, invertAlg, solved, type CubeState, type Piece } from '../cube/model';

export interface Lance { m: string; fala: string }
export interface Caso {
  id: string;
  nome: string;
  /** como reconhecer no seu cubo */
  ver: string;
  lances: Lance[];
  /** a solução inteira, quando 'lances' mostra só a primeira parte (depois a pessoa olha o cubo e escolhe de novo) */
  completa?: string;
  /** o que fazer depois, quando a situação não termina o passo */
  depois?: string;
}
export interface Passo {
  n: number;
  titulo: string;
  /** como os cubistas chamam este passo */
  cubista: string;
  cor: 'green' | 'red' | 'blue' | 'orange' | 'yellow';
  objetivo: string;
  segurar: string;
  /** o "porquê" ou o cuidado principal, em uma frase */
  dica: string;
  /** a peça que se resolve uma de cada vez */
  peca: string;
  /** quantas vezes repetir no cubo de verdade (padrão: 4 peças) */
  total?: number;
  /** a pergunta da lista de situações (padrão: como está o próximo/primeiro <peça>) */
  pergunta?: string;
  /** o que fazer no cubo de verdade depois de cada peça */
  repetir: string;
  /** o passo inteiro sendo feito, para ver antes de começar (sem 'inicio', parte do fim e desfaz) */
  demo: { inicio?: string; partes: { legenda: string; m: string }[] };
  /** cubo como fica quando a situação está resolvida */
  meta: () => CubeState;
  /** cubo como fica no fim do passo, para mostrar o objetivo */
  fim: () => CubeState;
  /** olhar o fim espiando a base (onde fica a parte branca) */
  fimDeBaixo: boolean;
  /** peças que importam neste passo (as outras ficam cinza) */
  foco: (p: Piece) => boolean;
  /** a situação está resolvida? (aceita outro caminho, se der no mesmo) */
  pronto: (s: CubeState, meta: CubeState) => boolean;
  casos: Caso[];
}

const isWhite = (p: Piece) => p.stickers.some(t => t.color === 'U');
const isEdge = (p: Piece) => p.stickers.length === 2;
const whiteEdge = (p: Piece) => isWhite(p) && isEdge(p);
const samePlace = (a: Piece, b: Piece) =>
  a.pos.every((v, i) => v === b.pos[i]) && a.stickers.every(t => b.stickers.some(u => u.color === t.color && u.n.every((v, i) => v === t.n[i])));
/** as peças do foco que, na meta, já estão embaixo precisam estar iguais à meta */
/** meio da 2ª camada: sem branco e sem amarelo */
const meioDoMeio = (p: Piece) => isEdge(p) && !p.stickers.some(t => t.color === 'U' || t.color === 'D');
/** as peças do foco que, na meta, estão nos andares de baixo precisam estar iguais à meta */
const andaresIguais = (s: CubeState, meta: CubeState, foco: (p: Piece) => boolean) =>
  meta.filter(p => foco(p) && p.pos[1] <= 0).every(m => samePlace(s.find(p => p.id === m.id)!, m));

const baseIgual = (s: CubeState, meta: CubeState, foco: (p: Piece) => boolean) =>
  meta.filter(p => foco(p) && p.pos[1] === -1).every(m => samePlace(s.find(p => p.id === m.id)!, m));

/** amarelo em cima, branco embaixo, verde de frente */
export const amareloEmCima = () => applyAlg(solved(), 'z2');
/** passo 7 termina com o amarelo de frente (o terremoto) e os meios amarelos ainda trocados */
const quinasMeta = () => applyAlg(amareloEmCima(), "F2 U L R' F2 L' R U F2 x'");
/** os 4 meios brancos em volta do amarelo, com o branco para cima */
const brancosNoTopo = () => applyAlg(amareloEmCima(), 'F2 R2 B2 L2');

export const PASSOS: Passo[] = [
  {
    n: 1, titulo: 'Preparar a cruz branca', cubista: 'Margarida', cor: 'green',
    objetivo: 'Juntar os 4 meios brancos em volta do centro amarelo, com o branco virado para cima.',
    segurar: 'Amarelo em cima, branco embaixo.',
    dica: 'Antes de subir uma peça, olhe o topo: se já tem branco no lugar, gire o topo para limpar o espaço.',
    peca: 'meio branco', repetir: 'Faça igual no seu cubo. Depois procure o próximo meio branco que ainda não está no topo.',
    demo: {
      inicio: "L2 R' L2 R2 F' D' B2 U L2 R2 F L U B2 L2 B R B L F'",
      partes: [
        { legenda: '1º meio branco sobe para o topo', m: 'F' },
        { legenda: '2º meio branco sobe', m: 'R' },
        { legenda: '3º meio branco: deita e sobe', m: "L B'" },
        { legenda: '4º: limpa o espaço e sobe', m: "U' F" },
      ],
    },
    meta: brancosNoTopo, fim: brancosNoTopo, fimDeBaixo: false,
    foco: whiteEdge,
    pronto: s => s.filter(whiteEdge).every(p => p.pos[1] === 1 && p.stickers.find(t => t.color === 'U')!.n[1] === 1),
    casos: [
      {
        id: 'meio', nome: 'Meio branco na camada do meio', ver: 'A peça está no andar do meio, entre duas laterais, e o espaço em cima dela está livre.',
        lances: [{ m: 'R', fala: 'Sobe a lateral: a peça branca vai para o topo.' }],
      },
      {
        id: 'limpar', nome: 'O espaço em cima já tem branco', ver: 'A peça está no andar do meio, mas bem em cima dela já tem um branco.',
        lances: [
          { m: 'U', fala: 'Gira o topo para limpar o espaço.' },
          { m: 'R', fala: 'Agora sobe a lateral.' },
        ],
      },
      {
        id: 'base', nome: 'Meio branco na base', ver: 'A peça está embaixo, com o branco virado para a mesa.',
        lances: [{ m: 'R2', fala: 'Movimento duplo na lateral: a peça sobe tudo.' }],
      },
      {
        id: 'deitada', nome: 'Branco virado para o lado', ver: 'A peça está no andar de cima (ou de baixo), mas o branco olha para a frente.',
        lances: [
          { m: 'F', fala: 'Gira a frente para deitar a peça no andar do meio.' },
          { m: "U'", fala: 'Gira o topo para limpar o espaço.' },
          { m: 'R', fala: 'Sobe a lateral.' },
        ],
      },
    ],
  },
  {
    n: 2, titulo: 'Finalizar a cruz branca', cubista: 'Cruz branca', cor: 'red',
    objetivo: 'Levar cada meio branco do topo para baixo, no lado da cor certa. No fim, a cruz branca fica embaixo.',
    segurar: 'Amarelo em cima. A cor que você vai resolver fica de frente para você.',
    dica: 'Olhe a outra cor do meio branco, a que fica de lado. Ela tem que bater com o centro antes de descer.',
    peca: 'meio branco', repetir: 'Faça igual no seu cubo. Depois vire o cubo inteiro para a próxima cor ficar de frente.',
    demo: {
      inicio: 'F2 R2 U B2 U2 L2 U2',
      partes: [
        { legenda: '1º: gira o topo até a cor bater e desce', m: "U' F2" },
        { legenda: 'Vira o cubo: próxima cor de frente', m: 'y' },
        { legenda: '2º: a cor já bate, só desce', m: 'F2' },
        { legenda: 'Vira o cubo de novo', m: 'y' },
        { legenda: '3º: gira o topo e desce', m: 'U F2' },
        { legenda: 'Vira o cubo de novo', m: 'y' },
        { legenda: '4º: gira o topo duas vezes e desce', m: 'U2 F2' },
      ],
    },
    meta: () => applyAlg(amareloEmCima(), 'R2 B2 L2'), fim: amareloEmCima, fimDeBaixo: true,
    foco: whiteEdge,
    pronto: (s, meta) => baseIgual(s, meta, whiteEdge),
    casos: [
      {
        id: 'bate', nome: 'A cor já bate com o centro', ver: 'O meio branco está no topo, de frente, e a cor dele é igual à do centro da frente.',
        lances: [{ m: 'F2', fala: 'O ponteiro está ao meio-dia. Gira a frente duas vezes e leva ele para as 6 horas.' }],
      },
      {
        id: 'girar', nome: 'A cor não bate', ver: 'O meio branco está no topo, mas em cima de outra cor.',
        lances: [
          { m: 'U', fala: 'Gira o topo até a cor bater com o centro.' },
          { m: 'F2', fala: 'Do meio-dia para as 6 horas: gira a frente duas vezes.' },
        ],
      },
      {
        id: 'oposto', nome: 'Está do outro lado', ver: 'A cor do meio branco é a do centro de trás.',
        lances: [
          { m: 'U2', fala: 'Gira o topo duas vezes até a cor bater com o centro.' },
          { m: 'F2', fala: 'Do meio-dia para as 6 horas.' },
        ],
      },
    ],
  },
  {
    n: 3, titulo: 'Primeira camada', cubista: 'Primeira camada (quinas brancas)', cor: 'blue',
    objetivo: 'Colocar as 4 quinas brancas. No fim, a face branca e a primeira camada ficam prontas.',
    segurar: 'Cruz branca embaixo, amarelo em cima. O lugar da quina fica na frente, embaixo.',
    dica: 'Gire o topo até a quina ficar bem em cima do lugar dela: a cor do lado do branco bate com o centro.',
    peca: 'quina branca', repetir: 'Faça igual no seu cubo. Depois vire o cubo inteiro para o próximo lugar vazio ficar na frente.',
    demo: {
      partes: [
        { legenda: '1ª quina: janela à direita', m: "R U R'" },
        { legenda: '2ª quina: gira o topo, janela à esquerda', m: "U' L' U' L" },
        { legenda: 'Vira o cubo: os lugares vazios vêm para a frente', m: 'y2' },
        { legenda: '3ª quina: janela no telhado', m: "R U2 R' U' R U R'" },
        { legenda: '4ª quina: estava embaixo, mas errada', m: "L' U' L U L' U' L" },
      ],
    },
    meta: amareloEmCima, fim: amareloEmCima, fimDeBaixo: true,
    foco: isWhite,
    pronto: (s, meta) => baseIgual(s, meta, isWhite),
    casos: [
      {
        id: 'direita', nome: 'Janela branca à direita', ver: 'A quina está no andar de cima e o branco olha para a direita.',
        lances: [
          { m: 'R', fala: 'Joga lá pra trás: gira a direita.' },
          { m: 'U', fala: 'Junta branco com branco: gira o topo.' },
          { m: "R'", fala: 'E volta todo mundo para baixo.' },
        ],
      },
      {
        id: 'esquerda', nome: 'Janela branca à esquerda', ver: 'A quina está no andar de cima e o branco olha para a esquerda.',
        lances: [
          { m: "L'", fala: 'Joga lá pra trás: gira a esquerda.' },
          { m: "U'", fala: 'Junta branco com branco: gira o topo.' },
          { m: 'L', fala: 'E volta todo mundo para baixo.' },
        ],
      },
      {
        id: 'telhado', nome: 'Janela no telhado', ver: 'A quina está no andar de cima e o branco olha para cima.',
        lances: [
          { m: 'R', fala: 'Gira a direita: o lugar da quina vai lá pra trás.' },
          { m: 'U2', fala: 'Gira o topo duas vezes.' },
          { m: "R'", fala: 'Volta a direita. Pronto: virou janela!' },
          { m: "U'", fala: 'Gira o topo até a quina ficar em cima do lugar dela.' },
          { m: 'R', fala: 'Joga lá pra trás.' },
          { m: 'U', fala: 'Junta branco com branco.' },
          { m: "R'", fala: 'E volta todo mundo para baixo.' },
        ],
      },
      {
        id: 'errada', nome: 'Quina embaixo, mas errada', ver: 'A quina já está embaixo, no lugar, mas o branco não está virado para baixo.',
        lances: [
          { m: 'R', fala: 'Gira a direita para tirar a quina de lá.' },
          { m: 'U', fala: 'Gira o topo.' },
          { m: "R'", fala: 'Volta a direita. A quina subiu e virou janela.' },
          { m: "U'", fala: 'Gira o topo até a quina ficar em cima do lugar dela.' },
          { m: 'R', fala: 'Joga lá pra trás.' },
          { m: 'U', fala: 'Junta branco com branco.' },
          { m: "R'", fala: 'E volta todo mundo para baixo.' },
        ],
      },
    ],
  },
  {
    n: 4, titulo: 'Segunda camada', cubista: 'Segunda camada', cor: 'orange',
    objetivo: 'Colocar os 4 meios do andar do meio. No fim, os dois andares de baixo ficam prontos.',
    segurar: 'Cruz branca embaixo, amarelo em cima. A cor da peça de frente, alinhada com o centro.',
    dica: 'Procure no topo um meio sem amarelo. Gire o topo até a cor da frente dele bater com o centro: forma um T. A cor de cima diz para que lado ele vai.',
    peca: 'meio', repetir: 'Faça igual no seu cubo. Depois procure outro meio sem amarelo no topo e alinhe com a cor dele.',
    demo: {
      partes: [
        { legenda: '1º meio: entra para a direita', m: "U R U' R' U' F' U F" },
        { legenda: '2º meio: entra para a esquerda', m: "U' L' U L U F U' F'" },
        { legenda: 'Vira o cubo: os lugares vazios vêm para a frente', m: 'y2' },
        { legenda: '3º meio: para a direita', m: "U R U' R' U' F' U F" },
        { legenda: '4º meio: para a esquerda', m: "U' L' U L U F U' F'" },
      ],
    },
    meta: amareloEmCima, fim: amareloEmCima, fimDeBaixo: false,
    foco: p => isWhite(p) || meioDoMeio(p),
    pronto: (s, meta) => andaresIguais(s, meta, p => isWhite(p) || meioDoMeio(p)),
    casos: [
      {
        id: 'direita', nome: 'Vai entrar para a direita', ver: 'A cor da frente da peça bate com o centro, e a cor de cima é a do centro da direita.',
        lances: [
          { m: "U", fala: 'Jogo pro lado oposto: gira o topo para a esquerda.' },
          { m: "R", fala: 'Subo o lugar onde ela vai entrar: a direita sobe.' },
          { m: "U'", fala: 'Volto pra frente: gira o topo.' },
          { m: "R'", fala: 'Volto o lugar onde ela vai entrar.' },
          { m: "U'", fala: 'Formou o parzinho! Jogo o parzinho lá pra trás.' },
          { m: "F'", fala: 'Giro a fachada do prédio, subindo o espaço vazio.' },
          { m: "U", fala: 'Volto o parzinho pra frente.' },
          { m: "F", fala: 'E volto o trio pra base.' },
        ],
      },
      {
        id: 'esquerda', nome: 'Vai entrar para a esquerda', ver: 'A cor da frente da peça bate com o centro, e a cor de cima é a do centro da esquerda.',
        lances: [
          { m: "U'", fala: 'Jogo pro lado oposto: gira o topo para a direita.' },
          { m: "L'", fala: 'Subo o lugar onde ela vai entrar: a esquerda sobe.' },
          { m: "U", fala: 'Volto pra frente: gira o topo.' },
          { m: "L", fala: 'Volto o lugar onde ela vai entrar.' },
          { m: "U", fala: 'Formou o parzinho! Jogo o parzinho lá pra trás.' },
          { m: "F", fala: 'Giro a fachada do prédio, subindo o espaço vazio.' },
          { m: "U'", fala: 'Volto o parzinho pra frente.' },
          { m: "F'", fala: 'E volto o trio pra base.' },
        ],
      },
      {
        id: 'invertida', nome: 'Peça presa no meio', ver: 'A peça já está no andar do meio, mas invertida (ou no lugar errado). Não tem nenhum meio sem amarelo no topo.',
        lances: [
          { m: "U", fala: 'Para tirar a peça, faça a fórmula da direita. Jogo pro lado oposto.' },
          { m: "R", fala: 'Subo o lugar onde ela vai entrar: a direita sobe.' },
          { m: "U'", fala: 'Volto pra frente: gira o topo.' },
          { m: "R'", fala: 'Volto o lugar onde ela vai entrar.' },
          { m: "U'", fala: 'Formou o parzinho! Jogo o parzinho lá pra trás.' },
          { m: "F'", fala: 'Giro a fachada do prédio, subindo o espaço vazio.' },
          { m: "U", fala: 'Volto o parzinho pra frente.' },
          { m: "F", fala: 'E volto o trio pra base. A peça saiu e foi para o topo!' },
          { m: 'U2', fala: 'Gira o topo até a cor da frente bater com o centro: formou o T.' },
          { m: "U", fala: 'Jogo pro lado oposto: gira o topo para a esquerda.' },
          { m: "R", fala: 'Subo o lugar onde ela vai entrar: a direita sobe.' },
          { m: "U'", fala: 'Volto pra frente: gira o topo.' },
          { m: "R'", fala: 'Volto o lugar onde ela vai entrar.' },
          { m: "U'", fala: 'Formou o parzinho! Jogo o parzinho lá pra trás.' },
          { m: "F'", fala: 'Giro a fachada do prédio, subindo o espaço vazio.' },
          { m: "U", fala: 'Volto o parzinho pra frente.' },
          { m: "F", fala: 'E volto o trio pra base.' },
        ],
      },
    ],
  },
  {
    n: 5, titulo: 'Cruz amarela', cubista: 'Cruz amarela (OLL)', cor: 'yellow',
    objetivo: 'Formar uma cruz amarela no topo: os 4 meios com o amarelo para cima. As quinas ainda não importam.',
    segurar: 'Amarelo em cima. Os dois andares de baixo já estão prontos.',
    dica: 'É sempre a mesma fórmula. O que muda é como você posiciona o desenho do topo antes de fazer.',
    peca: 'cruz amarela', total: 1,
    pergunta: 'Que desenho os meios amarelos formam no topo do seu cubo? Olhe só os meios: as quinas não importam agora.',
    repetir: 'Faça igual no seu cubo, posicionando o desenho do mesmo jeito. Pronto: cruz amarela!',
    demo: {
      partes: [
        { legenda: 'Só o ponto: faz a fórmula', m: "F R U R' U' F'" },
        { legenda: 'Virou um L: gira o topo até as 12h e 9h', m: 'U2' },
        { legenda: 'Faz a fórmula de novo', m: "F R U R' U' F'" },
        { legenda: 'Virou linha deitada: mais uma vez', m: "F R U R' U' F'" },
      ],
    },
    meta: amareloEmCima, fim: amareloEmCima, fimDeBaixo: false,
    foco: p => isWhite(p) || meioDoMeio(p) || (isEdge(p) && p.stickers.some(t => t.color === 'D')),
    pronto: (s, meta) => andaresIguais(s, meta, p => isWhite(p) || meioDoMeio(p))
      && s.filter(p => isEdge(p) && p.stickers.some(t => t.color === 'D')).every(p => p.stickers.find(t => t.color === 'D')!.n[1] === 1),
    casos: [
      {
        id: 'linha', nome: 'Linha deitada', ver: 'Dois meios amarelos fazem uma linha de um lado ao outro, deitada na sua frente.',
        lances: [
          { m: "F", fala: 'Gira a frente no sentido do relógio.' },
          { m: "R", fala: 'A direita sobe.' },
          { m: "U", fala: 'Gira o topo.' },
          { m: "R'", fala: 'Volta a direita.' },
          { m: "U'", fala: 'Volta o topo.' },
          { m: "F'", fala: 'Volta a frente. Cruz amarela!' },
        ],
      },
      {
        id: 'emPe', nome: 'Linha em pé', ver: 'A linha amarela vai de você até lá atrás.',
        lances: [
          { m: 'U', fala: 'Gira o topo uma vez: a linha fica deitada.' },
          { m: "F", fala: 'Gira a frente no sentido do relógio.' },
          { m: "R", fala: 'A direita sobe.' },
          { m: "U", fala: 'Gira o topo.' },
          { m: "R'", fala: 'Volta a direita.' },
          { m: "U'", fala: 'Volta o topo.' },
          { m: "F'", fala: 'Volta a frente. Cruz amarela!' },
        ],
      },
      {
        id: 'L', nome: 'L nas 12h e 9h', ver: 'Dois meios amarelos formam um L, como ponteiros do relógio às 12h e 9h: lá atrás e à esquerda.',
        lances: [
          { m: "F", fala: 'Gira a frente no sentido do relógio.' },
          { m: "R", fala: 'A direita sobe.' },
          { m: "U", fala: 'Gira o topo.' },
          { m: "R'", fala: 'Volta a direita.' },
          { m: "U'", fala: 'Volta o topo.' },
          { m: "F'", fala: 'Volta a frente. Virou linha deitada!' },
          { m: "F", fala: 'Gira a frente no sentido do relógio.' },
          { m: "R", fala: 'A direita sobe.' },
          { m: "U", fala: 'Gira o topo.' },
          { m: "R'", fala: 'Volta a direita.' },
          { m: "U'", fala: 'Volta o topo.' },
          { m: "F'", fala: 'Volta a frente. Cruz amarela!' },
        ],
      },
      {
        id: 'Loutro', nome: 'L em outra posição', ver: 'Tem um L, mas apontando para outro lado (por exemplo, 3h e 6h).',
        lances: [
          { m: 'U2', fala: 'Gira o topo até o L apontar para as 12h e 9h.' },
          { m: "F", fala: 'Gira a frente no sentido do relógio.' },
          { m: "R", fala: 'A direita sobe.' },
          { m: "U", fala: 'Gira o topo.' },
          { m: "R'", fala: 'Volta a direita.' },
          { m: "U'", fala: 'Volta o topo.' },
          { m: "F'", fala: 'Volta a frente. Virou linha deitada!' },
          { m: "F", fala: 'Gira a frente no sentido do relógio.' },
          { m: "R", fala: 'A direita sobe.' },
          { m: "U", fala: 'Gira o topo.' },
          { m: "R'", fala: 'Volta a direita.' },
          { m: "U'", fala: 'Volta o topo.' },
          { m: "F'", fala: 'Volta a frente. Cruz amarela!' },
        ],
      },
      {
        id: 'ponto', nome: 'Só o ponto', ver: 'Só o centro amarelo. Nenhum meio tem amarelo para cima.',
        lances: [
          { m: "F", fala: 'Gira a frente no sentido do relógio.' },
          { m: "R", fala: 'A direita sobe.' },
          { m: "U", fala: 'Gira o topo.' },
          { m: "R'", fala: 'Volta a direita.' },
          { m: "U'", fala: 'Volta o topo.' },
          { m: "F'", fala: 'Volta a frente. Virou um L!' },
          { m: 'U2', fala: 'Gira o topo até o L apontar para as 12h e 9h.' },
          { m: "F", fala: 'Gira a frente no sentido do relógio.' },
          { m: "R", fala: 'A direita sobe.' },
          { m: "U", fala: 'Gira o topo.' },
          { m: "R'", fala: 'Volta a direita.' },
          { m: "U'", fala: 'Volta o topo.' },
          { m: "F'", fala: 'Volta a frente. Virou linha deitada!' },
          { m: "F", fala: 'Gira a frente no sentido do relógio.' },
          { m: "R", fala: 'A direita sobe.' },
          { m: "U", fala: 'Gira o topo.' },
          { m: "R'", fala: 'Volta a direita.' },
          { m: "U'", fala: 'Volta o topo.' },
          { m: "F'", fala: 'Volta a frente. Cruz amarela!' },
        ],
      },
    ],
  },
  {
    n: 6, titulo: 'Face amarela', cubista: 'Orientar as quinas (OLL · Sune)', cor: 'green',
    objetivo: 'Deixar o topo todo amarelo. As cores dos lados ainda podem ficar trocadas: isso é o passo 7.',
    segurar: 'Amarelo em cima. A cruz amarela já está pronta.',
    dica: 'O objetivo é cair no peixinho. Com o peixinho, a cabeça (a quina amarela) fica na frente, à esquerda. Sem quina amarela em cima: o amarelo da quina da frente-esquerda olhando para a esquerda. Com duas: olhando para você.',
    peca: 'face amarela', total: 1,
    pergunta: 'Quantas quinas mostram o amarelo para cima no seu cubo? E para onde olham as outras?',
    repetir: 'Faça igual no seu cubo. Pronto: topo todo amarelo!',
    demo: {
      partes: [
        { legenda: 'Duas quinas: o amarelo da frente-esquerda olha para você. Faz a fórmula', m: "R U R' U R U2 R'" },
        { legenda: 'Virou peixinho: gira até a cabeça ficar na frente, à esquerda', m: "U'" },
        { legenda: 'Faz a fórmula', m: "R U R' U R U2 R'" },
        { legenda: 'Outro peixinho: gira e faz de novo', m: 'U2' },
        { legenda: 'Mais uma vez', m: "R U R' U R U2 R'" },
      ],
    },
    meta: amareloEmCima, fim: () => applyAlg(amareloEmCima(), "F2 U L R' F2 L' R U F2"), fimDeBaixo: false,
    foco: () => true,
    pronto: (s, meta) => andaresIguais(s, meta, p => isWhite(p) || meioDoMeio(p))
      && s.filter(p => p.stickers.some(t => t.color === 'D')).every(p => p.stickers.find(t => t.color === 'D')!.n[1] === 1),
    casos: [
      {
        id: 'peixe', nome: 'Peixinho', ver: 'Só uma quina com amarelo em cima: é o peixinho. Ela fica na frente, à esquerda (a cabeça do peixe aponta para baixo, perto da sua mão esquerda), e a quina da direita mostra o amarelo para você.',
        lances: [
          { m: "R", fala: 'Sobe a direita.' },
          { m: "U", fala: 'Gira o topo.' },
          { m: "R'", fala: 'Volta a direita.' },
          { m: "U", fala: 'Gira o topo de novo.' },
          { m: "R", fala: 'Sobe a direita.' },
          { m: "U2", fala: 'Gira o topo duas vezes.' },
          { m: "R'", fala: 'Volta a direita. Face amarela pronta!' },
        ],
      },
      {
        id: 'peixe2', nome: 'Peixinho que se repete', ver: 'Peixinho na mesma posição, mas a quina da direita mostra o amarelo para a direita. Faz a fórmula e aparece outro peixinho: é só repetir.',
        completa: "R U R' U R U2 R' U2 R U R' U R U2 R'",
        depois: 'Faça igual no seu cubo. Virou peixinho: gire o topo até a cabeça (a quina amarela) ficar na frente, à esquerda, e veja a quina da direita. Se ela mostra o amarelo para você, é o Peixinho; se mostra para a direita, é o Peixinho que se repete.',
        lances: [
          { m: "R", fala: 'Sobe a direita.' },
          { m: "U", fala: 'Gira o topo.' },
          { m: "R'", fala: 'Volta a direita.' },
          { m: "U", fala: 'Gira o topo de novo.' },
          { m: "R", fala: 'Sobe a direita.' },
          { m: "U2", fala: 'Gira o topo duas vezes.' },
          { m: "R'", fala: 'Volta a direita. Virou peixinho!' },
        ],
      },
      {
        id: 'zeroPares', nome: 'Nenhuma quina: amarelos aos pares', ver: 'Nenhuma quina com amarelo em cima. Os amarelos das quinas olham para os lados: dois para a esquerda e dois para a direita.',
        completa: "R U R' U R U2 R' R U R' U R U2 R'",
        depois: 'Faça igual no seu cubo. Virou peixinho: gire o topo até a cabeça (a quina amarela) ficar na frente, à esquerda, e veja a quina da direita. Se ela mostra o amarelo para você, é o Peixinho; se mostra para a direita, é o Peixinho que se repete.',
        lances: [
          { m: "R", fala: 'Sobe a direita.' },
          { m: "U", fala: 'Gira o topo.' },
          { m: "R'", fala: 'Volta a direita.' },
          { m: "U", fala: 'Gira o topo de novo.' },
          { m: "R", fala: 'Sobe a direita.' },
          { m: "U2", fala: 'Gira o topo duas vezes.' },
          { m: "R'", fala: 'Volta a direita. Virou peixinho!' },
        ],
      },
      {
        id: 'zero', nome: 'Nenhuma quina: amarelos espalhados', ver: 'Nenhuma quina com amarelo em cima, e os amarelos olham para lados diferentes. Gire o topo até a quina da frente-esquerda mostrar o amarelo para a esquerda.',
        completa: "R U R' U R U2 R' U' R U R' U R U2 R'",
        depois: 'Faça igual no seu cubo. Virou peixinho: gire o topo até a cabeça (a quina amarela) ficar na frente, à esquerda, e veja a quina da direita. Se ela mostra o amarelo para você, é o Peixinho; se mostra para a direita, é o Peixinho que se repete.',
        lances: [
          { m: "R", fala: 'Sobe a direita.' },
          { m: "U", fala: 'Gira o topo.' },
          { m: "R'", fala: 'Volta a direita.' },
          { m: "U", fala: 'Gira o topo de novo.' },
          { m: "R", fala: 'Sobe a direita.' },
          { m: "U2", fala: 'Gira o topo duas vezes.' },
          { m: "R'", fala: 'Volta a direita. Virou peixinho!' },
        ],
      },
      {
        id: 'farois', nome: 'Duas quinas: faróis', ver: 'Duas quinas amarelas em cima, lá atrás. As da frente mostram o amarelo para você, como faróis de carro.',
        completa: "R U R' U R U2 R' U' R U R' U R U2 R' U2 R U R' U R U2 R'",
        depois: 'Faça igual no seu cubo. Virou peixinho: gire o topo até a cabeça (a quina amarela) ficar na frente, à esquerda, e veja a quina da direita. Se ela mostra o amarelo para você, é o Peixinho; se mostra para a direita, é o Peixinho que se repete.',
        lances: [
          { m: "R", fala: 'Sobe a direita.' },
          { m: "U", fala: 'Gira o topo.' },
          { m: "R'", fala: 'Volta a direita.' },
          { m: "U", fala: 'Gira o topo de novo.' },
          { m: "R", fala: 'Sobe a direita.' },
          { m: "U2", fala: 'Gira o topo duas vezes.' },
          { m: "R'", fala: 'Volta a direita. Virou peixinho!' },
        ],
      },
      {
        id: 'T', nome: 'Duas quinas: T', ver: 'Duas quinas amarelas em cima, lado a lado. Gire o topo até a quina da frente-esquerda mostrar o amarelo para você (a de trás mostra para trás).',
        completa: "R U R' U R U2 R' U R U R' U R U2 R' U2 R U R' U R U2 R'",
        depois: 'Faça igual no seu cubo. Virou peixinho: gire o topo até a cabeça (a quina amarela) ficar na frente, à esquerda, e veja a quina da direita. Se ela mostra o amarelo para você, é o Peixinho; se mostra para a direita, é o Peixinho que se repete.',
        lances: [
          { m: "R", fala: 'Sobe a direita.' },
          { m: "U", fala: 'Gira o topo.' },
          { m: "R'", fala: 'Volta a direita.' },
          { m: "U", fala: 'Gira o topo de novo.' },
          { m: "R", fala: 'Sobe a direita.' },
          { m: "U2", fala: 'Gira o topo duas vezes.' },
          { m: "R'", fala: 'Volta a direita. Virou peixinho!' },
        ],
      },
      {
        id: 'diagonal', nome: 'Duas quinas na diagonal', ver: 'Duas quinas amarelas em cima, uma em cada canto oposto. Gire o topo até a quina da frente-esquerda mostrar o amarelo para você.',
        completa: "R U R' U R U2 R' R U R' U R U2 R' U2 R U R' U R U2 R'",
        depois: 'Faça igual no seu cubo. Virou peixinho: gire o topo até a cabeça (a quina amarela) ficar na frente, à esquerda, e veja a quina da direita. Se ela mostra o amarelo para você, é o Peixinho; se mostra para a direita, é o Peixinho que se repete.',
        lances: [
          { m: "R", fala: 'Sobe a direita.' },
          { m: "U", fala: 'Gira o topo.' },
          { m: "R'", fala: 'Volta a direita.' },
          { m: "U", fala: 'Gira o topo de novo.' },
          { m: "R", fala: 'Sobe a direita.' },
          { m: "U2", fala: 'Gira o topo duas vezes.' },
          { m: "R'", fala: 'Volta a direita. Virou peixinho!' },
        ],
      },
    ],
  },
  {
    n: 7, titulo: 'Arrumar as quinas', cubista: 'Permutar as quinas (PLL · A-perm)', cor: 'red',
    objetivo: 'Colocar as 4 quinas amarelas no lugar certo entre elas: em cada lado, as duas quinas com a mesma cor. Os meios ainda podem ficar trocados.',
    segurar: 'Terremoto no prédio! Tombe o cubo: o amarelo fica de frente para você, como a fachada do prédio.',
    dica: 'Olhe os lados da face amarela. Procure um lado em que as duas quinas mostram a mesma cor. Esse lado vai para baixo, apoiado na mesa.',
    peca: 'quinas', total: 1,
    pergunta: 'Com o amarelo de frente, qual lado tem as duas quinas com a mesma cor?',
    repetir: 'Faça igual no seu cubo. Pronto: em cada lado, as duas quinas com a mesma cor!',
    demo: {
      partes: [
        { legenda: 'Terremoto no prédio: tomba o cubo, amarelo de frente', m: "x'" },
        { legenda: 'Nenhum lado igual: faz a fórmula', m: "R U' R D2 R' U R D2 R2" },
        { legenda: 'Apareceu um lado igual: gira o cubo até ele ficar embaixo', m: "z'" },
        { legenda: 'Faz a fórmula de novo', m: "R U' R D2 R' U R D2 R2" },
      ],
    },
    meta: quinasMeta, fim: quinasMeta, fimDeBaixo: false,
    foco: p => !(isEdge(p) && p.stickers.some(t => t.color === 'D')),
    pronto: s => emQuePasso(s) >= 8,
    casos: [
      {
        id: 'base', nome: 'Lado igual já embaixo', ver: 'Com o amarelo de frente, o lado de baixo tem as duas quinas com a mesma cor.',
        lances: [
          { m: "R", fala: 'A direita vai pra frente: sobe o trio amarelo pro telhado.' },
          { m: "U'", fala: 'Joga o trio lá pra trás: gira o topo.' },
          { m: "R", fala: 'Quebra o trio: direita de novo.' },
          { m: "D2", fala: 'Gira a base duas vezes: forma um L invertido.' },
          { m: "R'", fala: 'Esconde o trio branco lá pra baixo: volta a direita.' },
          { m: "U", fala: 'O trio amarelo volta pra direita: gira o topo.' },
          { m: "R", fala: 'Esconde o amarelo lá nas costas: direita.' },
          { m: "D2", fala: 'Gira a base duas vezes: quebra o L.' },
          { m: "R2", fala: 'Gira a direita duas vezes: joga as brancas lá pra trás. Quinas no lugar!' },
        ],
      },
      {
        id: 'dir', nome: 'Lado igual à direita', ver: 'Com o amarelo de frente, as duas quinas da direita mostram a mesma cor do lado.',
        lances: [
          { m: "z", fala: 'Gira o cubo inteiro, sempre com o amarelo de frente, até o lado com as duas quinas iguais ficar embaixo.' },
          { m: "R", fala: 'A direita vai pra frente: sobe o trio amarelo pro telhado.' },
          { m: "U'", fala: 'Joga o trio lá pra trás: gira o topo.' },
          { m: "R", fala: 'Quebra o trio: direita de novo.' },
          { m: "D2", fala: 'Gira a base duas vezes: forma um L invertido.' },
          { m: "R'", fala: 'Esconde o trio branco lá pra baixo: volta a direita.' },
          { m: "U", fala: 'O trio amarelo volta pra direita: gira o topo.' },
          { m: "R", fala: 'Esconde o amarelo lá nas costas: direita.' },
          { m: "D2", fala: 'Gira a base duas vezes: quebra o L.' },
          { m: "R2", fala: 'Gira a direita duas vezes: joga as brancas lá pra trás. Quinas no lugar!' },
        ],
      },
      {
        id: 'topo', nome: 'Lado igual em cima', ver: 'Com o amarelo de frente, as duas quinas de cima mostram a mesma cor.',
        lances: [
          { m: "z2", fala: 'Gira o cubo inteiro, sempre com o amarelo de frente, até o lado com as duas quinas iguais ficar embaixo.' },
          { m: "R", fala: 'A direita vai pra frente: sobe o trio amarelo pro telhado.' },
          { m: "U'", fala: 'Joga o trio lá pra trás: gira o topo.' },
          { m: "R", fala: 'Quebra o trio: direita de novo.' },
          { m: "D2", fala: 'Gira a base duas vezes: forma um L invertido.' },
          { m: "R'", fala: 'Esconde o trio branco lá pra baixo: volta a direita.' },
          { m: "U", fala: 'O trio amarelo volta pra direita: gira o topo.' },
          { m: "R", fala: 'Esconde o amarelo lá nas costas: direita.' },
          { m: "D2", fala: 'Gira a base duas vezes: quebra o L.' },
          { m: "R2", fala: 'Gira a direita duas vezes: joga as brancas lá pra trás. Quinas no lugar!' },
        ],
      },
      {
        id: 'esq', nome: 'Lado igual à esquerda', ver: 'Com o amarelo de frente, as duas quinas da esquerda mostram a mesma cor do lado.',
        lances: [
          { m: "z'", fala: 'Gira o cubo inteiro, sempre com o amarelo de frente, até o lado com as duas quinas iguais ficar embaixo.' },
          { m: "R", fala: 'A direita vai pra frente: sobe o trio amarelo pro telhado.' },
          { m: "U'", fala: 'Joga o trio lá pra trás: gira o topo.' },
          { m: "R", fala: 'Quebra o trio: direita de novo.' },
          { m: "D2", fala: 'Gira a base duas vezes: forma um L invertido.' },
          { m: "R'", fala: 'Esconde o trio branco lá pra baixo: volta a direita.' },
          { m: "U", fala: 'O trio amarelo volta pra direita: gira o topo.' },
          { m: "R", fala: 'Esconde o amarelo lá nas costas: direita.' },
          { m: "D2", fala: 'Gira a base duas vezes: quebra o L.' },
          { m: "R2", fala: 'Gira a direita duas vezes: joga as brancas lá pra trás. Quinas no lugar!' },
        ],
      },
      {
        id: 'nenhum', nome: 'Nenhum lado igual', ver: 'Nenhum lado tem as duas quinas com a mesma cor. Faça a fórmula em qualquer posição: vai aparecer um lado igual.',
        completa: "R U' R D2 R' U R D2 R2 z' R U' R D2 R' U R D2 R2",
        depois: 'Faça igual no seu cubo. Agora apareceu um lado com as duas quinas iguais: escolha a situação dele.',
        lances: [
          { m: "R", fala: 'A direita vai pra frente: sobe o trio amarelo pro telhado.' },
          { m: "U'", fala: 'Joga o trio lá pra trás: gira o topo.' },
          { m: "R", fala: 'Quebra o trio: direita de novo.' },
          { m: "D2", fala: 'Gira a base duas vezes: forma um L invertido.' },
          { m: "R'", fala: 'Esconde o trio branco lá pra baixo: volta a direita.' },
          { m: "U", fala: 'O trio amarelo volta pra direita: gira o topo.' },
          { m: "R", fala: 'Esconde o amarelo lá nas costas: direita.' },
          { m: "D2", fala: 'Gira a base duas vezes: quebra o L.' },
          { m: "R2", fala: 'Gira a direita duas vezes: joga as brancas lá pra trás. Olhe os lados: apareceu um lado com as duas quinas iguais!' },
        ],
      },
    ],
  },
  {
    n: 8, titulo: 'Arrumar os meios', cubista: 'Permutar os meios (PLL · U-perm)', cor: 'blue',
    objetivo: 'Colocar os 4 meios amarelos no lugar. É o último passo: no fim, o cubo está montado!',
    segurar: 'O amarelo volta para cima. O lado que já está todo pronto fica lá nas costas.',
    dica: 'Primeiro gire o topo até as quinas baterem com os centros dos lados. Depois procure um lado todo pronto (as três peças de cima com a cor do centro) e deixe ele atrás.',
    peca: 'meios', total: 1,
    pergunta: 'Com o amarelo em cima: as quinas batem com os centros? Tem algum lado todo pronto?',
    repetir: 'Faça igual no seu cubo. Gire o topo, se precisar, até tudo bater: cubo montado!',
    demo: {
      partes: [
        { legenda: 'O amarelo volta para cima', m: 'x' },
        { legenda: 'Gira o topo até as quinas baterem com os centros', m: 'U' },
        { legenda: 'Nenhum lado pronto: faz a fórmula', m: "F2 U L R' F2 L' R U F2" },
        { legenda: 'Apareceu um lado pronto: gira o cubo até ele ficar atrás', m: 'y' },
        { legenda: 'O meio da cor da frente está à direita: fórmula com o topo para a esquerda', m: "F2 U L R' F2 L' R U F2" },
      ],
    },
    meta: amareloEmCima, fim: amareloEmCima, fimDeBaixo: false,
    foco: () => true,
    pronto: s => emQuePasso(s) === 9,
    casos: [
      {
        id: 'alinhar', nome: 'As quinas não batem com os centros', ver: 'As quinas estão certas entre si, mas não combinam com as cores dos centros dos lados.',
        completa: "U F2 U L R' F2 L' R U F2",
        depois: 'Faça igual no seu cubo. Agora veja se algum lado ficou todo pronto e escolha a situação.',
        lances: [
          { m: 'U', fala: 'Gira o topo até as quinas baterem com os centros dos lados.' },
        ],
      },
      {
        id: 'virar', nome: 'Lado pronto em outro lugar', ver: 'Tem um lado todo pronto, mas ele não está atrás.',
        completa: "y F2 U L R' F2 L' R U F2",
        depois: 'Faça igual no seu cubo. Agora veja onde está o meio com a cor do centro da frente e escolha a situação: à direita ou à esquerda.',
        lances: [
          { m: 'y', fala: 'Gira o cubo inteiro até o lado pronto ficar lá nas costas.' },
        ],
      },
      {
        id: 'direita', nome: 'Lado pronto atrás, meio à direita', ver: 'O lado pronto está atrás. O meio com a cor do centro da frente está no topo, à direita.',
        lances: [
          { m: "F2", fala: 'Gira a frente duas vezes: o trio amarelo vai pra baixo.' },
          { m: "U", fala: 'Traz pra frente o meio com a cor da frente: gira o topo.' },
          { m: "L", fala: 'Desce o trio de um lado: a esquerda desce.' },
          { m: "R'", fala: 'E desce o trio do outro lado: a direita desce.' },
          { m: "F2", fala: 'Gira a frente duas vezes: troca os trios de lugar.' },
          { m: "L'", fala: 'Sobe o trio da esquerda.' },
          { m: "R", fala: 'E sobe o trio da direita.' },
          { m: "U", fala: 'Alinha a cor na frente: gira o topo.' },
          { m: "F2", fala: 'Gira a frente duas vezes. Cubo montado!' },
        ],
      },
      {
        id: 'esquerda', nome: 'Lado pronto atrás, meio à esquerda', ver: 'O lado pronto está atrás. O meio com a cor do centro da frente está no topo, à esquerda.',
        lances: [
          { m: "F2", fala: 'Gira a frente duas vezes: o trio amarelo vai pra baixo.' },
          { m: "U'", fala: 'Traz pra frente o meio com a cor da frente: gira o topo.' },
          { m: "L", fala: 'Desce o trio de um lado: a esquerda desce.' },
          { m: "R'", fala: 'E desce o trio do outro lado: a direita desce.' },
          { m: "F2", fala: 'Gira a frente duas vezes: troca os trios de lugar.' },
          { m: "L'", fala: 'Sobe o trio da esquerda.' },
          { m: "R", fala: 'E sobe o trio da direita.' },
          { m: "U'", fala: 'Alinha a cor na frente: gira o topo.' },
          { m: "F2", fala: 'Gira a frente duas vezes. Cubo montado!' },
        ],
      },
      {
        id: 'nenhum', nome: 'Nenhum lado pronto', ver: 'As quinas batem com os centros, mas nenhum lado está todo pronto. Faça a fórmula com qualquer lado atrás: vai aparecer um lado pronto.',
        completa: "F2 U L R' F2 L' R U F2 y F2 U L R' F2 L' R U F2",
        depois: 'Faça igual no seu cubo. Apareceu um lado todo pronto: escolha a situação dele.',
        lances: [
          { m: "F2", fala: 'Gira a frente duas vezes: o trio amarelo vai pra baixo.' },
          { m: "U", fala: 'Traz pra frente o meio com a cor da frente: gira o topo.' },
          { m: "L", fala: 'Desce o trio de um lado: a esquerda desce.' },
          { m: "R'", fala: 'E desce o trio do outro lado: a direita desce.' },
          { m: "F2", fala: 'Gira a frente duas vezes: troca os trios de lugar.' },
          { m: "L'", fala: 'Sobe o trio da esquerda.' },
          { m: "R", fala: 'E sobe o trio da direita.' },
          { m: "U", fala: 'Alinha a cor na frente: gira o topo.' },
          { m: "F2", fala: 'Gira a frente duas vezes. Olhe os lados: apareceu um lado todo pronto!' },
        ],
      },
    ],
  },
];

/** os passos que ainda vão chegar, só para a trilha */
export const PROXIMOS: { n: number; titulo: string; cor: Passo['cor'] }[] = [
];

export const movesOf = (c: Caso) => c.lances.map(l => l.m);
/** o cubo da situação: a meta com a fórmula desfeita */
export const setupOf = (p: Passo, c: Caso) => applyAlg(p.meta(), invertAlg(c.completa ? c.completa.split(' ') : movesOf(c)));

/** adesivos cinza: tudo o que não é do foco (os centros ficam sempre coloridos) */
export function greyKeys(s: CubeState, foco: (p: Piece) => boolean): string[] {
  const out: string[] = [];
  for (const p of s) {
    if (p.stickers.length === 1 || foco(p)) continue;
    for (const t of p.stickers) { const f = faceOfNormal(t.n); out.push(`${f}${faceletIndex(f, p.pos)}`); }
  }
  return out;
}
export { clone };

/** os 8 passos com título e cor, e se a aula já existe */
export const TODOS = [
  { n: 0, titulo: 'Conheça o cubo', cor: 'yellow' as Passo['cor'], pronto: true },
  ...PASSOS.map(p => ({ n: p.n, titulo: p.titulo, cor: p.cor, pronto: true })),
  ...PROXIMOS.map(p => ({ ...p, pronto: false })),
];

/** o cubo do começo da demonstração do passo */
export function demoInicio(p: Passo): CubeState {
  if (p.demo.inicio) return applyAlg(amareloEmCima(), p.demo.inicio);
  return applyAlg(p.fim(), invertAlg(p.demo.partes.flatMap(x => x.m.split(' '))));
}
