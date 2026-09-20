import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { useAppTheme } from '../context/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Puzzle'>;

const puzzleTypes = [
  { id: 'mate', title: 'Mate em 2', subtitle: 'Ataque decisivo', icon: 'flash', color: '#f5b858', level: 'Intermediário' },
  { id: 'fork', title: 'Garfo tático', subtitle: 'Ganhe material', icon: 'git-branch', color: '#81b64c', level: 'Fácil' },
  { id: 'endgame', title: 'Finais', subtitle: 'Converta a vantagem', icon: 'flag', color: '#5fa8ff', level: 'Avançado' },
  { id: 'defense', title: 'Defesa precisa', subtitle: 'Encontre o recurso', icon: 'shield-checkmark', color: '#9b8cff', level: 'Difícil' },
] as const;

export default function PuzzleScreen({ navigation }: Props) {
  const { colors } = useAppTheme();
  const [started, setStarted] = useState(false);
  const [selectedPuzzle, setSelectedPuzzle] = useState('mate');
  const activePuzzle = puzzleTypes.find((p) => p.id === selectedPuzzle) ?? puzzleTypes[0];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>Centro de Treinamento</Text>
          <Text style={[styles.title, { color: colors.text }]}>Tática Diária</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Encontre o melhor lance na posição.
          </Text>
        </View>
        <View style={[styles.headerBadge, { backgroundColor: `${colors.accent}20` }]}>
          <Ionicons name="extension-puzzle" size={22} color={colors.accent} />
        </View>
      </View>

      {/* Hero Puzzle Board */}
      <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.heroTopLine}>
          <View style={[styles.difficultyBadge, { backgroundColor: `${activePuzzle.color}20` }]}>
            <View style={[styles.difficultyDot, { backgroundColor: activePuzzle.color }]} />
            <Text style={[styles.difficultyText, { color: activePuzzle.color }]}>
              {activePuzzle.level.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.streakText, { color: colors.accent }]}>Série: 8 🔥</Text>
        </View>

        <View style={[styles.boardPreview, { borderColor: colors.borderStrong }]}>
          {['♜', '', '', '♟', '', '', '♚', '', '', '♙', '', '♘', '', '', '', '', '', '', '♗', '', '', '', '', '', '', '', '', '', '', '♕', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '♔'].map((piece, index) => {
            const isDark = (Math.floor(index / 8) + (index % 8)) % 2 === 1;
            return (
              <View
                key={index}
                style={[
                  styles.boardSquare,
                  { backgroundColor: isDark ? colors.boardDark : colors.boardLight },
                ]}
              >
                {piece ? (
                  <Text
                    style={[
                      styles.boardPiece,
                      index < 32 ? styles.blackPiece : styles.whitePiece,
                    ]}
                  >
                    {piece}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={styles.heroCopy}>
          <Text style={[styles.heroKicker, { color: activePuzzle.color }]}>DESAFIO ATUAL</Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>{activePuzzle.title}</Text>
          <Text style={[styles.heroDescription, { color: colors.textSecondary }]}>
            Brancas jogam e ganham vantagem decisiva em poucos lances.
          </Text>
        </View>
      </View>

      {/* Training Motivation Banner */}
      <View style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.actionHeader}>
          <View style={[styles.actionIcon, { backgroundColor: `${colors.accent}20` }]}>
            <Ionicons name="bulb" size={18} color={colors.accent} />
          </View>
          <View style={styles.actionHeaderText}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Puzzles Offline</Text>
            <Text style={[styles.taskText, { color: colors.textSecondary }]}>
              Resolva sem internet a qualquer momento.
            </Text>
          </View>
        </View>
      </View>

      {/* Category selector */}
      <View style={styles.challengeHeader}>
        <Text style={[styles.challengeTitle, { color: colors.text }]}>Outros Puzzles</Text>
      </View>

      <View style={styles.challengeGrid}>
        {puzzleTypes.map((puzzle) => {
          const isSelected = puzzle.id === selectedPuzzle;
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
              onPress={() => {
                setSelectedPuzzle(puzzle.id);
                setStarted(false);
              }}
            >
              <View style={[styles.challengeIcon, { backgroundColor: `${puzzle.color}20` }]}>
                <Ionicons name={puzzle.icon as any} size={20} color={puzzle.color} />
              </View>
              <Text style={[styles.challengeCardTitle, { color: colors.text }]}>{puzzle.title}</Text>
              <Text style={[styles.challengeCardSubtitle, { color: colors.textSecondary }]}>
                {puzzle.subtitle}
              </Text>
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

      {/* Start puzzle button */}
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: started ? colors.primary : colors.accent }]}
        activeOpacity={0.8}
        onPress={() => setStarted(!started)}
      >
        <Ionicons name={started ? 'checkmark-circle' : 'play'} size={20} color="#171614" />
        <Text style={styles.primaryButtonText}>
          {started ? 'Resolvendo quebra-cabeça...' : 'Iniciar quebra-cabeça'}
        </Text>
      </TouchableOpacity>

      {/* Back button */}
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        activeOpacity={0.7}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={18} color={colors.text} />
        <Text style={[styles.backButtonText, { color: colors.text }]}>Voltar ao Menu</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
  },
  headerBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 12,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '800',
  },
  streakText: {
    fontSize: 13,
    fontWeight: '800',
  },
  boardPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 14,
  },
  boardSquare: {
    width: '12.5%',
    height: '12.5%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardPiece: {
    fontSize: 22,
    fontWeight: '900',
  },
  blackPiece: {
    color: '#1a1816',
  },
  whitePiece: {
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroCopy: {
    paddingHorizontal: 4,
  },
  heroKicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  heroDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  taskText: {
    fontSize: 12,
  },
  challengeHeader: {
    marginBottom: 12,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  challengeGrid: {
    gap: 10,
    marginBottom: 20,
  },
  challengeCard: {
    borderRadius: 16,
    padding: 14,
  },
  challengeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeLevel: {
    fontSize: 12,
    fontWeight: '800',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#171614',
    fontSize: 15,
    fontWeight: '800',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
