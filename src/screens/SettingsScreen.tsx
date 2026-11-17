import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import {
  clearActiveMatch,
  getCachedDailyPuzzle,
  resetLossesAndCache,
  setSetting,
} from '../database/db';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, mode, setTheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [cacheDate, setCacheDate] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const cached = getCachedDailyPuzzle();
      setCacheDate(cached?.date ?? null);
    }, [])
  );

  const handleClearPuzzleCache = () => {
    setSetting('cached_daily_puzzle', '');
    setCacheDate(null);
    Alert.alert('Cache limpo', 'O cache do puzzle diário foi limpo e será atualizado na próxima abertura.');
  };

  const handleClearActiveGame = () => {
    clearActiveMatch();
    Alert.alert('Partida limpa', 'O estado de partida em andamento salvo foi removido.');
  };

  const handleResetLosses = () => {
    Alert.alert(
      'Zerar Derrotas e Cache',
      'Deseja apagar todas as derrotas registradas e limpar o cache da partida?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: () => {
            resetLossesAndCache();
            Alert.alert('Concluído', 'Derrotas zeradas e cache limpo com sucesso.');
          },
        },
      ]
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
      <View style={[styles.topBar, { borderBottomColor: colors.border, paddingHorizontal: 16 }]}>
        <TouchableOpacity style={styles.backButtonTop} activeOpacity={0.7} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={[styles.topBarTitle, { color: colors.text }]}>Configurações</Text>
          <Text style={[styles.topBarSub, { color: colors.accent }]}>Preferências & Dados</Text>
        </View>

        <View style={[styles.topBarIconWrap, { backgroundColor: `${colors.accent}20` }]}>
          <Ionicons name="settings" size={20} color={colors.accent} />
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Aparência</Text>
          <View style={styles.themeRow}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                {
                  backgroundColor: mode === 'dark' ? `${colors.primary}20` : colors.cardSecondary,
                  borderColor: mode === 'dark' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setTheme('dark')}
            >
              <Ionicons name="moon" size={20} color={mode === 'dark' ? colors.primary : colors.textSecondary} />
              <Text style={[styles.themeLabel, { color: colors.text }]}>Modo Escuro</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                {
                  backgroundColor: mode === 'light' ? `${colors.accent}20` : colors.cardSecondary,
                  borderColor: mode === 'light' ? colors.accent : colors.border,
                },
              ]}
              onPress={() => setTheme('light')}
            >
              <Ionicons name="sunny" size={20} color={mode === 'light' ? colors.accent : colors.textSecondary} />
              <Text style={[styles.themeLabel, { color: colors.text }]}>Modo Claro</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Atalhos Rápidos</Text>

          <TouchableOpacity
            style={[styles.rowBtn, { borderBottomColor: colors.border }]}
            onPress={() => router.push('/tutorial')}
          >
            <Ionicons name="school-outline" size={18} color={colors.accent} />
            <Text style={[styles.rowLabel, { color: colors.text }]}>Regras e Tutorial</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rowBtn, { borderBottomColor: colors.border }]}
            onPress={() => router.push('/levels')}
          >
            <Ionicons name="trending-up-outline" size={18} color={colors.primary} />
            <Text style={[styles.rowLabel, { color: colors.text }]}>Níveis e Divisões</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.rowBtn} onPress={() => router.push('/achievements')}>
            <Ionicons name="medal-outline" size={18} color="#f5b858" />
            <Text style={[styles.rowLabel, { color: colors.text }]}>Conquistas</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Armazenamento Local (SQLite)</Text>

          <TouchableOpacity
            style={[styles.rowBtn, { borderBottomColor: colors.border }]}
            onPress={handleClearPuzzleCache}
          >
            <Ionicons name="cloud-offline-outline" size={18} color="#5fa8ff" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Limpar cache do Puzzle Lichess</Text>
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                {cacheDate ? `Salvo em ${cacheDate}` : 'Nenhum cache salvo'}
              </Text>
            </View>
            <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rowBtn, { borderBottomColor: colors.border }]}
            onPress={handleClearActiveGame}
          >
            <Ionicons name="hourglass-outline" size={18} color={colors.accent} />
            <Text style={[styles.rowLabel, { color: colors.text }]}>Descartar partida salva</Text>
            <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.rowBtn} onPress={handleResetLosses}>
            <Ionicons name="refresh-circle-outline" size={18} color={colors.danger} />
            <Text style={[styles.rowLabel, { color: colors.danger }]}>Zerar derrotas e cache</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>

        <View style={[styles.infoFooter, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.appName, { color: colors.text }]}>WinXadrez v1.0.0</Text>
          <Text style={[styles.appTech, { color: colors.textSecondary }]}>
            Expo Router • SQLite Local • Lichess Puzzle API
          </Text>
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
  content: { padding: 16, paddingBottom: 32, gap: 14 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 12 },
  themeRow: { flexDirection: 'row', gap: 10 },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  themeLabel: { fontSize: 13, fontWeight: '800' },
  rowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
  rowSub: { fontSize: 11, marginTop: 2 },
  infoFooter: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  appName: { fontSize: 14, fontWeight: '800' },
  appTech: { fontSize: 11, marginTop: 3 },
});
