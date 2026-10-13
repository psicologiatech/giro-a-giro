# Giro a Giro

Um jogo para aprender a montar o cubo mágico 3x3, um giro de cada vez. Feito em português, para qualquer pessoa.

Ilustrações do Pingo: geradas com o Gemini (Google), a partir da ideia e direção da Karol Alves.

**Jogar:** https://psicologiatech.github.io/giro-a-giro/

No celular, abra o link e escolha **Adicionar à tela inicial**. O app ganha ícone, abre em tela cheia e funciona sem internet.

## Para quem é

Para iniciantes: quem nunca montou um cubo mágico e quer conseguir pela primeira vez. O app acompanha três momentos:

1. **Conhecer** o cubo: as peças, as cores e os giros.
2. **Montar pela primeira vez**, uma etapa do método das camadas de cada vez.
3. **Treinar**, repetindo até que a memória muscular e a lógica de cada etapa fiquem assimiladas e a pessoa monte sem ajuda.

Não é um app de speedcubing. A meta é a primeira conquista e a autonomia depois dela.

## A ideia

Aprender a montar o cubo como numa boa aula: um passo de cada vez, vendo as situações que podem aparecer no seu cubo e o que fazer em cada uma, com uma linguagem visual (andares, janela, parzinho, peixinho, terremoto) e os nomes que os cubistas usam (Sune, A-perm, U-perm…).

## O que já funciona

- **Conheça o cubo**: peças (centros, meios, quinas), faces, andares e os giros, com o dedo
- **Trilha de 8 passos** pelo método de camadas: margarida, cruz branca, primeira camada, segunda camada, cruz amarela, face amarela (Sune), quinas (A-perm) e meios (U-perm)
  - em cada passo: objetivo, como segurar, o passo inteiro animado e as situações possíveis
  - em cada situação: o Pingo faz devagar, com uma fala em cada giro e as letras (dá para esconder); depois é a sua vez
  - uma peça (ou uma fórmula) de cada vez, conferindo no seu cubo de verdade; treino sem ajuda
  - todas as situações são testadas no cubo simulado
- **Meu cubo**: a câmera lê as 6 faces e diz em que passo o seu cubo está, levando direto para ele. Sem câmera, dá para pintar tocando.
- **Praticar** (abre depois do passo 8): cronômetro com embaralhamento, melhor tempo e média de 5; caderno de fórmulas com os nomes dos cubistas e a animação de cada uma; "Travei!" para voltar ao passo certo; cubo livre com giros do cubo inteiro (x, y, z)
- Pontos, sequência de dias e progresso guardados no aparelho
- App instalável (PWA) e publicação automática no GitHub Pages

## O que vem a seguir, por prioridade

1. **Montar sozinha, só com os nomes das fórmulas**
2. **Atalho para a câmera dentro de cada passo**
3. **App de loja** (Android e iOS) com Capacitor

## Para desenvolver

```bash
npm install
npm run dev      # abre em http://localhost:5173/giro-a-giro/
npm test         # testes do modelo do cubo
npm run build    # gera a versão de produção em dist/
```

Cada envio para a branch `main` roda os testes e publica o site pelo GitHub Actions.

## Como o código está organizado

- `src/cube/model.ts`: o cubo em números (posições e cores), sem desenho. É aqui que os algoritmos são testados.
- `src/cube/CubeScene.ts`: o desenho 3D (three.js), o arrastar com o dedo e a seta que mostra o próximo giro.
- `src/cube/fromFacelets.ts`: monta o cubo a partir das 54 cores e confere se ele é possível (cantos torcidos, meios virados, peças trocadas).
- `src/cube/solver.ts`: o método das camadas, em lances explicados. Testado com 3000 cubos embaralhados.
- `src/scan/`: câmera, leitura das cores (compara cada adesivo com os centros do próprio cubo, na mesma luz) e o cubo salvo no aparelho.
- `src/screens/`: as telas (Trilha, Conheça o cubo, Passos e situações, Meu cubo, Praticar, Cubo livre).
- `src/aulas/`: os 8 passos, as situações, o caderno de fórmulas e a detecção do passo do cubo.
- `src/progress.ts`: pontos e sequência de dias.
