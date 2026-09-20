import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { getRanking, RankingPlayerItem } from '../database/db';
import { useAppTheme } from '../context/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Leaderboard'>;

type FilterTab = 'top' | 'nearUser';

export default function LeaderboardScreen({ navigation }: Props) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('top');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(15);

  const [players, setPlayers] = useState<RankingPlayerItem[]>([]);
  const [userRank, setUserRank] = useState(1001);
  const [userPoints, setUserPoints] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(1001);

  const loadData = useCallback(() => {
    const data = getRanking(displayLimit, searchQuery, selectedFilter);
    setPlayers(data.players);
    setUserRank(data.userRank);
    setUserPoints(data.userPoints);
    setTotalPlayers(data.totalPlayers);
  }, [displayLimit, searchQuery, selectedFilter]);

  useEffect(() => {
    loadData();
    const unsub = navigation.addListener('focus', () => {
      loadData();
    });
    return unsub;
  }, [navigation, loadData]);

  const handleLoadMore = () => {
    setDisplayLimit((prev) => prev + 15);
  };

  // Top 3 do ranking
  const top1 = players[0] && players[0].rank === 1 ? players[0] : null;
  const top2 = players.find((p) => p.rank === 2) || null;
  const top3 = players.find((p) => p.rank === 3) || null;

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* 1. Barra Superior com Botão de Voltar no Canto Superior Esquerdo */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButtonTop}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={[styles.topBarTitle, { color: colors.text }]}>Ranking Geral</Text>
          <Text style={[styles.topBarSub, { color: colors.accent }]}>Liga dos 1.000</Text>
        </View>

        <View style={[styles.trophyIconWrap, { backgroundColor: `${colors.accent}20` }]}>
          <Ionicons name="trophy" size={20} color={colors.accent} />
        </View>
      </View>

      {/* 2. Card de Classificação Pessoal do Jogador */}
      <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.heroTopLine}>
          <View>
            <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>Sua Classificação</Text>
            <Text style={[styles.heroPosition, { color: colors.text }]}>
              #{userRank} <Text style={[styles.heroPositionUnit, { color: colors.accent }]}>de {totalPlayers}</Text>
            </Text>
          </View>
          <View style={[styles.upBadge, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons name="star" size={14} color={colors.primary} />
            <Text style={[styles.upText, { color: colors.primary }]}>{userPoints} Pontos</Text>
          </View>
        </View>
        <Text style={[styles.heroHint, { color: colors.textSecondary }]}>
          Todos os jogadores começam com 0 pontos. Ganhe partidas para subir posições!
        </Text>
      </View>

      {/* 3. Pódio Top 3 (quando não há busca ativa) */}
      {!searchQuery.trim() && top1 && (
        <View style={[styles.podiumSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.podiumTitle, { color: colors.text }]}>Top 3 Líderes</Text>
          <View style={styles.podium}>
            {/* 2nd place */}
            <View style={[styles.podiumCard, styles.second, { backgroundColor: colors.cardSecondary }]}>
              <View style={[styles.podiumRankBadge, { backgroundColor: '#b0bec530' }]}>
                <Text style={[styles.position, { color: '#b0bec5' }]}>2°</Text>
              </View>
              <Text style={[styles.podiumName, { color: colors.text }]} numberOfLines={1}>
                {top2?.name || 'Mestre'}
              </Text>
              <Text style={[styles.podiumScore, { color: colors.textSecondary }]}>
                {top2?.points || 0} pts
              </Text>
            </View>

            {/* 1st place */}
            <View
              style={[
                styles.podiumCard,
                styles.first,
                { backgroundColor: `${colors.accent}18`, borderColor: colors.accent, borderWidth: 1.5 },
              ]}
            >
              <Ionicons name="star" size={18} color={colors.accent} style={styles.crownIcon} />
              <View style={[styles.podiumRankBadge, { backgroundColor: `${colors.accent}30` }]}>
                <Text style={[styles.position, { color: colors.accent }]}>1°</Text>
              </View>
              <Text style={[styles.podiumName, { color: colors.text, fontWeight: '900' }]} numberOfLines={1}>
                {top1.name}
              </Text>
              <Text style={[styles.podiumScore, { color: colors.accent, fontWeight: '800' }]}>
                {top1.points} pts
              </Text>
            </View>

            {/* 3rd place */}
            <View style={[styles.podiumCard, styles.third, { backgroundColor: colors.cardSecondary }]}>
              <View style={[styles.podiumRankBadge, { backgroundColor: '#d18a5d30' }]}>
                <Text style={[styles.position, { color: '#d18a5d' }]}>3°</Text>
              </View>
              <Text style={[styles.podiumName, { color: colors.text }]} numberOfLines={1}>
                {top3?.name || 'Mestre'}
              </Text>
              <Text style={[styles.podiumScore, { color: colors.textSecondary }]}>
                {top3?.points || 0} pts
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 4. Abas de Filtro: Líderes vs Perto de Você */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[
            styles.tabOption,
            selectedFilter === 'top'
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
          ]}
          activeOpacity={0.8}
          onPress={() => {
            setSelectedFilter('top');
            setDisplayLimit(15);
            setSearchQuery('');
          }}
        >
          <Ionicons
            name="trophy-outline"
            size={14}
            color={selectedFilter === 'top' ? '#ffffff' : colors.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabText,
              { color: selectedFilter === 'top' ? '#ffffff' : colors.textSecondary },
            ]}
          >
            Líderes do Ranking
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabOption,
            selectedFilter === 'nearUser'
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
          ]}
          activeOpacity={0.8}
          onPress={() => {
            setSelectedFilter('nearUser');
            setSearchQuery('');
          }}
        >
          <Ionicons
            name="person-outline"
            size={14}
            color={selectedFilter === 'nearUser' ? '#ffffff' : colors.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabText,
              { color: selectedFilter === 'nearUser' ? '#ffffff' : colors.textSecondary },
            ]}
          >
            Perto de Você
          </Text>
        </TouchableOpacity>
      </View>

      {/* 5. Campo de Busca */}
      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={17} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar jogador ou bot por nome..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={(txt) => {
            setSearchQuery(txt);
            if (txt.trim().length > 0) {
              setDisplayLimit(50);
            }
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setSearchQuery('');
              setDisplayLimit(15);
            }}
          >
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* 6. Cabeçalho de Colunas */}
      <View style={[styles.tableHeaderRow, { borderBottomColor: colors.border }]}>
        <Text style={[styles.colHeaderRank, { color: colors.textSecondary }]}>POS.</Text>
        <Text style={[styles.colHeaderPlayer, { color: colors.textSecondary }]}>JOGADOR</Text>
        <Text style={[styles.colHeaderChange, { color: colors.textSecondary }]}>VAR.</Text>
        <Text style={[styles.colHeaderPoints, { color: colors.textSecondary }]}>PONTOS</Text>
      </View>
    </View>
  );

  const renderPlayerItem = ({ item }: { item: RankingPlayerItem }) => {
    const isUser = item.is_user;
    const isTop1 = item.rank === 1;
    const isTop2 = item.rank === 2;
    const isTop3 = item.rank === 3;

    const rankColor = isTop1
      ? colors.accent
      : isTop2
      ? '#b0bec5'
      : isTop3
      ? '#d18a5d'
      : colors.textSecondary;

    return (
      <View
        style={[
          styles.rankRow,
          { borderBottomColor: colors.border },
          isUser && {
            backgroundColor: `${colors.primary}22`,
            borderColor: colors.primary,
            borderWidth: 1.2,
            borderRadius: 12,
            marginVertical: 2,
          },
        ]}
      >
        {/* Posição */}
        <View style={styles.rankNumWrap}>
          <Text style={[styles.rankIndex, { color: rankColor, fontWeight: item.rank <= 3 ? '900' : '700' }]}>
            #{item.rank}
          </Text>
        </View>

        {/* Jogador com Avatar e Info */}
        <View style={styles.playerInfoCol}>
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: isUser ? colors.primary : `${rankColor}25` },
            ]}
          >
            <Text style={[styles.avatarInitial, { color: isUser ? '#ffffff' : rankColor }]}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.nameAndTierWrap}>
            <View style={styles.nameRow}>
              <Text
                style={[
                  styles.playerName,
                  { color: colors.text, fontWeight: isUser ? '900' : '700' },
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {isUser && (
                <View style={[styles.youPill, { backgroundColor: colors.primary }]}>
                  <Text style={styles.youPillText}>Você</Text>
                </View>
              )}
            </View>

            <Text style={[styles.playerMeta, { color: colors.textSecondary }]}>
              {item.tier} • {item.wins}V / {item.losses}D
            </Text>
          </View>
        </View>

        {/* Variação recente */}
        <View style={styles.changeWrap}>
          {item.position_change > 0 ? (
            <View style={styles.changeBadgeUp}>
              <Ionicons name="arrow-up" size={11} color="#10b981" />
              <Text style={styles.changeTextUp}>{item.position_change}</Text>
            </View>
          ) : item.position_change < 0 ? (
            <View style={styles.changeBadgeDown}>
              <Ionicons name="arrow-down" size={11} color="#ef4444" />
              <Text style={styles.changeTextDown}>{Math.abs(item.position_change)}</Text>
            </View>
          ) : (
            <Text style={[styles.changeNeutral, { color: colors.textMuted }]}>-</Text>
          )}
        </View>

        {/* Pontos */}
        <View style={styles.pointsCol}>
          <Text style={[styles.pointsValue, { color: isUser ? colors.primary : colors.text }]}>
            {item.points}
          </Text>
          <Text style={[styles.pointsUnit, { color: colors.textSecondary }]}>pts</Text>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    // Botão "Ver Mais" quando houver mais jogadores para exibir
    const canLoadMore = selectedFilter === 'top' && !searchQuery.trim() && displayLimit < totalPlayers;

    return (
      <View style={styles.footerContainer}>
        {canLoadMore && (
          <TouchableOpacity
            style={[styles.seeMoreButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={handleLoadMore}
          >
            <Text style={[styles.seeMoreText, { color: colors.accent }]}>
              Ver Mais (+15)
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.accent} />
          </TouchableOpacity>
        )}

        <Text style={[styles.displayInfoText, { color: colors.textMuted }]}>
          Exibindo {players.length} de {totalPlayers} participantes
        </Text>
      </View>
    );
  };

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
      <FlatList
        data={players}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderPlayerItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={8}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={38} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Nenhum jogador encontrado com "{searchQuery}".
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  headerContainer: {
    marginBottom: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  backButtonTop: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  topBarSub: {
    fontSize: 11,
    fontWeight: '700',
  },
  trophyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  heroTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  heroPosition: {
    fontSize: 22,
    fontWeight: '900',
  },
  heroPositionUnit: {
    fontSize: 14,
    fontWeight: '700',
  },
  upBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  upText: {
    fontSize: 14,
    fontWeight: '800',
  },
  heroHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  podiumSection: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  podiumTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
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
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
  },
  podiumRankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  first: {
    paddingVertical: 16,
  },
  second: {
    paddingVertical: 12,
  },
  third: {
    paddingVertical: 10,
  },
  crownIcon: {
    marginBottom: 2,
  },
  position: {
    fontSize: 14,
    fontWeight: '900',
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  podiumScore: {
    fontSize: 11,
  },
  tabSwitcher: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tabOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  colHeaderRank: {
    fontSize: 11,
    fontWeight: '800',
    width: 44,
  },
  colHeaderPlayer: {
    fontSize: 11,
    fontWeight: '800',
    flex: 1,
  },
  colHeaderChange: {
    fontSize: 11,
    fontWeight: '800',
    width: 36,
    textAlign: 'center',
  },
  colHeaderPoints: {
    fontSize: 11,
    fontWeight: '800',
    width: 65,
    textAlign: 'right',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 0.8,
  },
  rankNumWrap: {
    width: 44,
  },
  rankIndex: {
    fontSize: 13,
    fontWeight: '700',
  },
  playerInfoCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 13,
    fontWeight: '800',
  },
  nameAndTierWrap: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    fontSize: 13,
    maxWidth: 130,
  },
  youPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  youPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  playerMeta: {
    fontSize: 10,
    marginTop: 1,
  },
  changeWrap: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeBadgeUp: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeTextUp: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
  },
  changeBadgeDown: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeTextDown: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ef4444',
  },
  changeNeutral: {
    fontSize: 12,
    fontWeight: '700',
  },
  pointsCol: {
    width: 65,
    alignItems: 'flex-end',
  },
  pointsValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  pointsUnit: {
    fontSize: 10,
    fontWeight: '600',
  },
  footerContainer: {
    marginTop: 14,
    marginBottom: 10,
    alignItems: 'center',
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    width: '100%',
    marginBottom: 12,
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: '800',
  },
  displayInfoText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  emptyText: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
});
