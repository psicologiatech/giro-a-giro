/**
 * Fase 0 · Conhecer o cubo. Uma ideia por tela, e cada tela só avança quando a pessoa faz algo.
 * O cubo começa montado, com o amarelo em cima (o jeito de segurar de toda a trilha).
 */
import { amareloEmCima } from '../aulas/aulas';
import type { Face } from '../cube/model';
import { COR, corNaFace, ehCentro, ehMeio, ehQuina, tipoDaPeca, type Licao } from './tipos';

const NOME_COR: Record<Face, string> = { U: 'branco', D: 'amarelo', F: 'verde', B: 'azul', R: 'vermelho', L: 'laranja' };
const NOME_FACE: Record<Face, string> = { U: 'o *topo*', D: 'a *base*', F: 'a *frente*', B: 'a face de *trás*', R: 'a *direita*', L: 'a *esquerda*' };
const montado = amareloEmCima;

export const FASE0: Licao[] = [
  {
    id: 'f0-oi', passo: 0, titulo: 'Oi, cubo!', resumo: 'As 6 faces e as 6 cores',
    telas: [
      {
        fala: 'Este é um cubo mágico *montado*. Repare: cada lado tem uma cor só.', mood: 'oi', cubo: montado,
        tarefa: { tipo: 'ok', botao: 'Estou vendo' },
      },
      {
        fala: 'Cada lado do cubo se chama *face*. Toque em qualquer quadradinho da face *verde*.', mood: 'aponta',
        tarefa: {
          tipo: 'tocar', alvo: (p, f) => corNaFace(p, f) === COR.verde,
          erro: (p, f) => `Esse quadradinho é ${NOME_COR[corNaFace(p, f)!]}. Procure o verde.`,
        },
        acerto: 'Isso! Essa é a face verde.',
      },
      {
        fala: 'Agora toque na face *laranja*.',
        tarefa: { tipo: 'tocar', alvo: (p, f) => corNaFace(p, f) === COR.laranja, erro: (p, f) => `Esse é ${NOME_COR[corNaFace(p, f)!]}. Procure o laranja.` },
        acerto: 'Muito bem.',
      },
      {
        fala: 'A face *azul* está escondida atrás. Arraste o dedo no cubo para o lado, para virar, e toque no azul.', mood: 'pensando',
        tarefa: { tipo: 'tocar', alvo: (p, f) => corNaFace(p, f) === COR.azul, erro: (p, f) => `Esse é ${NOME_COR[corNaFace(p, f)!]}. Vire mais um pouco: o azul fica atrás.` },
        acerto: 'Achou! Dá para virar o cubo da tela sempre que precisar ver os outros lados.',
      },
      {
        fala: 'Pergunta rápida: quantas faces tem o cubo?', mood: 'pensando',
        tarefa: { tipo: 'escolha', opcoes: [
          { texto: '4 faces', porque: 'Conte de novo: em cima, embaixo, frente, trás, direita e esquerda.' },
          { texto: '6 faces', certo: true },
          { texto: '9 faces', porque: '9 são os quadradinhos de uma face. Faces são os lados do cubo.' },
        ] },
        acerto: 'Isso: 6 faces, uma de cada cor.',
      },
    ],
  },
  {
    id: 'f0-centros', passo: 0, titulo: 'Os centros', resumo: 'A peça que nunca sai do lugar',
    telas: [
      {
        fala: 'Cada quadradinho é a pontinha de uma *peça*. Olhe: quando o topo gira, as peças andam juntas.', mood: 'aponta', cubo: montado,
        tarefa: { tipo: 'ver', giros: ['U', "U'"], botao: 'Entendi' },
      },
      {
        fala: 'O quadradinho do *meio* de cada face é o *centro*. Toque no centro *amarelo*.',
        tarefa: {
          tipo: 'tocar', alvo: p => ehCentro(p) && p.stickers[0].color === COR.amarelo,
          erro: p => ehCentro(p) ? 'Esse é um centro, mas de outra cor. Procure o amarelo, no topo.' : 'Quase! O centro é o quadradinho bem do meio da face.',
        },
        acerto: 'Esse é o centro amarelo.',
      },
      {
        fala: 'O centro *nunca sai do lugar*. Veja: as peças em volta andam, e o centro só gira parado.', mood: 'estudando',
        destaque: ehCentro,
        tarefa: { tipo: 'ver', giros: ['U', 'U', "R", "R'", "U'", "U'"], botao: 'Vi!' },
      },
      {
        fala: 'Então, quando o cubo estiver montado, de que cor fica a face que tem o *centro verde*?', mood: 'pensando',
        tarefa: { tipo: 'escolha', opcoes: [
          { texto: 'Verde', certo: true },
          { texto: 'Amarela', porque: 'O centro manda na cor da face. Centro verde, face verde.' },
          { texto: 'Depende de como embaralhou', porque: 'Os centros nunca saem do lugar, então a cor de cada face já está decidida pelo centro.' },
        ] },
        acerto: 'Isso! O centro diz a cor da face. É ele que guia a montagem.',
      },
    ],
  },
  {
    id: 'f0-pecas', passo: 0, titulo: 'Meios e quinas', resumo: 'As peças de 2 e de 3 cores',
    telas: [
      {
        fala: 'Algumas peças têm *2 cores*. Elas se chamam *meios*. Toque em um meio.', mood: 'aponta', cubo: montado,
        tarefa: { tipo: 'tocar', alvo: ehMeio, erro: p => `Esse é ${tipoDaPeca(p)}. O meio fica no meio da beirada, entre dois cantos.` },
        acerto: 'Isso, um meio: 2 cores.',
      },
      {
        fala: 'As peças dos *cantos* têm *3 cores*: são as *quinas*. Toque em uma quina.',
        tarefa: { tipo: 'tocar', alvo: ehQuina, erro: p => `Esse é ${tipoDaPeca(p)}. As quinas ficam nos cantos.` },
        acerto: 'Isso, uma quina: 3 cores.',
      },
      {
        fala: 'Em volta do centro amarelo tem *4 meios*. Toque nos 4.', mood: 'pensando',
        tarefa: {
          tipo: 'tocar', quantos: 4, alvo: p => ehMeio(p) && p.pos[1] === 1,
          erro: p => ehMeio(p) ? 'Esse é um meio, mas não está em volta do amarelo. Olhe o topo.' : `Esse é ${tipoDaPeca(p)}. Procure os meios em volta do centro amarelo.`,
        },
        acerto: 'Os 4! Guarde essa imagem: vai ser importante no passo 1.',
      },
      {
        fala: 'Uma peça com *branco e vermelho* é um…', mood: 'pensando',
        tarefa: { tipo: 'escolha', opcoes: [
          { texto: 'Meio', certo: true },
          { texto: 'Quina', porque: 'A quina tem 3 cores. Branco e vermelho são 2.' },
          { texto: 'Centro', porque: 'O centro tem uma cor só.' },
        ] },
        acerto: 'Isso! 1 cor: centro. 2 cores: meio. 3 cores: quina.',
      },
    ],
  },
  {
    id: 'f0-segurar', passo: 0, titulo: 'Como segurar', resumo: 'Amarelo em cima, e o nome de cada face',
    telas: [
      {
        fala: 'Para não se perder, a gente segura o cubo sempre do mesmo jeito: *amarelo em cima*.', mood: 'cubo', cubo: montado,
        destaque: p => ehCentro(p) && p.stickers[0].color === COR.amarelo,
        tarefa: { tipo: 'ok', botao: 'Amarelo em cima' },
      },
      {
        fala: 'O nome da face vem de *onde ela está*. Toque na face que está *de frente* para você.', mood: 'aponta',
        tarefa: { tipo: 'tocar', alvo: (_, f) => f === 'F', erro: (_, f) => `Aí é ${NOME_FACE[f]}. A frente é a face que olha para você.` },
        acerto: 'Essa é a frente.',
      },
      {
        fala: 'Agora toque na face da *direita*.',
        tarefa: { tipo: 'tocar', alvo: (_, f) => f === 'R', erro: (_, f) => `Aí é ${NOME_FACE[f]}. Procure a face do lado direito.` },
        acerto: 'Essa é a direita.',
      },
      {
        fala: 'E o *topo*? Toque nele.',
        tarefa: { tipo: 'tocar', alvo: (_, f) => f === 'U', erro: (_, f) => `Aí é ${NOME_FACE[f]}. O topo é a face de cima.` },
        acerto: 'Isso. Frente, direita e topo: são as faces que mais vamos girar.',
      },
      {
        fala: 'Se você virar o cubo inteiro, a frente continua sendo a mesma cor?', mood: 'pensando',
        tarefa: { tipo: 'escolha', opcoes: [
          { texto: 'Não: frente é a face que olha para mim', certo: true },
          { texto: 'Sim: a frente é sempre verde', porque: 'O nome vem de onde a face está. Se você virar o cubo, outra cor fica de frente.' },
        ] },
        acerto: 'Exato. Por isso a gente segura sempre igual: amarelo em cima.',
      },
      {
        fala: 'Tem um cubo aí? Pegue e segure com o *amarelo em cima*, olhando para a frente.', mood: 'oi',
        tarefa: { tipo: 'nocubo', feito: 'Estou segurando assim' },
      },
    ],
  },
  {
    id: 'f0-topo', passo: 0, titulo: 'Girar o topo', resumo: 'O primeiro giro',
    telas: [
      {
        fala: 'Agora vamos *girar*. O *topo* gira como a tampa de um pote: a camada de cima inteira.', mood: 'aponta', cubo: montado,
        tarefa: { tipo: 'ver', giros: ['U', "U'"], botao: 'Vi como é' },
      },
      {
        fala: 'Sua vez! Coloque o dedo na camada de cima e arraste para a *esquerda*. A seta rosa mostra o caminho.',
        tarefa: { tipo: 'girar', giros: ['U'] },
        acerto: 'Isso! *Topo para a esquerda*.',
      },
      {
        fala: 'Agora o contrário: arraste o topo para a *direita*.',
        tarefa: { tipo: 'girar', giros: ["U'"] },
        acerto: 'Voltou tudo para o lugar.',
      },
      {
        fala: 'Gire o topo para a *esquerda* duas vezes seguidas.',
        tarefa: { tipo: 'girar', giros: ['U', 'U'] },
        acerto: 'Duas vezes é meia volta. Viu como as cores trocaram de lado?',
      },
      {
        fala: 'No seu cubo, faça igual: topo para a esquerda, e depois para a direita.', mood: 'cubo',
        tarefa: { tipo: 'nocubo', feito: 'Fiz no meu cubo' },
      },
    ],
  },
  {
    id: 'f0-direita', passo: 0, titulo: 'Girar a direita', resumo: 'Para cima e para baixo',
    telas: [
      {
        fala: 'A face da *direita* gira para cima ou para baixo, como uma roda.', mood: 'aponta', cubo: montado,
        tarefa: { tipo: 'ver', giros: ['R', "R'"], botao: 'Vi como é' },
      },
      {
        fala: 'Sua vez: arraste a camada da direita *para cima*.',
        tarefa: { tipo: 'girar', giros: ['R'] },
        acerto: 'Isso! *Direita para cima*.',
      },
      {
        fala: 'Agora *para baixo*, para voltar.',
        tarefa: { tipo: 'girar', giros: ["R'"] },
        acerto: 'De volta ao lugar.',
      },
      {
        fala: 'Que giro a seta está mostrando?', mood: 'pensando',
        tarefa: { tipo: 'escolha', seta: 'R', opcoes: [
          { texto: 'Direita para cima', certo: true },
          { texto: 'Direita para baixo', porque: 'Olhe a ponta da seta: ela aponta para cima.' },
          { texto: 'Topo para a esquerda', porque: 'A seta está em volta da camada da direita, não do topo.' },
        ] },
        acerto: 'Isso. Seguir a seta é metade do caminho.',
      },
      {
        fala: 'No seu cubo: direita para cima, e depois para baixo.', mood: 'cubo',
        tarefa: { tipo: 'nocubo', feito: 'Fiz no meu cubo' },
      },
    ],
  },
  {
    id: 'f0-frente', passo: 0, titulo: 'Girar a frente', resumo: 'Como o ponteiro do relógio',
    telas: [
      {
        fala: 'A *frente* gira como o ponteiro do relógio, olhando para ela.', mood: 'aponta', cubo: montado,
        tarefa: { tipo: 'ver', giros: ['F', "F'"], botao: 'Vi como é' },
      },
      {
        fala: 'Sua vez: gire a frente *no sentido do relógio*. Siga a seta.',
        tarefa: { tipo: 'girar', giros: ['F'] },
        acerto: 'Isso! *Frente no sentido do relógio*.',
      },
      {
        fala: 'Agora *contra o relógio*, para voltar.',
        tarefa: { tipo: 'girar', giros: ["F'"] },
        acerto: 'Voltou.',
      },
      {
        fala: 'Que giro a seta está mostrando?', mood: 'pensando',
        tarefa: { tipo: 'escolha', seta: 'U', opcoes: [
          { texto: 'Frente no sentido do relógio', porque: 'A seta está em volta da camada de cima.' },
          { texto: 'Topo para a esquerda', certo: true },
          { texto: 'Direita para cima', porque: 'A seta está em volta da camada de cima, não da direita.' },
        ] },
        acerto: 'Você já conhece os 3 giros do passo 1: topo, direita e frente!',
      },
      {
        fala: 'Juntando tudo: faça *topo para a esquerda*, depois *direita para cima*, depois *frente no sentido do relógio*.', mood: 'pensando', cubo: montado,
        tarefa: { tipo: 'girar', giros: ['U', 'R', 'F'] },
        acerto: 'Três giros seguidos! Agora você já pode começar o passo 1.',
      },
    ],
  },
];
