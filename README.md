# Elementar

Tabela periódica interactiva para explorares os 118 elementos químicos. Feita para crianças, em português de Portugal: nomes como hidrogénio, oxigénio e azoto, uma ficha com o átomo desenhado, um desafio e medalhas que ficam guardadas no teu aparelho.

## O que podes fazer

- Ver a tabela completa, com os lantanídeos e os actinídeos nas filas de baixo.
- Tocar num elemento e ler o número, o nome, a massa, o estado a 20 °C, o ano da descoberta, uma curiosidade e onde ele aparece no dia a dia.
- Ver os eletrões a orbitar em camadas.
- Ouvir o nome, se o navegador tiver uma voz em português.
- Mudar a temperatura e ver quem fica sólido, líquido ou gás.
- Procurar, e destacar um grupo, um período ou uma família de cores.
- Jogar um desafio de 8 perguntas, com pontos, sequência e estrelas.
- Guardar as descobertas e as medalhas neste aparelho (ficam no `localStorage`).
- Voltar a abrir o site sem internet, depois da primeira visita.

## Novidades da versão 1.1

- Visual renovado: fundo claro e fresco, cabeçalho com separadores e anel de progresso, barra de pesquisa e filtros num só cartão.
- Painel de pré-visualização no espaço vazio da tabela: passa o rato num elemento e vês o nome, a massa e o estado.
- Ficha com o átomo ao lado, factos em cartões e botões para saltar para o elemento anterior e seguinte (ou setas ← →).
- Desafio com barra de pergunta a pergunta, pontos e sequência, e as teclas 1 a 4 para responder.
- Medalhas com ícone e barra de progresso («4 de 5»).

## Correr no teu computador

Precisas do Node.js 22 ou mais recente.

```bash
npm install
npm run dev
```

Abre [http://127.0.0.1:4317](http://127.0.0.1:4317).

## Testes

```bash
npm test
```

Os testes confirmam que há 118 elementos, que os números e os símbolos não se repetem, que a disposição da tabela está certa e que a pontuação do desafio soma bem.

## Construir

```bash
npm run build
npm run preview
```

A pasta `dist` é o site estático. Podes publicá-la em qualquer alojamento de ficheiros.

## Publicar no GitHub Pages

1. No repositório, em **Settings → Pages**, escolhe **GitHub Actions** como fonte.
2. O fluxo `.github/workflows/pages.yml` corre os testes, constrói o site e publica-o quando há uma alteração em `main`.
3. Se o site ficar em `https://utilizador.github.io/nome-do-repositorio/`, o fluxo usa essa pasta como base. Se o repositório se chamar `utilizador.github.io`, ou usares um domínio próprio na raiz, a base fica `/`.

## Notas sobre os dados

- Os nomes estão em português europeu, como nas escolas em Portugal: azoto, crómio, tungsténio, árgon, radão, oganésson.
- As massas atómicas estão arredondadas a 3 casas decimais. Quando não há uma massa padrão, o número entre parênteses é a massa do isótopo mais estável.
- As temperaturas de fusão e de ebulição são aproximadas, à pressão normal. No carbono e no arsénio, o aquecimento passa o sólido a gás. O hélio não congela à pressão normal. Nos elementos muito pesados, e também no ástato e no frâncio, muitos valores são previsões: a ficha diz-te quando é o caso.
- O estado «à temperatura da sala» usa 20 °C.

Alguns elementos são tóxicos ou radioativos. A aplicação é para aprender, não para fazer experiências sem um adulto.
