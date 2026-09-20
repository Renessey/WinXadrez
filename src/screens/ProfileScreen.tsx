import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const stats = [
  { label: 'Rating', value: '1620', icon: 'trophy', color: '#e2b33c' },
  { label: 'Vitórias', value: '68%', icon: 'medal', color: '#81b64c' },
  { label: 'Partidas', value: '124', icon: 'game-controller', color: '#4a75a0' },
];

export default function ProfileScreen({ navigation }: Props) {
  const [profileName, setProfileName] = useState('Usuário');
  const [draftName, setDraftName] = useState(profileName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [theme, setTheme] = useState('Escuro');
  const [notifications, setNotifications] = useState(true);
  const [privacy, setPrivacy] = useState('Pública');

  const settings = [
    {
      label: 'Preferência de tema',
      value: theme,
      icon: 'moon',
      onPress: () => setTheme((current) => (current === 'Escuro' ? 'Claro' : 'Escuro')),
    },
    {
      label: 'Notificações',
      value: notifications ? 'Ativadas' : 'Desativadas',
      icon: 'notifications',
      onPress: () => setNotifications((value) => !value),
    },
    {
      label: 'Privacidade',
      value: privacy,
      icon: 'shield-checkmark',
      onPress: () => setPrivacy((current) => (current === 'Pública' ? 'Privada' : 'Pública')),
    },
  ];

  const handleEditProfile = () => {
    setDraftName(profileName);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    const nextName = draftName.trim();
    if (nextName.length >= 2) {
      setProfileName(nextName);
      setIsEditingName(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.avatarWrap}>
          <Ionicons name="person" size={40} color="#ffffff" />
        </View>

        <View style={styles.headerInfo}>
          {isEditingName ? (
            <TextInput
              style={styles.nameInput}
              value={draftName}
              onChangeText={setDraftName}
              autoFocus
              maxLength={28}
              placeholder="Seu nome"
              placeholderTextColor="#8f8a84"
            />
          ) : (
            <Text style={styles.name}>{profileName}</Text>
          )}
          <Text style={styles.subtitle}>{isEditingName ? 'Edite seu nome de exibição' : 'Jogador de xadrez'}</Text>
        </View>

        {isEditingName ? (
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelEditButton} activeOpacity={0.8} onPress={() => setIsEditingName(false)}>
              <Ionicons name="close" size={18} color="#ff9b9b" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveEditButton} activeOpacity={0.8} onPress={handleSaveName}>
              <Ionicons name="checkmark" size={18} color="#171614" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.editButton} activeOpacity={0.8} onPress={handleEditProfile}>
            <Ionicons name="create" size={16} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.accountCard}>
        <View style={styles.accountIcon}>
          <Ionicons name="person-circle-outline" size={22} color="#b9f27c" />
        </View>
        <View style={styles.accountInfo}>
          <Text style={styles.accountTitle}>Sincronize seu progresso</Text>
          <Text style={styles.accountSubtitle}>Entre ou crie uma conta para não perder seus dados.</Text>
        </View>
        <TouchableOpacity style={styles.accountButton} activeOpacity={0.8} onPress={() => navigation.navigate('Auth')}>
          <Text style={styles.accountButtonText}>Entrar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        {stats.map((item) => (
          <View key={item.label} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${item.color}22` }]}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
            </View>
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Resumo</Text>

        <View style={styles.progressBlock}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progresso semanal</Text>
            <Text style={styles.progressPercent}>72%</Text>
          </View>

          <View style={styles.progressBarBackground}>
            <View style={styles.progressBarFill} />
          </View>
        </View>

        <View style={styles.miniStatsRow}>
          <View style={styles.miniStat}>
            <Text style={styles.miniValue}>24</Text>
            <Text style={styles.miniLabel}>Vitórias seguidas</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={styles.miniValue}>8</Text>
            <Text style={styles.miniLabel}>Duelos em andamento</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Configurações</Text>

        {settings.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.settingRow}
            activeOpacity={0.8}
            onPress={item.onPress}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name={item.icon as any} size={18} color="#ffffff" />
              </View>
              <Text style={styles.settingLabel}>{item.label}</Text>
            </View>
            <Text style={styles.settingValue}>{item.value}</Text>
          </TouchableOpacity>
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
    backgroundColor: '#302e2b',
  },
  content: {
    padding: 18,
    paddingBottom: 28,
  },
  headerCard: {
    backgroundColor: '#262421',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#3d3b38',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  nameInput: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    minWidth: 130,
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#b9f27c',
  },
  avatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 5,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#a9a5a2',
    fontSize: 13,
    marginTop: 4,
  },
  editButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#1f1d1b',
    borderWidth: 1,
    borderColor: '#4d4a47',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editActions: {
    flexDirection: 'row',
    gap: 7,
  },
  cancelEditButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#332122',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveEditButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#b9f27c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#20271d',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(129,182,76,0.24)',
    padding: 13,
    marginBottom: 18,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(129,182,76,0.14)',
  },
  accountInfo: {
    flex: 1,
    marginHorizontal: 10,
  },
  accountTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  accountSubtitle: {
    color: '#9eae91',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },
  accountButton: {
    backgroundColor: '#b9f27c',
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  accountButtonText: {
    color: '#171614',
    fontSize: 11,
    fontWeight: '900',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#262421',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3d3b38',
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    color: '#a8a5a2',
    fontSize: 11,
  },
  sectionCard: {
    backgroundColor: '#262421',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3d3b38',
    padding: 16,
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  progressBlock: {
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#dcd8d4',
    fontSize: 13,
    fontWeight: '600',
  },
  progressPercent: {
    color: '#81b64c',
    fontWeight: '800',
    fontSize: 13,
  },
  progressBarBackground: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#1d1c1b',
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '72%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#81b64c',
  },
  miniStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  miniStat: {
    flex: 1,
    backgroundColor: '#1f1d1b',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#3d3b38',
  },
  miniValue: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 20,
    marginBottom: 4,
  },
  miniLabel: {
    color: '#a8a5a2',
    fontSize: 11,
    lineHeight: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3d3b38',
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
    backgroundColor: '#1f1d1b',
    borderWidth: 1,
    borderColor: '#3d3b38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  settingValue: {
    color: '#a8a5a2',
    fontSize: 12,
    fontWeight: '700',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 4,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
