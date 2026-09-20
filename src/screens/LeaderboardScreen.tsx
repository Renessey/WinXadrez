import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Leaderboard'>;

const rankings = [
  { name: 'Júlia', score: '1625', accent: '#f7d36d' },
  { name: 'Mateus', score: '1602', accent: '#b0bec5' },
  { name: 'Lucas', score: '1578', accent: '#d18a5d' },
  { name: 'Você', score: '1560', accent: '#81b64c' },
];

export default function LeaderboardScreen({ navigation }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState('Semana');
  const [selectedPlayer, setSelectedPlayer] = useState('Você');
  const periodOptions = ['Semana', 'Mês', 'Temporada'];
  const periodDescription = selectedPeriod === 'Semana'
    ? 'Os melhores jogadores da semana.'
    : selectedPeriod === 'Mês'
      ? 'Os melhores jogadores do mês.'
      : 'O ranking geral da temporada.';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Competição semanal</Text>
          <Text style={styles.title}>Ranking global</Text>
          <Text style={styles.subtitle}>{periodDescription}</Text>
        </View>
        <View style={styles.trophyBadge}>
          <Ionicons name="trophy" size={22} color="#f7d36d" />
        </View>
      </View>

      <View style={styles.periodSwitcher}>
        {periodOptions.map((period) => (
          <TouchableOpacity
            key={period}
            style={[styles.periodOption, selectedPeriod === period && styles.periodOptionActive]}
            activeOpacity={0.8}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}>
              {period}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroTopLine}>
          <View>
            <Text style={styles.heroLabel}>Sua posição</Text>
            <Text style={styles.heroPosition}>#4 <Text style={styles.heroPositionUnit}>global</Text></Text>
          </View>
          <View style={styles.upBadge}>
            <Ionicons name="arrow-up" size={13} color="#b9f27c" />
            <Text style={styles.upText}>2 posições</Text>
          </View>
        </View>
        <View style={styles.heroProgressTrack}>
          <View style={styles.heroProgressFill} />
        </View>
        <View style={styles.heroFooter}>
          <Text style={styles.heroHint}>Faltam 18 pontos para o pódio</Text>
          <Text style={styles.heroScore}>1560 Elo</Text>
        </View>
      </View>

      <View style={styles.podiumSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Pódio da semana</Text>
            <Text style={styles.sectionSubtitle}>A disputa está acirrada</Text>
          </View>
          <View style={styles.liveDot} />
        </View>
        <View style={styles.podium}>
          <View style={[styles.podiumCard, styles.second]}>
            <View style={[styles.podiumAvatar, { backgroundColor: 'rgba(176,190,197,0.18)' }]}>
              <Text style={[styles.podiumAvatarText, { color: '#b0bec5' }]}>M</Text>
            </View>
            <Text style={[styles.position, { color: '#b0bec5' }]}>2°</Text>
            <Text style={styles.playerName}>Mateus</Text>
            <Text style={styles.playerScore}>1602 Elo</Text>
          </View>
          <View style={[styles.podiumCard, styles.first]}>
            <View style={styles.crown}><Ionicons name="star" size={13} color="#171614" /></View>
            <View style={[styles.podiumAvatar, styles.firstAvatar]}>
              <Text style={[styles.podiumAvatarText, { color: '#f7d36d' }]}>J</Text>
            </View>
            <Text style={[styles.position, { color: '#f7d36d' }]}>1°</Text>
            <Text style={styles.playerName}>Júlia</Text>
            <Text style={styles.playerScore}>1625 Elo</Text>
          </View>
          <View style={[styles.podiumCard, styles.third]}>
            <View style={[styles.podiumAvatar, { backgroundColor: 'rgba(209,138,93,0.18)' }]}>
              <Text style={[styles.podiumAvatarText, { color: '#d18a5d' }]}>L</Text>
            </View>
            <Text style={[styles.position, { color: '#d18a5d' }]}>3°</Text>
            <Text style={styles.playerName}>Lucas</Text>
            <Text style={styles.playerScore}>1578 Elo</Text>
          </View>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Classificação</Text>
          <Text style={styles.listMeta}>ELO</Text>
        </View>
        {rankings.map((player, index) => (
          <TouchableOpacity
            key={player.name}
            style={[styles.rankRow, player.name === 'Você' && styles.currentUserRow, selectedPlayer === player.name && styles.selectedPlayerRow]}
            activeOpacity={0.75}
            onPress={() => setSelectedPlayer(player.name)}
          >
            <View style={styles.rankLeft}>
              <View style={[styles.rankIndexBadge, index < 3 && { backgroundColor: player.accent + '22' }]}>
                <Text style={[styles.rankIndex, index < 3 && { color: player.accent }]}>{index + 1}</Text>
              </View>
              <View style={[styles.listAvatar, { backgroundColor: player.accent + '22' }]}>
                <Text style={[styles.listAvatarText, { color: player.accent }]}>{player.name.charAt(0)}</Text>
              </View>
              <Text style={styles.rankName}>{player.name}</Text>
            </View>
            <View style={styles.scoreGroup}>
              {player.name === 'Você' && <Text style={styles.youLabel}>VOCÊ</Text>}
              <Text style={[styles.rankScore, { color: player.accent }]}>{player.score}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.selectionHint}>
          <Ionicons name="hand-left-outline" size={14} color="#8d8985" />
          <Text style={styles.selectionText}>{selectedPlayer} selecionado</Text>
        </View>
      </View>

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
    color: '#f7d36d',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.7,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  trophyBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2518',
    borderWidth: 1,
    borderColor: 'rgba(247,211,109,0.3)',
  },
  heroCard: {
    backgroundColor: '#252218',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(247,211,109,0.2)',
    padding: 18,
    marginBottom: 20,
    shadowColor: '#f7d36d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
  },
  subtitle: {
    color: '#a8a5a2',
    fontSize: 13,
    marginTop: 4,
  },
  periodSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#1d1b1a',
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  periodOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
  },
  periodOptionActive: {
    backgroundColor: '#f7d36d',
  },
  periodText: {
    color: '#96918c',
    fontSize: 11,
    fontWeight: '800',
  },
  periodTextActive: {
    color: '#171614',
  },
  heroTopLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroLabel: {
    color: '#c2b99d',
    fontSize: 12,
    fontWeight: '700',
  },
  heroPosition: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 3,
  },
  heroPositionUnit: {
    color: '#c2b99d',
    fontSize: 13,
    fontWeight: '700',
  },
  upBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(129,182,76,0.14)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  upText: {
    color: '#b9f27c',
    fontSize: 10,
    fontWeight: '800',
  },
  heroProgressTrack: {
    height: 7,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    marginTop: 17,
  },
  heroProgressFill: {
    width: '74%',
    height: '100%',
    borderRadius: 99,
    backgroundColor: '#f7d36d',
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 9,
  },
  heroHint: {
    color: '#aaa189',
    fontSize: 11,
  },
  heroScore: {
    color: '#f8e7ad',
    fontSize: 11,
    fontWeight: '800',
  },
  podiumSection: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#8d8985',
    fontSize: 11,
    marginTop: 3,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#81b64c',
    shadowColor: '#81b64c',
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 3,
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 18,
  },
  podiumCard: {
    flex: 1,
    backgroundColor: '#1d1b1a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    paddingVertical: 12,
  },
  first: {
    height: 120,
    transform: [{ scale: 1.05 }],
    borderColor: 'rgba(247, 211, 109, 0.45)',
  },
  second: {
    height: 100,
  },
  third: {
    height: 90,
  },
  position: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 7,
    marginBottom: 5,
  },
  playerName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  playerScore: {
    color: '#a8a5a2',
    fontSize: 12,
    marginTop: 4,
  },
  podiumAvatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(247,211,109,0.16)',
  },
  firstAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(247,211,109,0.2)',
  },
  podiumAvatarText: {
    fontSize: 17,
    fontWeight: '900',
  },
  crown: {
    position: 'absolute',
    top: -10,
    width: 25,
    height: 25,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7d36d',
    zIndex: 2,
  },
  panel: {
    backgroundColor: '#1d1b1a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  listTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  listMeta: {
    color: '#77736f',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  currentUserRow: {
    marginHorizontal: -5,
    paddingHorizontal: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(129,182,76,0.08)',
    borderBottomColor: 'rgba(129,182,76,0.16)',
  },
  selectedPlayerRow: {
    borderColor: 'rgba(247,211,109,0.28)',
    borderWidth: 1,
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankIndex: {
    color: '#a8a5a2',
    fontWeight: '700',
    fontSize: 13,
  },
  rankIndexBadge: {
    width: 25,
    height: 25,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listAvatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  listAvatarText: {
    fontSize: 14,
    fontWeight: '900',
  },
  rankName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  rankScore: {
    fontSize: 14,
    fontWeight: '800',
  },
  scoreGroup: {
    alignItems: 'flex-end',
  },
  youLabel: {
    color: '#81b64c',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  selectionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 13,
    paddingHorizontal: 4,
  },
  selectionText: {
    color: '#8d8985',
    fontSize: 11,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e2b33c',
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 18,
  },
  backButtonText: {
    color: '#171614',
    fontSize: 15,
    fontWeight: '800',
  },
});
