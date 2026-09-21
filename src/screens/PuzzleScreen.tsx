import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Chess, type PieceSymbol, type Square } from 'chess.js';
import { RootStackParamList } from '../types/navigation';
import { useAppTheme } from '../context/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Puzzle'>;

type PuzzleSpec = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  level: string;
  objective: string;
  fen: string;
  hint: string;
  solution: { from: Square; to: Square };
};

const pieceSymbols: Record<'w' | 'b', Record<PieceSymbol, string>> = {
  w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
  b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' },
};

const puzzleTypes: PuzzleSpec[] = [
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
    solution: { from: 'e2', to: 'e8' },
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
    solution: { from: 'd4', to: 'e6' },
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
    solution: { from: 'g2', to: 'g8' },
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
    solution: { from: 'f2', to: 'f3' },
  },
];

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

export default function PuzzleScreen({ navigation }: Props) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [selectedPuzzleId, setSelectedPuzzleId] = useState('mate');
  const [game, setGame] = useState(() => new Chess(puzzleTypes[0].fen));
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const activePuzzle = useMemo(
    () => puzzleTypes.find((puzzle) => puzzle.id === selectedPuzzleId) ?? puzzleTypes[0],
    [selectedPuzzleId]
  );

  const legalTargets = useMemo(
    () => (selectedSquare ? game.moves({ square: selectedSquare, verbose: true }).map((move) => move.to) : []),
    [game, selectedSquare]
  );

  const resetPuzzle = (puzzleId = selectedPuzzleId) => {
    const nextPuzzle = puzzleTypes.find((puzzle) => puzzle.id === puzzleId) ?? puzzleTypes[0];
    setGame(new Chess(nextPuzzle.fen));
    setSelectedSquare(null);
    setLastMove(null);
    setIsSolved(false);
    setHintVisible(false);
    setAttempts(0);
  };

  const handleSelectPuzzle = (puzzleId: string) => {
    setSelectedPuzzleId(puzzleId);
    resetPuzzle(puzzleId);
  };

  const handleSquarePress = (square: Square) => {
    if (isSolved) return;

    const current = new Chess(game.fen());

    if (selectedSquare) {
      const candidate = current.moves({ square: selectedSquare, verbose: true }).find((move) => move.to === square);

      if (candidate) {
        const appliedMove = current.move({ from: selectedSquare, to: square, promotion: 'q' });

        if (!appliedMove) {
          setSelectedSquare(null);
          return;
        }

        const isCorrect = selectedSquare === activePuzzle.solution.from && square === activePuzzle.solution.to;

        setGame(current);
        setLastMove({ from: selectedSquare, to: square });
        setSelectedSquare(null);
        setAttempts((prev) => prev + 1);

        if (isCorrect) {
          setIsSolved(true);
          Alert.alert('Excelente!', `Você resolveu o puzzle: ${activePuzzle.title}.`);
          return;
        }

        Alert.alert('Lance incorreto', activePuzzle.hint);
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
    Alert.alert('Dica', `${activePuzzle.hint} O lance correto é ${activePuzzle.solution.from} → ${activePuzzle.solution.to}.`);
  };

  const handleReset = () => {
    resetPuzzle();
    Alert.alert('Quebra-cabeça reiniciado', `Nova tentativa: ${activePuzzle.objective}`);
  };

  const renderBoard = () => {
    const board = game.board();

    return board.map((row, rowIndex) => (
      <View key={`row-${rowIndex}`} style={styles.boardRow}>
        {row.map((piece, colIndex) => {
          const square = `${files[colIndex]}${8 - rowIndex}` as Square;
          const isDark = (rowIndex + colIndex) % 2 === 1;
          const isSelected = selectedSquare === square;
          const isTarget = legalTargets.includes(square);
          const isLastMoveSquare = lastMove?.from === square || lastMove?.to === square;

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
                isSelected && { borderWidth: 2, borderColor: colors.boardSelected },
                isLastMoveSquare && { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 2 },
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
        <TouchableOpacity style={styles.backButtonTop} activeOpacity={0.7} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={[styles.topBarTitle, { color: colors.text }]}>Tática Diária</Text>
          <Text style={[styles.topBarSub, { color: colors.accent }]}>Desafios de Puzzles</Text>
        </View>

        <View style={[styles.topBarIconWrap, { backgroundColor: `${colors.accent}20` }]}>
          <Ionicons name="extension-puzzle" size={20} color={colors.accent} />
        </View>
      </View>

      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.heroTopLine}>
            <View style={[styles.difficultyBadge, { backgroundColor: `${activePuzzle.color}20` }]}>
              <View style={[styles.difficultyDot, { backgroundColor: activePuzzle.color }]} />
              <Text style={[styles.difficultyText, { color: activePuzzle.color }]}>{activePuzzle.level.toUpperCase()}</Text>
            </View>
            <Text style={[styles.streakText, { color: colors.accent }]}>Série: 8 🔥</Text>
          </View>

          <View style={[styles.boardPreview, { borderColor: colors.borderStrong }]}>{renderBoard()}</View>

          <View style={styles.heroCopy}>
            <Text style={[styles.heroKicker, { color: activePuzzle.color }]}>DESAFIO ATUAL</Text>
            <Text style={[styles.heroTitle, { color: colors.text }]}>{activePuzzle.title}</Text>
            <Text style={[styles.heroDescription, { color: colors.textSecondary }]}>{activePuzzle.objective}</Text>
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
              <Ionicons name="bulb" size={18} color={colors.accent} />
            </View>
            <View style={styles.actionHeaderText}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Puzzles Offline</Text>
              <Text style={[styles.taskText, { color: colors.textSecondary }]}>
                {attempts === 0 ? 'Resolva sem internet e use a dica com inteligência.' : `Tentativas: ${attempts}`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.challengeHeader}>
          <Text style={[styles.challengeTitle, { color: colors.text }]}>Outros Puzzles</Text>
        </View>

        <View style={styles.challengeGrid}>
          {puzzleTypes.map((puzzle) => {
            const isSelected = puzzle.id === selectedPuzzleId;
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
                <View style={[styles.challengeIcon, { backgroundColor: `${puzzle.color}20` }]}>
                  <Ionicons name={puzzle.icon as any} size={20} color={puzzle.color} />
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
  hintText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
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
  challengeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
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
