# WinXadrez

## Apresentacao

O WinXadrez e um aplicativo mobile de xadrez desenvolvido com Expo e React Native.
Ele permite jogar partidas contra bots, disputar partidas locais entre dois jogadores
e praticar diferentes recursos de treinamento em uma interface organizada por perfis,
ranking, niveis e progresso.

O projeto foi criado para reunir jogo, aprendizado e acompanhamento de resultados em
uma unica experiencia local. Os dados do jogador e as preferencias sao armazenados no
dispositivo com SQLite por meio da biblioteca `expo-sqlite`.

## Objetivo

O objetivo do WinXadrez e proporcionar uma experiencia pratica de estudo e pratica do
xadrez, adequada para iniciantes e jogadores com conhecimento basico ou intermediario.

O aplicativo busca oferecer:

- partidas contra adversarios automatizados em diferentes dificuldades;
- partidas locais entre dois participantes no mesmo dispositivo;
- acompanhamento de vitorias, derrotas, empates e pontuacao;
- progressao por niveis e divisoes;
- acesso a tutorial, aberturas, puzzles e conquistas;
- persistencia local dos dados e configuracoes;
- uma interface responsavel por temas claro e escuro.

## Funcionalidades

### Disponiveis no aplicativo

- criacao e atualizacao de um perfil local;
- partidas contra bot com niveis Facil, Medio e Dificil;
- partidas locais para dois jogadores no mesmo dispositivo;
- controle de tempo durante partidas com bot ou PvP;
- historico das partidas registradas;
- detalhes de cada partida;
- ranking local com mais de 1000 jogadores cadastrados;
- niveis gerais e por dificuldade;
- conquistas e indicadores de progresso;
- biblioteca de aberturas;
- tutorial com regras e movimentos;
- puzzles offline e puzzles obtidos da API do Lichess;
- cache do puzzle diario e progresso dos puzzles resolvidos;
- configuracoes de tema claro e escuro;
- limpeza de derrotas, cache e partida ativa;
- persistencia em banco SQLite local.

### Limites atuais

- o aplicativo nao oferece partidas online em servidores multijogador;
- o ranking integra o perfil local a bots gerados e armazenados no dispositivo;
- o modo contra amigo utiliza o mesmo celular para os dois jogadores;
- os puzzles diarios dependem da API do Lichess quando nao existe uma copia em cache;
- a disponibilidade das partidas, ranking e configuracoes depende do SQLite local;
- o projeto nao inclui sincronizacao de contas ou dados entre dispositivos.

## Tecnologias

- Expo 57;
- React 19;
- React Native 0.86;
- Expo Router para navegacao por arquivos;
- TypeScript em modo strict;
- `chess.js` para representacao e validacao das partidas;
- `expo-sqlite` para persistencia local;
- API publica de puzzles do Lichess;
- Ionicons por meio de `@expo/vector-icons`.

## Arquitetura

O projeto utiliza uma estrutura baseada em Expo Router e separa as telas da logica de
dados e dos componentes compartilhados:

- `app/`: rotas e layout principal da aplicacao;
- `src/screens/`: telas exibidas pelo aplicativo;
- `src/components/`: componentes reutilizaveis;
- `src/context/`: contextos compartilhados, como o tema;
- `src/database/`: inicializacao e operacoes do SQLite;
- `src/data/`: dados locais e geracao do ranking;
- `src/services/`: integracoes externas;
- `src/types/`: tipos TypeScript compartilhados;
- `assets/`: icones e imagens configuradas pelo Expo;
- `scripts/`: verificacoes automatizadas auxiliares.

## Requisitos

Antes de executar o projeto, prepare o ambiente com:

- Node.js e npm compativeis com o Expo SDK 57;
- Python 3 para executar a verificacao automatizada do SQLite;
- Git para obter e gerenciar o repositorio;
- Android Studio e um emulador Android, ou Expo Go em um dispositivo Android;
- macOS com Xcode para executar o app em simulador iOS;
- um navegador moderno para executar a versao web;
- conexao com a internet para carregar puzzles da API do Lichess.

O arquivo `package-lock.json` registra as dependencias do projeto JavaScript e deve
ser utilizado para restaurar as versoes definidas pelo lockfile.

## Instalacao

1. Clone o repositorio e entre na pasta do projeto:

```bash
git clone <url-do-repositorio>
cd WinXadrez
```

2. Instale as dependencias a partir do lockfile:

```bash
npm ci
```

3. Confirme que a dependencia de Expo CLI pode ser executada pelos scripts do npm:

```bash
npx expo --version
```

O comando `npm ci` remove uma instalacao anterior do diretório `node_modules` e cria
uma nova instalacao exatamente conforme `package-lock.json`. Caso as dependencias ainda
tenham sido restauradas, altere o manifesto ou o lockfile somente quando necessario.

## Execucao

Inicie o servidor de desenvolvimento Expo:

```bash
npm start
```

Abra a versao em uma plataforma especifica:

```bash
npm run android
npm run ios
npm run web
```

No terminal do Expo, use o codigo QR exibido para abrir o aplicativo em Expo Go ou
selecione o emulador/simulador configurado no ambiente.

Para validar a estrutura e a persistencia SQLite:

```bash
npm run test:sqlite
```

Para executar a verificacao TypeScript sem gerar arquivos:

```bash
npm run typecheck
```

## Como usar

1. Na primeira abertura, crie um perfil informando nome e nivel de conhecimento.
2. Na tela inicial, selecione **Partida** para jogar contra o bot ou **Jogar contra**
   para uma partida local entre dois jogadores.
3. Ao iniciar uma partida contra o bot, escolha a dificuldade Facil, Medio ou Dificil.
4. Movimente as peças tocando na peça e depois na casa de destino valida.
5. A partida salva pode ser retomada ou reiniciada quando o aplicativo a encontrar.
6. Use **Puzzle** para resolver desafios offline ou sincronizados com o Lichess.
7. Consulte **Aberturas** e **Aprenda a Jogar** para estudar regras e posicoes.
8. Acompanhe evolucao em **Niveis & Ligas**, **Conquistas**, **Historico** e **Ranking**.
9. Abra o **Perfil** para editar o nome e consultar estatisticas.
10. Em **Configuracoes**, altere o tema ou limpe cache e dados locais da partida.

## Banco de dados SQLite

O aplicativo cria e abre o banco local `winxadrez.db` por meio de `expo-sqlite`.
O modo WAL e habilitado para melhorar a persistencia das escritas. Os dados permanecem
no dispositivo e continuam disponiveis apos fechar e abrir o aplicativo.

### Estrutura principal

- `profile`: informa nome, nivel de conhecimento, pontos e contadores de partidas;
- `matches`: registra adversario, resultado, variacao de pontos, cor, dificuldade,
  quantidade de lances e data;
- `settings`: guarda preferencias e estados serializados em texto;
- `ranking_players`: armazena jogadores humanos e bots, pontos, resultados e posicao;
- indices: aceleram o ranking por pontos e garantem somente um perfil local.

Dados estruturados em JSON, como partida ativa, cache de puzzle diario e progresso de
puzzles, sao armazenados como texto na tabela `settings`. Antes da leitura, o aplicativo
valida os campos esperados e rejeita dados malformados.

A versao atual da estrutura e registrada em `settings.database_schema_version` e no
`PRAGMA user_version` do banco. A verificacao automatizada esta em `scripts/verify_sqlite.py`
e pode ser executada por `npm run test:sqlite`.

## Créditos

O WinXadrez utiliza recursos e bibliotecas de:

- Expo e React Native;
- `chess.js`;
- Expo SQLite;
- API pública de puzzles do Lichess;
- Ionicons, disponibilizados por `@expo/vector-icons`.

O projeto não possui uma lista oficial de autores cadastrada nesta documentação.
Dados adicionais devem ser definidos pelo responsável pelo repositório.

## Licença

Este repositório inclui um arquivo `LICENSE`, mas o conteúdo atual corresponde à
licença MIT da base Expo/650 Industries. Ele não identifica uma licença própria
autorizada para o WinXadrez. Antes de distribuir o projeto, o responsável deve
confirmar os direitos autorais e aplicar uma licença compatível com o código e os
recursos utilizados.
