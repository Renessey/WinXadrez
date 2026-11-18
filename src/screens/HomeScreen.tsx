import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  AccessibilityInfo,
  useWindowDimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getProfile,
  createProfile,
  UserProfile,
  SkillLevel,
  getUserLevels,
  UserLevelsSummary,
  getActiveMatch,
} from '../database/db';
import { useAppTheme } from '../context/ThemeContext';

type GameDifficulty = 'Fácil' | 'Médio' | 'Difícil';
type IconName = keyof typeof Ionicons.glyphMap;

/* ---------- Identidade visual ---------- */
// Palco escuro fixo (igual nos temas claro e escuro): obsidiana esmeralda + ouro + marfim.
const STAGE = '#06110d';
const GOLD = '#e9c46a';
const IVORY = '#f3ead3';
const BOARD_LIGHT = '#3b6a56';
const BOARD_DARK = '#12281f';
const ON_GOLD = '#1a1400';
const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

interface Tile {
  title: string;
  subtitle: string;
  icon: IconName;
  route: string;
  glyph: string;
}

const trainTiles: Tile[] = [
  { title: 'Puzzles', subtitle: 'Um desafio novo por dia', icon: 'extension-puzzle-outline', route: '/puzzle', glyph: '♞' },
  { title: 'Aberturas', subtitle: 'Biblioteca e posições', icon: 'book-outline', route: '/openings', glyph: '♝' },
  { title: 'Aprenda a jogar', subtitle: 'Regras e movimentos', icon: 'school-outline', route: '/tutorial', glyph: '♜' },
];

const progressTiles: Tile[] = [
  { title: 'Conquistas', subtitle: 'Medalhas e metas', icon: 'medal-outline', route: '/achievements', glyph: '♛' },
  { title: 'Níveis e ligas', subtitle: 'Sua evolução', icon: 'trending-up-outline', route: '/levels', glyph: '♙' },
  { title: 'Histórico', subtitle: 'Partidas recentes', icon: 'time-outline', route: '/history', glyph: '♖' },
  { title: 'Ranking', subtitle: 'Top 1.000', icon: 'trophy-outline', route: '/leaderboard', glyph: '♔' },
];

const profileTile: Tile = {
  title: 'Perfil',
  subtitle: 'Estatísticas e preferências',
  icon: 'person-outline',
  route: '/profile',
  glyph: '♚',
};

const skillOptions: { level: SkillLevel; title: string; desc: string; icon: IconName }[] = [
  { level: 'Não sei jogar', title: 'Não sei jogar', desc: 'Dificuldade fácil, com tutorial', icon: 'school-outline' },
  { level: 'Sei o básico', title: 'Sei o básico', desc: 'Conheço regras e peças. Dificuldade média', icon: 'book-outline' },
  { level: 'Sou bom', title: 'Sou bom', desc: 'Jogo com tática. Dificuldade difícil', icon: 'trophy-outline' },
];

const difficultyOptions: { level: GameDifficulty; title: string; desc: string; icon: IconName }[] = [
  { level: 'Fácil', title: 'Fácil', desc: 'Jogadas simples, ideal para começar', icon: 'leaf-outline' },
  { level: 'Médio', title: 'Médio', desc: 'Bot tático e equilibrado', icon: 'hardware-chip-outline' },
  { level: 'Difícil', title: 'Difícil', desc: 'Bot calculista e exigente', icon: 'flame-outline' },
];

const pieces = [
  { symbol: '♙', name: 'Peão', text: 'Anda 1 casa para frente (2 no primeiro lance) e captura na diagonal.' },
  { symbol: '♖', name: 'Torre', text: 'Move-se em linha reta, na horizontal ou vertical, por quantas casas quiser.' },
  { symbol: '♘', name: 'Cavalo', text: 'Move-se em "L": 2 casas em uma direção e 1 para o lado. Só ele pula peças.' },
  { symbol: '♗', name: 'Bispo', text: 'Move-se nas diagonais, sempre na mesma cor de casa.' },
  { symbol: '♕', name: 'Dama', text: 'Combina Torre e Bispo: a peça mais poderosa do jogo.' },
  { symbol: '♔', name: 'Rei', text: 'Anda 1 casa em qualquer direção e nunca pode ficar sob ataque.' },
];

const dustSpecks = [
  { left: '10%', size: 3, duration: 5200, delay: 0 },
  { left: '24%', size: 2, duration: 6400, delay: 1400 },
  { left: '38%', size: 3, duration: 5600, delay: 800 },
  { left: '52%', size: 2, duration: 7000, delay: 2600 },
  { left: '64%', size: 4, duration: 6000, delay: 400 },
  { left: '76%', size: 2, duration: 5000, delay: 2000 },
  { left: '88%', size: 3, duration: 6600, delay: 1000 },
] as const;

/* ---------- Pequenos blocos visuais ---------- */

// Degradê feito com faixas translúcidas (sem depender de expo-linear-gradient)
function Fade({ color, from, height }: { color: string; from: 'top' | 'bottom'; height: number }) {
  const steps = 14;
  return (
    <View
      pointerEvents="none"
      style={[styles.fade, { height }, from === 'top' ? { top: 0 } : { bottom: 0 }]}
    >
      {Array.from({ length: steps }).map((_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            backgroundColor: color,
            opacity: from === 'top' ? 1 - i / steps : i / steps,
          }}
        />
      ))}
    </View>
  );
}

// Brilho radial feito com círculos concêntricos
function Glow({ size, color }: { size: number; color: string }) {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => {
        const d = size * (1 - i / 8);
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: d,
              height: d,
              borderRadius: d / 2,
              backgroundColor: color,
              opacity: 0.035,
            }}
          />
        );
      })}
    </>
  );
}

function Speck({ left, size, duration, delay, enabled }: { left: string; size: number; duration: number; delay: number; enabled: boolean }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!enabled) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(t, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [t, duration, delay, enabled]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: 36,
        left: left as `${number}%`,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: GOLD,
        opacity: t.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.8, 0.4, 0] }),
        transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -170] }) }],
      }}
    />
  );
}

function ScalePress({
  children,
  onPress,
  style,
  containerStyle,
  label,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  label?: string;
}) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v: number) =>
    Animated.spring(s, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  return (
    <Animated.View style={[{ transform: [{ scale: s }] }, containerStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPressIn={() => to(0.97)}
        onPressOut={() => to(1)}
        onPress={onPress}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

function BentoTile({ tile, wide, onPress }: { tile: Tile; wide?: boolean; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <ScalePress
      label={`${tile.title}. ${tile.subtitle}`}
      onPress={onPress}
      containerStyle={wide ? styles.tileOuterWide : styles.tileOuter}
      style={[
        styles.tile,
        wide && styles.tileWide,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text pointerEvents="none" style={[styles.glyph, { color: colors.text }]}>
        {tile.glyph}
      </Text>
      <View style={[styles.tileIcon, { backgroundColor: colors.chipBg, borderColor: colors.border }]}>
        <Ionicons name={tile.icon} size={20} color={colors.primary} />
      </View>
      <View>
        <Text style={[styles.tileTitle, { color: colors.text }]}>{tile.title}</Text>
        <Text style={[styles.tileSub, { color: colors.textSecondary }]}>{tile.subtitle}</Text>
      </View>
    </ScalePress>
  );
}

function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fechar" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) + 8 },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: GOLD }]} />
            {children}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function OptionRow({
  icon,
  title,
  desc,
  selected,
  trailing,
  onPress,
}: {
  icon: IconName;
  title: string;
  desc: string;
  selected?: boolean;
  trailing: 'radio' | 'chevron';
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionRow,
        {
          backgroundColor: colors.cardSecondary ?? colors.chipBg,
          borderColor: selected ? GOLD : colors.border,
          borderWidth: selected ? 2 : 1,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.optionIcon, { backgroundColor: colors.chipBg }]}>
        <Ionicons name={icon} size={20} color={selected ? GOLD : colors.textSecondary} />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.optionTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>{desc}</Text>
      </View>
      {trailing === 'radio' ? (
        <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? GOLD : colors.textMuted} />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

/* ---------- Tela ---------- */

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [levels, setLevels] = useState<UserLevelsSummary>(() => getUserLevels());
  const [hasActiveMatch, setHasActiveMatch] = useState(false);
  const [focused, setFocused] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel>('Sei o básico');
  const [pendingMode, setPendingMode] = useState<'bot' | 'pvp'>('bot');

  const scrollY = useRef(new Animated.Value(0)).current;
  const intro = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;

  const boardSize = Math.min(width * 0.78, 320);

  const loadProfileData = () => {
    setProfile(getProfile());
    setLevels(getUserLevels());
    const saved = getActiveMatch();
    setHasActiveMatch(Boolean(saved && saved.fen && saved.fen !== START_FEN));
  };

  useEffect(() => {
    loadProfileData();
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
      setFocused(true);
      return () => setFocused(false);
    }, [])
  );

  // Entrada: o tabuleiro sobe e o rei desce, uma vez
  useEffect(() => {
    if (reduceMotion) {
      intro.setValue(1);
      return;
    }
    Animated.timing(intro, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [intro, reduceMotion]);

  // Levitação do rei e varredura de luz no tabuleiro
  useEffect(() => {
    if (reduceMotion) return;
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    const sweepLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(2400),
        Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    floatLoop.start();
    sweepLoop.start();
    return () => {
      floatLoop.stop();
      sweepLoop.stop();
    };
  }, [float, sweep, reduceMotion]);

  /* ----- Lógica original, preservada ----- */
  const handleStartGamePress = (targetMode: 'bot' | 'pvp' = 'bot') => {
    const currentProfile = getProfile();
    if (!currentProfile) {
      setPlayerName('');
      setSelectedLevel('Sei o básico');
      setPendingMode(targetMode);
      setShowOnboarding(true);
      return;
    }
    if (targetMode === 'pvp') {
      router.push({ pathname: '/game', params: { mode: 'pvp' } });
      return;
    }
    const saved = getActiveMatch();
    const active = saved && saved.fen && saved.fen !== START_FEN;
    if (active) {
      router.push({ pathname: '/game', params: { mode: 'bot' } });
    } else {
      setShowLevelModal(true);
    }
  };

  const handleSelectGameDifficulty = (difficulty: GameDifficulty) => {
    setShowLevelModal(false);
    router.push({ pathname: '/game', params: { mode: 'bot', difficulty } });
  };

  const handleSelectLevel = (level: SkillLevel) => {
    setSelectedLevel(level);
    if (level === 'Não sei jogar') setShowTutorial(true);
  };

  const handleConfirmOnboarding = () => {
    const trimmed = playerName.trim();
    if (trimmed.length < 2) {
      Alert.alert('Nome inválido', 'Digite um nome ou apelido com pelo menos 2 caracteres.');
      return;
    }
    const newProfile = createProfile(trimmed, selectedLevel);
    setProfile(newProfile);
    setShowOnboarding(false);
    router.push({ pathname: '/game', params: { mode: pendingMode } });
  };

  const winRate =
    profile && profile.matches_count > 0
      ? `${Math.round((profile.wins_count / profile.matches_count) * 100)}%`
      : '0%';
  const initial = profile?.name?.trim()?.charAt(0)?.toUpperCase();
  const go = (route: string) => router.push(route as any);

  /* ----- Animações derivadas ----- */
  const tilt = scrollY.interpolate({ inputRange: [0, 320], outputRange: ['56deg', '34deg'], extrapolate: 'clamp' });
  const parallax = scrollY.interpolate({ inputRange: [0, 400], outputRange: [0, 90], extrapolate: 'clamp' });
  const kingFloat = float.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  const shadowScale = float.interpolate({ inputRange: [0, 1], outputRange: [1, 0.78] });
  const shadowOpacity = float.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.28] });
  const glowScale = float.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const sweepX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-boardSize * 1.3, boardSize * 1.3] });

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {focused && <StatusBar style="light" />}

      <Animated.ScrollView
        style={styles.flex}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* Cobre o "puxar para baixo" com a cor do palco */}
        <View pointerEvents="none" style={styles.overscroll} />

        {/* ===== PALCO ===== */}
        <View style={[styles.stage, { paddingTop: insets.top + 12 }]}>
          {/* Cabeçalho */}
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir perfil"
              onPress={() => go('/profile')}
              style={({ pressed }) => [styles.headerProfile, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial ?? '♔'}</Text>
              </View>
              <View style={styles.flex}>
                <Text numberOfLines={1} style={styles.brandName}>
                  {profile ? profile.name : 'WinXadrez'}
                </Text>
                <Text numberOfLines={1} style={styles.brandSub}>
                  {profile ? `Nível ${levels.totalLevel} · ${profile.skill_level}` : 'Xadrez offline'}
                </Text>
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir configurações"
              onPress={() => go('/settings')}
              style={({ pressed }) => [styles.glassButton, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="settings-outline" size={22} color={IVORY} />
            </Pressable>
          </View>

          {/* Cena: tabuleiro em perspectiva + rei flutuante */}
          <View style={styles.scene}>
            <View style={styles.glowCenter} pointerEvents="none">
              <Animated.View style={styles.glowInner}>
                <Animated.View style={{ transform: [{ scale: glowScale }], alignItems: 'center', justifyContent: 'center' }}>
                  <Glow size={300} color={GOLD} />
                </Animated.View>
              </Animated.View>
            </View>

            <Animated.View
              pointerEvents="none"
              style={[
                styles.boardWrap,
                {
                  opacity: intro,
                  transform: [
                    { translateY: parallax },
                    { translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) },
                  ],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.board,
                  {
                    width: boardSize,
                    height: boardSize,
                    transform: [{ perspective: 900 }, { rotateX: tilt }, { rotateZ: '-16deg' }],
                  },
                ]}
              >
                {Array.from({ length: 8 }).map((_, r) => (
                  <View key={r} style={styles.boardRow}>
                    {Array.from({ length: 8 }).map((__, c) => (
                      <View
                        key={c}
                        style={{ flex: 1, backgroundColor: (r + c) % 2 === 0 ? BOARD_LIGHT : BOARD_DARK }}
                      />
                    ))}
                  </View>
                ))}
                <Animated.View
                  style={[styles.sweep, { height: boardSize * 1.8, transform: [{ translateX: sweepX }, { rotate: '28deg' }] }]}
                />
              </Animated.View>
            </Animated.View>

            <Fade color={STAGE} from="bottom" height={110} />

            {dustSpecks.map((s, i) => (
              <Speck key={i} {...s} enabled={!reduceMotion} />
            ))}

            {/* Sombra do rei sobre o tabuleiro */}
            <Animated.View
              pointerEvents="none"
              style={[styles.kingShadow, { opacity: shadowOpacity, transform: [{ scaleX: shadowScale }] }]}
            />

            {/* Rei */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.kingWrap,
                {
                  opacity: intro,
                  transform: [
                    { translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) },
                    { translateY: kingFloat },
                  ],
                },
              ]}
            >
              <Text style={styles.king}>♚</Text>
            </Animated.View>
          </View>

          {/* Mensagem e ações */}
          <View style={styles.stageText}>
            {hasActiveMatch && (
              <View style={styles.liveChip}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Partida em andamento</Text>
              </View>
            )}
            <Text style={styles.heroTitle}>
              {hasActiveMatch ? 'Seu rei ainda está em jogo.' : 'Cada lance muda o jogo.'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {hasActiveMatch
                ? 'Volte ao tabuleiro e termine o que começou.'
                : 'Enfrente um bot no seu nível ou desafie um amigo no mesmo aparelho.'}
            </Text>

            <ScalePress
              label={hasActiveMatch ? 'Continuar partida' : 'Jogar contra o bot'}
              onPress={() => handleStartGamePress('bot')}
              style={styles.goldButton}
            >
              <Ionicons name={hasActiveMatch ? 'play-forward' : 'play'} size={20} color={ON_GOLD} />
              <Text style={styles.goldButtonText}>{hasActiveMatch ? 'Continuar partida' : 'Jogar contra o bot'}</Text>
            </ScalePress>

            <ScalePress
              label="Jogar com um amigo"
              onPress={() => handleStartGamePress('pvp')}
              style={styles.ghostButton}
              containerStyle={{ marginTop: 10 }}
            >
              <Ionicons name="people-outline" size={20} color={IVORY} />
              <Text style={styles.ghostButtonText}>Jogar com um amigo</Text>
            </ScalePress>
          </View>
        </View>

        {/* ===== ESTATÍSTICAS (sobrepostas ao palco) ===== */}
        <View style={[styles.stats, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>{profile ? profile.matches_count : 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Partidas</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{winRate}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Vitórias</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.accent }]}>{profile ? profile.rating : 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pontos</Text>
          </View>
        </View>

        {/* ===== BENTO ===== */}
        <View style={styles.body}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Treinar</Text>
          <BentoTile tile={trainTiles[0]} wide onPress={() => go(trainTiles[0].route)} />
          <View style={styles.tileRow}>
            <BentoTile tile={trainTiles[1]} onPress={() => go(trainTiles[1].route)} />
            <BentoTile tile={trainTiles[2]} onPress={() => go(trainTiles[2].route)} />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 28 }]}>Progresso</Text>
          <View style={styles.tileRow}>
            <BentoTile tile={progressTiles[0]} onPress={() => go(progressTiles[0].route)} />
            <BentoTile tile={progressTiles[1]} onPress={() => go(progressTiles[1].route)} />
          </View>
          <View style={styles.tileRow}>
            <BentoTile tile={progressTiles[2]} onPress={() => go(progressTiles[2].route)} />
            <BentoTile tile={progressTiles[3]} onPress={() => go(progressTiles[3].route)} />
          </View>
          <BentoTile tile={profileTile} wide onPress={() => go(profileTile.route)} />
        </View>
      </Animated.ScrollView>

      {/* ===== Onboarding ===== */}
      <Sheet visible={showOnboarding} onClose={() => setShowOnboarding(false)}>
        <Text style={[styles.sheetTitle, { color: colors.text }]}>Crie seu perfil</Text>
        <Text style={[styles.sheetSub, { color: colors.textSecondary }]}>
          Com seu nome e nível, o bot começa na dificuldade certa para você.
        </Text>

        <Text style={[styles.fieldLabel, { color: colors.text }]}>Nome ou apelido</Text>
        <TextInput
          style={[
            styles.textInput,
            { backgroundColor: colors.cardSecondary ?? colors.chipBg, color: colors.text, borderColor: colors.borderStrong },
          ]}
          placeholder="Ex.: Mestre Carlos"
          placeholderTextColor={colors.textMuted}
          value={playerName}
          onChangeText={setPlayerName}
          maxLength={25}
          autoFocus
        />

        <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 16 }]}>Seu nível de xadrez</Text>
        <View style={styles.optionList}>
          {skillOptions.map((opt) => (
            <OptionRow
              key={opt.level}
              icon={opt.icon}
              title={opt.title}
              desc={opt.desc}
              selected={selectedLevel === opt.level}
              trailing="radio"
              onPress={() => handleSelectLevel(opt.level)}
            />
          ))}
        </View>

        {selectedLevel === 'Não sei jogar' && (
          <Pressable style={styles.linkButton} onPress={() => setShowTutorial(true)}>
            <Ionicons name="help-circle-outline" size={18} color={colors.accent} />
            <Text style={[styles.linkButtonText, { color: colors.accent }]}>Ver como se joga xadrez</Text>
          </Pressable>
        )}

        <View style={styles.sheetActions}>
          <Pressable
            accessibilityRole="button"
            style={[styles.cancelButton, { borderColor: colors.borderStrong }]}
            onPress={() => setShowOnboarding(false)}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={[styles.confirmButton, { flex: 2 }]} onPress={handleConfirmOnboarding}>
            <Text style={styles.confirmText}>Começar a jogar</Text>
          </Pressable>
        </View>
      </Sheet>

      {/* ===== Tutorial ===== */}
      <Sheet visible={showTutorial} onClose={() => setShowTutorial(false)}>
        <Text style={[styles.sheetTitle, { color: colors.text }]}>Como jogar xadrez</Text>
        <Text style={[styles.sheetSub, { color: colors.textSecondary }]}>O essencial para fazer seu primeiro lance.</Text>

        <ScrollView style={styles.tutorialScroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.tutorialHeading, { color: colors.text }]}>Objetivo</Text>
          <Text style={[styles.tutorialText, { color: colors.textSecondary }]}>
            Dar xeque-mate no rei adversário: deixá-lo sob ataque, sem nenhuma casa livre para escapar.
          </Text>

          <Text style={[styles.tutorialHeading, { color: colors.text, marginTop: 20 }]}>Como as peças se movem</Text>
          {pieces.map((p, index) => (
            <View
              key={p.name}
              style={[styles.pieceRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
            >
              <Text style={[styles.pieceSymbol, { color: GOLD }]}>{p.symbol}</Text>
              <View style={styles.flex}>
                <Text style={[styles.pieceName, { color: colors.text }]}>{p.name}</Text>
                <Text style={[styles.pieceText, { color: colors.textSecondary }]}>{p.text}</Text>
              </View>
            </View>
          ))}

          <Text style={[styles.tutorialHeading, { color: colors.text, marginTop: 20 }]}>Três dicas</Text>
          <Text style={[styles.tutorialText, { color: colors.textSecondary }]}>
            1. Controle o centro com peões e cavalos logo no início.{'\n'}
            2. Não deixe peças desprotegidas e observe cada lance do adversário.{'\n'}
            3. No nível fácil o bot erra de propósito, para você aprender jogando.
          </Text>
        </ScrollView>

        <Pressable accessibilityRole="button" style={[styles.confirmButton, { alignSelf: 'stretch', marginTop: 8 }]} onPress={() => setShowTutorial(false)}>
          <Text style={styles.confirmText}>Entendi</Text>
        </Pressable>
      </Sheet>

      {/* ===== Dificuldade ===== */}
      <Sheet visible={showLevelModal} onClose={() => setShowLevelModal(false)}>
        <Text style={[styles.sheetTitle, { color: colors.text }]}>Escolha a dificuldade</Text>
        <Text style={[styles.sheetSub, { color: colors.textSecondary }]}>Você enfrentará o bot neste nível.</Text>
        <View style={styles.optionList}>
          {difficultyOptions.map((opt) => (
            <OptionRow
              key={opt.level}
              icon={opt.icon}
              title={opt.title}
              desc={opt.desc}
              trailing="chevron"
              onPress={() => handleSelectGameDifficulty(opt.level)}
            />
          ))}
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fade: { position: 'absolute', left: 0, right: 0 },
  overscroll: { position: 'absolute', top: -900, left: 0, right: 0, height: 900, backgroundColor: STAGE },

  // Palco
  stage: {
    backgroundColor: STAGE,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    paddingBottom: 56,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20 },
  headerProfile: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: GOLD,
    backgroundColor: 'rgba(233,196,106,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: GOLD, fontSize: 20, fontWeight: '800' },
  brandName: { color: IVORY, fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  brandSub: { color: 'rgba(243,234,211,0.6)', fontSize: 13, marginTop: 1 },
  glassButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Cena
  scene: { height: 300, marginTop: 4, alignItems: 'center', overflow: 'hidden' },
  glowCenter: { position: 'absolute', top: 0, left: 0, right: 0, height: 220, alignItems: 'center', justifyContent: 'center' },
  glowInner: { alignItems: 'center', justifyContent: 'center' },
  boardWrap: { position: 'absolute', top: 14, alignItems: 'center' },
  board: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(233,196,106,0.55)',
    backgroundColor: BOARD_DARK,
  },
  boardRow: { flex: 1, flexDirection: 'row' },
  sweep: {
    position: 'absolute',
    top: -40,
    left: '50%',
    width: 64,
    backgroundColor: 'rgba(233,196,106,0.2)',
  },
  kingWrap: { position: 'absolute', top: 14, alignItems: 'center' },
  king: {
    fontSize: 96,
    lineHeight: 110,
    color: GOLD,
    includeFontPadding: false,
    textShadowColor: 'rgba(233,196,106,0.75)',
    textShadowRadius: 28,
    textShadowOffset: { width: 0, height: 0 },
  },
  kingShadow: {
    position: 'absolute',
    top: 148,
    width: 96,
    height: 22,
    borderRadius: 48,
    backgroundColor: '#000000',
  },

  // Texto do palco
  stageText: { paddingHorizontal: 20, marginTop: 4 },
  liveChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(233,196,106,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(233,196,106,0.35)',
    marginBottom: 12,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: GOLD },
  liveText: { color: GOLD, fontSize: 12, fontWeight: '600' },
  heroTitle: { color: IVORY, fontSize: 32, lineHeight: 36, fontWeight: '800', letterSpacing: -1, marginBottom: 8 },
  heroSubtitle: { color: 'rgba(243,234,211,0.65)', fontSize: 15, lineHeight: 22, marginBottom: 22 },
  goldButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: GOLD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: GOLD,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  goldButtonText: { color: ON_GOLD, fontSize: 17, fontWeight: '800' },
  ghostButton: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ghostButtonText: { color: IVORY, fontSize: 15, fontWeight: '600' },

  // Estatísticas
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: -34,
    paddingVertical: 16,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 34 },

  // Bento
  body: { paddingHorizontal: 20, marginTop: 28 },
  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, marginBottom: 12 },
  tileRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  tileOuter: { flex: 1 },
  tileOuterWide: { marginTop: 12 },
  tile: {
    minHeight: 138,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  tileWide: { minHeight: 112 },
  glyph: { position: 'absolute', right: -6, bottom: -30, fontSize: 124, opacity: 0.06 },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  tileSub: { fontSize: 13, marginTop: 2 },

  // Sheets
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 18, opacity: 0.8 },
  sheetTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, marginBottom: 6 },
  sheetSub: { fontSize: 14, lineHeight: 20, marginBottom: 18 },
  fieldLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  textInput: { minHeight: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 16 },
  optionList: { gap: 10 },
  optionRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14 },
  optionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontSize: 15, fontWeight: '700' },
  optionDesc: { fontSize: 13, marginTop: 1, lineHeight: 17 },
  linkButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6 },
  linkButtonText: { fontSize: 14, fontWeight: '600' },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelButton: { flex: 1, minHeight: 52, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600' },
  confirmButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { color: ON_GOLD, fontSize: 15, fontWeight: '800' },

  // Tutorial
  tutorialScroll: { marginBottom: 12 },
  tutorialHeading: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  tutorialText: { fontSize: 14, lineHeight: 22 },
  pieceRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  pieceSymbol: { width: 36, fontSize: 30, textAlign: 'center' },
  pieceName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  pieceText: { fontSize: 13, lineHeight: 18 },
});