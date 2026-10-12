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

A maioria dos tutoriais mostra um cubo de exemplo e pede que o seu fique igual. Quase nunca fica, e a pessoa trava. O Giro a Giro faz o contrário: você mostra o seu cubo pela câmera e o app ensina a partir dele, mostrando o próximo giro com uma seta no próprio cubo.

## O que já funciona

- **Meu cubo**: a câmera lê as 6 faces do seu cubo, com uma grade na tela; você confere e corrige as cores com um toque. Sem câmera, dá para pintar tocando. O app confere se as cores formam um cubo possível.
- **Montar meu cubo**: depois de ler o seu cubo, o Pingo guia a montagem pelo método das camadas, um giro por vez, com a seta no 3D. Tem "Ver de novo", "Voltar", conferência ao fim de cada etapa e "Errei um giro" (a tela imita o engano e ensina a desfazer). O progresso fica salvo.
- Cubo 3D que você gira arrastando as faces com o dedo
- Modo Brincar: embaralhar, desfazer, arrumar e comemoração ao montar
- Pontos, nível e sequência de dias, guardados no aparelho
- App instalável (PWA) e publicação automática no GitHub Pages

## O que vem a seguir, por prioridade

1. **Fases da trilha**: notação, cruz branca, cantos, segunda camada e última camada
2. **Mascote e recompensas** em mais momentos do jogo
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
- `src/screens/`: as telas Trilha, Meu cubo e Brincar.
- `src/progress.ts`: pontos e sequência de dias.
