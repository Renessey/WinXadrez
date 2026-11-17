# Roteiro de apresentacao - WinXadrez

Duracao planejada: ate 5 minutos.

## 1. Introducao (0:00-0:35)

- Apresente o nome WinXadrez e informe que se trata de um aplicativo de xadrez
  desenvolvido com Expo, React Native e TypeScript.
- Explique que o projeto combina partidas contra bot, partida local entre amigos,
  puzzles, tutorial, ranking e persistencia local.

## 2. Abertura e perfil (0:35-1:00)

- Abra o aplicativo e mostre a tela inicial.
- Caso seja o primeiro acesso, crie um perfil com nome e nivel.
- Destaque que o cadastro identifica o jogador e permite acompanhar estatisticas.

## 3. Partida e movimentacao (1:00-2:10)

- Selecione a partida contra o bot.
- Escolha uma dificuldade e realize alguns lances legais.
- Mostre a selecao da casa de destino, o tempo da partida e a troca de turnos.
- Em seguida, finalize ou reinicie a partida para demonstrar o historico.
- Se houver tempo, alterne para o modo contra amigo e explique que o modo PvP
  local nao modifica o ranking.

## 4. Funcionalidades principais (2:10-3:20)

- Volte a tela inicial e passe rapidamente por Puzzle, Aberturas, Aprenda a Jogar,
  Conquistas e Niveis & Ligas.
- Resolva ou apenas selecione um puzzle e explique o cache diario e a origem
  Lichess ou offline.
- Abra o ranking e o perfil para demonstrar pontos, estatisticas e tema claro/escuro.

## 5. SQLite (3:20-4:15)

- Explique que o banco local se chama `winxadrez.db`.
- Liste as tabelas `profile`, `matches`, `settings` e `ranking_players`.
- Mostre uma configuracao ou partida registrada e explique que o dado permanece
  apos fechar e reabrir o aplicativo.
- Informe que a verificacao pode ser executada por `npm run test:sqlite`.

## 6. Encerramento (4:15-5:00)

- Resuma os principais recursos demonstrados.
- Destaque a persistencia SQLite, a praticidade local e os recursos educacionais.
- Agradeca a audiencia e finalize a apresentacao.
