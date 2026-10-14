/**
 * Passos 2 a 8 em lições curtas, para fazer tudo no cubo da tela:
 *  1. o objetivo do passo (ver e tocar nas peças que importam)
 *  2. gestos novos, quando o passo precisa (cubo inteiro, esquerda, letras, base, tombar)
 *  3. uma lição por situação: olhar → ver o Pingo fazer → fazer → repetir
 *  4. "Qual é a situação?": reconhecer pelo desenho do cubo
 *  5. o passo inteiro na tela, do começo ao fim (e, se quiser, no seu cubo)
 */
import { PASSOS, amareloEmCima, demoInicio, setupOf, type Caso, type Passo } from '../aulas/aulas';
import { applyAlg, type CubeState, type Piece } from '../cube/model';
import { COR, ehMeio, ehQuina, meioBranco, tem, type Licao, type Tela } from './tipos';
import { margarida } from './passo1';

const P = (n: number) => PASSOS.find(p => p.n === n)!;
const caso = (n: number, id: string) => P(n).casos.find(c => c.id === id)!;
const montado = amareloEmCima;
const meioDoMeio = (p: Piece) => ehMeio(p) && !tem(p, COR.branco) && !tem(p, COR.amarelo);
const quinaBranca = (p: Piece) => ehQuina(p) && tem(p, COR.branco);
const quinaAmarela = (p: Piece) => ehQuina(p) && tem(p, COR.amarelo);
const amareloPraCima = (p: Piece) => p.stickers.some(t => t.color === COR.amarelo && t.n[1] === 1);
const mesmo = (a: Piece, b: Piece) => JSON.stringify(a.pos) === JSON.stringify(b.pos) && a.stickers.every(t => b.stickers.some(u => u.color === t.color && JSON.stringify(u.n) === JSON.stringify(t.n)));

/** como reconhecer cada situação, em uma frase curta */
const OLHAR: Record<string, string> = {
  '2.bate': 'O meio branco da frente tem a outra cor *igual ao centro da frente*. Já pode descer.',
  '2.girar': 'A outra cor do meio branco *não bate* com o centro da frente. Primeiro gira o topo.',
  '2.oposto': 'A outra cor do meio branco é a do centro *de trás*: o topo gira duas vezes.',
  '3.direita': 'A quina está em cima, com o branco olhando para a *direita*: é a *janela à direita*.',
  '3.esquerda': 'Agora o branco da quina olha para a *esquerda*: *janela à esquerda*.',
  '3.telhado': 'O branco da quina olha *para cima*: *janela no telhado*. Primeiro ela vira janela.',
  '3.errada': 'A quina já está *embaixo*, mas torta. Primeiro ela sobe e vira janela.',
  '4.direita': 'No topo, um meio sem amarelo forma um *T* com o centro da frente. A cor de cima é a da *direita*.',
  '4.esquerda': 'Mesmo *T*, mas a cor de cima do meio é a do centro da *esquerda*.',
  '4.invertida': 'O meio está *preso* no andar do meio, virado. Primeiro ele sai para o topo.',
  '5.linha': 'No topo, os amarelos formam uma *linha deitada*, de um lado ao outro.',
  '5.emPe': 'A linha amarela está *em pé*, de você até lá atrás. Gira o topo para ela deitar.',
  '5.L': 'Os amarelos formam um *L* lá atrás e à esquerda, como ponteiros às 12h e 9h.',
  '5.Loutro': 'Tem um *L*, mas em outra posição. Gira o topo até ele ficar às 12h e 9h.',
  '5.ponto': 'Só o *centro* amarelo, nenhum meio. A fórmula transforma em L, e depois em linha.',
  '6.peixe': 'Uma quina amarela em cima: é o *peixinho*. A cabeça fica na frente, à esquerda.',
  '6.peixe2': 'Peixinho, mas a quina da direita mostra o amarelo *para a direita*. Vira outro peixinho.',
  '6.zeroPares': 'Nenhuma quina amarela em cima, e os amarelos dos lados estão *aos pares*.',
  '6.zero': 'Nenhuma quina amarela em cima, com os amarelos *espalhados* pelos lados.',
  '6.farois': 'Duas quinas amarelas atrás. As da frente mostram o amarelo para você: são os *faróis*.',
  '6.T': 'Duas quinas amarelas em cima, *lado a lado*.',
  '6.diagonal': 'Duas quinas amarelas em cantos *opostos*, na diagonal.',
  '7.base': 'Com o amarelo de frente, o lado *de baixo* tem as duas quinas com a mesma cor.',
  '7.dir': 'O lado com as duas quinas iguais está à *direita*. Primeiro gira o cubo inteiro.',
  '7.topo': 'O lado com as quinas iguais está *em cima*. O cubo gira até ele ficar embaixo.',
  '7.esq': 'O lado com as quinas iguais está à *esquerda*. O cubo gira até ele ir para baixo.',
  '7.nenhum': '*Nenhum* lado tem as duas quinas iguais. A fórmula faz aparecer um.',
  '8.alinhar': 'As quinas estão certas entre si, mas *não batem* com os centros dos lados. Só gira o topo.',
  '8.virar': 'Tem um lado *todo pronto*, mas ele não está atrás. Gira o cubo inteiro.',
  '8.direita': 'Lado pronto atrás. O meio com a cor da frente está no topo, à *direita*.',
  '8.esquerda': 'Lado pronto atrás. O meio com a cor da frente está no topo, à *esquerda*.',
  '8.nenhum': 'Nenhum lado está todo pronto. A fórmula faz aparecer um.',
};

/** as peças que a situação resolve (piscam): do foco, nos andares de baixo, ainda fora do lugar */
function alvoDoCaso(p: Passo, c: Caso): (x: Piece) => boolean {
  const ini = setupOf(p, c), meta = p.meta();
  const ids = new Set(meta.filter(m => p.foco(m) && m.pos[1] <= 0 && m.stickers.length > 1 && !mesmo(ini.find(x => x.id === m.id)!, m)).map(m => m.id));
  return x => ids.has(x.id);
}

/** uma lição por situação: olhar, ver, fazer e (se a fórmula não for enorme) repetir */
function licaoDoCaso(p: Passo, c: Caso): Licao {
  const cubo = () => setupOf(p, c);
  const giros = c.lances.map(l => l.m), falas = c.lances.map(l => l.fala);
  // quando uma fórmula termina e outra começa (a fala anuncia "Virou…" ou "saiu"), uma pausa para olhar o cubo
  const pausas = c.lances.flatMap((l, k) => {
    const m = l.fala.match(/(Virou[^.!]*[.!]|A peça saiu[^.!]*[.!])/);
    return m && k < c.lances.length - 1 ? [{ depois: k, texto: `Fórmula completa! ${m[1]} Olhe o cubo: agora vem a próxima parte, do começo.` }] : [];
  });
  const n = giros.length;
  const continua = !!c.depois;
  const telas: Tela[] = [
    {
      fala: OLHAR[`${p.n}.${c.id}`] ?? c.ver, mood: 'aponta', cubo, foco: p.foco, destaque: alvoDoCaso(p, c),
      tarefa: { tipo: 'ok', botao: 'Estou vendo' },
    },
    {
      fala: n === 1 ? 'Veja o Pingo fazer. É um giro só.' : `Veja o Pingo fazer. São ${n} giros, um de cada vez.`, mood: 'estudando',
      tarefa: { tipo: 'ver', giros, botao: 'Vi!' },
    },
    {
      fala: 'Sua vez. Siga a seta: embaixo aparece o que cada giro faz.', cubo, destaque: alvoDoCaso(p, c),
      tarefa: { tipo: 'girar', giros, falas, pausas },
      acerto: n >= 3 && n <= 10 ? 'Isso! Mais uma vez, para a mão começar a lembrar.' : continua ? 'Isso! O cubo virou outra situação: é só olhar de novo e seguir.' : 'Situação resolvida!',
    },
  ];
  if (n >= 3 && n <= 10) telas.push({
    fala: 'De novo, agora só com a seta. Repetir é o que faz a mão aprender.', cubo,
    tarefa: { tipo: 'girar', giros },
    acerto: continua ? 'Isso! O cubo virou outra situação: é só olhar de novo e seguir.' : 'Situação resolvida!',
  });
  return { id: `p${p.n}-${c.id}`, passo: p.n, titulo: c.nome, resumo: n === 1 ? '1 giro' : `${n} giros`, telas };
}

/** reconhecer a situação pelo desenho: até 3 perguntas, cada uma com 3 opções */
export function licaoQual(p: Passo): Licao {
  const cs = p.casos;
  const escolhidos = cs.length <= 3 ? cs : [cs[0], cs[Math.floor(cs.length / 2)], cs[cs.length - 1]];
  const telas: Tela[] = escolhidos.map((c, k) => {
    const outros = cs.filter(x => x !== c);
    const opcoes = [c, outros[k % outros.length], outros[(k + 1) % outros.length]]
      .filter((x, i, a) => a.indexOf(x) === i);
    // embaralha de um jeito fixo, para a certa não ficar sempre em primeiro
    const ordem = opcoes.map((x, i) => ({ x, i })).sort((a, b) => ((a.i + k) % 3) - ((b.i + k) % 3)).map(o => o.x);
    return {
      fala: k === 0 ? 'Olhe o cubo. Que situação é essa?' : 'E esta?', mood: 'pensando', cubo: () => setupOf(p, c), foco: p.foco,
      tarefa: { tipo: 'escolha', opcoes: ordem.map(x => x === c ? { texto: x.nome, certo: true } : { texto: x.nome, porque: `Não é essa. ${OLHAR[`${p.n}.${c.id}`] ?? c.ver}` }) },
      acerto: `Isso: ${c.nome.toLowerCase()}.`,
    };
  });
  return { id: `p${p.n}-qual`, passo: p.n, titulo: 'Qual é a situação?', resumo: 'Reconhecer pelo desenho', telas };
}

/** o passo inteiro no cubo da tela, e depois (se quiser) no seu cubo */
function licaoTodo(p: Passo): Licao {
  const giros: string[] = [], falas: string[] = [], pausas: { depois: number; texto: string }[] = [];
  p.demo.partes.forEach((parte, k) => {
    for (const m of parte.m.split(' ')) { giros.push(m); falas.push(parte.legenda); }
    const prox = p.demo.partes[k + 1];
    // entre uma parte e outra, uma pausa para olhar o cubo antes de seguir
    if (prox) pausas.push({ depois: giros.length - 1, texto: `Parte feita! Olhe o cubo antes de seguir. Agora: *${prox.legenda.charAt(0).toLowerCase() + prox.legenda.slice(1)}*.` });
  });
  return {
    id: `p${p.n}-todo`, passo: p.n, titulo: `O passo ${p.n} inteiro`, resumo: 'Do começo ao fim, na tela', telas: [
      {
        fala: 'Agora o passo inteiro, *sem a seta*: leia o giro pedido e faça. Se travar, ligue a seta ou toque em Me mostra.', mood: 'aponta',
        cubo: () => demoInicio(p), foco: p.foco,
        tarefa: { tipo: 'girar', giros, falas, semSeta: true, pausas },
        acerto: p.n === 8 ? 'Cubo montado! Você fez os 8 passos.' : `Passo ${p.n} completo na tela!`,
      },
      {
        fala: 'Tem um cubo aí? Escolha a imagem parecida com o seu e eu mostro o que fazer. Sem cubo, é só terminar.', mood: 'cubo',
        tarefa: { tipo: 'missao', passo: p.n },
        acerto: p.n === 8 ? 'Seu cubo está montado!' : `Passo ${p.n} pronto!`,
      },
    ],
  };
}

const quinasNoLugar = () => applyAlg(amareloEmCima(), "F2 U L R' F2 L' R U F2 x'");

/* ---------- os objetivos e os gestos novos, escritos à mão ---------- */
const INTRO: Record<number, Licao[]> = {
  2: [
    {
      id: 'p2-objetivo', passo: 2, titulo: 'A cruz branca', resumo: 'O objetivo do passo 2', telas: [
        { fala: 'No passo 2, as pétalas *descem* e formam uma *cruz branca* embaixo do cubo.', mood: 'oi', cubo: () => P(2).fim(), foco: meioBranco, base: true, tarefa: { tipo: 'ok', botao: 'Estou vendo' } },
        { fala: 'Toque nos 4 meios brancos da cruz.', base: true, tarefa: { tipo: 'tocar', quantos: 4, alvo: meioBranco, erro: () => 'Procure os meios brancos, embaixo do cubo.' }, acerto: 'A cruz branca!' },
        { fala: 'Cada meio branco tem outra cor. Embaixo de qual centro ela precisa ficar?', mood: 'pensando', base: true, tarefa: { tipo: 'escolha', opcoes: [
          { texto: 'Do centro da mesma cor', certo: true },
          { texto: 'De qualquer centro', porque: 'Olhe o cubo: o verde fica embaixo do centro verde, o vermelho embaixo do vermelho. Cada cor no seu lugar.' },
        ] }, acerto: 'Isso! A cor do lado combina com o centro.' },
      ],
    },
    {
      id: 'p2-inteiro', passo: 2, titulo: 'Girar o cubo inteiro', resumo: 'Trocar a cor da frente', telas: [
        { fala: 'Às vezes a gente gira o *cubo inteiro* na mão, sem mexer nenhuma camada. Veja.', mood: 'aponta', cubo: margarida, foco: null, tarefa: { tipo: 'ver', giros: ['y', "y'"], botao: 'Vi!' } },
        { fala: 'Sua vez: toque no botão para girar o cubo inteiro.', tarefa: { tipo: 'girar', giros: ['y'] }, acerto: 'Isso. Outra cor ficou de frente, e nada se desmontou.' },
        { fala: 'Quando você gira o cubo inteiro, o que muda?', mood: 'pensando', tarefa: { tipo: 'escolha', opcoes: [
          { texto: 'Só a cor que fica de frente', certo: true },
          { texto: 'As peças se misturam', porque: 'Nada se mistura: o cubo todo gira junto. Só muda o lado que fica olhando para você.' },
        ] }, acerto: 'Exato. É assim que a próxima cor vem para a frente.' },
        { fala: 'No seu cubo: gire o cubo inteiro para a esquerda, sempre com o amarelo em cima.', mood: 'cubo', tarefa: { tipo: 'nocubo', feito: 'Fiz no meu cubo' } },
      ],
    },
  ],
  3: [
    {
      id: 'p3-objetivo', passo: 3, titulo: 'A primeira camada', resumo: 'O objetivo do passo 3', telas: [
        { fala: 'No passo 3, as *quinas brancas* descem e completam a face branca: o primeiro andar fica pronto.', mood: 'oi', cubo: () => P(3).fim(), foco: p => quinaBranca(p) || meioBranco(p), base: true, tarefa: { tipo: 'ok', botao: 'Estou vendo' } },
        { fala: 'Toque nas 4 *quinas brancas*, nos cantos de baixo.', base: true, tarefa: { tipo: 'tocar', quantos: 4, alvo: quinaBranca, erro: p => ehMeio(p) ? 'Esse é um meio. As quinas ficam nos cantos.' : 'Procure as quinas com branco, embaixo.' }, acerto: 'As 4 quinas!' },
        { fala: 'A quina tem 3 cores. As outras duas precisam bater com…', mood: 'pensando', tarefa: { tipo: 'escolha', opcoes: [
          { texto: 'Os centros dos lados', certo: true },
          { texto: 'O centro amarelo', porque: 'O amarelo fica do outro lado. As cores da quina combinam com os centros que estão do lado dela.' },
        ] }, acerto: 'Isso: cada cor com o seu centro.' },
        { fala: 'Quando o branco da quina olha para o lado, a gente chama de *janela*. Esta é uma janela à direita.', mood: 'aponta', cubo: () => setupOf(P(3), caso(3, 'direita')), foco: quinaBranca, base: false, destaque: alvoDoCaso(P(3), caso(3, 'direita')), tarefa: { tipo: 'ok', botao: 'Entendi a janela' } },
      ],
    },
    {
      id: 'p3-gesto-esquerda', passo: 3, titulo: 'Girar a esquerda', resumo: 'O giro que faltava', telas: [
        { fala: 'A *esquerda* gira como a direita, só que do outro lado.', mood: 'aponta', cubo: montado, foco: null, tarefa: { tipo: 'ver', giros: ["L'", 'L'], botao: 'Vi como é' } },
        { fala: 'Sua vez: arraste a esquerda *para cima*.', tarefa: { tipo: 'girar', giros: ["L'"] }, acerto: 'Isso! *Esquerda para cima*.' },
        { fala: 'Agora *para baixo*, para voltar.', tarefa: { tipo: 'girar', giros: ['L'] }, acerto: 'De volta.' },
        { fala: 'Que giro a seta está mostrando?', mood: 'pensando', tarefa: { tipo: 'escolha', seta: "L'", opcoes: [
          { texto: 'Esquerda para cima', certo: true },
          { texto: 'Esquerda para baixo', porque: 'Olhe a ponta da seta: ela aponta para cima.' },
          { texto: 'Direita para cima', porque: 'A seta está do lado esquerdo do cubo.' },
        ] }, acerto: 'Isso. Agora você conhece topo, direita, frente e esquerda.' },
      ],
    },
  ],
  4: [
    {
      id: 'p4-objetivo', passo: 4, titulo: 'O andar do meio', resumo: 'O objetivo do passo 4', telas: [
        { fala: 'Agora o *andar do meio*: 4 meios que não têm branco nem amarelo.', mood: 'oi', cubo: () => P(4).fim(), foco: meioDoMeio, tarefa: { tipo: 'ok', botao: 'Estou vendo' } },
        { fala: 'Toque nos 4 meios do andar do meio. Arraste para ver os de trás.', tarefa: { tipo: 'tocar', quantos: 4, alvo: meioDoMeio, erro: () => 'Procure os meios do andar do meio: sem branco e sem amarelo.' }, acerto: 'Os 4! O segundo andar.' },
        { fala: 'Um meio que tem *amarelo* vai para o andar do meio?', mood: 'pensando', tarefa: { tipo: 'escolha', opcoes: [
          { texto: 'Não: ele fica no topo', certo: true },
          { texto: 'Sim', porque: 'O amarelo é do topo. Esse meio fica para os próximos passos.' },
        ] }, acerto: 'Isso. No topo, procure um meio *sem amarelo*.' },
        { fala: 'O truque é formar um *T*: a cor da frente do meio bate com o centro da frente.', mood: 'aponta', cubo: () => setupOf(P(4), caso(4, 'direita')), foco: P(4).foco, destaque: alvoDoCaso(P(4), caso(4, 'direita')), tarefa: { tipo: 'ok', botao: 'Achei o T' } },
      ],
    },
    {
      id: 'p4-letras', passo: 4, titulo: 'As letras', resumo: 'O apelido de cada giro', telas: [
        { fala: 'Daqui em diante as fórmulas crescem. Os cubistas dão uma *letra* para cada giro. Vamos conhecer.', mood: 'estudando', cubo: montado, foco: null, tarefa: { tipo: 'ok', botao: 'Bora' } },
        { fala: '*R* vem de *right*, direita em inglês. A seta mostra o R. Ele é a direita para…', mood: 'pensando', tarefa: { tipo: 'escolha', seta: 'R', opcoes: [
          { texto: 'Para cima', certo: true }, { texto: 'Para baixo', porque: 'Olhe a seta: no R, a direita sobe.' },
        ] }, acerto: 'Isso: *R* é direita para cima.' },
        { fala: '*U* vem de *up*, em cima. Então U é…', mood: 'pensando', tarefa: { tipo: 'escolha', seta: 'U', opcoes: [
          { texto: 'Girar o topo', certo: true }, { texto: 'Girar a frente', porque: 'Up é em cima: U é o topo.' },
        ] }, acerto: 'Isso: *U* é o topo para a esquerda.' },
        { fala: '*F* vem de *front*, frente. E *L* vem de *left*. L é…', mood: 'pensando', tarefa: { tipo: 'escolha', seta: 'L', opcoes: [
          { texto: 'Girar a esquerda', certo: true }, { texto: 'Girar a direita', porque: 'Left é esquerda. A direita é o R.' },
        ] }, acerto: 'Isso: *L* é a esquerda.' },
        { fala: 'O apóstrofo (*R\'*) quer dizer: o mesmo giro, *ao contrário*. Então R\' é…', mood: 'pensando', tarefa: { tipo: 'escolha', seta: "R'", opcoes: [
          { texto: 'Direita para baixo', certo: true }, { texto: 'Direita para cima', porque: 'R é para cima; R\' é o contrário, para baixo.' },
        ] }, acerto: 'Isso! E o *2* (como *U2*) quer dizer: duas vezes.' },
        { fala: 'Faça *R U R\'*: direita para cima, topo para a esquerda, direita para baixo.', cubo: montado,
          tarefa: { tipo: 'girar', giros: ['R', 'U', "R'"] }, acerto: 'Você leu e fez uma fórmula! A partir de agora, as letras aparecem junto com os gestos.' },
      ],
    },
  ],
  5: [
    {
      id: 'p5-objetivo', passo: 5, titulo: 'A cruz amarela', resumo: 'O objetivo do passo 5', telas: [
        { fala: 'Os dois andares de baixo estão prontos. Agora o *topo*: primeiro, uma *cruz amarela*.', mood: 'oi', cubo: () => P(5).fim(), foco: p => ehMeio(p) && tem(p, COR.amarelo), tarefa: { tipo: 'ok', botao: 'Estou vendo' } },
        { fala: 'Toque nos 4 meios amarelos da cruz.', tarefa: { tipo: 'tocar', quantos: 4, alvo: p => ehMeio(p) && amareloPraCima(p), erro: () => 'Procure os meios amarelos em volta do centro amarelo.' }, acerto: 'A cruz amarela!' },
        { fala: 'Na cruz amarela, as quinas já importam?', mood: 'pensando', tarefa: { tipo: 'escolha', opcoes: [
          { texto: 'Ainda não', certo: true }, { texto: 'Sim', porque: 'A cruz é feita só com os meios. As quinas ficam para o passo 6.' },
        ] }, acerto: 'Isso. E uma boa notícia: é sempre *a mesma fórmula*. Muda só o desenho antes de começar.' },
      ],
    },
  ],
  6: [
    {
      id: 'p6-objetivo', passo: 6, titulo: 'A face amarela', resumo: 'O objetivo do passo 6', telas: [
        { fala: 'Agora as *quinas*: o topo inteiro fica amarelo.', mood: 'oi', cubo: () => P(6).fim(), foco: p => tem(p, COR.amarelo), tarefa: { tipo: 'ok', botao: 'Estou vendo' } },
        { fala: 'Toque nas 4 quinas amarelas do topo.', tarefa: { tipo: 'tocar', quantos: 4, alvo: p => quinaAmarela(p) && amareloPraCima(p), erro: p => ehMeio(p) ? 'Esse é um meio. As quinas ficam nos cantos.' : 'Procure as quinas amarelas no topo.' }, acerto: 'O topo todo amarelo!' },
        { fala: 'Com só uma quina amarela em cima, o desenho parece um *peixinho*. Olhe a cabeça, que pisca.', mood: 'aponta', cubo: () => setupOf(P(6), caso(6, 'peixe')), foco: p => tem(p, COR.amarelo), destaque: p => quinaAmarela(p) && amareloPraCima(p), tarefa: { tipo: 'ok', botao: 'Achei o peixinho' } },
        { fala: 'Precisa de uma fórmula diferente para cada desenho?', mood: 'pensando', tarefa: { tipo: 'escolha', opcoes: [
          { texto: 'Não: é sempre a mesma', certo: true }, { texto: 'Sim, uma para cada', porque: 'É sempre a mesma fórmula. Muda só como você posiciona o topo antes.' },
        ] }, acerto: 'Isso. Os cubistas chamam essa fórmula de *Sune*.' },
      ],
    },
  ],
  7: [
    {
      id: 'p7-objetivo', passo: 7, titulo: 'Quinas no lugar', resumo: 'O objetivo do passo 7', telas: [
        { fala: 'O topo está amarelo, mas as quinas podem estar trocadas. Agora elas vão para o *lugar certo*.', mood: 'oi', cubo: () => P(6).fim(), foco: quinaAmarela, tarefa: { tipo: 'ok', botao: 'Estou vendo' } },
        { fala: 'Quinas no lugar: em cada lado, as duas quinas mostram a *mesma cor*, igual ao centro.', mood: 'aponta', cubo: quinasNoLugar, foco: quinaAmarela, tarefa: { tipo: 'ok', botao: 'Entendi' } },
      ],
    },
    {
      id: 'p7-tombar', passo: 7, titulo: 'Tombar e girar a base', resumo: 'Dois gestos novos', telas: [
        { fala: 'Neste passo o cubo *tomba*: o amarelo fica de frente para você, como a fachada de um prédio.', mood: 'aponta', cubo: () => P(6).fim(), foco: null, tarefa: { tipo: 'ver', giros: ["x'"], botao: 'Vi!' } },
        { fala: 'Sua vez: toque no botão para tombar o cubo.', cubo: () => P(6).fim(), tarefa: { tipo: 'girar', giros: ["x'"] }, acerto: 'Terremoto no prédio! O amarelo ficou de frente.' },
        { fala: 'E vamos girar a *base*, a camada de baixo, igual ao topo.', mood: 'aponta', tarefa: { tipo: 'ver', giros: ['D', "D'"], botao: 'Vi como é' } },
        { fala: 'Gire a base *duas vezes*. Na fórmula, isso é o *D2*.', tarefa: { tipo: 'girar', giros: ['D2'] }, acerto: 'Isso! D vem de *down*, embaixo.' },
      ],
    },
  ],
  8: [
    {
      id: 'p8-objetivo', passo: 8, titulo: 'O último passo', resumo: 'O objetivo do passo 8', telas: [
        { fala: 'Último passo! Os meios do topo vão para o lugar, e o cubo fica *montado*.', mood: 'festa', cubo: montado, foco: null, tarefa: { tipo: 'ok', botao: 'Bora!' } },
        { fala: 'Primeiro você procura um lado *todo pronto*: as três peças de cima com a cor do centro. Para onde ele vai?', mood: 'pensando', cubo: montado, tarefa: { tipo: 'escolha', opcoes: [
          { texto: 'Lá atrás, nas costas do cubo', certo: true },
          { texto: 'Para a frente', porque: 'O lado pronto fica atrás, para a fórmula mexer só nos outros três.' },
        ] }, acerto: 'Isso. O lado pronto fica nas costas.' },
      ],
    },
  ],
};

export const PASSOS_2A8: Licao[] = [2, 3, 4, 5, 6, 7, 8].flatMap(n => [
  ...(INTRO[n] ?? []),
  ...P(n).casos.map(c => licaoDoCaso(P(n), c)),
  licaoQual(P(n)),
  licaoTodo(P(n)),
]);
export type { CubeState };
