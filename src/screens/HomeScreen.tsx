import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { getProfile, createProfile, UserProfile, SkillLevel, getUserLevels, UserLevelsSummary } from '../database/db';
import { useAppTheme } from '../context/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

interface NavItem {
  title: string;
  subtitle: string;
  screen: keyof RootStackParamList;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const navItems: NavItem[] = [
  { title: 'Partida', subtitle: 'Jogar vs Bot', screen: 'Game', icon: 'game-controller', color: '#81b64c' },
  { title: 'Puzzle', subtitle: 'Desafios diários', screen: 'Puzzle', icon: 'extension-puzzle', color: '#f7b267' },
  { title: 'Histórico', subtitle: 'Resultados recentes', screen: 'History', icon: 'time', color: '#5fa8ff' },
  { title: 'Ranking', subtitle: 'Top da semana', screen: 'Leaderboard', icon: 'trophy', color: '#f7d36d' },
  { title: 'Perfil', subtitle: 'Estatísticas reais', screen: 'Profile', icon: 'person', color: '#9b8cff' },
];

const particleDirections = [
  { x: 34, y: -22, size: 5 },
  { x: 24, y: 20, size: 7 },
  { x: -22, y: -18, size: 4 },
  { x: -30, y: 16, size: 6 },
  { x: 10, y: -32, size: 4 },
];

export default function HomeScreen({ navigation }: Props) {
  const { colors, mode } = useAppTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [levels, setLevels] = useState<UserLevelsSummary>(() => getUserLevels());

  // Onboarding & Tutorial Modal states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel>('Sei o básico');

  const pulse = useRef(new Animated.Value(0)).current;
  const orbTravel = useRef(new Animated.Value(0)).current;
  const explosion = useRef(new Animated.Value(0)).current;
  const [heroWidth, setHeroWidth] = useState(0);
  const travelDistance = Math.max(heroWidth - 76, 220);

  const loadProfileData = () => {
    const p = getProfile();
    setProfile(p);
    setLevels(getUserLevels());
  };

  useEffect(() => {
    loadProfileData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfileData();
    });
    return unsubscribe;
  }, [navigation]);

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

  const handleStartGamePress = () => {
    const currentProfile = getProfile();
    if (!currentProfile) {
      setPlayerName('');
      setSelectedLevel('Sei o básico');
      setShowOnboarding(true);
    } else {
      navigation.navigate('Game');
    }
  };

  const handleSelectLevel = (level: SkillLevel) => {
    setSelectedLevel(level);
    if (level === 'Não sei jogar') {
      setShowTutorial(true);
    }
  };

  const handleConfirmOnboarding = () => {
    const trimmed = playerName.trim();
    if (trimmed.length < 2) {
      Alert.alert('Nome inválido', 'Por favor, digite seu nome ou apelido com pelo menos 2 caracteres.');
      return;
    }

    const newProfile = createProfile(trimmed, selectedLevel);
    setProfile(newProfile);
    setShowOnboarding(false);
    navigation.navigate('Game');
  };

  const winRate =
    profile && profile.matches_count > 0
      ? `${Math.round((profile.wins_count / profile.matches_count) * 100)}%`
      : '0%';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Top bar with real profile info */}
      <View style={styles.topBar}>
        <View style={[styles.logoWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.logoMark}>♔</Text>
        </View>

        <View style={styles.topMeta}>
          <Text style={[styles.brandName, { color: colors.text }]}>
            {profile ? profile.name : 'WinXadrez'}
          </Text>
          <Text style={[styles.brandSub, { color: colors.textSecondary }]}>
            {profile ? `Nível ${levels.totalLevel} • ${profile.skill_level}` : 'Xadrez Offline'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.profileButton, { backgroundColor: colors.chipBg, borderColor: colors.border }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-circle-outline" size={20} color={colors.accent} />
          <Text style={[styles.profileButtonText, { color: colors.text }]}>Perfil</Text>
        </TouchableOpacity>
      </View>

      {/* Hero card */}
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
          style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
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
            <Text style={styles.eyebrow}>Xadrez Offline</Text>
            <Text style={[styles.heroTitle, { color: colors.text }]}>{`Conquiste\ncada partida.`}</Text>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              Jogue contra a máquina calibrada ao seu nível, treine e acompanhe sua evolução real.
            </Text>

            <View style={styles.heroActions}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                activeOpacity={0.9}
                onPress={handleStartGamePress}
              >
                <Ionicons name="play" size={18} color="#ffffff" />
                <Text style={styles.primaryButtonText}>Jogar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: colors.accent }]}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('Puzzle')}
              >
                <Ionicons name="sparkles" size={18} color="#171614" />
                <Text style={styles.secondaryButtonText}>Puzzles</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Real stats row */}
      <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {profile ? profile.matches_count : 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Partidas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{winRate}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Vitórias</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.accent }]}>
            {profile ? profile.rating : 1200}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rating Elo</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Menu de Atividades</Text>
      </View>

      {/* Menu items list */}
      <View style={styles.list}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.9}
            onPress={() => {
              if (item.screen === 'Game') {
                handleStartGamePress();
              } else {
                navigation.navigate(item.screen);
              }
            }}
          >
            <View style={[styles.iconWrapper, { backgroundColor: item.color + '22' }]}>
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Modal de Cadastro / Onboarding Inicial */}
      <Modal
        visible={showOnboarding}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOnboarding(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalBadge}>
                <Ionicons name="person-add" size={20} color="#81b64c" />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Bem-vindo ao WinXadrez!</Text>
              <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                Informe seu nome e seu nível para calibrar a dificuldade do jogo.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Seu nome ou apelido:</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: mode === 'dark' ? colors.cardSecondary : '#f0eee8',
                    color: colors.text,
                    borderColor: colors.borderStrong,
                  },
                ]}
                placeholder="Ex: Mestre Carlos"
                placeholderTextColor={colors.textMuted}
                value={playerName}
                onChangeText={setPlayerName}
                maxLength={25}
                autoFocus
              />
            </View>

            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>
              Qual é o seu nível de xadrez?
            </Text>

            <View style={styles.levelList}>
              {(
                [
                  {
                    level: 'Não sei jogar' as SkillLevel,
                    title: 'Não sei jogar',
                    desc: 'Iniciante total • Dificuldade Fácil (com tutorial)',
                    icon: 'school-outline',
                    color: '#f7b267',
                  },
                  {
                    level: 'Sei o básico' as SkillLevel,
                    title: 'Sei o básico',
                    desc: 'Conheço regras e peças • Dificuldade Média',
                    icon: 'book-outline',
                    color: '#81b64c',
                  },
                  {
                    level: 'Sou bom' as SkillLevel,
                    title: 'Sou bom',
                    desc: 'Experiente e tático • Dificuldade Difícil',
                    icon: 'trophy-outline',
                    color: '#9b8cff',
                  },
                ] as const
              ).map((opt) => {
                const isSelected = selectedLevel === opt.level;
                return (
                  <TouchableOpacity
                    key={opt.level}
                    style={[
                      styles.levelCard,
                      {
                        backgroundColor: mode === 'dark' ? colors.cardSecondary : '#f7f6f2',
                        borderColor: isSelected ? opt.color : colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleSelectLevel(opt.level)}
                  >
                    <View style={[styles.levelIconWrap, { backgroundColor: opt.color + '22' }]}>
                      <Ionicons name={opt.icon as any} size={20} color={opt.color} />
                    </View>
                    <View style={styles.levelInfo}>
                      <Text style={[styles.levelTitle, { color: colors.text }]}>{opt.title}</Text>
                      <Text style={[styles.levelDesc, { color: colors.textSecondary }]}>{opt.desc}</Text>
                    </View>
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={isSelected ? opt.color : colors.textMuted}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedLevel === 'Não sei jogar' && (
              <TouchableOpacity
                style={styles.tutorialButton}
                activeOpacity={0.8}
                onPress={() => setShowTutorial(true)}
              >
                <Ionicons name="help-circle-outline" size={18} color="#f7b267" />
                <Text style={styles.tutorialButtonText}>Ver tutorial de como jogar xadrez</Text>
              </TouchableOpacity>
            )}

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={() => setShowOnboarding(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmButton, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
                onPress={handleConfirmOnboarding}
              >
                <Text style={styles.modalConfirmText}>Começar a Jogar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Tutorial Simples de Xadrez */}
      <Modal
        visible={showTutorial}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowTutorial(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.tutorialBox,
              { backgroundColor: colors.surface, borderColor: colors.borderStrong },
            ]}
          >
            <View style={styles.tutorialHeader}>
              <Text style={styles.tutorialHeaderIcon}>♟️</Text>
              <Text style={[styles.tutorialTitle, { color: colors.text }]}>Como Jogar Xadrez</Text>
              <Text style={[styles.tutorialSubtitle, { color: colors.textSecondary }]}>
                O guia rápido e essencial para você começar agora!
              </Text>
            </View>

            <ScrollView style={styles.tutorialScroll}>
              <View style={[styles.tutorialSection, { backgroundColor: mode === 'dark' ? colors.cardSecondary : '#f7f6f2' }]}>
                <Text style={[styles.tutorialSectionTitle, { color: colors.accent }]}>
                  🎯 O Objetivo Principal
                </Text>
                <Text style={[styles.tutorialSectionText, { color: colors.text }]}>
                  O xadrez é um jogo entre dois exércitos. O seu objetivo é dar <Text style={{ fontWeight: 'bold' }}>Xeque-mate</Text> no Rei do adversário: deixá-lo encurralado sob ataque sem que ele tenha nenhuma casa livre para escapar.
                </Text>
              </View>

              <View style={[styles.tutorialSection, { backgroundColor: mode === 'dark' ? colors.cardSecondary : '#f7f6f2' }]}>
                <Text style={[styles.tutorialSectionTitle, { color: colors.primary }]}>
                  ♞ Como as Peças se Movem
                </Text>

                <View style={styles.pieceRow}>
                  <Text style={styles.pieceSymbol}>♙</Text>
                  <View style={styles.pieceDescWrap}>
                    <Text style={[styles.pieceName, { color: colors.text }]}>Peão</Text>
                    <Text style={[styles.pieceText, { color: colors.textSecondary }]}>
                      Anda 1 casa para frente (ou 2 no primeiro lance). Captura 1 casa na diagonal à frente.
                    </Text>
                  </View>
                </View>

                <View style={styles.pieceRow}>
                  <Text style={styles.pieceSymbol}>♖</Text>
                  <View style={styles.pieceDescWrap}>
                    <Text style={[styles.pieceName, { color: colors.text }]}>Torre</Text>
                    <Text style={[styles.pieceText, { color: colors.textSecondary }]}>
                      Move-se em linha reta para frente, trás e pros lados por quantas casas quiser.
                    </Text>
                  </View>
                </View>

                <View style={styles.pieceRow}>
                  <Text style={styles.pieceSymbol}>♘</Text>
                  <View style={styles.pieceDescWrap}>
                    <Text style={[styles.pieceName, { color: colors.text }]}>Cavalo</Text>
                    <Text style={[styles.pieceText, { color: colors.textSecondary }]}>
                      Move-se em formato de "L" (2 casas em uma direção e 1 para o lado). É a única que pula outras peças!
                    </Text>
                  </View>
                </View>

                <View style={styles.pieceRow}>
                  <Text style={styles.pieceSymbol}>♗</Text>
                  <View style={styles.pieceDescWrap}>
                    <Text style={[styles.pieceName, { color: colors.text }]}>Bispo</Text>
                    <Text style={[styles.pieceText, { color: colors.textSecondary }]}>
                      Move-se nas diagonais da mesma cor em que começou o jogo, quantas casas quiser.
                    </Text>
                  </View>
                </View>

                <View style={styles.pieceRow}>
                  <Text style={styles.pieceSymbol}>♕</Text>
                  <View style={styles.pieceDescWrap}>
                    <Text style={[styles.pieceName, { color: colors.text }]}>Dama (Rainha)</Text>
                    <Text style={[styles.pieceText, { color: colors.textSecondary }]}>
                      A mais poderosa! Junta os movimentos da Torre e do Bispo: retas e diagonais livres.
                    </Text>
                  </View>
                </View>

                <View style={styles.pieceRow}>
                  <Text style={styles.pieceSymbol}>♔</Text>
                  <View style={styles.pieceDescWrap}>
                    <Text style={[styles.pieceName, { color: colors.text }]}>Rei</Text>
                    <Text style={[styles.pieceText, { color: colors.textSecondary }]}>
                      A peça vital! Anda apenas 1 casa em qualquer direção. Nunca pode se colocar em perigo.
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.tutorialSection, { backgroundColor: mode === 'dark' ? colors.cardSecondary : '#f7f6f2' }]}>
                <Text style={[styles.tutorialSectionTitle, { color: '#5fa8ff' }]}>
                  💡 3 Dicas de Ouro
                </Text>
                <Text style={[styles.tutorialBullet, { color: colors.text }]}>
                  1. Controle o centro do tabuleiro com seus peões e cavalos logo no início.
                </Text>
                <Text style={[styles.tutorialBullet, { color: colors.text }]}>
                  2. Não deixe peças desprotegidas e preste atenção aos lances do adversário.
                </Text>
                <Text style={[styles.tutorialBullet, { color: colors.text }]}>
                  3. O computador no nível Fácil comete erros propositais para você aprender jogando!
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.closeTutorialButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
              onPress={() => setShowTutorial(false)}
            >
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
              <Text style={styles.closeTutorialText}>Entendi! Vamos jogar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderWidth: 1,
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
    fontSize: 18,
    fontWeight: '800',
  },
  brandSub: {
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.6,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  profileButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroCard: {
    position: 'relative',
    borderRadius: 28,
    borderWidth: 1,
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
  },
  particleBubble: {
    position: 'absolute',
    top: 30,
    left: 28,
    backgroundColor: '#f7d36d',
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
  },
  eyebrow: {
    color: '#81b64c',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
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
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 3,
  },
  statCard: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '800',
    fontSize: 18,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  list: {
    gap: 10,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(129, 182, 76, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  levelList: {
    gap: 8,
    marginTop: 8,
    marginBottom: 14,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
  },
  levelIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  levelDesc: {
    fontSize: 11,
  },
  tutorialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 14,
  },
  tutorialButtonText: {
    color: '#f7b267',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalConfirmButton: {
    flex: 2,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  modalConfirmText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  // Tutorial modal
  tutorialBox: {
    maxHeight: '85%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    elevation: 10,
  },
  tutorialHeader: {
    alignItems: 'center',
    marginBottom: 14,
  },
  tutorialHeaderIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  tutorialTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  tutorialSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  tutorialScroll: {
    marginBottom: 14,
  },
  tutorialSection: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  tutorialSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  tutorialSectionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  pieceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  pieceSymbol: {
    fontSize: 26,
    color: '#f7d36d',
    width: 32,
    textAlign: 'center',
  },
  pieceDescWrap: {
    flex: 1,
  },
  pieceName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  pieceText: {
    fontSize: 11,
    lineHeight: 15,
  },
  tutorialBullet: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  closeTutorialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  closeTutorialText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
