import React, { useEffect, useMemo, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DefaultTheme, ThemeProvider as NavThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import { ActivityIndicator, Animated, Easing, Platform, View, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

import { ThemeProvider, useAppTheme } from '../src/context/ThemeContext';

const starData: Array<{
  left: `${number}%`;
  top: `${number}%`;
  size: number;
  opacity: number;
  driftX: number;
  driftY: number;
}> = [
  { left: '8%', top: '14%', size: 4, opacity: 0.9, driftX: 30, driftY: -20 },
  { left: '18%', top: '35%', size: 3, opacity: 0.8, driftX: -20, driftY: 18 },
  { left: '31%', top: '24%', size: 5, opacity: 1, driftX: 20, driftY: 12 },
  { left: '45%', top: '16%', size: 3, opacity: 0.8, driftX: 16, driftY: -18 },
  { left: '56%', top: '32%', size: 4, opacity: 0.9, driftX: -18, driftY: 20 },
  { left: '70%', top: '18%', size: 3, opacity: 0.8, driftX: -20, driftY: 18 },
  { left: '82%', top: '28%', size: 5, opacity: 1, driftX: 20, driftY: -16 },
  { left: '90%', top: '18%', size: 4, opacity: 0.8, driftX: -26, driftY: 22 },
  { left: '14%', top: '48%', size: 3, opacity: 0.7, driftX: 18, driftY: -16 },
  { left: '38%', top: '60%', size: 4, opacity: 0.9, driftX: -20, driftY: 18 },
  { left: '60%', top: '54%', size: 3, opacity: 0.8, driftX: 18, driftY: -18 },
  { left: '79%', top: '66%', size: 5, opacity: 1, driftX: -20, driftY: 16 },
  { left: '92%', top: '46%', size: 3, opacity: 0.8, driftX: 18, driftY: -16 },
  { left: '10%', top: '72%', size: 4, opacity: 0.9, driftX: 18, driftY: 14 },
  { left: '49%', top: '74%', size: 5, opacity: 1, driftX: -16, driftY: -20 },
  { left: '72%', top: '82%', size: 3, opacity: 0.8, driftX: 24, driftY: 18 },
];

function MainLayout() {
  const { colors, mode } = useAppTheme();
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 14000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 14000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [drift]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setHidden(true);
    }
  }, []);

  const navTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        primary: colors.primary,
      },
    }),
    [colors]
  );

  return (
    <SafeAreaProvider>
      <NavThemeProvider value={navTheme}>
        <View style={[styles.appShell, { backgroundColor: colors.background }]}>
          <Animated.View pointerEvents="none" style={styles.backgroundLayer}>
            <Animated.View
              style={[
                styles.orb,
                styles.orbPrimary,
                {
                  opacity: mode === 'dark' ? 0 : 0.08,
                  transform: [
                    { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, 16] }) },
                    { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) },
                    { scale: drift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) },
                  ],
                },
              ]}
            />
            {starData.map((star, index) => (
              <Animated.View
                key={`star-${index}`}
                style={{
                  position: 'absolute',
                  left: star.left,
                  top: star.top,
                  width: star.size,
                  height: star.size,
                  borderRadius: star.size / 2,
                  opacity: mode === 'dark' ? star.opacity * 0.45 : star.opacity * 0.12,
                  backgroundColor: mode === 'dark' ? '#ffffff' : '#000000',
                  shadowColor: mode === 'dark' ? '#ffffff' : '#000000',
                  shadowOpacity: 0.35,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 0 },
                  transform: [
                    {
                      translateX: drift.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, star.driftX * 0.45],
                      }),
                    },
                    {
                      translateY: drift.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, star.driftY * 0.45],
                      }),
                    },
                  ],
                }}
              />
            ))}
          </Animated.View>

          <View style={styles.navigatorWrap}>
            <StatusBar hidden={true} />
            <NavigationBar hidden={true} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: 'transparent',
                },
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
      <View style={{ flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}>
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
  appShell: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFill,
    opacity: 1,
    zIndex: 0,
  },
  navigatorWrap: {
    flex: 1,
    zIndex: 1,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    shadowColor: '#ffffff',
    shadowOpacity: 0.12,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  orbPrimary: {
    width: 260,
    height: 260,
    left: -60,
    top: 160,
    backgroundColor: 'rgba(110, 96, 255, 0.18)',
  },
});

