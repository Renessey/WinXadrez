import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  PanResponder,
  Modal,
  TextInput,
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

type GameDifficulty = 'Fácil' | 'Médio' | 'Difícil';
type IonName = keyof typeof Ionicons.glyphMap;
type McName = keyof typeof MaterialCommunityIcons.glyphMap;
type Anim = Animated.AnimatedInterpolation<number>;

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

/* ---------- Paleta: obsidiana, latão e marfim ---------- */
const BG = '#070908';
const SURFACE = '#0f1311';
const SURFACE_2 = '#151a17';
const GOLD = '#d9b45b';
const GOLD_BRIGHT = '#f6dc98';
const GOLD_DEEP = '#3a2a0c';
const IVORY = '#f2ecdd';
const MUTED = 'rgba(242,236,221,0.62)';
const HAIR = 'rgba(217,180,91,0.22)';
const ON_GOLD = '#1b1405';

function parseHex(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const mix = (a: string, b: string, t: number) => {
  const A = parseHex(a);
  const B = parseHex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
};
const clamp = (v: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, v));

/* ---------- Dados ---------- */
interface MenuItem {
  title: string;
  subtitle: string;
  icon: McName;
  route: string;
}

const menuSections: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Treinar',
    items: [
      { title: 'Puzzles', subtitle: 'Desafio diário', icon: 'chess-knight', route: '/puzzle' },
      { title: 'Aberturas', subtitle: 'Biblioteca', icon: 'chess-pawn', route: '/openings' },
      { title: 'Aprenda a jogar', subtitle: 'Regras e peças', icon: 'school-outline', route: '/tutorial' },
    ],
  },
  {
    title: 'Sua evolução',
    items: [
      { title: 'Conquistas', subtitle: 'Medalhas e metas', icon: 'medal-outline', route: '/achievements' },
      { title: 'Níveis e ligas', subtitle: 'Progresso', icon: 'chart-line', route: '/levels' },
      { title: 'Histórico', subtitle: 'Partidas recentes', icon: 'history', route: '/history' },
      { title: 'Ranking', subtitle: 'Top 1.000', icon: 'podium', route: '/leaderboard' },
      { title: 'Perfil', subtitle: 'Estatísticas', icon: 'account-outline', route: '/profile' },
    ],
  },
];

const skillOptions: { level: SkillLevel; title: string; desc: string; icon: IonName }[] = [
  { level: 'Não sei jogar', title: 'Não sei jogar', desc: 'Dificuldade fácil, com tutorial', icon: 'school-outline' },
  { level: 'Sei o básico', title: 'Sei o básico', desc: 'Conheço regras e peças. Dificuldade média', icon: 'book-outline' },
  { level: 'Sou bom', title: 'Sou bom', desc: 'Jogo com tática. Dificuldade difícil', icon: 'trophy-outline' },
];

const difficultyOptions: { level: GameDifficulty; title: string; desc: string; icon: IonName }[] = [
  { level: 'Fácil', title: 'Fácil', desc: 'Jogadas simples, ideal para começar', icon: 'leaf-outline' },
  { level: 'Médio', title: 'Médio', desc: 'Bot tático e equilibrado', icon: 'hardware-chip-outline' },
  { level: 'Difícil', title: 'Difícil', desc: 'Bot calculista e exigente', icon: 'flame-outline' },
];

const skillDifficulty: Record<SkillLevel, GameDifficulty> = {
  'Não sei jogar': 'Fácil',
  'Sei o básico': 'Médio',
  'Sou bom': 'Difícil',
};

const pieceGuide: { icon: McName; name: string; text: string }[] = [
  { icon: 'chess-pawn', name: 'Peão', text: 'Anda 1 casa para frente (2 no primeiro lance) e captura na diagonal.' },
  { icon: 'chess-rook', name: 'Torre', text: 'Move-se em linha reta, na horizontal ou vertical, por quantas casas quiser.' },
  { icon: 'chess-knight', name: 'Cavalo', text: 'Move-se em "L": 2 casas em uma direção e 1 para o lado. Só ele pula peças.' },
  { icon: 'chess-bishop', name: 'Bispo', text: 'Move-se nas diagonais, sempre na mesma cor de casa.' },
  { icon: 'chess-queen', name: 'Dama', text: 'Combina Torre e Bispo: a peça mais poderosa do jogo.' },
  { icon: 'chess-king', name: 'Rei', text: 'Anda 1 casa em qualquer direção e nunca pode ficar sob ataque.' },
];

/* ---------- Blocos visuais ---------- */

function Fade({ color, from, height, style }: { color: string; from: 'top' | 'bottom'; height: number; style?: StyleProp<ViewStyle> }) {
  const steps = 14;
  return (
    <View pointerEvents="none" style={[styles.fade, { height }, style]}>
      {Array.from({ length: steps }).map((_, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: color, opacity: from === 'top' ? 1 - i / steps : i / steps }} />
      ))}
    </View>
  );
}

// Peça "extrudada": várias cópias empilhadas que se abrem conforme o card inclina
function ExtrudedPiece({
  icon,
  size,
  layers,
  left,
  top,
  X,
  Y,
  reach,
  rise,
  colorTop,
  colorDeep,
  opacity = 1,
}: {
  icon: McName;
  size: number;
  layers: number;
  left: number;
  top: number;
  X: Anim;
  Y: Anim;
  reach: number;
  rise: number;
  colorTop: string;
  colorDeep: string;
  opacity?: number;
}) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left, top, width: size, height: size, opacity }}>
      {Array.from({ length: layers }).map((_, i) => {
        const d = layers > 1 ? i / (layers - 1) : 1;
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              top: -i * rise,
              transform: [
                { translateX: X.interpolate({ inputRange: [-1, 1], outputRange: [-d * reach, d * reach] }) },
                { translateY: Y.interpolate({ inputRange: [-1, 1], outputRange: [-d * reach, d * reach] }) },
              ],
            }}
          >
            <MaterialCommunityIcons name={icon} size={size} color={mix(colorDeep, colorTop, d)} />
          </Animated.View>
        );
      })}
    </View>
  );
}

function Speck({ x, y, size, duration, delay, depth, X, Y, enabled }: { x: number; y: number; size: number; duration: number; delay: number; depth: number; X: Anim; Y: Anim; enabled: boolean }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!enabled) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(t, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
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
        left: x,
        top: y,
        transform: [
          { translateX: X.interpolate({ inputRange: [-1, 1], outputRange: [-depth * 26, depth * 26] }) },
          { translateY: Y.interpolate({ inputRange: [-1, 1], outputRange: [-depth * 26, depth * 26] }) },
        ],
      }}
    >
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: GOLD_BRIGHT,
          opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.9] }),
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -14] }) }],
        }}
      />
    </Animated.View>
  );
}

/* ---------- Card 3D: arraste para inclinar ---------- */
function HeroCard3D({ w, h, reduce, onLock }: { w: number; h: number; reduce: boolean; onLock: (v: boolean) => void }) {
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(0)).current;
  const hint = useRef(new Animated.Value(1)).current;
  const idleA = useRef(new Animated.Value(reduce ? 0.5 : 0)).current;
  const idleB = useRef(new Animated.Value(reduce ? 0.5 : 0)).current;
  const cur = useRef({ x: 0, y: 0 });
  const base = useRef({ x: 0, y: 0 });
  const dims = useRef({ w, h });
  const lockRef = useRef(onLock);
  dims.current = { w, h };
  lockRef.current = onLock;

  // Movimento sutil de "respiração" enquanto ninguém toca
  useEffect(() => {
    if (reduce) return;
    const mk = (v: Animated.Value, d: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: d, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: d, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
    const a = mk(idleA, 4600);
    const b = mk(idleB, 6200);
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [reduce, idleA, idleB]);

  useEffect(() => {
    const l1 = tx.addListener(({ value }) => (cur.current.x = value));
    const l2 = ty.addListener(({ value }) => (cur.current.y = value));
    return () => {
      tx.removeListener(l1);
      ty.removeListener(l2);
    };
  }, [tx, ty]);

  const release = () => {
    lockRef.current(false);
    Animated.parallel([
      Animated.spring(tx, { toValue: 0, useNativeDriver: true, friction: 5, tension: 55 }),
      Animated.spring(ty, { toValue: 0, useNativeDriver: true, friction: 5, tension: 55 }),
      Animated.timing(press, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start();
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        base.current = { ...cur.current };
        tx.stopAnimation();
        ty.stopAnimation();
        lockRef.current(true);
        Animated.timing(press, { toValue: 1, duration: 180, useNativeDriver: true }).start();
        Animated.timing(hint, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      },
      onPanResponderMove: (_, g) => {
        tx.setValue(clamp(base.current.x + g.dx / (dims.current.w * 0.45)));
        ty.setValue(clamp(base.current.y + g.dy / (dims.current.h * 0.45)));
      },
      onPanResponderRelease: release,
      onPanResponderTerminate: release,
    })
  ).current;

  // Inclinação final = dedo + respiração (que diminui quando você toca)
  const gain = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.15] });
  const idleX = Animated.multiply(idleA.interpolate({ inputRange: [0, 1], outputRange: [-0.4, 0.4] }), gain);
  const idleY = Animated.multiply(idleB.interpolate({ inputRange: [0, 1], outputRange: [-0.3, 0.3] }), gain);
  const X = Animated.add(tx, idleX) as unknown as Anim;
  const Y = Animated.add(ty, idleY) as unknown as Anim;

  const S = Math.min(h * 0.5, w * 0.46);
  const kingLeft = (w - S) / 2;
  const kingTop = h * 0.17;
  const baseY = kingTop + S * 0.9;
  const pedW = S * 1.7;
  const pedH = S * 0.42;

  const glareX = X.interpolate({ inputRange: [-1, 1], outputRange: [w * 0.8, -w * 0.8] });
  const glareX2 = X.interpolate({ inputRange: [-1, 1], outputRange: [w * 0.5, -w * 0.5] });

  return (
    <View style={{ width: w, height: h }} {...pan.panHandlers}>
      <Animated.View
        style={[
          styles.cardShell,
          {
            width: w,
            height: h,
            transform: [
              { perspective: 1000 },
              { rotateX: Y.interpolate({ inputRange: [-1, 1], outputRange: ['10deg', '-10deg'] }) },
              { rotateY: X.interpolate({ inputRange: [-1, 1], outputRange: ['-12deg', '12deg'] }) },
              { scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] }) },
            ],
          },
        ]}
      >
        <View style={styles.cardClip}>
          {/* Piso em perspectiva */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: -w * 0.4,
              bottom: -h * 0.22,
              width: w * 1.8,
              height: h * 0.9,
              transform: [{ perspective: 600 }, { rotateX: '68deg' }],
            }}
          >
            {Array.from({ length: 6 }).map((_, r) => (
              <View key={r} style={{ flex: 1, flexDirection: 'row' }}>
                {Array.from({ length: 12 }).map((__, c) => (
                  <View key={c} style={{ flex: 1, backgroundColor: (r + c) % 2 === 0 ? '#1a221e' : '#0c100e' }} />
                ))}
              </View>
            ))}
          </View>
          <Fade color="#0a0d0c" from="top" height={h * 0.2} style={{ top: h * 0.54, bottom: undefined }} />

          {/* Halo atrás do rei */}
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: kingTop - S * 0.4, height: S * 2, alignItems: 'center', justifyContent: 'center' }}>
            {Array.from({ length: 8 }).map((_, i) => {
              const d = S * 2.4 * (1 - i / 8);
              return <View key={i} style={{ position: 'absolute', width: d, height: d, borderRadius: d / 2, backgroundColor: GOLD, opacity: 0.035 }} />;
            })}
          </View>

          {/* Pedestal (3 anéis empilhados dão espessura) */}
          {[4, 2, 0].map((off, i) => (
            <View
              key={i}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: (w - pedW) / 2,
                top: baseY - pedH / 2 + off * 2.2,
                width: pedW,
                height: pedH,
                borderRadius: pedW / 2,
                backgroundColor: i === 2 ? '#14100a' : '#0a0805',
                borderWidth: 1.5,
                borderColor: i === 2 ? 'rgba(246,220,152,0.7)' : 'rgba(217,180,91,0.35)',
              }}
            />
          ))}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: (w - pedW * 0.6) / 2,
              top: baseY - pedH * 0.3,
              width: pedW * 0.6,
              height: pedH * 0.6,
              borderRadius: pedW,
              borderWidth: 1,
              borderColor: 'rgba(217,180,91,0.4)',
            }}
          />

          {/* Peças de apoio, mais ao fundo */}
          <ExtrudedPiece icon="chess-knight" size={S * 0.5} layers={6} left={w * 0.07} top={h * 0.36} X={X} Y={Y} reach={9} rise={1.1} colorTop="#8e8672" colorDeep="#1e1d19" opacity={0.7} />
          <ExtrudedPiece icon="chess-bishop" size={S * 0.5} layers={6} left={w - w * 0.07 - S * 0.5} top={h * 0.33} X={X} Y={Y} reach={9} rise={1.1} colorTop="#8e8672" colorDeep="#1e1d19" opacity={0.7} />

          {/* Rei principal */}
          <ExtrudedPiece icon="chess-king" size={S} layers={14} left={kingLeft} top={kingTop} X={X} Y={Y} reach={20} rise={1.5} colorTop={GOLD_BRIGHT} colorDeep={GOLD_DEEP} />

          {/* Faíscas em profundidades diferentes */}
          {[
            { x: 0.12, y: 0.2, s: 3, d: 3200, dl: 0, z: 1.2 },
            { x: 0.82, y: 0.16, s: 2, d: 4200, dl: 800, z: 0.6 },
            { x: 0.28, y: 0.55, s: 2, d: 3800, dl: 1500, z: 1.4 },
            { x: 0.7, y: 0.5, s: 4, d: 4600, dl: 400, z: 1.8 },
            { x: 0.9, y: 0.4, s: 2, d: 3400, dl: 1100, z: 0.9 },
            { x: 0.5, y: 0.1, s: 3, d: 4000, dl: 600, z: 0.4 },
            { x: 0.05, y: 0.6, s: 3, d: 5000, dl: 200, z: 1.6 },
          ].map((p, i) => (
            <Speck key={i} x={w * p.x} y={h * p.y} size={p.s} duration={p.d} delay={p.dl} depth={p.z} X={X} Y={Y} enabled={!reduce} />
          ))}

          {/* Brilho especular que acompanha a inclinação */}
          <Animated.View pointerEvents="none" style={[styles.glare, { height: h * 1.8, width: 70, transform: [{ translateX: glareX }, { rotate: '22deg' }] }]} />
          <Animated.View pointerEvents="none" style={[styles.glare, { height: h * 1.8, width: 18, opacity: 0.8, transform: [{ translateX: glareX2 }, { rotate: '22deg' }] }]} />

          {/* Aresta superior iluminada */}
          <View pointerEvents="none" style={styles.edgeLight} />

          {/* Dica */}
          <Animated.View pointerEvents="none" style={[styles.hint, { opacity: hint }]}>
            <Ionicons name="hand-left-outline" size={14} color={GOLD} />
            <Text style={styles.hintText}>Arraste para inclinar</Text>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

// Botão/tile que se inclina em direção ao ponto tocado
function TiltPress({
  children,
  onPress,
  style,
  innerStyle,
  containerStyle,
  label,
  max = 8,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  label?: string;
  max?: number;
}) {
  const rx = useRef(new Animated.Value(0)).current;
  const ry = useRef(new Animated.Value(0)).current;
  const sc = useRef(new Animated.Value(0)).current;
  const dim = useRef({ w: 1, h: 1 });
  const go = (v: Animated.Value, to: number) => Animated.spring(v, { toValue: to, useNativeDriver: true, speed: 28, bounciness: 6 }).start();
  return (
    <Animated.View
      style={[
        {
          transform: [
            { perspective: 700 },
            { rotateX: rx.interpolate({ inputRange: [-1, 1], outputRange: [`${max}deg`, `-${max}deg`] }) },
            { rotateY: ry.interpolate({ inputRange: [-1, 1], outputRange: [`-${max}deg`, `${max}deg`] }) },
            { scale: sc.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] }) },
          ],
        },
        containerStyle,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onLayout={(e) => (dim.current = { w: e.nativeEvent.layout.width || 1, h: e.nativeEvent.layout.height || 1 })}
        onPressIn={(e) => {
          const { locationX, locationY } = e.nativeEvent;
          go(ry, clamp((locationX / dim.current.w - 0.5) * 2));
          go(rx, clamp((locationY / dim.current.h - 0.5) * 2));
          go(sc, 1);
        }}
        onPressOut={() => {
          go(rx, 0);
          go(ry, 0);
          go(sc, 0);
        }}
        onPress={onPress}
        style={style}
      >
        <View pointerEvents="none" style={innerStyle}>
          {children}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fechar" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <View style={styles.handle} />
            {children}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function OptionRow({ icon, title, desc, selected, trailing, onPress }: { icon: IonName; title: string; desc: string; selected?: boolean; trailing: 'radio' | 'chevron'; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.optionRow, { borderColor: selected ? GOLD : HAIR, borderWidth: selected ? 2 : 1, opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={styles.optionIcon}>
        <Ionicons name={icon} size={20} color={GOLD} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDesc}>{desc}</Text>
      </View>
      {trailing === 'radio' ? (
        <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? GOLD : MUTED} />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={MUTED} />
      )}
    </Pressable>
  );
}

/* ---------- Tela ---------- */

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [levels, setLevels] = useState<UserLevelsSummary>(() => getUserLevels());
  const [hasActiveMatch, setHasActiveMatch] = useState(false);
  const [focused, setFocused] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [scrollLocked, setScrollLocked] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel>('Sei o básico');
  const [pendingMode, setPendingMode] = useState<'bot' | 'pvp'>('bot');

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

  /* ----- Lógica original, preservada ----- */
  const handleStartGamePress = (targetMode: 'bot' | 'pvp' = 'bot') => {
    const currentProfile = getProfile();
    if (!currentProfile) {
      setPlayerName('');
      setOnboardingError(null);
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
    setOnboardingError(null);
    if (level === 'Não sei jogar') setShowTutorial(true);
  };

  const handleConfirmOnboarding = async () => {
    const trimmed = playerName.trim();
    if (trimmed.length < 2) {
      setOnboardingError('Digite um nome ou apelido com pelo menos 2 caracteres.');
      return;
    }
    if (isSavingProfile) return;

    setIsSavingProfile(true);
    try {
      const newProfile = await createProfile(trimmed, selectedLevel);
      setProfile(newProfile);
      setShowOnboarding(false);
      router.push({
        pathname: '/game',
        params:
          pendingMode === 'bot'
            ? { mode: 'bot', difficulty: skillDifficulty[selectedLevel] }
            : { mode: 'pvp' },
      });
    } catch (error) {
      console.error('Não foi possível criar o perfil:', error);
      setOnboardingError('Não foi possível salvar seu perfil. Tente novamente.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const go = (route: string) => router.push(route as any);
  const winRate = profile && profile.matches_count > 0 ? `${Math.round((profile.wins_count / profile.matches_count) * 100)}%` : '0%';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const initial = profile?.name?.trim()?.charAt(0)?.toUpperCase();

  /* ----- Medidas ----- */
  const isWide = width >= 700;
  const padL = 20 + insets.left;
  const padR = 20 + insets.right;
  const cw = width - padL - padR;
  const colGap = 28;
  const heroW = isWide ? (cw - colGap) * 0.48 : cw;
  const heroH = isWide ? 380 : Math.min(Math.max(cw * 0.95, 300), 380);
  const cols = isWide ? 4 : 2;
  const gap = 12;
  const tileW = (cw - gap * (cols - 1)) / cols;

  /* ----- Seções ----- */
  const header = (
    <View style={styles.header}>
      <View style={styles.brand}>
        <MaterialCommunityIcons name="chess-king" size={22} color={GOLD} />
        <Text style={styles.wordmark}>WINXADREZ</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Abrir configurações" onPress={() => go('/settings')} style={({ pressed }) => [styles.roundButton, { opacity: pressed ? 0.6 : 1 }]}>
        <Ionicons name="settings-outline" size={21} color={IVORY} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Abrir perfil" onPress={() => go('/profile')} style={({ pressed }) => [styles.roundButton, { opacity: pressed ? 0.6 : 1, borderColor: GOLD }]}>
        {initial ? <Text style={styles.initial}>{initial}</Text> : <Ionicons name="person-outline" size={21} color={IVORY} />}
      </Pressable>
    </View>
  );

  const hero = <HeroCard3D w={heroW} h={heroH} reduce={reduceMotion} onLock={setScrollLocked} />;

  const copy = (
    <View style={isWide ? undefined : { marginTop: 26 }}>
      <Text style={styles.eyebrow}>
        {profile ? `${greeting.toUpperCase()}, ${profile.name.toUpperCase()}` : 'BEM-VINDO'}
      </Text>
      <Text style={[styles.display, { fontSize: isWide ? 44 : 38, lineHeight: isWide ? 50 : 43 }]}>
        {hasActiveMatch ? 'Seu rei ainda está em jogo.' : 'Sua vez de jogar.'}
      </Text>
      <Text style={styles.lead}>
        {profile
          ? `Nível ${levels.totalLevel} · ${profile.skill_level}. ${hasActiveMatch ? 'Volte ao tabuleiro e termine o que começou.' : 'Escolha como quer começar.'}`
          : 'Xadrez offline, contra um bot calibrado ao seu nível ou contra um amigo.'}
      </Text>

      <TiltPress
        label={hasActiveMatch ? 'Continuar partida' : 'Jogar contra o bot'}
        onPress={() => handleStartGamePress('bot')}
        containerStyle={{ marginTop: 22 }}
        style={styles.cta}
        innerStyle={styles.ctaInner}
      >
        <View style={styles.ctaShine} />
        <Ionicons name={hasActiveMatch ? 'play-forward' : 'play'} size={19} color={ON_GOLD} />
        <Text style={styles.ctaText}>{hasActiveMatch ? 'Continuar partida' : 'Jogar contra o bot'}</Text>
      </TiltPress>

      <TiltPress label="Jogar com um amigo" onPress={() => handleStartGamePress('pvp')} containerStyle={{ marginTop: 10 }} style={styles.ctaGhost} innerStyle={styles.ctaInner}>
        <Ionicons name="people-outline" size={20} color={IVORY} />
        <Text style={styles.ctaGhostText}>Jogar com um amigo</Text>
      </TiltPress>
    </View>
  );

  const stats = (
    <View style={styles.statsRow}>
      <View style={styles.stat}>
        <Text style={styles.statValue}>{profile ? profile.matches_count : 0}</Text>
        <Text style={styles.statLabel}>PARTIDAS</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.stat}>
        <Text style={[styles.statValue, { color: GOLD }]}>{winRate}</Text>
        <Text style={styles.statLabel}>VITÓRIAS</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.stat}>
        <Text style={styles.statValue}>{profile ? profile.rating : 0}</Text>
        <Text style={styles.statLabel}>PONTOS</Text>
      </View>
    </View>
  );

  const sections = menuSections.map((section) => (
    <View key={section.title} style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionRule} />
        <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
        <View style={[styles.sectionRule, { flex: 1 }]} />
      </View>
      <View style={[styles.tileGrid, { gap }]}>
        {section.items.map((item) => (
          <TiltPress
            key={item.route}
            label={`${item.title}. ${item.subtitle}`}
            onPress={() => go(item.route)}
            containerStyle={{ width: tileW }}
            style={styles.tile}
            innerStyle={styles.tileInner}
          >
            <View style={styles.tileIcon}>
              <MaterialCommunityIcons name={item.icon} size={24} color={GOLD} />
            </View>
            <View>
              <Text numberOfLines={1} style={styles.tileTitle}>
                {item.title}
              </Text>
              <Text numberOfLines={1} style={styles.tileSub}>
                {item.subtitle}
              </Text>
            </View>
          </TiltPress>
        ))}
      </View>
    </View>
  ));

  return (
    <View style={[styles.flex, { backgroundColor: BG }]}>
      {focused && <StatusBar style="light" />}

      {/* Luz ambiente no topo */}
      <View pointerEvents="none" style={styles.ambient}>
        {Array.from({ length: 8 }).map((_, i) => {
          const d = 460 * (1 - i / 8);
          return <View key={i} style={{ position: 'absolute', width: d, height: d, borderRadius: d / 2, backgroundColor: GOLD, opacity: 0.025 }} />;
        })}
      </View>

      <ScrollView
        style={styles.flex}
        scrollEnabled={!scrollLocked}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 44, paddingLeft: padL, paddingRight: padR }}
      >
        {header}

        {isWide ? (
          <View style={{ flexDirection: 'row', gap: colGap, marginTop: 24, alignItems: 'center' }}>
            {hero}
            <View style={styles.flex}>
              {copy}
              {stats}
            </View>
          </View>
        ) : (
          <>
            <View style={{ marginTop: 20 }}>{hero}</View>
            {copy}
            {stats}
          </>
        )}

        {sections}
      </ScrollView>

      {/* ===== Onboarding ===== */}
      <Sheet visible={showOnboarding} onClose={() => setShowOnboarding(false)}>
        <ScrollView
          style={styles.onboardingScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sheetTitle}>Crie seu perfil</Text>
          <Text style={styles.sheetSub}>Com seu nome e nível, o bot começa na dificuldade certa para você.</Text>

          <Text style={styles.fieldLabel}>Nome ou apelido</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ex.: Mestre Carlos"
            placeholderTextColor={MUTED}
            value={playerName}
            onChangeText={(name) => {
              setPlayerName(name);
              setOnboardingError(null);
            }}
            maxLength={25}
            autoFocus
            accessibilityLabel="Nome ou apelido"
          />
          {onboardingError && <Text style={styles.onboardingError}>{onboardingError}</Text>}

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Seu nível de xadrez</Text>
          <View style={styles.optionList}>
            {skillOptions.map((opt) => (
              <OptionRow key={opt.level} icon={opt.icon} title={opt.title} desc={opt.desc} selected={selectedLevel === opt.level} trailing="radio" onPress={() => handleSelectLevel(opt.level)} />
            ))}
          </View>

          {selectedLevel === 'Não sei jogar' && (
            <Pressable style={styles.linkButton} onPress={() => setShowTutorial(true)}>
              <Ionicons name="help-circle-outline" size={18} color={GOLD} />
              <Text style={styles.linkButtonText}>Ver como se joga xadrez</Text>
            </Pressable>
          )}
        </ScrollView>

        <View style={styles.sheetActions}>
          <Pressable accessibilityRole="button" style={styles.cancelButton} onPress={() => setShowOnboarding(false)}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={isSavingProfile} style={[styles.confirmButton, { flex: 2, opacity: isSavingProfile ? 0.7 : 1 }]} onPress={handleConfirmOnboarding}>
            <Text style={styles.confirmText}>{isSavingProfile ? 'Salvando...' : 'Começar a jogar'}</Text>
          </Pressable>
        </View>
      </Sheet>

      {/* ===== Tutorial ===== */}
      <Sheet visible={showTutorial} onClose={() => setShowTutorial(false)}>
        <Text style={styles.sheetTitle}>Como jogar xadrez</Text>
        <Text style={styles.sheetSub}>O essencial para fazer seu primeiro lance.</Text>

        <ScrollView style={styles.tutorialScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.tutorialHeading}>Objetivo</Text>
          <Text style={styles.tutorialText}>Dar xeque-mate no rei adversário: deixá-lo sob ataque, sem nenhuma casa livre para escapar.</Text>

          <Text style={[styles.tutorialHeading, { marginTop: 20 }]}>Como as peças se movem</Text>
          {pieceGuide.map((p, index) => (
            <View key={p.name} style={[styles.pieceRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: HAIR }]}>
              <View style={styles.pieceIcon}>
                <MaterialCommunityIcons name={p.icon} size={24} color={GOLD} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.pieceName}>{p.name}</Text>
                <Text style={styles.pieceText}>{p.text}</Text>
              </View>
            </View>
          ))}

          <Text style={[styles.tutorialHeading, { marginTop: 20 }]}>Três dicas</Text>
          <Text style={styles.tutorialText}>
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
        <Text style={styles.sheetTitle}>Escolha a dificuldade</Text>
        <Text style={styles.sheetSub}>Você enfrentará o bot neste nível.</Text>
        <View style={styles.optionList}>
          {difficultyOptions.map((opt) => (
            <OptionRow key={opt.level} icon={opt.icon} title={opt.title} desc={opt.desc} trailing="chevron" onPress={() => handleSelectGameDifficulty(opt.level)} />
          ))}
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  ambient: { position: 'absolute', top: -200, left: 0, right: 0, height: 460, alignItems: 'center', justifyContent: 'center' },

  // Cabeçalho
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmark: { color: IVORY, fontFamily: SERIF, fontSize: 15, fontWeight: '700', letterSpacing: 4 },
  roundButton: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: HAIR, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  initial: { color: GOLD, fontFamily: SERIF, fontSize: 19, fontWeight: '700' },

  // Card 3D
  cardShell: {
    borderRadius: 32,
    backgroundColor: '#0a0d0c',
    shadowColor: GOLD,
    shadowOpacity: 0.28,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
  cardClip: { flex: 1, borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(217,180,91,0.38)', backgroundColor: '#0a0d0c' },
  glare: { position: 'absolute', top: -40, left: '50%', backgroundColor: 'rgba(255,244,214,0.07)' },
  edgeLight: { position: 'absolute', top: 0, left: 28, right: 28, height: 1, backgroundColor: 'rgba(255,244,214,0.35)' },
  hint: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: HAIR,
  },
  hintText: { color: MUTED, fontSize: 12, fontWeight: '500' },

  // Texto e CTAs
  eyebrow: { color: GOLD, fontSize: 11, fontWeight: '700', letterSpacing: 2.2 },
  display: { color: IVORY, fontFamily: SERIF, fontWeight: '700', letterSpacing: -1, marginTop: 8 },
  lead: { color: MUTED, fontSize: 15, lineHeight: 22, marginTop: 10 },
  cta: { borderRadius: 18, backgroundColor: GOLD, overflow: 'hidden', shadowColor: GOLD, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  ctaInner: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaShine: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%', backgroundColor: 'rgba(255,255,255,0.18)' },
  ctaText: { color: ON_GOLD, fontSize: 17, fontWeight: '800' },
  ctaGhost: { borderRadius: 18, borderWidth: 1, borderColor: 'rgba(217,180,91,0.45)', backgroundColor: 'rgba(217,180,91,0.06)' },
  ctaGhostText: { color: IVORY, fontSize: 16, fontWeight: '600' },

  // Estatísticas
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 28, paddingVertical: 22, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: HAIR },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: IVORY, fontFamily: SERIF, fontSize: 36, fontWeight: '700', letterSpacing: -0.5 },
  statLabel: { color: MUTED, fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginTop: 4 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 42, backgroundColor: HAIR },

  // Menu
  section: { marginTop: 34 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  sectionRule: { width: 22, height: StyleSheet.hairlineWidth, backgroundColor: GOLD, opacity: 0.6 },
  sectionTitle: { color: GOLD, fontSize: 11, fontWeight: '700', letterSpacing: 2.4 },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { borderRadius: 22, borderWidth: 1, borderColor: HAIR, backgroundColor: SURFACE, overflow: 'hidden' },
  tileInner: { minHeight: 132, padding: 16, justifyContent: 'space-between' },
  tileIcon: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: HAIR, backgroundColor: 'rgba(217,180,91,0.08)', alignItems: 'center', justifyContent: 'center' },
  tileTitle: { color: IVORY, fontFamily: SERIF, fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  tileSub: { color: MUTED, fontSize: 13, marginTop: 2 },

  // Sheets
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  sheetWrap: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  sheet: { maxHeight: '92%', backgroundColor: SURFACE, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0, borderColor: HAIR, paddingHorizontal: 20, paddingTop: 10 },
  onboardingScroll: { flexShrink: 1 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 18, backgroundColor: GOLD, opacity: 0.8 },
  sheetTitle: { color: IVORY, fontFamily: SERIF, fontSize: 26, fontWeight: '700', letterSpacing: -0.5, marginBottom: 6 },
  sheetSub: { color: MUTED, fontSize: 14, lineHeight: 20, marginBottom: 18 },
  fieldLabel: { color: IVORY, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  textInput: { minHeight: 52, borderWidth: 1, borderColor: HAIR, borderRadius: 14, paddingHorizontal: 14, fontSize: 16, color: IVORY, backgroundColor: SURFACE_2 },
  onboardingError: { color: '#ff8b8b', fontSize: 13, marginTop: 7 },
  optionList: { gap: 10 },
  optionRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: SURFACE_2 },
  optionIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(217,180,91,0.08)' },
  optionTitle: { color: IVORY, fontSize: 15, fontWeight: '700' },
  optionDesc: { color: MUTED, fontSize: 13, marginTop: 1, lineHeight: 17 },
  linkButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6 },
  linkButtonText: { color: GOLD, fontSize: 14, fontWeight: '600' },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelButton: { flex: 1, minHeight: 54, borderRadius: 16, borderWidth: 1, borderColor: HAIR, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: MUTED, fontSize: 15, fontWeight: '600' },
  confirmButton: { minHeight: 54, borderRadius: 16, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: ON_GOLD, fontSize: 15, fontWeight: '800' },

  // Tutorial
  tutorialScroll: { marginBottom: 12 },
  tutorialHeading: { color: IVORY, fontFamily: SERIF, fontSize: 19, fontWeight: '700', marginBottom: 6 },
  tutorialText: { color: MUTED, fontSize: 14, lineHeight: 22 },
  pieceRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  pieceIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(217,180,91,0.08)', borderWidth: 1, borderColor: HAIR },
  pieceName: { color: IVORY, fontSize: 15, fontWeight: '600', marginBottom: 2 },
  pieceText: { color: MUTED, fontSize: 13, lineHeight: 18 },
});