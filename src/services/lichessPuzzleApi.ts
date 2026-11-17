import { Chess, type PieceSymbol, type Square } from 'chess.js';
import type { LichessPuzzleApiResponse, PuzzleMove, PuzzleSpec } from '../types/puzzle';

const LICHESS_API_BASE = 'https://lichess.org/api/puzzle';
const REQUEST_TIMEOUT_MS = 8000;

const THEME_LABELS: Record<string, string> = {
  mate: 'Xeque-mate',
  mateIn1: 'Mate em 1',
  mateIn2: 'Mate em 2',
  mateIn3: 'Mate em 3',
  mateIn4: 'Mate em 4',
  fork: 'Garfo',
  pin: 'Cravada',
  skewer: 'Espeto',
  discoveredAttack: 'Ataque descoberto',
  sacrifice: 'Sacrifício',
  deflection: 'Desvio',
  attraction: 'Atração',
  clearance: 'Abertura de linha',
  endgame: 'Final',
  middlegame: 'Meio-jogo',
  opening: 'Abertura',
  crushing: 'Vantagem decisiva',
  advantage: 'Vantagem',
  hangingPiece: 'Peça solta',
  trappedPiece: 'Peça presa',
  backRankMate: 'Mate do corredor',
  smotheredMate: 'Mate afogado',
  kingsideAttack: 'Ataque na ala do rei',
  queensideAttack: 'Ataque na ala da dama',
  promotion: 'Promoção',
  underPromotion: 'Subpromoção',
  short: 'Curto',
  long: 'Longo',
  veryLong: 'Sequência longa',
  oneMove: 'Lance único',
  quietMove: 'Lance silencioso',
  zugzwang: 'Zugzwang',
  intermezzo: 'Lance intermediário',
  doubleCheck: 'Xeque duplo',
};

const PIECE_NAMES_PT: Record<PieceSymbol, string> = {
  p: 'peão',
  n: 'cavalo',
  b: 'bispo',
  r: 'torre',
  q: 'dama',
  k: 'rei',
};

export function parseUciMove(uci: string): PuzzleMove {
  const from = uci.slice(0, 2) as Square;
  const to = uci.slice(2, 4) as Square;
  const promoChar = uci.length > 4 ? uci[4].toLowerCase() : undefined;
  const promotion =
    promoChar === 'q' || promoChar === 'r' || promoChar === 'b' || promoChar === 'n'
      ? (promoChar as Exclude<PieceSymbol, 'k' | 'p'>)
      : undefined;

  return promotion ? { from, to, promotion } : { from, to };
}

function translateThemes(themes: string[]): string[] {
  return themes.map((theme) => THEME_LABELS[theme] ?? theme);
}

function getLevelMeta(rating: number): { level: string; color: string } {
  if (rating < 1200) return { level: 'Fácil', color: '#81b64c' };
  if (rating < 1650) return { level: 'Intermediário', color: '#f5b858' };
  if (rating < 2050) return { level: 'Avançado', color: '#5fa8ff' };
  return { level: 'Mestre', color: '#9b8cff' };
}

function extractFenAndLastMove(data: LichessPuzzleApiResponse): {
  fen: string;
  initialLastMove?: { from: Square; to: Square };
} {
  if (data.puzzle.fen) {
    const lastMoveUci = data.puzzle.lastMove;
    const initialLastMove =
      lastMoveUci && lastMoveUci.length >= 4
        ? {
            from: lastMoveUci.slice(0, 2) as Square,
            to: lastMoveUci.slice(2, 4) as Square,
          }
        : undefined;

    return { fen: data.puzzle.fen, initialLastMove };
  }

  // Fallback: reconstrói a posição via PGN até initialPly caso o campo fen não venha
  const fullGame = new Chess();
  fullGame.loadPgn(data.game.pgn);
  const history = fullGame.history({ verbose: true });

  const puzzleGame = new Chess();
  const limit = Math.min(data.puzzle.initialPly + 1, history.length);
  let lastMove: { from: Square; to: Square } | undefined;

  for (let i = 0; i < limit; i++) {
    const move = puzzleGame.move(history[i].san);
    if (move) {
      lastMove = { from: move.from, to: move.to };
    }
  }

  return { fen: puzzleGame.fen(), initialLastMove: lastMove };
}

function mapLichessResponseToPuzzle(
  data: LichessPuzzleApiResponse,
  source: 'lichess-daily' | 'lichess-random'
): PuzzleSpec {
  const { fen, initialLastMove } = extractFenAndLastMove(data);
  const chess = new Chess(fen);
  const turnLabel = chess.turn() === 'w' ? 'Brancas jogam' : 'Pretas jogam';
  const solutionMoves = data.puzzle.solution.map(parseUciMove);
  const totalPlayerMoves = Math.ceil(solutionMoves.length / 2);

  const firstMove = solutionMoves[0];
  const pieceToMove = firstMove ? chess.get(firstMove.from) : undefined;
  const pieceHint = pieceToMove
    ? `Observe os lances com seu ${PIECE_NAMES_PT[pieceToMove.type]} em ${firstMove.from}.`
    : 'Procure uma ameaça tática direta contra o rei ou peças sem defesa.';

  const translatedThemes = translateThemes(data.puzzle.themes);
  const primaryTheme = translatedThemes[0] ?? 'Tática';
  const { level, color } = getLevelMeta(data.puzzle.rating);

  const whitePlayer = data.game.players?.find((p) => p.color === 'white');
  const blackPlayer = data.game.players?.find((p) => p.color === 'black');
  const playersLabel =
    whitePlayer && blackPlayer
      ? `${whitePlayer.name} (${whitePlayer.rating ?? '?'}) vs ${blackPlayer.name} (${blackPlayer.rating ?? '?'})`
      : undefined;

  const isDaily = source === 'lichess-daily';

  return {
    id: `lichess-${data.puzzle.id}`,
    title: isDaily ? 'Puzzle Diário • Lichess' : `Desafio Lichess #${data.puzzle.id}`,
    subtitle: `${primaryTheme} • ${data.puzzle.rating} ELO`,
    icon: isDaily ? 'calendar' : 'globe-outline',
    color,
    level,
    objective:
      totalPlayerMoves > 1
        ? `${turnLabel} e encontram a sequência vencedora (${totalPlayerMoves} lances).`
        : `${turnLabel} e encontram o melhor lance.`,
    fen,
    hint: `${pieceHint} Tema principal: ${translatedThemes.slice(0, 2).join(', ')}.`,
    solutionMoves,
    initialLastMove,
    rating: data.puzzle.rating,
    themes: translatedThemes,
    source,
    playersLabel,
  };
}

async function fetchLichessPuzzle(
  endpoint: string,
  source: 'lichess-daily' | 'lichess-random'
): Promise<PuzzleSpec> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${LICHESS_API_BASE}${endpoint}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Lichess API retornou status ${response.status}`);
    }

    const data = (await response.json()) as LichessPuzzleApiResponse;
    if (!data?.puzzle?.solution?.length) {
      throw new Error('Resposta inválida da API de puzzles do Lichess.');
    }

    return mapLichessResponseToPuzzle(data, source);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchDailyPuzzle(): Promise<PuzzleSpec> {
  return fetchLichessPuzzle('/daily', 'lichess-daily');
}

export async function fetchNextPuzzle(): Promise<PuzzleSpec> {
  return fetchLichessPuzzle('/next', 'lichess-random');
}

