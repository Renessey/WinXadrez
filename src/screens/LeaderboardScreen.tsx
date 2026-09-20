import React from 'react';
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
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Ionicons name="trophy" size={36} color="#f7d36d" />
        <Text style={styles.title}>Ranking global</Text>
        <Text style={styles.subtitle}>Top 10 desta semana</Text>
      </View>

      <View style={styles.podium}>
        <View style={[styles.podiumCard, styles.second]}>
          <Text style={styles.position}>2°</Text>
          <Text style={styles.playerName}>Mateus</Text>
          <Text style={styles.playerScore}>1602</Text>
        </View>
        <View style={[styles.podiumCard, styles.first]}>
          <Text style={styles.position}>1°</Text>
          <Text style={styles.playerName}>Júlia</Text>
          <Text style={styles.playerScore}>1625</Text>
        </View>
        <View style={[styles.podiumCard, styles.third]}>
          <Text style={styles.position}>3°</Text>
          <Text style={styles.playerName}>Lucas</Text>
          <Text style={styles.playerScore}>1578</Text>
        </View>
      </View>

      <View style={styles.panel}>
        {rankings.map((player, index) => (
          <View key={player.name} style={styles.rankRow}>
            <View style={styles.rankLeft}>
              <Text style={styles.rankIndex}>{index + 1}</Text>
              <Text style={styles.rankName}>{player.name}</Text>
            </View>
            <Text style={[styles.rankScore, { color: player.accent }]}>{player.score}</Text>
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
  heroCard: {
    backgroundColor: '#1d1b1a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    alignItems: 'center',
    marginBottom: 18,
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
    paddingVertical: 14,
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
    marginBottom: 8,
  },
  playerName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  playerScore: {
    color: '#a8a5a2',
    fontSize: 12,
    marginTop: 6,
  },
  panel: {
    backgroundColor: '#1d1b1a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankIndex: {
    width: 24,
    color: '#a8a5a2',
    fontWeight: '700',
    fontSize: 13,
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
