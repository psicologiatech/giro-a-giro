/**
 * Passo 1 · Margarida, em lições curtas: o que é, achar os meios brancos, e uma situação por vez.
 * Só usa os giros ensinados na fase 0: topo, direita e frente.
 */
import { PASSOS, amareloEmCima, setupOf } from '../aulas/aulas';
import { applyAlg, invertAlg, type CubeState, type Piece } from '../cube/model';
import { COR, ehMeio, ehQuina, meioBranco, petala, tem, tipoDaPeca, type Licao } from './tipos';

const P1 = PASSOS.find(p => p.n === 1)!;
const caso = (id: string) => P1.casos.find(c => c.id === id)!;
/** a margarida pronta: 4 meios brancos em volta do amarelo */
export const margarida = () => applyAlg(amareloEmCima(), 'F2 R2 B2 L2');
/** o cubo de uma situação do passo 1 */
const situacao = (id: string) => () => setupOf(P1, caso(id));
/** as peças que a situação mexe (as que piscam) */
function mexe(id: string): (p: Piece) => boolean {
  const ini = situacao(id)(), fim = margarida();
  const ids = new Set(ini.filter(p => meioBranco(p) && JSON.stringify(p.pos) !== JSON.stringify(fim.find(q => q.id === p.id)!.pos)).map(p => p.id));
  return p => ids.has(p.id);
}
/** a peça da situação: o meio branco que ainda não é pétala (fica igual mesmo depois de subir) */
function sozinha(id: string): (p: Piece) => boolean {
  const ids = new Set(situacao(id)().filter(p => meioBranco(p) && !petala(p)).map(p => p.id));
  return p => ids.has(p.id);
}
/** pisca enquanto ainda não virou pétala */
const aindaNao = (p: Piece) => meioBranco(p) && !petala(p);
const contaPetalas = (s: CubeState) => ({ n: s.filter(petala).length, total: 4, rotulo: 'pétalas' });

/** a margarida inteira no cubo da tela: cada parte junta uma pétala, usando só topo, direita e frente */
export const MARGARIDA_TODA = ['R', 'F', "U'", 'R', "U'", 'R', "U'", 'R', 'R'];
const embaralhadoParaMargarida = () => applyAlg(margarida(), invertAlg(MARGARIDA_TODA));
/** um cubo embaralhado de verdade, com o amarelo em cima, para procurar os meios brancos */
const embaralhado = () => applyAlg(amareloEmCima(), "R U F' U2 R' F R2 U' F2 R U2 F'");

const erroMeioBranco = (p: Piece) =>
  meioBranco(p) ? '' : tem(p, COR.branco) && ehQuina(p) ? 'Essa tem branco, mas tem *3 cores*: é uma quina. Procure uma de 2 cores.'
  : ehMeio(p) ? 'Esse é um meio, mas não tem branco.' : `Esse é ${tipoDaPeca(p)}. Procure um meio com branco.`;

export const PASSO1: Licao[] = [
  {
    id: 'p1-margarida', passo: 1, titulo: 'O que é a margarida', resumo: 'O objetivo do passo 1',
    telas: [
      {
        fala: 'No passo 1 a gente faz uma *margarida*. O miolo é o centro *amarelo*.', mood: 'oi', cubo: margarida, foco: meioBranco,
        destaque: p => p.stickers.length === 1 && p.stickers[0].color === COR.amarelo,
        tarefa: { tipo: 'ok', botao: 'Achei o miolo' },
      },
      {
        fala: 'As *pétalas* são os 4 *meios brancos*, em volta do miolo, com o branco *virado para cima*. Toque nas 4 pétalas.', mood: 'aponta',
        tarefa: { tipo: 'tocar', quantos: 4, alvo: petala, erro: () => 'Essa não é pétala. As pétalas são os meios brancos em volta do amarelo.' },
        acerto: 'Essa é a margarida! O cinza são as peças que ainda não importam.',
      },
      {
        fala: 'As pétalas são meios ou quinas?', mood: 'pensando',
        tarefa: { tipo: 'escolha', opcoes: [
          { texto: 'Meios (2 cores)', certo: true },
          { texto: 'Quinas (3 cores)', porque: 'As pétalas ficam no meio da beirada: são meios, com 2 cores.' },
        ] },
        acerto: 'Isso. Então, no passo 1, a gente só procura *meios brancos*.',
      },
    ],
  },
  {
    id: 'p1-achar', passo: 1, titulo: 'Achar os meios brancos', resumo: 'Procurar as pétalas no cubo bagunçado',
    telas: [
      {
        fala: 'Num cubo embaralhado, as peças brancas ficam espalhadas. Toque num *meio branco*: 2 cores, uma delas branca.', mood: 'pensando', cubo: embaralhado, foco: null,
        tarefa: { tipo: 'tocar', alvo: meioBranco, erro: erroMeioBranco },
        acerto: 'Achou um!',
      },
      {
        fala: 'Agora ache os *4*. Arraste o cubo para ver os outros lados.', mood: 'aponta',
        tarefa: { tipo: 'tocar', quantos: 4, alvo: meioBranco, erro: erroMeioBranco },
        acerto: 'Os 4 meios brancos! São eles que vão virar pétalas.',
      },
      {
        fala: 'No seu cubo, segure com o amarelo em cima e procure os 4 meios brancos.', mood: 'cubo',
        tarefa: { tipo: 'nocubo', feito: 'Achei no meu cubo' },
      },
    ],
  },
  {
    id: 'p1-primeira', passo: 1, titulo: 'A primeira pétala', resumo: 'O caso mais fácil: um giro só',
    telas: [
      {
        fala: 'Olhe o meio branco que pisca: está no *andar do meio*, com o branco olhando para a frente.', mood: 'aponta',
        cubo: situacao('meio'), foco: sozinha('meio'), destaque: aindaNao,
        tarefa: { tipo: 'ok', botao: 'Estou vendo' },
      },
      {
        fala: 'Basta um giro: *direita para cima*. Veja o branco subir e virar pétala.',
        tarefa: { tipo: 'ver', giros: ['R'], botao: 'Vi!' },
      },
      {
        fala: 'Sua vez: *direita para cima*.', cubo: situacao('meio'), destaque: aindaNao,
        tarefa: { tipo: 'girar', giros: ['R'] },
        acerto: 'Primeira pétala!',
      },
      {
        fala: 'Para onde o branco ficou virado?', mood: 'pensando',
        tarefa: { tipo: 'escolha', opcoes: [
          { texto: 'Para cima, em volta do amarelo', certo: true },
          { texto: 'Para a frente', porque: 'Olhe o topo: o branco ficou para cima, ao lado do amarelo.' },
        ] },
        acerto: 'Isso é uma pétala: branco para cima, em volta do amarelo.',
      },
    ],
  },
  {
    id: 'p1-limpar', passo: 1, titulo: 'Não amasse a pétala', resumo: 'Girar o topo antes de subir',
    telas: [
      {
        fala: 'Aqui tem um problema: *bem em cima* de onde a peça vai subir, já tem uma pétala.', mood: 'hmm',
        cubo: situacao('limpar'), foco: meioBranco, destaque: mexe('limpar'),
        tarefa: { tipo: 'ok', botao: 'Estou vendo' },
      },
      {
        fala: 'Se você subir a direita agora, o que acontece com a pétala de cima?', mood: 'pensando',
        tarefa: { tipo: 'escolha', seta: 'R', opcoes: [
          { texto: 'Ela sai do topo e se perde', certo: true },
          { texto: 'Nada, ela fica no lugar', porque: 'A camada da direita inteira gira, e a pétala de cima vai junto.' },
        ] },
        acerto: 'Exato. Uma pétala amassaria a outra.',
      },
      {
        fala: 'Por isso, primeiro *gira o topo* para tirar a pétala do caminho. Depois sobe.', mood: 'aponta',
        tarefa: { tipo: 'ver', giros: ['U', 'R'], botao: 'Entendi' },
      },
      {
        fala: 'Sua vez: *topo para a esquerda*, depois *direita para cima*.', cubo: situacao('limpar'), destaque: mexe('limpar'),
        tarefa: { tipo: 'girar', giros: ['U', 'R'] },
        acerto: 'Duas pétalas, nenhuma amassada.',
      },
    ],
  },
  {
    id: 'p1-base', passo: 1, titulo: 'Peça lá embaixo', resumo: 'Subir uma peça que está na base',
    telas: [
      {
        fala: 'Esta peça está *embaixo*, com o branco olhando para a mesa. Olhe por baixo do cubo.', mood: 'aponta',
        cubo: situacao('base'), foco: sozinha('base'), destaque: aindaNao, base: true,
        tarefa: { tipo: 'ok', botao: 'Estou vendo' },
      },
      {
        fala: 'Para ela subir tudo, gira a direita *duas vezes*.',
        tarefa: { tipo: 'ver', giros: ['R', 'R'], botao: 'Vi!' },
      },
      {
        fala: 'Sua vez: *direita para cima*, duas vezes.', cubo: situacao('base'), destaque: aindaNao,
        tarefa: { tipo: 'girar', giros: ['R', 'R'] },
        acerto: 'Subiu tudo!',
      },
      {
        fala: 'E se, em cima dela, já tivesse uma pétala? O que fazer antes?', mood: 'pensando',
        tarefa: { tipo: 'escolha', opcoes: [
          { texto: 'Girar o topo para limpar o espaço', certo: true },
          { texto: 'Subir assim mesmo', porque: 'Aí a pétala de cima seria amassada. Primeiro limpa o espaço girando o topo.' },
        ] },
        acerto: 'Isso. Antes de subir, sempre olhe o topo.',
      },
    ],
  },
  {
    id: 'p1-deitada', passo: 1, titulo: 'Branco de lado', resumo: 'Quando o branco olha para a frente',
    telas: [
      {
        fala: 'Esta peça está *no topo*, mas o branco olha para a *frente*, não para cima. Ainda não é pétala.', mood: 'hmm',
        cubo: situacao('deitada'), foco: meioBranco, destaque: aindaNao,
        tarefa: { tipo: 'ok', botao: 'Estou vendo' },
      },
      {
        fala: 'Primeiro, *frente no sentido do relógio*: a peça desce para o andar do meio.', mood: 'aponta',
        tarefa: { tipo: 'ver', giros: ['F'], botao: 'Vi!' },
      },
      {
        fala: 'Agora a peça ficou no andar do meio. Já viu essa situação: o que fazer?', mood: 'pensando',
        tarefa: { tipo: 'escolha', opcoes: [
          { texto: 'Limpar o espaço e subir a direita', certo: true },
          { texto: 'Girar a frente de novo', porque: 'Girar a frente de novo leva a peça para baixo. Agora é igual à primeira pétala: limpa o espaço e sobe.' },
        ] },
        acerto: 'Isso! Virou uma situação que você já conhece.',
      },
      {
        fala: 'Sua vez, do começo: *frente no sentido do relógio*, *topo para a direita*, *direita para cima*.', cubo: situacao('deitada'), destaque: aindaNao,
        tarefa: { tipo: 'girar', giros: ['F', "U'", 'R'] },
        acerto: 'Pétala no lugar!',
      },
    ],
  },
  {
    id: 'p1-toda', passo: 1, titulo: 'A margarida inteira', resumo: 'As 4 pétalas, do começo ao fim',
    telas: [
      {
        fala: 'Agora a margarida inteira, uma pétala de cada vez. Siga a seta e olhe o contador.', mood: 'aponta',
        cubo: embaralhadoParaMargarida, foco: meioBranco, contador: contaPetalas,
        tarefa: { tipo: 'girar', giros: MARGARIDA_TODA },
        acerto: 'Margarida completa! As 4 pétalas em volta do amarelo.',
      },
      {
        fala: 'Agora no seu cubo. Ache um meio branco que ainda não é pétala e me diga onde ele está.', mood: 'cubo',
        tarefa: { tipo: 'missao', passo: 1, total: 4, peca: 'pétala' },
        acerto: 'Passo 1 completo!',
      },
    ],
  },
];
