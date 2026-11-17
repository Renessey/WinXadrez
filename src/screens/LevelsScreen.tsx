import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { getUserLevels, getUserRankingPosition, UserLevelsSummary } from '../database/db';

const leagueTiers = [
  { name: 'Iniciante', minPoints: 0, color: '#94a3b8' },
  { name: 'Bronze', minPoints: 200, color: '#d18a5d' },
  { name: 'Prata', minPoints: 500, color: '#b0bec5' },
  { name: 'Ouro', minPoints: 1100, color: '#f5b858' },
  { name: 'Diamante', minPoints: 1700, color: '#38bdf8' },
  { name: 'Mestre', minPoints: 2400, color: '#9b8cff' },
];

export default function LevelsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [levels, setLevels] = useState<UserLevelsSummary>(() => getUserLevels());
  const [ranking, setRanking] = useState(() => getUserRankingPosition());

  useFocusEffect(
    useCallback(() => {
      setLevels(getUserLevels());
      setRanking(getUserRankingPosition());
    }, [])
  );

  const difficultyCards = [
    { data: levels.facil, color: '#81b64c', icon: 'school-outline' },
    { data: levels.medio, color: '#38bdf8', icon: 'hardware-chip-outline' },
    { data: levels.dificil, color: '#f43f5e', icon: 'flame-outline' },
  ];

  const currentTier =
    [...leagueTiers].reverse().find((t) => ranking.points >= t.minPoints) ?? leagueTiers[0];

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
          <Text style={[styles.topBarTitle, { color: colors.text }]}>Níveis & Ligas</Text>
          <Text style={[styles.topBarSub, { color: colors.primary }]}>Evolução por Dificuldade</Text>
        </View>

        <View style={[styles.topBarIconWrap, { backgroundColor: `${colors.primary}20` }]}>
          <Ionicons name="trending-up" size={20} color={colors.primary} />
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.heroRow}>
            <View>
              <Text style={[styles.heroKicker, { color: colors.accent }]}>NÍVEL GERAL</Text>
              <Text style={[styles.heroLevel, { color: colors.text }]}>Nível {levels.totalLevel}</Text>
              <Text style={[styles.heroMeta, { color: colors.textSecondary }]}>
                Posição #{ranking.rank} de {ranking.total} • {ranking.points} Pontos
              </Text>
            </View>
            <View style={[styles.tierBadge, { backgroundColor: `${currentTier.color}22`, borderColor: currentTier.color }]}>
              <Text style={[styles.tierBadgeText, { color: currentTier.color }]}>{currentTier.name}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Progresso por Dificuldade</Text>
        <View style={styles.cardsCol}>
          {difficultyCards.map(({ data, color, icon }) => (
            <View
              key={data.difficulty}
              style={[styles.diffCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.diffHeader}>
                <View style={styles.diffLeft}>
                  <View style={[styles.diffIcon, { backgroundColor: `${color}20` }]}>
                    <Ionicons name={icon as any} size={20} color={color} />
                  </View>
                  <View>
                    <Text style={[styles.diffTitle, { color: colors.text }]}>
                      Modo {data.difficulty} • Nv. {data.level}
                    </Text>
                    <Text style={[styles.diffSub, { color: colors.textSecondary }]}>
                      {data.currentProgress}/{data.winsPerLevel} vitórias para o próximo nível ({data.totalWins} total)
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.progressTrack, { backgroundColor: colors.cardSecondary }]}>
                <View style={[styles.progressFill, { width: `${data.percent}%`, backgroundColor: color }]} />
              </View>

              <TouchableOpacity
                style={[styles.playDiffBtn, { backgroundColor: `${color}18`, borderColor: `${color}55` }]}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({ pathname: '/game', params: { mode: 'bot', difficulty: data.difficulty } })
                }
              >
                <Ionicons name="play" size={14} color={color} />
                <Text style={[styles.playDiffBtnText, { color }]}>Jogar no {data.difficulty}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Divisões do Ranking</Text>
        <View style={[styles.tiersCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {leagueTiers.map((tier) => {
            const reached = ranking.points >= tier.minPoints;
            const isCurrent = tier.name === currentTier.name;
            return (
              <View key={tier.name} style={[styles.tierRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.tierDot, { backgroundColor: tier.color }]} />
                <Text style={[styles.tierName, { color: colors.text, fontWeight: isCurrent ? '900' : '700' }]}>
                  {tier.name} {isCurrent ? '(Atual)' : ''}
                </Text>
                <Text style={[styles.tierPoints, { color: reached ? tier.color : colors.textMuted }]}>
                  {tier.minPoints}+ pts
                </Text>
              </View>
            );
          })}
        </View>
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
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  heroKicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  heroLevel: { fontSize: 28, fontWeight: '900', marginTop: 2 },
  heroMeta: { fontSize: 12, marginTop: 4 },
  tierBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5 },
  tierBadgeText: { fontSize: 13, fontWeight: '900' },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  cardsCol: { gap: 12, marginBottom: 22 },
  diffCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  diffHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  diffLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  diffIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  diffTitle: { fontSize: 15, fontWeight: '800' },
  diffSub: { fontSize: 12, marginTop: 2 },
  progressTrack: { height: 8, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  playDiffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
  },
  playDiffBtnText: { fontSize: 12, fontWeight: '800' },
  tiersCard: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 14 },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  tierDot: { width: 10, height: 10, borderRadius: 5 },
  tierName: { flex: 1, fontSize: 14 },
  tierPoints: { fontSize: 13, fontWeight: '800' },
});
