import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

const matches = [
  { opponent: 'Júlia', result: 'Vitória', rating: '+34', accent: '#81b64c', mode: 'Blitz' },
  { opponent: 'Pedro', result: 'Derrota', rating: '-18', accent: '#ff6b6b', mode: 'Rápida' },
  { opponent: 'Ana', result: 'Vitória', rating: '+12', accent: '#81b64c', mode: 'Clássica' },
  { opponent: 'Mateus', result: 'Empate', rating: '+4', accent: '#f7d36d', mode: 'Clássica' },
];

export default function HistoryScreen({ navigation }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Performance</Text>
          <Text style={styles.title}>Seu histórico</Text>
          <Text style={styles.subtitle}>Uma leitura rápida da sua evolução.</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="analytics" size={21} color="#b9f27c" />
        </View>
      </View>

      <View style={styles.overviewCard}>
        <View style={styles.overviewTop}>
          <View>
            <Text style={styles.overviewLabel}>Ritmo atual</Text>
            <Text style={styles.overviewValue}>+126 <Text style={styles.overviewUnit}>Elo</Text></Text>
          </View>
          <View style={styles.trendBadge}>
            <Ionicons name="trending-up" size={14} color="#b9f27c" />
            <Text style={styles.trendText}>+12.4%</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
        <View style={styles.overviewFooter}>
          <Text style={styles.overviewHint}>Consistência nas últimas partidas</Text>
          <Text style={styles.overviewPercent}>68%</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, styles.summaryCardHighlight]}>
          <View style={[styles.summaryIcon, { backgroundColor: 'rgba(129,182,76,0.14)' }]}>
            <Ionicons name="game-controller" size={15} color="#b9f27c" />
          </View>
          <Text style={styles.summaryValue}>12</Text>
          <Text style={styles.summaryLabel}>Partidas</Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={[styles.summaryIcon, { backgroundColor: 'rgba(247,211,109,0.14)' }]}>
            <Ionicons name="pie-chart" size={15} color="#f7d36d" />
          </View>
          <Text style={styles.summaryValue}>68%</Text>
          <Text style={styles.summaryLabel}>Vitórias</Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={[styles.summaryIcon, { backgroundColor: 'rgba(95,168,255,0.14)' }]}>
            <Ionicons name="trending-up" size={15} color="#5fa8ff" />
          </View>
          <Text style={styles.summaryValue}>+126</Text>
          <Text style={styles.summaryLabel}>Elo</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Últimos confrontos</Text>
            <Text style={styles.sectionSubtitle}>Suas partidas mais recentes</Text>
          </View>
          <View style={styles.liveDot} />
        </View>

        {matches.map((match) => (
          <View key={match.opponent} style={styles.matchRow}>
            <View style={[styles.matchAvatar, { backgroundColor: match.accent + '22' }]}>
              <Text style={[styles.matchAvatarText, { color: match.accent }]}>{match.opponent.charAt(0)}</Text>
            </View>
            <View style={styles.matchInfo}>
              <Text style={styles.matchOpponent}>{match.opponent}</Text>
              <View style={styles.modeLine}>
                <Ionicons name="time-outline" size={12} color="#8d8985" />
                <Text style={styles.matchMode}>{match.mode}</Text>
              </View>
            </View>

            <View style={styles.matchMeta}>
              <View style={[styles.badge, { backgroundColor: match.accent + '22' }]}> 
                <Text style={[styles.badgeText, { color: match.accent }]}>{match.result}</Text>
              </View>
              <Text style={[styles.rating, { color: match.accent }]}>{match.rating}</Text>
            </View>
          </View>
        ))}
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
    marginBottom: 20,
  },
  eyebrow: {
    color: '#81b64c',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  title: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#9d9995',
    fontSize: 13,
    marginTop: 5,
  },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d2a19',
    borderWidth: 1,
    borderColor: 'rgba(129,182,76,0.25)',
  },
  overviewCard: {
    backgroundColor: '#20271d',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(129,182,76,0.22)',
    padding: 18,
    marginBottom: 14,
    shadowColor: '#81b64c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },
  overviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  overviewLabel: {
    color: '#b4c3a6',
    fontSize: 12,
    fontWeight: '700',
  },
  overviewValue: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 4,
  },
  overviewUnit: {
    color: '#b4c3a6',
    fontSize: 13,
    fontWeight: '700',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(129,182,76,0.14)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  trendText: {
    color: '#b9f27c',
    fontSize: 11,
    fontWeight: '800',
  },
  progressTrack: {
    height: 7,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: 99,
    marginTop: 18,
    overflow: 'hidden',
  },
  progressFill: {
    width: '68%',
    height: '100%',
    backgroundColor: '#81b64c',
    borderRadius: 99,
  },
  overviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 9,
  },
  overviewHint: {
    color: '#9eae91',
    fontSize: 11,
  },
  overviewPercent: {
    color: '#d9efc8',
    fontSize: 11,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1d1b1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  summaryCardHighlight: {
    borderColor: 'rgba(129,182,76,0.2)',
  },
  summaryIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 20,
  },
  summaryLabel: {
    color: '#a8a5a2',
    fontSize: 11,
    marginTop: 4,
  },
  panel: {
    backgroundColor: '#1d1b1a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionSubtitle: {
    color: '#8d8985',
    fontSize: 11,
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
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  matchAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  matchAvatarText: {
    fontSize: 16,
    fontWeight: '900',
  },
  matchInfo: {
    flex: 1,
  },
  matchOpponent: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  matchMode: {
    color: '#a8a5a2',
    fontSize: 11,
    marginTop: 4,
  },
  modeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  matchMeta: {
    alignItems: 'flex-end',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  rating: {
    fontSize: 12,
    fontWeight: '800',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4a75a0',
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 18,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
