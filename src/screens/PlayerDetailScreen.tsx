import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { getUserRankingPosition } from '../database/db';

export default function PlayerDetailScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    name?: string;
    rank?: string;
    points?: string;
    tier?: string;
    wins?: string;
    losses?: string;
    draws?: string;
    matches?: string;
    is_user?: string;
  }>();

  const myRanking = useMemo(() => getUserRankingPosition(), []);

  const name = params.name || 'Jogador';
  const rank = Number(params.rank || 1);
  const points = Number(params.points || 0);
  const tier = params.tier || 'Iniciante';
  const wins = Number(params.wins || 0);
  const losses = Number(params.losses || 0);
  const draws = Number(params.draws || 0);
  const matches = Number(params.matches || wins + losses + draws);
  const isUser = params.is_user === '1';

  const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
  const pointsDiff = points - myRanking.points;
  const suggestedDifficulty: 'Fácil' | 'Médio' | 'Difícil' =
    points >= 1600 ? 'Difícil' : points >= 700 ? 'Médio' : 'Fácil';

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
          <Text style={[styles.topBarTitle, { color: colors.text }]}>Ficha do Jogador</Text>
          <Text style={[styles.topBarSub, { color: colors.accent }]}>Ranking Global</Text>
        </View>

        <View style={[styles.topBarIconWrap, { backgroundColor: `${colors.accent}20` }]}>
          <Ionicons name="person" size={20} color={colors.accent} />
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: isUser ? colors.primary : `${colors.accent}25` }]}>
            <Text style={[styles.avatarText, { color: isUser ? '#ffffff' : colors.accent }]}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={[styles.nameText, { color: colors.text }]}>
            {name} {isUser ? '(Você)' : ''}
          </Text>
          <Text style={[styles.rankLine, { color: colors.accent }]}>
            Posição #{rank} • Divisão {tier}
          </Text>

          <View style={[styles.scoreBox, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
            <Text style={[styles.scoreValue, { color: colors.primary }]}>{points}</Text>
            <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>Pontos Totais</Text>
          </View>
        </View>

        <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Desempenho na Liga</Text>
          <View style={styles.grid}>
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: colors.text }]}>{matches}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Partidas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: colors.primary }]}>{wins}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Vitórias</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: colors.danger }]}>{losses}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Derrotas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: colors.accent }]}>{winRate}%</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Aproveit.</Text>
            </View>
          </View>
        </View>

        {!isUser && (
          <View style={[styles.compareCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Comparação com Você</Text>
            <Text style={[styles.compareText, { color: colors.textSecondary }]}>
              {pointsDiff > 0
                ? `${name} está ${pointsDiff} pontos à sua frente (você está em #${myRanking.rank}).`
                : pointsDiff < 0
                ? `Você está ${Math.abs(pointsDiff)} pontos à frente de ${name}!`
                : `Vocês estão empatados com ${points} pontos!`}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
          onPress={() =>
            isUser
              ? router.push('/profile')
              : router.push({ pathname: '/game', params: { mode: 'bot', difficulty: suggestedDifficulty } })
          }
        >
          <Ionicons name={isUser ? 'person-circle-outline' : 'game-controller'} size={18} color="#ffffff" />
          <Text style={styles.primaryBtnText}>
            {isUser ? 'Abrir Meu Perfil Completo' : `Treinar no Nível ${suggestedDifficulty}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  topBarCenter: { flex: 1, alignItems: 'center' },
  topBarTitle: { fontSize: 18, fontWeight: '800' },
  topBarSub: { fontSize: 11, fontWeight: '700' },
  topBarIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 16, paddingBottom: 32 },
  profileCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '900' },
  nameText: { fontSize: 20, fontWeight: '900', textAlign: 'center' },
  rankLine: { fontSize: 13, fontWeight: '700', marginTop: 4, marginBottom: 14 },
  scoreBox: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  scoreValue: { fontSize: 26, fontWeight: '900' },
  scoreLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  statsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 12 },
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  statVal: { fontSize: 18, fontWeight: '900' },
  statLbl: { fontSize: 11, marginTop: 3 },
  compareCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  compareText: { fontSize: 13, lineHeight: 19 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
  },
  primaryBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
});
