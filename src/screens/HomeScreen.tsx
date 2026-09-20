import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

interface NavItem {
  title: string;
  subtitle: string;
  screen: keyof RootStackParamList;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const navItems: NavItem[] = [
  { title: 'Partida', subtitle: 'Jogar agora', screen: 'Game', icon: 'game-controller', color: '#81b64c' },
  { title: 'Puzzle', subtitle: 'Desafios diários', screen: 'Puzzle', icon: 'extension-puzzle', color: '#f7b267' },
  { title: 'Histórico', subtitle: 'Resultados recentes', screen: 'History', icon: 'time', color: '#5fa8ff' },
  { title: 'Ranking', subtitle: 'Top da semana', screen: 'Leaderboard', icon: 'trophy', color: '#f7d36d' },
  { title: 'Perfil', subtitle: 'Estatísticas', screen: 'Profile', icon: 'person', color: '#9b8cff' },
];

const particleDirections = [
  { x: 34, y: -22, size: 5 },
  { x: 24, y: 20, size: 7 },
  { x: -22, y: -18, size: 4 },
  { x: -30, y: 16, size: 6 },
  { x: 10, y: -32, size: 4 },
];

export default function HomeScreen({ navigation }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const orbTravel = useRef(new Animated.Value(0)).current;
  const explosion = useRef(new Animated.Value(0)).current;
  const [heroWidth, setHeroWidth] = useState(0);
  const travelDistance = Math.max(heroWidth - 76, 220);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1300, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1300, useNativeDriver: true }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(orbTravel, {
          toValue: 1,
          duration: 1900,
          useNativeDriver: true,
        }),
        Animated.timing(explosion, {
          toValue: 1,
          duration: 480,
          useNativeDriver: true,
        }),
        Animated.delay(520),
        Animated.parallel([
          Animated.timing(orbTravel, { toValue: 0, duration: 1, useNativeDriver: true }),
          Animated.timing(explosion, { toValue: 0, duration: 1, useNativeDriver: true }),
        ]),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [explosion, orbTravel]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoMark}>♔</Text>
        </View>

        <View style={styles.topMeta}>
          <Text style={styles.brandName}>WinXadrez</Text>
          <Text style={styles.brandSub}>Club premium</Text>
        </View>

        <TouchableOpacity style={styles.statusChip} activeOpacity={0.8}>
          <Ionicons name="flash" size={12} color="#171614" />
          <Text style={styles.statusText}>ON</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.heroShell,
          {
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.012],
                }),
              },
            ],
          },
        ]}
      >
        <View
          style={styles.heroCard}
          onLayout={(event) => setHeroWidth(event.nativeEvent.layout.width)}
        >
        <View pointerEvents="none" style={styles.heroReflection} />
        <View pointerEvents="none" style={styles.particleTrack} />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.particle,
            {
              transform: [
                {
                  translateX: orbTravel.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, travelDistance],
                  }),
                },
                {
                  scale: orbTravel.interpolate({
                    inputRange: [0, 0.15, 0.85, 1],
                    outputRange: [0.85, 1.1, 1.1, 1.5],
                  }),
                },
              ],
              opacity: explosion.interpolate({
                inputRange: [0, 0.8, 1],
                outputRange: [1, 1, 0],
              }),
            },
          ]}
        />
        {particleDirections.map((particle, index) => (
          <Animated.View
            key={index}
            pointerEvents="none"
            style={[
              styles.particleBubble,
              { width: particle.size, height: particle.size, borderRadius: particle.size / 2 },
              {
                transform: [
                  {
                    translateX: orbTravel.interpolate({
                      inputRange: [0, 1],
                      outputRange: [travelDistance, travelDistance + particle.x],
                    }),
                  },
                  {
                    translateY: explosion.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, particle.y],
                    }),
                  },
                  {
                    scale: explosion.interpolate({
                      inputRange: [0, 0.2, 1],
                      outputRange: [0, 1, 0.7],
                    }),
                  },
                ],
                opacity: explosion.interpolate({
                  inputRange: [0, 0.15, 0.8, 1],
                  outputRange: [0, 1, 0.8, 0],
                }),
              },
            ]}
          />
        ))}

          <View style={styles.heroContent}>
          <Text style={styles.eyebrow}>Estratégia em foco</Text>
          <Text style={styles.heroTitle}>{`Conquiste
cada partida.`}</Text>
          <Text style={styles.heroSubtitle}>
            Jogue, treine e evolua com um ambiente moderno, direto e competitivo.
          </Text>

          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9} onPress={() => navigation.navigate('Game')}>
              <Ionicons name="play" size={16} color="#ffffff" />
              <Text style={styles.primaryButtonText}>Jogar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.9} onPress={() => navigation.navigate('Puzzle')}>
              <Ionicons name="sparkles" size={16} color="#171614" />
              <Text style={styles.secondaryButtonText}>Treinar</Text>
            </TouchableOpacity>
          </View>
          </View>
        </View>
      </Animated.View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>1.2k</Text>
          <Text style={styles.statLabel}>Jogos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>72%</Text>
          <Text style={styles.statLabel}>Vitórias</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>#12</Text>
          <Text style={styles.statLabel}>Ranking</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Menu</Text>
        <Text style={styles.sectionLink}>Tudo</Text>
      </View>

      <View style={styles.list}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={[styles.iconWrapper, { backgroundColor: item.color + '22' }]}>
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9a9794" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171614',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  logoWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#1f1d1b',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMark: {
    color: '#f7d36d',
    fontSize: 26,
    fontWeight: '900',
  },
  topMeta: {
    flex: 1,
    marginLeft: 12,
  },
  brandName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  brandSub: {
    color: '#9d9995',
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f7d36d',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    color: '#171614',
    fontSize: 11,
    fontWeight: '800',
  },
  heroCard: {
    position: 'relative',
    backgroundColor: '#1d1b1a',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    overflow: 'hidden',
  },
  heroShell: {
    marginBottom: 18,
    borderRadius: 28,
    shadowColor: '#81b64c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  heroReflection: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 12,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  particleTrack: {
    position: 'absolute',
    top: 31,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(129,182,76,0.16)',
  },
  particle: {
    position: 'absolute',
    top: 26,
    left: 28,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#b9f27c',
    shadowColor: '#81b64c',
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  particleBubble: {
    position: 'absolute',
    top: 29,
    left: 28,
    backgroundColor: '#d8ffa9',
    shadowColor: '#81b64c',
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 3,
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
  },
  eyebrow: {
    color: '#a9a5a2',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 38,
    letterSpacing: -1,
    maxWidth: 220,
  },
  heroSubtitle: {
    color: '#c1bcba',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    maxWidth: 260,
  },
  heroActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
    backgroundColor: '#81b64c',
    paddingVertical: 12,
    borderRadius: 14,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
    backgroundColor: '#f7b267',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    borderRadius: 14,
  },
  secondaryButtonText: {
    color: '#171614',
    fontWeight: '800',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    padding: 10,
    borderRadius: 28,
    backgroundColor: '#1d1b1a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#81b64c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 4,
  },
  statCard: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 18,
  },
  statLabel: {
    color: '#a8a5a2',
    fontSize: 11,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  sectionLink: {
    color: '#d9d7d4',
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1d1b1a',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#9d9995',
    fontSize: 12,
    marginTop: 4,
  },
});
