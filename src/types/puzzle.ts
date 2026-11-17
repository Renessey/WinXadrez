import type { PieceSymbol, Square } from 'chess.js';

export interface PuzzleMove {
  from: Square;
  to: Square;
  promotion?: Exclude<PieceSymbol, 'k' | 'p'>;
}

export interface PuzzleSpec {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  level: string;
  objective: string;
  fen: string;
  hint: string;
  /** Sequência completa de lances (índices pares = jogador, ímpares = resposta do oponente) */
  solutionMoves: PuzzleMove[];
  /** Lance anterior do adversário para destacar no tabuleiro ao iniciar o desafio */
  initialLastMove?: { from: Square; to: Square };
  rating?: number;
  themes?: string[];
  source: 'offline' | 'lichess-daily' | 'lichess-random';
  playersLabel?: string;
}

export interface LichessPuzzleApiResponse {
  game: {
    id: string;
    perf?: {
      key: string;
      name: string;
    };
    rated?: boolean;
    players?: Array<{
      name: string;
      id?: string;
      color?: 'white' | 'black';
      rating?: number;
    }>;
    pgn: string;
    clock?: string;
  };
  puzzle: {
    id: string;
    rating: number;
    plays: number;
    solution: string[];
    themes: string[];
    fen?: string;
    lastMove?: string;
    initialPly: number;
  };
}

