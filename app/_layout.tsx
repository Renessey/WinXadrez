import React, { useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DefaultTheme, DarkTheme, ThemeProvider as NavThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import { ActivityIndicator, Platform, View, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

import { ThemeProvider, useAppTheme } from '../src/context/ThemeContext';

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

  return (
    <ThemeProvider>
      <MainLayout />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  appShell: { flex: 1 },
  loading: { flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' },
});