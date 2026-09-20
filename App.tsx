import React, { useEffect, useMemo, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ActivityIndicator, Animated, Easing, Platform, View, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from './src/types/navigation';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import PuzzleScreen from './src/screens/PuzzleScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

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

function MainContent() {
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
          <NavigationContainer theme={navTheme}>
            <StatusBar hidden={true} />
            <NavigationBar hidden={true} />
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: 'transparent',
                },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: 'WinXadrez' }}
              />
              <Stack.Screen
                name="Game"
                component={GameScreen}
                options={{ title: 'Partida' }}
              />
              <Stack.Screen
                name="Puzzle"
                component={PuzzleScreen}
                options={{ title: 'Quebra-cabeças' }}
              />
              <Stack.Screen
                name="History"
                component={HistoryScreen}
                options={{ title: 'Histórico' }}
              />
              <Stack.Screen
                name="Leaderboard"
                component={LeaderboardScreen}
                options={{ title: 'Ranking' }}
              />
              <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: 'Perfil' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

export default function App() {
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
      <MainContent />
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
