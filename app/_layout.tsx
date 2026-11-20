import React, { useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DefaultTheme, DarkTheme, ThemeProvider as NavThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import { ActivityIndicator, Platform, Pressable, Text, View, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

import { ThemeProvider, useAppTheme } from '../src/context/ThemeContext';
import { initializeDatabase } from '../src/database/db';

function MainLayout() {
  const { colors, mode } = useAppTheme();

  // Mantém a barra de navegação do Android oculta (comportamento original)
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setHidden(true);
    }
  }, []);

  const navTheme = useMemo(() => {
    const base = mode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        primary: colors.primary,
      },
    };
  }, [colors, mode]);

  return (
    <SafeAreaProvider>
      <NavThemeProvider value={navTheme}>
        <View style={[styles.appShell, { backgroundColor: colors.background }]}>
          {/* Barra de status visível, com ícones claros no tema escuro e escuros no claro */}
          <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
          <NavigationBar hidden={true} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" options={{ title: 'WinXadrez' }} />
            <Stack.Screen name="game" options={{ title: 'Partida' }} />
            <Stack.Screen name="puzzle" options={{ title: 'Quebra-cabeças' }} />
            <Stack.Screen name="history" options={{ title: 'Histórico' }} />
            <Stack.Screen name="leaderboard" options={{ title: 'Ranking' }} />
            <Stack.Screen name="profile" options={{ title: 'Perfil' }} />
            <Stack.Screen name="tutorial" options={{ title: 'Aprenda Xadrez' }} />
            <Stack.Screen name="openings" options={{ title: 'Aberturas' }} />
            <Stack.Screen name="achievements" options={{ title: 'Conquistas' }} />
            <Stack.Screen name="levels" options={{ title: 'Níveis & Ligas' }} />
            <Stack.Screen name="match-detail" options={{ title: 'Detalhes da Partida' }} />
            <Stack.Screen name="player-detail" options={{ title: 'Ficha do Jogador' }} />
            <Stack.Screen name="settings" options={{ title: 'Configurações' }} />
          </Stack>
        </View>
      </NavThemeProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#81b64c" />
      </View>
    );
  }

  return <DatabaseGate />;
}

function DatabaseGate() {
  const [databaseReady, setDatabaseReady] = React.useState(false);
  const [databaseError, setDatabaseError] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);

  useEffect(() => {
    let active = true;
    initializeDatabase().then(
      () => {
        if (active) setDatabaseReady(true);
      },
      (error: unknown) => {
        console.error('Erro ao inicializar o banco de dados:', error);
        if (active) {
          setDatabaseError(error instanceof Error ? error.message : String(error));
        }
      }
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  if (databaseError) {
    return (
      <View style={styles.errorScreen}>
        <Text style={styles.errorTitle}>Não foi possível iniciar o jogo.</Text>
        <Text style={styles.errorMessage}>{databaseError}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setDatabaseError(null);
            setAttempt((current) => current + 1);
          }}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  if (!databaseReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#81b64c" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <MainLayout />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  appShell: { flex: 1 },
  loading: { flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' },
  errorScreen: { flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorTitle: { color: '#ffffff', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  errorMessage: { color: '#cccccc', fontSize: 14, marginTop: 12, textAlign: 'center' },
  retryButton: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: '#d9b45b' },
  retryButtonText: { color: '#1b1405', fontWeight: '700' },
});