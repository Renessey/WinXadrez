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
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>12</Text>
          <Text style={styles.summaryLabel}>Partidas</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>68%</Text>
          <Text style={styles.summaryLabel}>Vitórias</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>+126</Text>
          <Text style={styles.summaryLabel}>Elo</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Últimos confrontos</Text>

        {matches.map((match) => (
          <View key={match.opponent} style={styles.matchRow}>
            <View style={styles.matchInfo}>
              <Text style={styles.matchOpponent}>{match.opponent}</Text>
              <Text style={styles.matchMode}>{match.mode}</Text>
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
    paddingVertical: 14,
    alignItems: 'center',
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
    marginBottom: 14,
  },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
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
