import React, { useEffect, useState } from 'react';
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
import { getMatches, getProfile, MatchRecord, UserProfile } from '../database/db';
import { useAppTheme } from '../context/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

export default function HistoryScreen({ navigation }: Props) {
  const { colors } = useAppTheme();
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const loadData = () => {
    setMatches(getMatches());
    setProfile(getProfile());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const matchesCount = profile?.matches_count ?? 0;
  const winsCount = profile?.wins_count ?? 0;
  const winPercent = matchesCount > 0 ? Math.round((winsCount / matchesCount) * 100) : 0;
  const rating = profile?.rating ?? 1200;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Desempenho</Text>
          <Text style={[styles.title, { color: colors.text }]}>Histórico de Jogos</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Partidas registradas.
          </Text>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: `${colors.primary}22` }]}>
          <Ionicons name="analytics" size={22} color={colors.primary} />
        </View>
      </View>

      {/* Overview Card */}
      <View style={[styles.overviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.overviewTop}>
          <View>
            <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Rating Atual</Text>
            <Text style={[styles.overviewValue, { color: colors.text }]}>
              {rating} <Text style={[styles.overviewUnit, { color: colors.accent }]}>Elo</Text>
            </Text>
          </View>
          <View style={[styles.trendBadge, { backgroundColor: `${colors.primary}18` }]}>
            <Ionicons name="medal-outline" size={14} color={colors.primary} />
            <Text style={[styles.trendText, { color: colors.primary }]}>{winPercent}% vitórias</Text>
          </View>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: colors.chipBg }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${Math.min(winPercent, 100)}%` }]} />
        </View>

        <View style={styles.overviewFooter}>
          <Text style={[styles.overviewHint, { color: colors.textSecondary }]}>
            {matchesCount === 0 ? 'Nenhuma partida jogada ainda' : `${winsCount} vitória(s) em ${matchesCount} confronto(s)`}
          </Text>
          <Text style={[styles.overviewPercent, { color: colors.primary }]}>{winPercent}%</Text>
        </View>
      </View>

      {/* Summary Counters */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.summaryIcon, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons name="game-controller" size={16} color={colors.primary} />
          </View>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{matchesCount}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Partidas</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.summaryIcon, { backgroundColor: `${colors.accent}20` }]}>
            <Ionicons name="pie-chart" size={16} color={colors.accent} />
          </View>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{winsCount}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Vitórias</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.summaryIcon, { backgroundColor: `${colors.danger}20` }]}>
            <Ionicons name="close" size={16} color={colors.danger} />
          </View>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{profile?.losses_count ?? 0}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Derrotas</Text>
        </View>
      </View>

      {/* Match List Section */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Partidas Recentes</Text>

      {matches.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="file-tray-outline" size={38} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhuma partida registrada</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            Ao jogar contra o Bot no tabuleiro, todos os seus resultados e variações de Elo aparecerão aqui!
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Game')}
          >
            <Ionicons name="play" size={16} color="#ffffff" />
            <Text style={styles.emptyButtonText}>Jogar Partida</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {matches.map((item) => {
            const isWin = item.result === 'Vitória';
            const isLoss = item.result === 'Derrota';
            const badgeColor = isWin ? colors.primary : isLoss ? colors.danger : colors.accent;
            const badgeBg = `${badgeColor}18`;

            return (
              <View
                key={item.id}
                style={[styles.matchCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.matchLeft}>
                  <View style={[styles.resultIconWrap, { backgroundColor: badgeBg }]}>
                    <Ionicons
                      name={isWin ? 'trophy' : isLoss ? 'close' : 'remove'}
                      size={20}
                      color={badgeColor}
                    />
                  </View>
                  <View>
                    <Text style={[styles.matchOpponent, { color: colors.text }]}>
                      {item.opponent}
                    </Text>
                    <Text style={[styles.matchMeta, { color: colors.textSecondary }]}>
                      Nível: {item.difficulty} • {item.moves_count} lances • {item.date}
                    </Text>
                  </View>
                </View>

                <View style={styles.matchRight}>
                  <View style={[styles.resultBadge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.resultText, { color: badgeColor }]}>{item.result}</Text>
                  </View>
                  <Text
                    style={[
                      styles.ratingDiff,
                      { color: item.rating_change >= 0 ? colors.primary : colors.danger },
                    ]}
                  >
                    {item.rating_change >= 0 ? `+${item.rating_change}` : item.rating_change} Elo
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  subtitle: {
    fontSize: 13,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  overviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  overviewValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  overviewUnit: {
    fontSize: 15,
    fontWeight: '800',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 7,
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
  },
  overviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewHint: {
    fontSize: 12,
  },
  overviewPercent: {
    fontSize: 13,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  list: {
    gap: 10,
    marginBottom: 20,
  },
  matchCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  resultIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchOpponent: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  matchMeta: {
    fontSize: 11,
  },
  matchRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  resultText: {
    fontSize: 11,
    fontWeight: '800',
  },
  ratingDiff: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 14,
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
