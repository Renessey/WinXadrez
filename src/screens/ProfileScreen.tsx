import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import {
  getProfile,
  getSetting,
  getUserLevels,
  setSetting,
  updateProfileName,
  UserLevelsSummary,
  UserProfile,
} from '../database/db';
import { useAppTheme } from '../context/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const { colors, mode, toggleTheme } = useAppTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [levels, setLevels] = useState<UserLevelsSummary>(() => getUserLevels());

  const [draftName, setDraftName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const loadData = () => {
    const p = getProfile();
    setProfile(p);
    if (p) {
      setDraftName(p.name);
    }
    setLevels(getUserLevels());
    const notifSetting = getSetting('notifications', 'true');
    setNotificationsEnabled(notifSetting === 'true');
  };

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const handleEditProfile = () => {
    setDraftName(profile?.name || 'Jogador');
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    const nextName = draftName.trim();
    if (nextName.length >= 2) {
      updateProfileName(nextName);
      setIsEditingName(false);
      loadData();
    } else {
      Alert.alert('Atenção', 'O nome deve ter pelo menos 2 caracteres.');
    }
  };

  const handleToggleNotifications = () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    setSetting('notifications', next ? 'true' : 'false');
  };

  const matchesCount = profile?.matches_count ?? 0;
  const winsCount = profile?.wins_count ?? 0;
  const lossesCount = profile?.losses_count ?? 0;
  const drawsCount = profile?.draws_count ?? 0;
  const winPercent = matchesCount > 0 ? Math.round((winsCount / matchesCount) * 100) : 0;

  const stats = [
    { label: 'Nível Geral', value: `Nv. ${levels.totalLevel}`, icon: 'trophy', color: colors.accent },
    { label: 'Vitórias', value: `${winPercent}%`, icon: 'medal', color: colors.primary },
    { label: 'Partidas', value: `${matchesCount}`, icon: 'game-controller', color: '#38bdf8' },
  ];

  const settings = [
    {
      label: 'Tema do aplicativo',
      value: mode === 'dark' ? 'Escuro' : 'Claro',
      icon: mode === 'dark' ? 'moon' : 'sunny',
      iconColor: colors.accent,
      onPress: toggleTheme,
    },
    {
      label: 'Notificações de partida',
      value: notificationsEnabled ? 'Ativadas' : 'Desativadas',
      icon: notificationsEnabled ? 'notifications' : 'notifications-off',
      iconColor: colors.primary,
      onPress: handleToggleNotifications,
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header Profile Card */}
      <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatarWrap, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarInitial}>
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'J'}
          </Text>
        </View>

        <View style={styles.headerInfo}>
          {isEditingName ? (
            <TextInput
              style={[styles.nameInput, { color: colors.text, borderBottomColor: colors.primary }]}
              value={draftName}
              onChangeText={setDraftName}
              autoFocus
              maxLength={25}
              placeholder="Seu nome"
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            <Text style={[styles.name, { color: colors.text }]}>{profile?.name || 'Jogador'}</Text>
          )}
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isEditingName ? 'Digite seu novo nome' : `Nível Geral ${levels.totalLevel} • ${profile?.skill_level || 'Iniciante'}`}
          </Text>
        </View>

        {isEditingName ? (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.cancelEditButton, { backgroundColor: colors.chipBg }]}
              activeOpacity={0.8}
              onPress={() => setIsEditingName(false)}
            >
              <Ionicons name="close" size={18} color={colors.danger} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveEditButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
              onPress={handleSaveName}
            >
              <Ionicons name="checkmark" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.chipBg, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={handleEditProfile}
          >
            <Ionicons name="pencil" size={16} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Real Stats Cards */}
      <View style={styles.statsRow}>
        {stats.map((item) => (
          <View
            key={item.label}
            style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.statIcon, { backgroundColor: `${item.color}22` }]}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{item.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Tabela Horizontal de Níveis (Fácil, Médio, Difícil) */}
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Nível por Dificuldade</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.accent }]}>Começa em 0</Text>
        </View>
        <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
          Ganhe partidas para subir de nível. Cada dificuldade tem sua própria meta!
        </Text>

        <View style={styles.levelsTableHorizontal}>
          {/* Coluna Fácil */}
          <View style={[styles.levelColCard, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
            <View style={[styles.levelColBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="leaf" size={14} color="#10b981" />
              <Text style={[styles.levelColName, { color: '#10b981' }]}>Fácil</Text>
            </View>

            <Text style={[styles.levelColValue, { color: colors.text }]}>
              Nv. {levels.facil.level}
            </Text>

            <Text style={[styles.levelColProgressText, { color: colors.textSecondary }]}>
              {levels.facil.currentProgress}/10 vitórias
            </Text>

            <View style={[styles.progressBarContainer, { backgroundColor: colors.surface }]}>
              <View
                style={[
                  styles.progressBarActive,
                  { width: `${levels.facil.percent}%`, backgroundColor: '#10b981' },
                ]}
              />
            </View>
            <Text style={[styles.levelNextText, { color: colors.textMuted }]}>
              Meta: 10 vitórias/nv
            </Text>
          </View>

          {/* Coluna Médio */}
          <View style={[styles.levelColCard, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
            <View style={[styles.levelColBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Ionicons name="flash" size={14} color="#38bdf8" />
              <Text style={[styles.levelColName, { color: '#38bdf8' }]}>Médio</Text>
            </View>

            <Text style={[styles.levelColValue, { color: colors.text }]}>
              Nv. {levels.medio.level}
            </Text>

            <Text style={[styles.levelColProgressText, { color: colors.textSecondary }]}>
              {levels.medio.currentProgress}/6 vitórias
            </Text>

            <View style={[styles.progressBarContainer, { backgroundColor: colors.surface }]}>
              <View
                style={[
                  styles.progressBarActive,
                  { width: `${levels.medio.percent}%`, backgroundColor: '#38bdf8' },
                ]}
              />
            </View>
            <Text style={[styles.levelNextText, { color: colors.textMuted }]}>
              Meta: 6 vitórias/nv
            </Text>
          </View>

          {/* Coluna Difícil */}
          <View style={[styles.levelColCard, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
            <View style={[styles.levelColBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Ionicons name="flame" size={14} color="#ef4444" />
              <Text style={[styles.levelColName, { color: '#ef4444' }]}>Difícil</Text>
            </View>

            <Text style={[styles.levelColValue, { color: colors.text }]}>
              Nv. {levels.dificil.level}
            </Text>

            <Text style={[styles.levelColProgressText, { color: colors.textSecondary }]}>
              {levels.dificil.currentProgress}/4 vitórias
            </Text>

            <View style={[styles.progressBarContainer, { backgroundColor: colors.surface }]}>
              <View
                style={[
                  styles.progressBarActive,
                  { width: `${levels.dificil.percent}%`, backgroundColor: '#ef4444' },
                ]}
              />
            </View>
            <Text style={[styles.levelNextText, { color: colors.textMuted }]}>
              Meta: 4 vitórias/nv
            </Text>
          </View>
        </View>
      </View>

      {/* Breakdown: Wins / Losses / Draws */}
      <View style={[styles.breakdownCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.breakdownTitle, { color: colors.text }]}>Desempenho Geral</Text>

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownValue, { color: colors.primary }]}>{winsCount}</Text>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Vitórias</Text>
          </View>

          <View style={[styles.breakdownDivider, { backgroundColor: colors.border }]} />

          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownValue, { color: colors.danger }]}>{lossesCount}</Text>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Derrotas</Text>
          </View>

          <View style={[styles.breakdownDivider, { backgroundColor: colors.border }]} />

          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownValue, { color: colors.accent }]}>{drawsCount}</Text>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Empates</Text>
          </View>
        </View>
      </View>

      {/* Settings Section */}
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferências & Configurações</Text>

        {settings.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.settingRow, { borderBottomColor: colors.border }]}
            activeOpacity={0.8}
            onPress={item.onPress}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: `${item.iconColor}20` }]}>
                <Ionicons name={item.icon as any} size={18} color={item.iconColor} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{item.label}</Text>
            </View>

            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{item.value}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Back to home button */}
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
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    elevation: 2,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '800',
    paddingVertical: 2,
    borderBottomWidth: 2,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelEditButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveEditButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    elevation: 1,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },
  levelsTableHorizontal: {
    flexDirection: 'row',
    gap: 10,
  },
  levelColCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  levelColBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 8,
  },
  levelColName: {
    fontSize: 11,
    fontWeight: '800',
  },
  levelColValue: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 2,
  },
  levelColProgressText: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarActive: {
    height: '100%',
    borderRadius: 3,
  },
  levelNextText: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  breakdownCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 14,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  breakdownItem: {
    alignItems: 'center',
    flex: 1,
  },
  breakdownValue: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 2,
  },
  breakdownLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  breakdownDivider: {
    width: 1,
    height: 32,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingValue: {
    fontSize: 13,
    fontWeight: '600',
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
