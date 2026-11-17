import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Chess, type PieceSymbol, type Square } from 'chess.js';
import { useAppTheme } from '../context/ThemeContext';
import {
  getCachedDailyPuzzle,
  getLocalDateKey,
  getPuzzleProgress,
  recordPuzzleSolved,
  saveCachedDailyPuzzle,
} from '../database/db';
import { fetchDailyPuzzle, fetchNextPuzzle } from '../services/lichessPuzzleApi';
import type { PuzzleSpec } from '../types/puzzle';

const pieceSymbols: Record<'w' | 'b', Record<PieceSymbol, string>> = {
  w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
  b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' },
};

const offlinePuzzles: PuzzleSpec[] = [
  {
    id: 'mate',
    title: 'Mate em 1',
    subtitle: 'Ataque decisivo',
    icon: 'flash',
    color: '#f5b858',
    level: 'Intermediário',
    objective: 'Brancas jogam e encontram o lance vencedor.',
    fen: '6k1/8/8/8/8/8/4Q3/6K1 w - - 0 1',
    hint: 'A rainha ataca a coluna e o rei do adversário.',
    solutionMoves: [{ from: 'e2', to: 'e8' }],
    source: 'offline',
  },
  {
    id: 'fork',
    title: 'Garfo tático',
    subtitle: 'Ganhe material',
    icon: 'git-branch',
    color: '#81b64c',
    level: 'Fácil',
    objective: 'Descubra o lance que ataca duas peças ao mesmo tempo.',
    fen: '6k1/8/8/8/3N4/8/8/6K1 w - - 0 1',
    hint: 'O cavalo aproveita o centro para criar uma ameaça dupla.',
    solutionMoves: [{ from: 'd4', to: 'e6' }],
    source: 'offline',
  },
  {
    id: 'endgame',
    title: 'Final forte',
    subtitle: 'Converta a vantagem',
    icon: 'flag',
    color: '#5fa8ff',
    level: 'Avançado',
    objective: 'Use a torre para pressionar o rei adversário.',
    fen: '6k1/8/8/8/8/8/6R1/6K1 w - - 0 1',
    hint: 'A torre avança pela coluna aberta.',
    solutionMoves: [{ from: 'g2', to: 'g8' }],
    source: 'offline',
  },
  {
    id: 'defense',
    title: 'Defesa precisa',
    subtitle: 'Encontre o recurso',
    icon: 'shield-checkmark',
    color: '#9b8cff',
    level: 'Difícil',
    objective: 'Defenda o ponto crítico e mantenha a posição.',
    fen: '6k1/8/8/8/8/8/5P2/6K1 w - - 0 1',
    hint: 'A melhor defesa é a peça certa no lugar certo.',
    solutionMoves: [{ from: 'f2', to: 'f3' }],
    source: 'offline',
  },
];

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

export default function PuzzleScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const initialCache = useMemo(() => getCachedDailyPuzzle(), []);
  const initialProgress = useMemo(() => getPuzzleProgress(), []);

  const [dailyPuzzle, setDailyPuzzle] = useState<PuzzleSpec | null>(initialCache?.puzzle ?? null);
  const [randomPuzzle, setRandomPuzzle] = useState<PuzzleSpec | null>(null);
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<string>(
    initialCache?.puzzle?.id ?? offlinePuzzles[0].id
  );
  const [loadingDaily, setLoadingDaily] = useState<boolean>(
    !initialCache || initialCache.date !== getLocalDateKey()
  );
  const [loadingRandom, setLoadingRandom] = useState<boolean>(false);
  const [apiStatusNote, setApiStatusNote] = useState<string | null>(
    initialCache ? 'Cache local carregado' : null
  );

  const [streak, setStreak] = useState<number>(initialProgress.streak);
  const [solvedIds, setSolvedIds] = useState<string[]>(initialProgress.solvedIds);

  const allPuzzles = useMemo(() => {
    const list: PuzzleSpec[] = [];
    if (dailyPuzzle) list.push(dailyPuzzle);
    if (randomPuzzle) list.push(randomPuzzle);
    return [...list, ...offlinePuzzles];
  }, [dailyPuzzle, randomPuzzle]);

  const activePuzzle = useMemo(
    () => allPuzzles.find((puzzle) => puzzle.id === selectedPuzzleId) ?? allPuzzles[0],
    [allPuzzles, selectedPuzzleId]
  );

  const [game, setGame] = useState(() => new Chess(activePuzzle.fen));
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    activePuzzle.initialLastMove ?? null
  );
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [isOpponentThinking, setIsOpponentThinking] = useState(false);
  const [isSolved, setIsSolved] = useState(() => solvedIds.includes(activePuzzle.id));
  const [hintVisible, setHintVisible] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const replyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInteractedRef = useRef(false);

  const clearPendingReply = () => {
    if (replyTimeoutRef.current) {
      clearTimeout(replyTimeoutRef.current);
      replyTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearPendingReply();
  }, []);

  const applyPuzzleToBoard = useCallback(
    (puzzle: PuzzleSpec, currentSolvedIds: string[]) => {
      clearPendingReply();
      setIsOpponentThinking(false);
      setGame(new Chess(puzzle.fen));
      setSelectedSquare(null);
      setLastMove(puzzle.initialLastMove ?? null);
      setSolutionIndex(0);
      setIsSolved(currentSolvedIds.includes(puzzle.id));
      setHintVisible(false);
      setAttempts(0);
      setFeedbackError(null);
    },
    []
  );

  const loadDailyFromApi = useCallback(
    async (forceSelect: boolean) => {
      try {
        setLoadingDaily(true);
        const fetched = await fetchDailyPuzzle();
        saveCachedDailyPuzzle(fetched);
        setDailyPuzzle(fetched);
        setApiStatusNote('Sincronizado hoje via Lichess');

        if (forceSelect || !hasInteractedRef.current) {
          setSelectedPuzzleId(fetched.id);
          applyPuzzleToBoard(fetched, getPuzzleProgress().solvedIds);
        }
      } catch {
        setApiStatusNote(
          initialCache
            ? 'Sem internet — usando último puzzle salvo no cache'
            : 'Sem internet — usando puzzles offline'
        );
      } finally {
        setLoadingDaily(false);
      }
    },
    [applyPuzzleToBoard, initialCache]
  );

  useEffect(() => {
    const today = getLocalDateKey();
    if (initialCache && initialCache.date === today) {
      setLoadingDaily(false);
      setApiStatusNote('Puzzle diário em cache offline');
      return;
    }
    loadDailyFromApi(false);
  }, [initialCache, loadDailyFromApi]);

  const handleLoadNextOnlinePuzzle = async () => {
    if (loadingRandom) return;
    try {
      setLoadingRandom(true);
      hasInteractedRef.current = true;
      const next = await fetchNextPuzzle();
      setRandomPuzzle(next);
      setSelectedPuzzleId(next.id);
      applyPuzzleToBoard(next, solvedIds);
      setApiStatusNote('Novo desafio carregado do Lichess');
    } catch {
      Alert.alert(
        'Sem conexão',
        'Não foi possível buscar um novo puzzle do Lichess agora. Você pode continuar jogando os puzzles offline.'
      );
    } finally {
      setLoadingRandom(false);
    }
  };

  const boardOrientation = useMemo(
    () => new Chess(activePuzzle.fen).turn(),
    [activePuzzle.fen]
  );

  const legalTargets = useMemo(
    () => (selectedSquare ? game.moves({ square: selectedSquare, verbose: true }).map((move) => move.to) : []),
    [game, selectedSquare]
  );

  const resetPuzzle = (puzzleId = selectedPuzzleId) => {
    const nextPuzzle = allPuzzles.find((puzzle) => puzzle.id === puzzleId) ?? allPuzzles[0];
    clearPendingReply();
    setIsOpponentThinking(false);
    setGame(new Chess(nextPuzzle.fen));
    setSelectedSquare(null);
    setLastMove(nextPuzzle.initialLastMove ?? null);
    setSolutionIndex(0);
    setIsSolved(false);
    setHintVisible(false);
    setAttempts(0);
    setFeedbackError(null);
  };

  const handleSelectPuzzle = (puzzleId: string) => {
    hasInteractedRef.current = true;
    const target = allPuzzles.find((puzzle) => puzzle.id === puzzleId) ?? allPuzzles[0];
    setSelectedPuzzleId(puzzleId);
    applyPuzzleToBoard(target, solvedIds);
  };

  const handleSquarePress = (square: Square) => {
    if (isSolved || isOpponentThinking) return;

    hasInteractedRef.current = true;
    const current = new Chess(game.fen());

    if (selectedSquare) {
      const candidate = current.moves({ square: selectedSquare, verbose: true }).find((move) => move.to === square);

      if (candidate) {
        const expectedMove = activePuzzle.solutionMoves[solutionIndex];
        const promotionChoice = expectedMove?.promotion ?? 'q';
        const appliedMove = current.move({
          from: selectedSquare,
          to: square,
          promotion: promotionChoice,
        });

        if (!appliedMove) {
          setSelectedSquare(null);
          return;
        }

        const isLastStep = solutionIndex >= activePuzzle.solutionMoves.length - 1;
        const matchesExpected =
          expectedMove &&
          selectedSquare === expectedMove.from &&
          square === expectedMove.to;
        const isAlternativeMate = current.isCheckmate() && isLastStep;

        setSelectedSquare(null);
        setAttempts((prev) => prev + 1);

        if (!matchesExpected && !isAlternativeMate) {
          setFeedbackError('Lance incorreto — tente outro caminho!');
          return;
        }

        setFeedbackError(null);
        setGame(current);
        setLastMove({ from: selectedSquare, to: square });

        const nextIndex = solutionIndex + 1;

        if (nextIndex >= activePuzzle.solutionMoves.length || current.isCheckmate()) {
          setIsSolved(true);
          const updated = recordPuzzleSolved(activePuzzle.id);
          setStreak(updated.streak);
          setSolvedIds(updated.solvedIds);
          Alert.alert('Excelente!', `Você resolveu o puzzle: ${activePuzzle.title}.`);
          return;
        }

        const opponentMove = activePuzzle.solutionMoves[nextIndex];
        setIsOpponentThinking(true);
        replyTimeoutRef.current = setTimeout(() => {
          const afterReply = new Chess(current.fen());
          const reply = afterReply.move({
            from: opponentMove.from,
            to: opponentMove.to,
            promotion: opponentMove.promotion ?? 'q',
          });
          if (reply) {
            setGame(afterReply);
            setLastMove({ from: opponentMove.from, to: opponentMove.to });
            setSolutionIndex(nextIndex + 1);
          }
          setIsOpponentThinking(false);
        }, 350);
        return;
      }

      const piece = current.get(square);
      if (piece && piece.color === current.turn()) {
        setSelectedSquare(square);
        return;
      }

      setSelectedSquare(null);
      return;
    }

    const piece = current.get(square);
    if (piece && piece.color === current.turn()) {
      setSelectedSquare(square);
    }
  };

  const handleShowHint = () => {
    setHintVisible(true);
    const currentStepMove = activePuzzle.solutionMoves[solutionIndex] ?? activePuzzle.solutionMoves[0];
    Alert.alert(
      'Dica',
      `${activePuzzle.hint}\n\nLance sugerido agora: ${currentStepMove.from} → ${currentStepMove.to}.`
    );
  };

  const handleReset = () => {
    resetPuzzle();
    Alert.alert('Quebra-cabeça reiniciado', `Nova tentativa: ${activePuzzle.objective}`);
  };

  const renderBoard = () => {
    const rawBoard = game.board();
    const mappedRows = rawBoard.map((row, rowIndex) =>
      row.map((piece, colIndex) => ({
        piece,
        square: `${files[colIndex]}${8 - rowIndex}` as Square,
        isDark: (rowIndex + colIndex) % 2 === 1,
      }))
    );

    const displayedRows =
      boardOrientation === 'b'
        ? [...mappedRows].reverse().map((row) => [...row].reverse())
        : mappedRows;

    const currentExpected = activePuzzle.solutionMoves[solutionIndex];

    return displayedRows.map((row, rowIndex) => (
      <View key={`row-${rowIndex}`} style={styles.boardRow}>
        {row.map(({ piece, square, isDark }) => {
          const isSelected = selectedSquare === square;
          const isTarget = legalTargets.includes(square);
          const isLastMoveSquare = lastMove?.from === square || lastMove?.to === square;
          const isHintSquare = hintVisible && !isSolved && currentExpected?.from === square;

          return (
            <TouchableOpacity
              key={square}
              activeOpacity={0.9}
              onPress={() => handleSquarePress(square)}
              style={[
                styles.square,
                {
                  backgroundColor: isDark ? colors.boardDark : colors.boardLight,
                },
                isLastMoveSquare && { backgroundColor: colors.boardLastMove },
                isHintSquare && { borderWidth: 2, borderColor: colors.accent },
                isSelected && { borderWidth: 2, borderColor: colors.boardSelected },
              ]}
            >
              {isTarget && !piece && <View style={styles.emptyTargetDot} />}
              {isTarget && piece && <View style={styles.captureRing} />}

              {piece && (
                <Text
                  style={[
                    styles.pieceText,
                    piece.color === 'b' ? styles.pieceBlack : styles.pieceWhite,
                  ]}
                >
                  {pieceSymbols[piece.color][piece.type]}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    ));
  };

  const totalPlayerMoves = Math.max(1, Math.ceil(activePuzzle.solutionMoves.length / 2));
  const completedPlayerMoves = Math.min(totalPlayerMoves, Math.floor(solutionIndex / 2));

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: Math.max(insets.top, 8),
        },
      ]}
    >
      <View style={[styles.topBar, { borderBottomColor: colors.border, paddingHorizontal: 16 }]}>
        <TouchableOpacity style={styles.backButtonTop} activeOpacity={0.7} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={[styles.topBarTitle, { color: colors.text }]}>Tática Diária</Text>
          <Text style={[styles.topBarSub, { color: colors.accent }]}>Lichess API + Offline</Text>
        </View>

        <TouchableOpacity
          style={[styles.topBarIconWrap, { backgroundColor: `${colors.accent}20` }]}
          activeOpacity={0.7}
          onPress={() => loadDailyFromApi(true)}
          disabled={loadingDaily}
        >
          {loadingDaily ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Ionicons name="refresh" size={18} color={colors.accent} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.heroTopLine}>
            <View style={[styles.difficultyBadge, { backgroundColor: `${activePuzzle.color}20` }]}>
              <View style={[styles.difficultyDot, { backgroundColor: activePuzzle.color }]} />
              <Text style={[styles.difficultyText, { color: activePuzzle.color }]}>{activePuzzle.level.toUpperCase()}</Text>
            </View>
            <Text style={[styles.streakText, { color: colors.accent }]}>Série: {streak} 🔥</Text>
          </View>

          <View style={[styles.boardPreview, { borderColor: colors.borderStrong }]}>{renderBoard()}</View>

          <View style={styles.heroCopy}>
            <Text style={[styles.heroKicker, { color: activePuzzle.color }]}>
              {activePuzzle.source === 'offline'
                ? 'DESAFIO OFFLINE'
                : `LICHESS • ${activePuzzle.rating ?? ''} ELO • LANCE ${completedPlayerMoves + (isSolved ? 0 : 1)}/${totalPlayerMoves}`}
            </Text>
            <Text style={[styles.heroTitle, { color: colors.text }]}>{activePuzzle.title}</Text>
            <Text style={[styles.heroDescription, { color: colors.textSecondary }]}>{activePuzzle.objective}</Text>

            {activePuzzle.playersLabel && (
              <Text style={[styles.playersMetaText, { color: colors.textMuted }]}>
                Partida real: {activePuzzle.playersLabel}
              </Text>
            )}

            {feedbackError && (
              <View style={[styles.errorBadge, { backgroundColor: `${colors.danger}18`, borderColor: colors.danger }]}>
                <Ionicons name="close-circle" size={16} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>{feedbackError}</Text>
              </View>
            )}

            {hintVisible && (
              <Text style={[styles.hintText, { color: colors.accent }]}>Dica: {activePuzzle.hint}</Text>
            )}

            {isSolved && (
              <View style={[styles.successBadge, { backgroundColor: `${colors.primary}20`, borderColor: colors.primary }]}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                <Text style={[styles.successText, { color: colors.primary }]}>Puzzle resolvido</Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.actionHeader}>
            <View style={[styles.actionIcon, { backgroundColor: `${colors.accent}20` }]}>
              <Ionicons name="globe" size={18} color={colors.accent} />
            </View>
            <View style={styles.actionHeaderText}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Puzzles Online (Lichess)</Text>
              <Text style={[styles.taskText, { color: colors.textSecondary }]}>
                {apiStatusNote
                  ? `${apiStatusNote} • Tentativas: ${attempts}`
                  : attempts === 0
                  ? 'Desafios reais diários com cache automático para jogar offline.'
                  : `Tentativas: ${attempts}`}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.nextOnlineBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
              onPress={handleLoadNextOnlinePuzzle}
              disabled={loadingRandom}
            >
              {loadingRandom ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="shuffle" size={14} color="#ffffff" />
                  <Text style={styles.nextOnlineBtnText}>Novo</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.challengeHeader}>
          <Text style={[styles.challengeTitle, { color: colors.text }]}>Desafios Disponíveis</Text>
        </View>

        <View style={styles.challengeGrid}>
          {allPuzzles.map((puzzle) => {
            const isSelected = puzzle.id === activePuzzle.id;
            const puzzleSolved = solvedIds.includes(puzzle.id);
            return (
              <TouchableOpacity
                key={puzzle.id}
                style={[
                  styles.challengeCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSelected ? puzzle.color : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => handleSelectPuzzle(puzzle.id)}
              >
                <View style={styles.challengeCardTopRow}>
                  <View style={[styles.challengeIcon, { backgroundColor: `${puzzle.color}20` }]}>
                    <Ionicons name={puzzle.icon as any} size={20} color={puzzle.color} />
                  </View>
                  {puzzleSolved && (
                    <View style={[styles.solvedPill, { backgroundColor: `${colors.primary}20` }]}>
                      <Text style={[styles.solvedPillText, { color: colors.primary }]}>Concluído</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.challengeCardTitle, { color: colors.text }]}>{puzzle.title}</Text>
                <Text style={[styles.challengeCardSubtitle, { color: colors.textSecondary }]}>{puzzle.subtitle}</Text>
                <View style={styles.challengeBottom}>
                  <Text style={[styles.challengeLevel, { color: puzzle.color }]}>{puzzle.level}</Text>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={18} color={puzzle.color} />
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]} onPress={handleShowHint}>
            <Ionicons name="bulb-outline" size={18} color={colors.accent} />
            <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>Dica</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.primaryButtonAction, { backgroundColor: colors.primary }]} onPress={handleReset}>
            <Ionicons name="refresh" size={18} color="#ffffff" />
            <Text style={styles.primaryButtonTextAction}>Reiniciar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButtonTop: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  topBarSub: {
    fontSize: 11,
    fontWeight: '700',
  },
  topBarIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  heroTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '800',
  },
  boardPreview: {
    width: 320,
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  boardRow: {
    flexDirection: 'row',
    width: '100%',
  },
  square: {
    width: '12.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emptyTargetDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  captureRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.24)',
  },
  pieceText: {
    fontWeight: '900',
    fontSize: 24,
    textAlign: 'center',
    includeFontPadding: false,
  },
  pieceBlack: {
    color: '#0f172a',
  },
  pieceWhite: {
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 2,
  },
  heroCopy: {
    gap: 6,
  },
  heroKicker: {
    fontSize: 11,
    letterSpacing: 1.1,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  heroDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  playersMetaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  errorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 6,
  },
  successText: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 18,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionHeaderText: {
    flex: 1,
  },
  nextOnlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 74,
    justifyContent: 'center',
  },
  nextOnlineBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  taskText: {
    fontSize: 12,
    marginTop: 2,
  },
  challengeHeader: {
    marginBottom: 10,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  challengeGrid: {
    gap: 10,
    marginBottom: 18,
  },
  challengeCard: {
    borderRadius: 16,
    padding: 12,
  },
  challengeCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  challengeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solvedPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  solvedPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  challengeCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  challengeCardSubtitle: {
    fontSize: 12,
    marginBottom: 10,
  },
  challengeBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  challengeLevel: {
    fontSize: 11,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  primaryButtonAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
  },
  primaryButtonTextAction: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
