import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Puzzle'>;

const puzzleTypes = [
  { id: 'mate', title: 'Mate em 2', subtitle: 'Ataque decisivo', icon: 'flash', color: '#f5b858', level: 'Intermediário' },
  { id: 'fork', title: 'Garfo tático', subtitle: 'Ganhe material', icon: 'git-branch', color: '#81b64c', level: 'Fácil' },
  { id: 'endgame', title: 'Finais', subtitle: 'Converta a vantagem', icon: 'flag', color: '#5fa8ff', level: 'Avançado' },
  { id: 'defense', title: 'Defesa precisa', subtitle: 'Encontre o recurso', icon: 'shield-checkmark', color: '#9b8cff', level: 'Difícil' },
] as const;

export default function PuzzleScreen({ navigation }: Props) {
  const [started, setStarted] = useState(false);
  const [selectedPuzzle, setSelectedPuzzle] = useState('mate');
  const activePuzzle = puzzleTypes.find((puzzle) => puzzle.id === selectedPuzzle) ?? puzzleTypes[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Centro de treinamento</Text>
          <Text style={styles.title}>Tática do dia</Text>
          <Text style={styles.description}>Leia a posição. Encontre a ideia.</Text>
        </View>
        <View style={styles.headerBadge}>
          <Ionicons name="extension-puzzle" size={21} color="#f5b858" />
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroGlow} />
        <View style={styles.heroTopLine}>
          <View style={styles.difficultyBadge}>
            <View style={styles.difficultyDot} />
            <Text style={styles.difficultyText}>INTERMEDIÁRIO</Text>
          </View>
          <Text style={styles.streakText}>Série 8</Text>
        </View>

        <View style={styles.boardPreview}>
          {['♜', '', '', '♟', '', '', '♚', '', '', '♙', '', '♘', '', '', '', '', '', '', '♗', '', '', '', '', '', '', '', '', '', '', '♕', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '♔'].map((piece, index) => (
            <View key={index} style={[styles.boardSquare, (Math.floor(index / 8) + index % 8) % 2 === 1 ? styles.boardDark : styles.boardLight]}>
              {piece ? <Text style={[styles.boardPiece, index < 32 ? styles.blackPiece : styles.whitePiece]}>{piece}</Text> : null}
            </View>
          ))}
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.heroKicker}>DESAFIO ATUAL</Text>
          <Text style={styles.heroTitle}>Encontre o melhor lance</Text>
          <Text style={styles.heroDescription}>Mate em 2 movimentos e explique a ideia principal da posição.</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>8</Text>
          <Text style={styles.statLabel}>Séries</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>84%</Text>
          <Text style={styles.statLabel}>Acerto</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>#18</Text>
          <Text style={styles.statLabel}>Ranking</Text>
        </View>
      </View>

      <View style={styles.actionCard}>
        <View style={styles.actionHeader}>
          <View style={styles.actionIcon}>
            <Ionicons name="bulb" size={18} color="#f5b858" />
          </View>
          <View style={styles.actionHeaderText}>
            <Text style={styles.sectionTitle}>Treine com intenção</Text>
            <Text style={styles.taskText}>Cada acerto aumenta sua sequência.</Text>
          </View>
          <Text style={styles.progressLabel}>64%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
      </View>

      <View style={styles.challengeHeader}>
        <View>
          <Text style={styles.challengeTitle}>Mais desafios</Text>
          <Text style={styles.challengeSubtitle}>Escolha como quer treinar hoje</Text>
        </View>
        <Text style={styles.challengeCount}>4 opções</Text>
      </View>

      <View style={styles.challengeGrid}>
        {puzzleTypes.map((puzzle) => {
          const isSelected = puzzle.id === selectedPuzzle;
          return (
            <TouchableOpacity
              key={puzzle.id}
              style={[styles.challengeCard, isSelected && styles.challengeCardSelected]}
              activeOpacity={0.8}
              onPress={() => {
                setSelectedPuzzle(puzzle.id);
                setStarted(false);
              }}
            >
              <View style={[styles.challengeIcon, { backgroundColor: puzzle.color + '20' }]}>
                <Ionicons name={puzzle.icon} size={19} color={puzzle.color} />
              </View>
              <Text style={styles.challengeCardTitle}>{puzzle.title}</Text>
              <Text style={styles.challengeCardSubtitle}>{puzzle.subtitle}</Text>
              <View style={styles.challengeBottom}>
                <Text style={[styles.challengeLevel, { color: puzzle.color }]}>{puzzle.level}</Text>
                {isSelected ? <Ionicons name="checkmark-circle" size={17} color={puzzle.color} /> : <Ionicons name="chevron-forward" size={16} color="#77736f" />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={[styles.primaryButton, started && styles.primaryButtonActive]} activeOpacity={0.8} onPress={() => setStarted(true)}>
        <Ionicons name={started ? 'checkmark-circle' : 'play'} size={19} color="#171614" />
        <Text style={styles.primaryButtonText}>{started ? 'Desafio em andamento' : 'Iniciar quebra-cabeça'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        activeOpacity={0.7}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={18} color="#ffffff" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171614',
  },
  content: {
    padding: 18,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  eyebrow: {
    color: '#f5b858',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  headerBadge: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2115',
    borderWidth: 1,
    borderColor: 'rgba(245,184,88,0.28)',
  },
  heroCard: {
    backgroundColor: '#211d18',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(245,184,88,0.24)',
    padding: 16,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#f5b858',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.13,
    shadowRadius: 14,
    elevation: 4,
  },
  heroGlow: {
    position: 'absolute',
    top: -65,
    right: -48,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(245,184,88,0.08)',
  },
  heroTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245,184,88,0.13)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f5b858',
  },
  difficultyText: {
    color: '#f5b858',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  streakText: {
    color: '#b9aa91',
    fontSize: 11,
    fontWeight: '800',
  },
  title: {
    fontSize: 29,
    fontWeight: '900',
    color: '#ffffff',
  },
  description: {
    fontSize: 13,
    color: '#9f978c',
    marginTop: 5,
  },
  boardPreview: {
    width: '100%',
    aspectRatio: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#30291e',
  },
  boardSquare: {
    width: '12.5%',
    height: '12.5%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardLight: { backgroundColor: '#ead8b8' },
  boardDark: { backgroundColor: '#9a7655' },
  boardPiece: {
    fontSize: 25,
    lineHeight: 27,
    textAlign: 'center',
  },
  blackPiece: { color: '#231d18' },
  whitePiece: { color: '#fff7e8' },
  heroCopy: {
    marginTop: 15,
  },
  heroKicker: {
    color: '#f5b858',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 21,
    fontWeight: '900',
    marginTop: 4,
  },
  heroDescription: {
    color: '#bdb3a7',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1d1b1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 18,
  },
  statLabel: {
    color: '#a8a5a2',
    fontSize: 11,
    marginTop: 4,
  },
  actionCard: {
    backgroundColor: '#1d1b1a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 18,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,184,88,0.14)',
    marginRight: 11,
  },
  actionHeaderText: { flex: 1 },
  progressLabel: {
    color: '#f5b858',
    fontSize: 12,
    fontWeight: '900',
  },
  progressTrack: {
    height: 6,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginTop: 14,
  },
  progressFill: {
    width: '64%',
    height: '100%',
    borderRadius: 99,
    backgroundColor: '#f5b858',
  },
  sectionTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 17,
    marginBottom: 8,
  },
  taskText: {
    color: '#d7d3cf',
    fontSize: 12,
    marginTop: 3,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  challengeTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  challengeSubtitle: {
    color: '#8d8985',
    fontSize: 11,
    marginTop: 3,
  },
  challengeCount: {
    color: '#a8a5a2',
    fontSize: 11,
    fontWeight: '700',
  },
  challengeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  challengeCard: {
    width: '48.5%',
    minHeight: 142,
    backgroundColor: '#1d1b1a',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 13,
  },
  challengeCardSelected: {
    backgroundColor: '#292219',
    borderColor: 'rgba(245,184,88,0.45)',
  },
  challengeIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },
  challengeCardTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  challengeCardSubtitle: {
    color: '#96918c',
    fontSize: 10,
    marginTop: 4,
  },
  challengeBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  challengeLevel: {
    fontSize: 10,
    fontWeight: '800',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f5b858',
    borderRadius: 15,
    paddingVertical: 14,
    marginBottom: 14,
    shadowColor: '#f5b858',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonActive: {
    backgroundColor: '#b9f27c',
  },
  primaryButtonText: {
    color: '#171614',
    fontWeight: '800',
    fontSize: 15,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#353331',
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
