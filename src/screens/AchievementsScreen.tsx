import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import {
  getMatches,
  getProfile,
  getPuzzleProgress,
  getUserLevels,
  getUserRankingPosition,
} from '../database/db';

interface AchievementItem {
  id: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
  current: number;
  target: number;
}

export default function AchievementsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<AchievementItem[]>([]);

  const loadAchievements = useCallback(() => {
    const profile = getProfile();
    const matches = getMatches();
    const puzzleProgress = getPuzzleProgress();
    const levels = getUserLevels();
    const ranking = getUserRankingPosition();

    const wins = profile?.wins_count ?? 0;
    const totalMatches = profile?.matches_count ?? 0;
    const points = profile?.rating ?? 0;
    const hardWins = matches.filter((m) => m.result === 'Vitória' && m.difficulty === 'Difícil').length;
    const streak = puzzleProgress.streak;

    const list: AchievementItem[] = [
      {
        id: 'first-win',
        title: 'Primeira Vitória',
        desc: 'Vença sua primeira partida contra o Bot.',
        icon: 'trophy',
        color: '#81b64c',
        current: Math.min(1, wins),
        target: 1,
      },
      {
        id: 'veteran',
        title: 'Enxadrista Ativo',
        desc: 'Complete 10 partidas ranqueadas no tabuleiro.',
        icon: 'game-controller',
        color: '#38bdf8',
        current: Math.min(10, totalMatches),
        target: 10,
      },
      {
        id: 'tactician',
        title: 'Mente Tática',
        desc: 'Resolva 3 puzzles (Lichess ou offline).',
        icon: 'extension-puzzle',
        color: '#f5b858',
        current: Math.min(3, streak),
        target: 3,
      },
      {
        id: 'puzzle-streak',
        title: 'Mestre dos Puzzles',
        desc: 'Alcance uma série de 10 puzzles resolvidos.',
        icon: 'flame',
        color: '#f97316',
        current: Math.min(10, streak),
        target: 10,
      },
      {
        id: 'hard-slayer',
        title: 'Destemido',
        desc: 'Vença uma partida na dificuldade Difícil.',
        icon: 'shield-checkmark',
        color: '#f43f5e',
        current: Math.min(1, hardWins),
        target: 1,
      },
      {
        id: 'level-up',
        title: 'Evolução Constante',
        desc: 'Atinja o Nível Geral 3 acumulando vitórias.',
        icon: 'trending-up',
        color: '#9b8cff',
        current: Math.min(3, levels.totalLevel),
        target: 3,
      },
      {
        id: 'bronze-tier',
        title: 'Divisão Bronze',
        desc: 'Alcance 200 pontos no ranking geral.',
        icon: 'ribbon',
        color: '#d18a5d',
        current: Math.min(200, points),
        target: 200,
      },
      {
        id: 'top-500',
        title: 'Metade Superior',
        desc: 'Entre para o Top 500 do ranking de 1.000 jogadores.',
        icon: 'podium',
        color: '#5fa8ff',
        current: ranking.rank <= 500 ? 1 : 0,
        target: 1,
      },
    ];

    setItems(list);
  }, []);

  useFocusEffect(loadAchievements);

  const unlockedCount = items.filter((i) => i.current >= i.target).length;
  const totalCount = items.length || 8;
  const completionPct = Math.round((unlockedCount / totalCount) * 100);

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
          <Text style={[styles.topBarTitle, { color: colors.text }]}>Conquistas</Text>
          <Text style={[styles.topBarSub, { color: colors.accent }]}>Medalhas & Metas Reais</Text>
        </View>

        <View style={[styles.topBarIconWrap, { backgroundColor: `${colors.accent}20` }]}>
          <Ionicons name="medal" size={20} color={colors.accent} />
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={[styles.summaryKicker, { color: colors.accent }]}>PROGRESSO GERAL</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {unlockedCount} de {totalCount} medalhas
              </Text>
            </View>
            <View style={[styles.pctBadge, { backgroundColor: `${colors.primary}20` }]}>
              <Text style={[styles.pctText, { color: colors.primary }]}>{completionPct}%</Text>
            </View>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.cardSecondary }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${completionPct}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
        </View>

        <View style={styles.list}>
          {items.map((item) => {
            const unlocked = item.current >= item.target;
            const pct = Math.min(100, Math.round((item.current / item.target) * 100));

            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: unlocked ? item.color : colors.border,
                    borderWidth: unlocked ? 1.5 : 1,
                    opacity: unlocked ? 1 : 0.85,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: unlocked ? `${item.color}22` : colors.cardSecondary },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={unlocked ? item.color : colors.textMuted}
                  />
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                    {unlocked ? (
                      <View style={[styles.statusPill, { backgroundColor: `${item.color}22` }]}>
                        <Text style={[styles.statusText, { color: item.color }]}>Desbloqueada</Text>
                      </View>
                    ) : (
                      <Text style={[styles.counterText, { color: colors.textSecondary }]}>
                        {item.current}/{item.target}
                      </Text>
                    )}
                  </View>

                  <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{item.desc}</Text>

                  <View style={[styles.miniTrack, { backgroundColor: colors.cardSecondary }]}>
                    <View
                      style={[
                        styles.miniFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: unlocked ? item.color : colors.textMuted,
                        },
                      ]}
                    />
                  </View>
                </View>
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
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryKicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  summaryValue: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  pctBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  pctText: { fontSize: 14, fontWeight: '900' },
  progressTrack: { height: 10, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  list: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontSize: 10, fontWeight: '800' },
  counterText: { fontSize: 12, fontWeight: '800' },
  cardDesc: { fontSize: 12, lineHeight: 17, marginBottom: 8 },
  miniTrack: { height: 6, borderRadius: 999, overflow: 'hidden' },
  miniFill: { height: '100%', borderRadius: 999 },
});
