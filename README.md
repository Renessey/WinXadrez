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
