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
import { getProfile, UserProfile } from '../database/db';
import { useAppTheme } from '../context/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Leaderboard'>;

export default function LeaderboardScreen({ navigation }: Props) {
  const { colors } = useAppTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('Semana');

  useEffect(() => {
    setProfile(getProfile());
    const unsub = navigation.addListener('focus', () => {
      setProfile(getProfile());
    });
    return unsub;
  }, [navigation]);

  const userName = profile?.name || 'Você';
  const userRating = profile?.rating || 1200;

  const rankings = [
    { name: 'Mestre Magnus', score: 1720, accent: '#f7d36d' },
    { name: 'Júlia Bot', score: 1540, accent: '#b0bec5' },
    { name: 'Lucas Tático', score: 1380, accent: '#d18a5d' },
    { name: userName, score: userRating, accent: colors.primary, isUser: true },
    { name: 'Pedro Iniciante', score: 920, accent: colors.textSecondary },
  ].sort((a, b) => b.score - a.score);

  const userIndex = rankings.findIndex((r) => r.isUser);
  const userRank = userIndex >= 0 ? userIndex + 1 : 4;

  const periodOptions = ['Semana', 'Mês', 'Temporada'];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Competição</Text>
          <Text style={[styles.title, { color: colors.text }]}>Ranking Geral</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Classificação com base no seu Rating Elo real.
          </Text>
        </View>
        <View style={[styles.trophyBadge, { backgroundColor: `${colors.accent}20` }]}>
          <Ionicons name="trophy" size={24} color={colors.accent} />
        </View>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSwitcher}>
        {periodOptions.map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodOption,
              selectedPeriod === period
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.chipBg },
            ]}
            activeOpacity={0.8}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodText,
                { color: selectedPeriod === period ? '#ffffff' : colors.textSecondary },
              ]}
            >
              {period}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* User Position Highlight Card */}
      <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.heroTopLine}>
          <View>
            <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>Sua Posição</Text>
            <Text style={[styles.heroPosition, { color: colors.text }]}>
              #{userRank} <Text style={[styles.heroPositionUnit, { color: colors.accent }]}>lugar</Text>
            </Text>
          </View>
          <View style={[styles.upBadge, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons name="trophy-outline" size={14} color={colors.primary} />
            <Text style={[styles.upText, { color: colors.primary }]}>{userRating} Elo</Text>
          </View>
        </View>
      </View>

      {/* Podium Top 3 */}
      <View style={[styles.podiumSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.podiumTitle, { color: colors.text }]}>Top 3 Mestres</Text>
        <View style={styles.podium}>
          {/* 2nd place */}
          <View style={[styles.podiumCard, styles.second, { backgroundColor: colors.chipBg }]}>
            <Text style={[styles.position, { color: '#b0bec5' }]}>2°</Text>
            <Text style={[styles.podiumName, { color: colors.text }]} numberOfLines={1}>
              {rankings[1]?.name || 'Júlia'}
            </Text>
            <Text style={[styles.podiumScore, { color: colors.textSecondary }]}>
              {rankings[1]?.score} Elo
            </Text>
          </View>

          {/* 1st place */}
          <View
            style={[
              styles.podiumCard,
              styles.first,
              { backgroundColor: `${colors.accent}20`, borderColor: colors.accent, borderWidth: 1.5 },
            ]}
          >
            <Ionicons name="star" size={16} color={colors.accent} style={styles.crownIcon} />
            <Text style={[styles.position, { color: colors.accent }]}>1°</Text>
            <Text style={[styles.podiumName, { color: colors.text, fontWeight: '900' }]} numberOfLines={1}>
              {rankings[0]?.name || 'Magnus'}
            </Text>
            <Text style={[styles.podiumScore, { color: colors.accent, fontWeight: '800' }]}>
              {rankings[0]?.score} Elo
            </Text>
          </View>

          {/* 3rd place */}
          <View style={[styles.podiumCard, styles.third, { backgroundColor: colors.chipBg }]}>
            <Text style={[styles.position, { color: '#d18a5d' }]}>3°</Text>
            <Text style={[styles.podiumName, { color: colors.text }]} numberOfLines={1}>
              {rankings[2]?.name || 'Lucas'}
            </Text>
            <Text style={[styles.podiumScore, { color: colors.textSecondary }]}>
              {rankings[2]?.score} Elo
            </Text>
          </View>
        </View>
      </View>

      {/* Leaderboard Table */}
      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.listHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.listTitle, { color: colors.text }]}>Tabela Completa</Text>
          <Text style={[styles.listMeta, { color: colors.textSecondary }]}>RATING</Text>
        </View>

        {rankings.map((player, index) => {
          const isUser = player.isUser;
          return (
            <View
              key={player.name}
              style={[
                styles.rankRow,
                { borderBottomColor: colors.border },
                isUser && { backgroundColor: `${colors.primary}18` },
              ]}
            >
              <View style={styles.rankLeft}>
                <Text style={[styles.rankIndex, { color: index < 3 ? player.accent : colors.textSecondary }]}>
                  #{index + 1}
                </Text>
                <View style={[styles.listAvatar, { backgroundColor: `${player.accent}25` }]}>
                  <Text style={[styles.listAvatarText, { color: player.accent }]}>
                    {player.name.charAt(0)}
                  </Text>
                </View>
                <Text style={[styles.rankName, { color: colors.text, fontWeight: isUser ? '900' : '700' }]}>
                  {player.name} {isUser && '(Você)'}
                </Text>
              </View>

              <Text style={[styles.rankScore, { color: player.accent }]}>{player.score} Elo</Text>
            </View>
          );
        })}
      </View>

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
  trophyBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodSwitcher: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  periodOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  heroTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroPosition: {
    fontSize: 22,
    fontWeight: '900',
  },
  heroPositionUnit: {
    fontSize: 16,
    fontWeight: '800',
  },
  upBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  upText: {
    fontSize: 13,
    fontWeight: '800',
  },
  podiumSection: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  podiumTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  podiumCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  first: {
    paddingVertical: 20,
  },
  second: {
    paddingVertical: 14,
  },
  third: {
    paddingVertical: 10,
  },
  crownIcon: {
    marginBottom: 2,
  },
  position: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  podiumName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  podiumScore: {
    fontSize: 11,
  },
  panel: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 6,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  listMeta: {
    fontSize: 12,
    fontWeight: '700',
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderBottomWidth: 1,
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rankIndex: {
    fontSize: 14,
    fontWeight: '800',
    width: 24,
  },
  listAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listAvatarText: {
    fontSize: 14,
    fontWeight: '800',
  },
  rankName: {
    fontSize: 14,
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
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
