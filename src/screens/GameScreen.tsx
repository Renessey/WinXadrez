import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  AppState,
  AppStateStatus,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Chess, Color, Move, PieceSymbol, Square } from 'chess.js';
import { RootStackParamList } from '../types/navigation';
import {
  clearActiveMatch,
  getActiveMatch,
  getProfile,
  getUserLevels,
  recordMatchResult,
  saveActiveMatch,
  UserLevelsSummary,
  UserProfile,
} from '../database/db';
import { useAppTheme } from '../context/ThemeContext';
import { cancelGameNotifications, notifyGameInProgress } from '../services/notifications';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const pieceSymbols: Record<Color, Record<string, string>> = {
  w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
  b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' },
};

const pieceValues: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

const initialPieceCounts: Record<Color, Record<string, number>> = {
  w: { p: 8, n: 2, b: 2, r: 2, q: 1 },
  b: { p: 8, n: 2, b: 2, r: 2, q: 1 },
};

type GameDifficulty = 'Fácil' | 'Médio' | 'Difícil';

// Memoized Square Cell for 60 FPS performance without re-rendering 64 squares every frame
interface CellProps {
  square: Square;
  isDark: boolean;
  squareSize: number;
  isSelected: boolean;
  isLastMoveSquare: boolean;
  isTarget: boolean;
  piece: { type: PieceSymbol; color: Color } | null;
  isCurrentlyMoving: boolean;
  onPress: (sq: Square) => void;
  colors: any;
}

const SquareCell = React.memo(function SquareCell({
  square,
  isDark,
  squareSize,
  isSelected,
  isLastMoveSquare,
  isTarget,
  piece,
  isCurrentlyMoving,
  onPress,
  colors,
}: CellProps) {
  return (
    <TouchableOpacity
      style={[
        styles.square,
        {
          width: squareSize,
          height: squareSize,
          backgroundColor: isDark ? colors.boardDark : colors.boardLight,
        },
        // Modern dark soft cyan highlight (No ugly yellow!)
        isLastMoveSquare && styles.modernLastMoveOverlay,
        isSelected && styles.modernSelectedSquareOverlay,
      ]}
      activeOpacity={0.88}
      onPress={() => onPress(square)}
    >
      {/* Target moves dots & capture rings */}
      {isTarget && !piece && <View style={styles.modernEmptyTargetDot} />}
      {isTarget && piece && (
        <View
          style={[
            styles.modernCaptureRing,
            { width: squareSize * 0.88, height: squareSize * 0.88 },
          ]}
        />
      )}

      {/* Piece Symbol */}
      {piece && !isCurrentlyMoving && (
        <Text
          style={[
            styles.pieceText,
            piece.color === 'b' ? styles.pieceBlack : styles.pieceWhite,
            { fontSize: Math.floor(squareSize * 0.74) },
          ]}
        >
          {pieceSymbols[piece.color][piece.type]}
        </Text>
      )}
    </TouchableOpacity>
  );
});

export default function GameScreen({ navigation }: Props) {
  const { colors, mode } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [levels, setLevels] = useState<UserLevelsSummary>(() => getUserLevels());

  const [game, setGame] = useState(() => new Chess());
  const [fen, setFen] = useState(game.fen());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [difficulty, setDifficulty] = useState<GameDifficulty>('Médio');
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  // Resume or Restart dialog modal state
  const [showResumeModal, setShowResumeModal] = useState(false);
  const pendingSavedMatchRef = useRef<any>(null);

  // Clocks: 2 minutes (120s) blitz clock
  const [whiteTime, setWhiteTime] = useState(120);
  const [blackTime, setBlackTime] = useState(120);

  // 60 FPS Native Piece Movement Animation
  const moveAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [animatingPiece, setAnimatingPiece] = useState<{
    piece: { type: PieceSymbol; color: Color };
    fromCol: number;
    fromRow: number;
    toCol: number;
    toRow: number;
  } | null>(null);

  // Match end modal state
  const [gameOverModal, setGameOverModal] = useState<{
    visible: boolean;
    title: string;
    description: string;
    isWin: boolean;
  }>({
    visible: false,
    title: '',
    description: '',
    isWin: false,
  });

  const matchRecordedRef = useRef(false);

  // Responsive board calculation to prevent any overflow or cutoffs
  const reservedVerticalSpace = insets.top + insets.bottom + 46 + 58 + 58 + 48 + 28;
  const maxBoardHeight = windowHeight - reservedVerticalSpace;
  const boardSize = Math.floor(Math.min(windowWidth - 16, Math.max(260, maxBoardHeight)));
  const squareSize = Math.floor(boardSize / 8);

  // Check saved match on mount
  useEffect(() => {
    const p = getProfile();
    setProfile(p);
    setLevels(getUserLevels());
    if (p) {
      if (p.skill_level === 'Não sei jogar') setDifficulty('Fácil');
      else if (p.skill_level === 'Sei o básico') setDifficulty('Médio');
      else setDifficulty('Difícil');
    }

    // Check if there is a match in progress saved
    const saved = getActiveMatch();
    if (saved && saved.fen && saved.fen !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
      pendingSavedMatchRef.current = saved;
      setShowResumeModal(true);
    }
  }, []);

  // Save active match state whenever moves or clocks change, or on unmount
  useEffect(() => {
    if (!game.isGameOver() && game.history().length > 0 && !matchRecordedRef.current) {
      saveActiveMatch({
        fen: game.fen(),
        whiteTime,
        blackTime,
        difficulty,
        lastMove: lastMove ? { from: lastMove.from, to: lastMove.to } : null,
        historyLength: game.history().length,
      });
    }
  }, [fen, whiteTime, blackTime, difficulty, lastMove]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelGameNotifications();
    };
  }, []);

  // Background notifications on app background during an active match
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState.match(/inactive|background/)) {
        if (!game.isGameOver() && game.history().length > 0) {
          notifyGameInProgress('Bot WinXadrez');
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [game]);

  // Chess clocks countdown timer
  useEffect(() => {
    if (game.isGameOver() || gameOverModal.visible || showResumeModal) return;

    const timer = setInterval(() => {
      if (game.turn() === 'w') {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            handleTimeOut('w');
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            handleTimeOut('b');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [game, gameOverModal.visible, showResumeModal]);

  const handleTimeOut = (loserColor: Color) => {
    if (matchRecordedRef.current) return;
    matchRecordedRef.current = true;
    clearActiveMatch();
    cancelGameNotifications();

    if (loserColor === 'w') {
      recordMatchResult('Derrota', 0, difficulty, game.history().length, 'Bot WinXadrez');
      setLevels(getUserLevels());
      setGameOverModal({
        visible: true,
        title: 'Tempo Esgotado!',
        description: 'Seu tempo acabou. Vitória das Pretas.',
        isWin: false,
      });
    } else {
      recordMatchResult('Vitória', 0, difficulty, game.history().length, 'Bot WinXadrez');
      setLevels(getUserLevels());
      setGameOverModal({
        visible: true,
        title: 'Tempo Esgotado!',
        description: 'O tempo do adversário acabou. Vitória sua!',
        isWin: true,
      });
    }
  };

  const board = useMemo(() => game.board(), [fen, game]);

  const legalTargets = useMemo(
    () => (selectedSquare ? game.moves({ square: selectedSquare, verbose: true }).map((m) => m.to) : []),
    [selectedSquare, fen, game]
  );

  // Compute captured pieces dynamically
  const capturedPieces = useMemo(() => {
    const currentCounts: Record<Color, Record<string, number>> = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    };

    board.forEach((row) => {
      row.forEach((piece) => {
        if (piece && piece.type !== 'k') {
          currentCounts[piece.color][piece.type] = (currentCounts[piece.color][piece.type] || 0) + 1;
        }
      });
    });

    const capturedByWhite: { type: string; color: Color }[] = [];
    (['p', 'n', 'b', 'r', 'q'] as const).forEach((t) => {
      const missing = (initialPieceCounts.b[t] || 0) - (currentCounts.b[t] || 0);
      for (let i = 0; i < missing; i++) {
        capturedByWhite.push({ type: t, color: 'b' });
      }
    });

    const capturedByBlack: { type: string; color: Color }[] = [];
    (['p', 'n', 'b', 'r', 'q'] as const).forEach((t) => {
      const missing = (initialPieceCounts.w[t] || 0) - (currentCounts.w[t] || 0);
      for (let i = 0; i < missing; i++) {
        capturedByBlack.push({ type: t, color: 'w' });
      }
    });

    return { capturedByWhite, capturedByBlack };
  }, [board]);

  const resetGame = () => {
    clearActiveMatch();
    cancelGameNotifications();
    const nextGame = new Chess();
    setGame(nextGame);
    setFen(nextGame.fen());
    setSelectedSquare(null);
    setLastMove(null);
    setIsBotThinking(false);
    setWhiteTime(120);
    setBlackTime(120);
    matchRecordedRef.current = false;
    setGameOverModal({ visible: false, title: '', description: '', isWin: false });
    setSettingsModalVisible(false);
    setShowResumeModal(false);
  };

  // Resume saved match action
  const handleResumeSavedMatch = () => {
    const saved = pendingSavedMatchRef.current;
    if (saved && saved.fen) {
      try {
        const loadedGame = new Chess(saved.fen);
        setGame(loadedGame);
        setFen(saved.fen);
        setWhiteTime(saved.whiteTime ?? 120);
        setBlackTime(saved.blackTime ?? 120);
        if (saved.difficulty) setDifficulty(saved.difficulty);
        if (saved.lastMove) setLastMove(saved.lastMove);
        matchRecordedRef.current = false;
      } catch (err) {
        resetGame();
      }
    }
    setShowResumeModal(false);
  };

  // Bot AI algorithm
  const calculateBotMove = (chessGame: Chess): Move | null => {
    const moves = chessGame.moves({ verbose: true });
    if (moves.length === 0) return null;

    if (difficulty === 'Fácil') {
      const captureMoves = moves.filter((m) => m.captured);
      if (captureMoves.length > 0 && Math.random() < 0.35) {
        return captureMoves[Math.floor(Math.random() * captureMoves.length)];
      }
      return moves[Math.floor(Math.random() * moves.length)];
    }

    if (difficulty === 'Médio') {
      let bestMove: Move | null = null;
      let highestValue = -999;

      for (const move of moves) {
        let value = 0;
        if (move.captured) {
          value += (pieceValues[move.captured] || 1) * 10;
        }
        if (['d4', 'e4', 'd5', 'e5'].includes(move.to)) {
          value += 2;
        }
        if (move.promotion) {
          value += 15;
        }
        if (value > highestValue) {
          highestValue = value;
          bestMove = move;
        }
      }

      if (!bestMove || Math.random() < 0.25) {
        return moves[Math.floor(Math.random() * moves.length)];
      }
      return bestMove;
    }

    // Difícil (Hard AI)
    let bestMove: Move | null = null;
    let bestScore = -99999;

    for (const move of moves) {
      chessGame.move(move);
      let score = 0;

      if (chessGame.isCheckmate()) score += 10000;
      else if (chessGame.isCheck()) score += 15;

      const oppMoves = chessGame.moves({ verbose: true });
      let maxOppCapture = 0;
      for (const opp of oppMoves) {
        if (opp.captured) {
          const capVal = pieceValues[opp.captured] || 0;
          if (capVal > maxOppCapture) maxOppCapture = capVal;
        }
      }
      score -= maxOppCapture * 8;

      if (move.captured) {
        score += (pieceValues[move.captured] || 0) * 12;
      }
      if (['d4', 'e4', 'd5', 'e5'].includes(move.to)) {
        score += 4;
      }
      if (move.promotion) score += 20;

      chessGame.undo();

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove || moves[Math.floor(Math.random() * moves.length)];
  };

  // Check and handle game over
  const checkGameOverState = useCallback(
    (currentGame: Chess) => {
      if (!currentGame.isGameOver()) return;
      if (matchRecordedRef.current) return;
      matchRecordedRef.current = true;
      clearActiveMatch();
      cancelGameNotifications();

      const totalMoves = currentGame.history().length;

      if (currentGame.isCheckmate()) {
        const winner = currentGame.turn() === 'w' ? 'b' : 'w';
        const isWin = winner === 'w';

        recordMatchResult(isWin ? 'Vitória' : 'Derrota', 0, difficulty, totalMoves, 'Bot WinXadrez');
        setLevels(getUserLevels());

        setGameOverModal({
          visible: true,
          title: isWin ? 'Vitória por Xeque-mate!' : 'Derrota por Xeque-mate',
          description: isWin
            ? `Parabéns! Você venceu no modo ${difficulty} e pontuou rumo ao próximo nível!`
            : 'O Bot WinXadrez aplicou um xeque-mate. Analise a partida e tente novamente!',
          isWin,
        });
      } else if (currentGame.isDraw()) {
        let desc = 'A partida terminou em empate.';
        if (currentGame.isStalemate()) desc = 'Empate por afogamento (Stalemate).';
        else if (currentGame.isThreefoldRepetition()) desc = 'Empate por repetição tripla de lances.';
        else if (currentGame.isInsufficientMaterial()) desc = 'Empate por material insuficiente.';

        recordMatchResult('Empate', 0, difficulty, totalMoves, 'Bot WinXadrez');
        setLevels(getUserLevels());

        setGameOverModal({
          visible: true,
          title: 'Empate!',
          description: desc,
          isWin: false,
        });
      }
    },
    [difficulty]
  );

  // Smooth 60 FPS Native Piece Movement
  const animateAndCommitMove = (
    from: Square,
    to: Square,
    piece: { type: PieceSymbol; color: Color },
    onFinished: () => void
  ) => {
    const fromCol = files.indexOf(from[0]);
    const fromRow = 8 - parseInt(from[1], 10);
    const toCol = files.indexOf(to[0]);
    const toRow = 8 - parseInt(to[1], 10);

    moveAnim.setValue({
      x: fromCol * squareSize,
      y: fromRow * squareSize,
    });

    setAnimatingPiece({
      piece,
      fromCol,
      fromRow,
      toCol,
      toRow,
    });

    Animated.timing(moveAnim, {
      toValue: {
        x: toCol * squareSize,
        y: toRow * squareSize,
      },
      duration: 175,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onFinished();
      setAnimatingPiece(null);
    });
  };

  // Execute bot move with smooth animation
  const triggerBotMove = (currentGame: Chess) => {
    setIsBotThinking(true);

    setTimeout(() => {
      if (currentGame.isGameOver()) {
        setIsBotThinking(false);
        return;
      }

      const botMove = calculateBotMove(currentGame);
      if (!botMove) {
        setIsBotThinking(false);
        checkGameOverState(currentGame);
        return;
      }

      const botPiece = currentGame.get(botMove.from);
      if (!botPiece) {
        currentGame.move(botMove);
        setFen(currentGame.fen());
        setLastMove({ from: botMove.from, to: botMove.to });
        setIsBotThinking(false);
        checkGameOverState(currentGame);
        return;
      }

      // Smooth 60 FPS glide for bot's move
      animateAndCommitMove(botMove.from, botMove.to, botPiece, () => {
        try {
          currentGame.move(botMove);
          setFen(currentGame.fen());
          setLastMove({ from: botMove.from, to: botMove.to });
        } catch {
          // fallback
        }
        setIsBotThinking(false);
        checkGameOverState(currentGame);
      });
    }, 350);
  };

  // Handle square tap by user
  const handleSquarePress = useCallback(
    (square: Square) => {
      if (isBotThinking || game.isGameOver()) return;
      if (game.turn() !== 'w') return;

      if (selectedSquare) {
        if (selectedSquare === square) {
          setSelectedSquare(null);
          return;
        }

        const friendlyPiece = game.get(square);
        if (friendlyPiece && friendlyPiece.color === 'w') {
          setSelectedSquare(square);
          return;
        }

        const legalMove = game
          .moves({ square: selectedSquare, verbose: true })
          .find((m) => m.to === square);

        if (legalMove) {
          const movingPiece = game.get(selectedSquare);
          if (!movingPiece) return;

          const fromSq = selectedSquare;
          setSelectedSquare(null);

          // Animate user's piece move smoothly at 60 FPS
          animateAndCommitMove(fromSq, square, movingPiece, () => {
            try {
              game.move({ from: fromSq, to: square, promotion: 'q' });
              setFen(game.fen());
              setLastMove({ from: fromSq, to: square });

              if (!game.isGameOver()) {
                triggerBotMove(game);
              } else {
                checkGameOverState(game);
              }
            } catch {
              setSelectedSquare(null);
            }
          });
          return;
        }

        setSelectedSquare(null);
        return;
      }

      const piece = game.get(square);
      if (piece && piece.color === 'w') {
        setSelectedSquare(square);
      }
    },
    [selectedSquare, isBotThinking, game, squareSize]
  );

  // Forfeit handler
  const handleForfeit = () => {
    if (game.isGameOver() || matchRecordedRef.current) return;

    Alert.alert(
      'Desistir da Partida',
      'Tem certeza de que deseja abandonar este confronto? A partida será considerada uma derrota.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Desistir',
          style: 'destructive',
          onPress: () => {
            matchRecordedRef.current = true;
            clearActiveMatch();
            cancelGameNotifications();
            recordMatchResult('Derrota', 0, difficulty, game.history().length, 'Bot WinXadrez');
            setLevels(getUserLevels());
            setGameOverModal({
              visible: true,
              title: 'Partida Abandonada',
              description: 'Você desistiu do confronto. Vitória do adversário.',
              isWin: false,
            });
          },
        },
      ]
    );
  };

  // Propose draw handler
  const handleOfferDraw = () => {
    if (game.isGameOver() || matchRecordedRef.current) return;

    Alert.alert('Proposta de Empate', 'Deseja propor empate ao Bot WinXadrez?', [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Propor Empate',
        onPress: () => {
          if (difficulty === 'Fácil' || Math.random() < 0.65) {
            matchRecordedRef.current = true;
            clearActiveMatch();
            cancelGameNotifications();
            recordMatchResult('Empate', 0, difficulty, game.history().length, 'Bot WinXadrez');
            setLevels(getUserLevels());
            setGameOverModal({
              visible: true,
              title: 'Empate por Acordo!',
              description: 'O Bot WinXadrez aceitou a sua proposta de empate.',
              isWin: false,
            });
          } else {
            Alert.alert(
              'Proposta Recusada',
              'O Bot WinXadrez avaliou a posição com vantagem e decidiu continuar jogando!'
            );
          }
        },
      },
    ]);
  };

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(Math.max(0, totalSeconds) / 60);
    const s = Math.max(0, totalSeconds) % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: Math.max(insets.top, 8),
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {/* 1. Header estilo Chess app dark moderno */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.headerButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>WinXadrez</Text>
          <Text style={[styles.headerSub, { color: colors.accent }]}>Nível {difficulty}</Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          activeOpacity={0.7}
          onPress={() => setSettingsModalVisible(true)}
        >
          <Ionicons name="settings-sharp" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* 2. Top Player Card (Bot WinXadrez) */}
      <View style={[styles.playerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatarBox, { backgroundColor: colors.cardSecondary }]}>
          <Ionicons name="hardware-chip-outline" size={24} color={colors.accent} />
        </View>

        <View style={styles.playerTextContainer}>
          <Text style={[styles.playerNameText, { color: colors.text }]} numberOfLines={1}>
            Bot WinXadrez ({difficulty})
          </Text>
          <View style={styles.playerMetaRow}>
            <Text style={[styles.timerText, { color: colors.text }]}>{formatTimer(blackTime)}</Text>
            <Ionicons name="time-outline" size={13} color={colors.textSecondary} style={{ marginLeft: 6, marginRight: 2 }} />
            <Text style={[styles.metaSubText, { color: colors.textSecondary }]}>
              {isBotThinking ? 'Pensando...' : 'Tempo da Vez'}
            </Text>
          </View>
        </View>

        {/* Captured pieces by black */}
        <View style={styles.capturedContainer}>
          <View style={styles.capturedRow}>
            {capturedPieces.capturedByBlack.slice(0, 5).map((p, idx) => (
              <Text key={`top-cap-1-${idx}`} style={styles.capturedSymbolWhite}>
                {pieceSymbols.w[p.type]}
              </Text>
            ))}
          </View>
          <View style={styles.capturedRow}>
            {capturedPieces.capturedByBlack.slice(5, 10).map((p, idx) => (
              <Text key={`top-cap-2-${idx}`} style={styles.capturedSymbolWhite}>
                {pieceSymbols.w[p.type]}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* 3. Chess Board (Otimizado, fluido, sem cortes e sem tons amarelos) */}
      <View style={styles.boardCenterContainer}>
        <View style={[styles.boardWrapper, { width: boardSize, height: boardSize, borderColor: colors.borderStrong }]}>
          {board.map((row, rowIndex) => (
            <View key={`board-row-${rowIndex}`} style={styles.boardRow}>
              {row.map((piece, colIndex) => {
                const square = `${files[colIndex]}${8 - rowIndex}` as Square;
                const isDark = (rowIndex + colIndex) % 2 === 1;
                const isSelected = selectedSquare === square;
                const isTarget = legalTargets.includes(square);
                const isLastMoveSquare = lastMove?.from === square || lastMove?.to === square;

                const isCurrentlyMoving =
                  animatingPiece !== null &&
                  animatingPiece.fromRow === rowIndex &&
                  animatingPiece.fromCol === colIndex;

                return (
                  <SquareCell
                    key={`square-${rowIndex}-${colIndex}`}
                    square={square}
                    isDark={isDark}
                    squareSize={squareSize}
                    isSelected={isSelected}
                    isLastMoveSquare={isLastMoveSquare}
                    isTarget={isTarget}
                    piece={piece}
                    isCurrentlyMoving={isCurrentlyMoving}
                    onPress={handleSquarePress}
                    colors={colors}
                  />
                );
              })}
            </View>
          ))}

          {/* 60 FPS Native Piece Translation Overlay */}
          {animatingPiece && (
            <Animated.View
              style={[
                styles.movingPieceContainer,
                {
                  width: squareSize,
                  height: squareSize,
                  transform: [{ translateX: moveAnim.x }, { translateY: moveAnim.y }],
                },
              ]}
              pointerEvents="none"
            >
              <Text
                style={[
                  styles.pieceText,
                  animatingPiece.piece.color === 'b' ? styles.pieceBlack : styles.pieceWhite,
                  { fontSize: Math.floor(squareSize * 0.74) },
                ]}
              >
                {pieceSymbols[animatingPiece.piece.color][animatingPiece.piece.type]}
              </Text>
            </Animated.View>
          )}
        </View>
      </View>

      {/* 4. Bottom Player Card (Você / Brancas com Nível) */}
      <View style={[styles.playerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatarBox, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarInitial}>
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'V'}
          </Text>
        </View>

        <View style={styles.playerTextContainer}>
          <Text style={[styles.playerNameText, { color: colors.text }]} numberOfLines={1}>
            {profile?.name || 'Você'} (Brancas)
          </Text>
          <View style={styles.playerMetaRow}>
            <Text style={[styles.timerText, { color: colors.text }]}>{formatTimer(whiteTime)}</Text>
            <Ionicons name="time-outline" size={13} color={colors.textSecondary} style={{ marginLeft: 6, marginRight: 2 }} />
            <Text style={[styles.metaSubText, { color: colors.textSecondary }]}>
              Nível {levels.totalLevel}
            </Text>
            <View style={[styles.diffBadgePill, { backgroundColor: colors.cardSecondary }]}>
              <Text style={[styles.diffBadgePillText, { color: colors.accent }]}>{difficulty}</Text>
            </View>
          </View>
        </View>

        {/* Captured pieces by white */}
        <View style={styles.capturedContainer}>
          <View style={styles.capturedRow}>
            {capturedPieces.capturedByWhite.slice(0, 5).map((p, idx) => (
              <Text key={`bot-cap-1-${idx}`} style={styles.capturedSymbolBlack}>
                {pieceSymbols.b[p.type]}
              </Text>
            ))}
          </View>
          <View style={styles.capturedRow}>
            {capturedPieces.capturedByWhite.slice(5, 10).map((p, idx) => (
              <Text key={`bot-cap-2-${idx}`} style={styles.capturedSymbolBlack}>
                {pieceSymbols.b[p.type]}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* 5. Bottom Action Bar (Desistir e Empate) */}
      <View style={[styles.bottomActionBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={styles.bottomActionButton}
          activeOpacity={0.7}
          onPress={handleForfeit}
        >
          <Ionicons name="flag-outline" size={20} color={colors.danger} />
          <Text style={[styles.bottomActionText, { color: colors.textSecondary }]}>Desistir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomActionButton}
          activeOpacity={0.7}
          onPress={handleOfferDraw}
        >
          <Ionicons name="hand-left-outline" size={20} color={colors.accent} />
          <Text style={[styles.bottomActionText, { color: colors.textSecondary }]}>Empate</Text>
        </TouchableOpacity>
      </View>

      {/* Modal: Continuar Partida Anterior ou Reiniciar */}
      <Modal
        visible={showResumeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowResumeModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.dialogBox, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
            <View style={[styles.dialogIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Ionicons name="hourglass-outline" size={36} color="#38bdf8" />
            </View>

            <Text style={[styles.dialogTitle, { color: colors.text }]}>Partida em Andamento</Text>
            <Text style={[styles.dialogDesc, { color: colors.textSecondary }]}>
              Você tem um confronto ativo contra o Bot WinXadrez. Deseja continuar de onde parou ou iniciar uma nova partida?
            </Text>

            <View style={styles.dialogButtonsCol}>
              <TouchableOpacity
                style={[styles.dialogPrimaryBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
                onPress={handleResumeSavedMatch}
              >
                <Ionicons name="play" size={18} color="#ffffff" />
                <Text style={styles.dialogPrimaryBtnText}>Continuar Partida</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dialogSecondaryBtn, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={resetGame}
              >
                <Ionicons name="refresh" size={18} color={colors.text} />
                <Text style={[styles.dialogSecondaryBtnText, { color: colors.text }]}>
                  Reiniciar Partida
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.settingsBox, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
            <View style={styles.settingsHeader}>
              <Text style={[styles.settingsTitle, { color: colors.text }]}>Configurações da Partida</Text>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.settingsLabel, { color: colors.textSecondary }]}>Dificuldade do Bot:</Text>
            <View style={styles.difficultyPickerRow}>
              {(['Fácil', 'Médio', 'Difícil'] as GameDifficulty[]).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.difficultyOption,
                    { backgroundColor: colors.cardSecondary, borderColor: colors.border },
                    difficulty === d && { backgroundColor: colors.primary, borderColor: colors.accent },
                  ]}
                  onPress={() => setDifficulty(d)}
                >
                  <Text
                    style={[
                      styles.difficultyOptionText,
                      { color: colors.textSecondary },
                      difficulty === d && { color: '#ffffff' },
                    ]}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.restartBtn, { backgroundColor: colors.cardSecondary }]}
              activeOpacity={0.8}
              onPress={resetGame}
            >
              <Ionicons name="refresh" size={18} color={colors.text} />
              <Text style={[styles.restartBtnText, { color: colors.text }]}>Reiniciar Partida</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Fim de Partida */}
      <Modal
        visible={gameOverModal.visible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setGameOverModal((prev) => ({ ...prev, visible: false }))}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.gameOverCard, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
            <Ionicons
              name={gameOverModal.isWin ? 'trophy' : 'close-circle'}
              size={52}
              color={gameOverModal.isWin ? '#f5b858' : colors.danger}
            />
            <Text style={[styles.gameOverTitle, { color: colors.text }]}>{gameOverModal.title}</Text>
            <Text style={[styles.gameOverDesc, { color: colors.textSecondary }]}>
              {gameOverModal.description}
            </Text>

            <View style={[styles.levelProgressBox, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
              <Text style={[styles.levelProgressLabel, { color: colors.textSecondary }]}>
                Seu Nível Geral:
              </Text>
              <Text style={[styles.levelProgressValue, { color: colors.accent }]}>
                Nível {levels.totalLevel}
              </Text>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalSecondaryBtn, { backgroundColor: colors.cardSecondary }]}
                activeOpacity={0.8}
                onPress={() => {
                  setGameOverModal((prev) => ({ ...prev, visible: false }));
                  navigation.navigate('Home');
                }}
              >
                <Text style={[styles.modalSecondaryBtnText, { color: colors.text }]}>Início</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalPrimaryBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
                onPress={resetGame}
              >
                <Text style={styles.modalPrimaryBtnText}>Jogar Novamente</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '700',
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  playerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  playerNameText: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  playerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 13,
    fontWeight: '800',
  },
  metaSubText: {
    fontSize: 11,
    fontWeight: '600',
  },
  diffBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6,
  },
  diffBadgePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  capturedContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 64,
  },
  capturedRow: {
    flexDirection: 'row',
    gap: 1,
  },
  capturedSymbolWhite: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  capturedSymbolBlack: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800',
    textShadowColor: 'rgba(255,255,255,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  boardCenterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  boardWrapper: {
    borderRadius: 8,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  boardRow: {
    flex: 1,
    flexDirection: 'row',
  },
  square: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  // Modern Dark Overlays (No Yellow!)
  modernLastMoveOverlay: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
  },
  modernSelectedSquareOverlay: {
    borderWidth: 2.5,
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.28)',
  },
  modernEmptyTargetDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.65)',
    position: 'absolute',
  },
  modernCaptureRing: {
    borderRadius: 999,
    borderWidth: 3,
    borderColor: 'rgba(244, 63, 94, 0.65)',
    position: 'absolute',
  },
  pieceText: {
    fontWeight: '900',
    textAlign: 'center',
    includeFontPadding: false,
  },
  pieceWhite: {
    color: '#ffffff',
    textShadowColor: '#0f172a',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 2,
  },
  pieceBlack: {
    color: '#0f172a',
  },
  movingPieceContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  bottomActionBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  bottomActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  bottomActionText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Modal Backdrop & Dialog
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialogBox: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  dialogIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  dialogTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  dialogDesc: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  dialogButtonsCol: {
    width: '100%',
    gap: 10,
  },
  dialogPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  dialogPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  dialogSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  dialogSecondaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Settings & GameOver Modals
  settingsBox: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  settingsTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  settingsLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  difficultyPickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  difficultyOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  difficultyOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  restartBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  gameOverCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  gameOverTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  gameOverDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  levelProgressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  levelProgressLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  levelProgressValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalSecondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalPrimaryBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
