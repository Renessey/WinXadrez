import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { getMatches } from '../database/db';

export default function MatchDetailScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string;
    opponent?: string;
    result?: string;
    rating_change?: string;
    player_color?: string;
    difficulty?: string;
    moves_count?: string;
    date?: string;
  }>();

  const match = useMemo(() => {
    if (params.id) {
      const found = getMatches().find((m) => String(m.id) === String(params.id));
      if (found) return found;
    }
    return {
      id: Number(params.id ?? 0),
      opponent: params.opponent ?? 'Bot WinXadrez',
      result: (params.result as 'Vitória' | 'Derrota' | 'Empate') ?? 'Vitória',
      rating_change: Number(params.rating_change ?? 0),
      player_color: (params.player_color as 'w' | 'b') ?? 'w',
      difficulty: (params.difficulty as 'Fácil' | 'Médio' | 'Difícil') ?? 'Médio',
      moves_count: Number(params.moves_count ?? 0),
      date: params.date ?? '-',
    };
  }, [params]);

  const isWin = match.result === 'Vitória';
  const isLoss = match.result === 'Derrota';
  const accentColor = isWin ? colors.primary : isLoss ? colors.danger : colors.accent;

  const analysisSummary = isWin
    ? match.moves_count <= 20
      ? 'Vitória rápida e agressiva! Você aproveitou bem as falhas táticas iniciais.'
      : 'Boa consistência até o final da partida, convertendo a vantagem com precisão.'
    : isLoss
    ? 'Partida exigente. Experimente revisar aberturas ou treinar táticas diárias antes da revanche.'
    : 'Equilíbrio sólido durante todo o confronto, garantindo meio ponto estratégico.';

  const details = [
    { label: 'Adversário', value: match.opponent, icon: 'hardware-chip-outline' },
    { label: 'Nível do Bot', value: match.difficulty, icon: 'speedometer-outline' },
    { label: 'Suas Peças', value: match.player_color === 'b' ? 'Pretas (♚)' : 'Brancas (♔)', icon: 'contrast-outline' },
    { label: 'Total de Lances', value: `${match.moves_count} lances`, icon: 'footsteps-outline' },
    { label: 'Data & Hora', value: match.date, icon: 'calendar-outline' },
  ];

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
          <Text style={[styles.topBarTitle, { color: colors.text }]}>Detalhes da Partida</Text>
          <Text style={[styles.topBarSub, { color: accentColor }]}>Resumo do Confronto</Text>
        </View>

        <View style={[styles.topBarIconWrap, { backgroundColor: `${accentColor}20` }]}>
          <Ionicons name={isWin ? 'trophy' : isLoss ? 'close-circle' : 'remove-circle'} size={20} color={accentColor} />
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: accentColor }]}>
          <View style={[styles.heroIconWrap, { backgroundColor: `${accentColor}20` }]}>
            <Ionicons
              name={isWin ? 'trophy' : isLoss ? 'shield-outline' : 'git-compare-outline'}
              size={34}
              color={accentColor}
            />
          </View>
          <Text style={[styles.heroResult, { color: accentColor }]}>{match.result}</Text>
          <Text style={[styles.heroOpponent, { color: colors.text }]}>vs {match.opponent}</Text>
          <View style={[styles.pointsPill, { backgroundColor: `${accentColor}18` }]}>
            <Text style={[styles.pointsText, { color: accentColor }]}>
              {match.rating_change >= 0 ? `+${match.rating_change}` : match.rating_change} Pontos no Ranking
            </Text>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Dados Técnicos</Text>
          {details.map((row) => (
            <View key={row.label} style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <View style={styles.detailLeft}>
                <Ionicons name={row.icon as any} size={17} color={colors.textSecondary} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{row.label}</Text>
              </View>
              <Text style={[styles.detailValue, { color: colors.text }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.insightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.insightHeader}>
            <Ionicons name="bulb" size={18} color={colors.accent} />
            <Text style={[styles.insightTitle, { color: colors.text }]}>Análise Rápida</Text>
          </View>
          <Text style={[styles.insightBody, { color: colors.textSecondary }]}>{analysisSummary}</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={17} color={colors.text} />
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Voltar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={() =>
              router.push({ pathname: '/game', params: { mode: 'bot', difficulty: match.difficulty } })
            }
          >
            <Ionicons name="refresh" size={17} color="#ffffff" />
            <Text style={styles.primaryBtnText}>Revanche ({match.difficulty})</Text>
          </TouchableOpacity>
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
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroResult: { fontSize: 24, fontWeight: '900' },
  heroOpponent: { fontSize: 15, fontWeight: '700', marginTop: 2, marginBottom: 10 },
  pointsPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  pointsText: { fontSize: 13, fontWeight: '800' },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { fontSize: 13, fontWeight: '600' },
  detailValue: { fontSize: 13, fontWeight: '800' },
  insightCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  insightTitle: { fontSize: 14, fontWeight: '800' },
  insightBody: { fontSize: 13, lineHeight: 19 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 13,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '800' },
  primaryBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    paddingVertical: 13,
  },
  primaryBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
});
