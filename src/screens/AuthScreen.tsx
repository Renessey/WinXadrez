import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  Easing,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;
type AuthMode = 'login' | 'signup';

export default function AuthScreen({ navigation }: Props) {
  const entrance = useRef(new Animated.Value(0)).current;
  const constellationPulse = useRef(new Animated.Value(0)).current;
  const guestPulse = useRef(new Animated.Value(0)).current;
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const entranceAnimation = Animated.timing(entrance, {
      toValue: 1,
      duration: 850,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    entranceAnimation.start();
    return () => {
      entranceAnimation.stop();
    };
  }, [entrance]);

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(constellationPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(constellationPulse, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ]),
    );

    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, [constellationPulse]);

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(guestPulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(guestPulse, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ]),
    );

    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, [guestPulse]);

  const isSignup = mode === 'signup';

  const submit = () => {
    if (isSignup && name.trim().length < 2) {
      setError('Digite seu nome para continuar.');
      return;
    }

    if (!email.includes('@')) {
      setError('Digite um e-mail válido.');
      return;
    }

    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    setError('');
    navigation.replace('Home');
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View pointerEvents="none" style={styles.astralBackground}>
        {[['11%', '18%'], ['84%', '12%'], ['92%', '38%'], ['7%', '61%'], ['88%', '73%'], ['18%', '88%'], ['68%', '91%'], ['35%', '14%'], ['58%', '78%'], ['96%', '56%']].map(([left, top], index) => (
          <Animated.View
            key={`${left}-${top}`}
            style={[
              styles.backgroundStar,
              { left: left as `${number}%`, top: top as `${number}%`, width: index % 3 === 0 ? 4 : 3, height: index % 3 === 0 ? 4 : 3 },
              {
                opacity: constellationPulse.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: index % 2 === 0 ? [0.35, 1, 0.35] : [1, 0.3, 1],
                }),
              },
            ]}
          />
        ))}
        <View style={[styles.backgroundLine, styles.backgroundLineOne]} />
        <View style={[styles.backgroundLine, styles.backgroundLineTwo]} />
        <View style={[styles.backgroundLine, styles.backgroundLineThree]} />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.pageContent,
            {
              opacity: entrance,
              transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
            },
          ]}
        >
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Text style={styles.logoMark}>♔</Text>
          </View>
          <View>
            <Text style={styles.brandName}>WinXadrez</Text>
            <Text style={styles.brandSubtitle}>Jogue no seu ritmo</Text>
          </View>
        </View>

        <View style={styles.intro}>
          <Text style={styles.eyebrow}>CLUBE DE ESTRATÉGIA</Text>
          <Text style={styles.title}>{isSignup ? 'Crie seu espaço.' : 'Sua próxima jogada.'}</Text>
          <Text style={styles.description}>
            {isSignup
              ? 'Monte seu perfil e acompanhe cada evolução no tabuleiro.'
              : 'Entre para continuar sua jornada no xadrez.'}
          </Text>
        </View>

        <Animated.View
          style={[
            styles.formCard,
            { transform: [{ scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }] },
          ]}
        >
          <View style={styles.modeSwitch}>
            <TouchableOpacity
              style={[styles.modeOption, !isSignup && styles.modeOptionActive]}
              activeOpacity={0.8}
              onPress={() => switchMode('login')}
            >
              <Text style={[styles.modeText, !isSignup && styles.modeTextActive]}>Entrar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeOption, isSignup && styles.modeOptionActive]}
              activeOpacity={0.8}
              onPress={() => switchMode('signup')}
            >
              <Text style={[styles.modeText, isSignup && styles.modeTextActive]}>Criar conta</Text>
            </TouchableOpacity>
          </View>

          {isSignup && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nome</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color="#8f8a84" />
                <TextInput
                  style={styles.input}
                  placeholder="Como devemos chamar você?"
                  placeholderTextColor="#77716b"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="#8f8a84" />
              <TextInput
                style={styles.input}
                placeholder="voce@exemplo.com"
                placeholderTextColor="#77716b"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="#8f8a84" />
              <TextInput
                style={styles.input}
                placeholder="Mínimo de 6 caracteres"
                placeholderTextColor="#77716b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                onPress={() => setShowPassword((visible) => !visible)}
              >
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#8f8a84" />
              </TouchableOpacity>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.submitButton} activeOpacity={0.85} onPress={submit}>
            <Text style={styles.submitText}>{isSignup ? 'Criar minha conta' : 'Entrar no WinXadrez'}</Text>
            <Ionicons name="arrow-forward" size={18} color="#171614" />
          </TouchableOpacity>

          {!isSignup && <Text style={styles.forgotText}>Esqueceu sua senha?</Text>}
        </Animated.View>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.divider} />
        </View>

        <Animated.View
          style={[
            styles.guestPulseWrap,
            {
              transform: [{ scale: guestPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.018] }) }],
            },
          ]}
        >
          <TouchableOpacity style={styles.guestButton} activeOpacity={0.85} onPress={() => navigation.replace('Home')}>
            <Ionicons name="glasses-outline" size={19} color="#b9f27c" />
            <View style={styles.guestCopy}>
              <Text style={styles.guestTitle}>Entrar sem cadastro</Text>
              <Text style={styles.guestSubtitle}>Explore o app como visitante</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#77716b" />
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.legalText}>Ao continuar, você concorda com os termos de uso do WinXadrez.</Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#171614',
  },
  astralBackground: {
    ...StyleSheet.absoluteFill,
    opacity: 0.9,
    zIndex: 0,
  },
  backgroundStar: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#f0ffd9',
    shadowColor: '#b9f27c',
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  backgroundLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(185,242,124,0.28)',
  },
  backgroundLineOne: {
    width: 160,
    left: '10%',
    top: '18%',
    transform: [{ rotate: '24deg' }],
  },
  backgroundLineTwo: {
    width: 210,
    right: '-8%',
    top: '38%',
    transform: [{ rotate: '-28deg' }],
  },
  backgroundLineThree: {
    width: 180,
    left: '-12%',
    top: '73%',
    transform: [{ rotate: '-18deg' }],
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 34,
    paddingBottom: 24,
  },
  pageContent: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#24221f',
    borderWidth: 1,
    borderColor: 'rgba(185,242,124,0.22)',
  },
  logoMark: {
    color: '#b9f27c',
    fontSize: 25,
    fontWeight: '900',
  },
  brandName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  brandSubtitle: {
    color: '#8f8a84',
    fontSize: 11,
    marginTop: 2,
  },
  intro: {
    marginTop: 42,
    marginBottom: 22,
  },
  eyebrow: {
    color: '#81b64c',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginBottom: 9,
  },
  title: {
    color: '#ffffff',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  description: {
    color: '#a8a29b',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
    maxWidth: 310,
  },
  formCard: {
    backgroundColor: '#1d1b1a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    shadowColor: '#81b64c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: '#171614',
    borderRadius: 13,
    padding: 4,
    marginBottom: 20,
  },
  modeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  modeOptionActive: {
    backgroundColor: '#b9f27c',
  },
  modeText: {
    color: '#8f8a84',
    fontSize: 12,
    fontWeight: '800',
  },
  modeTextActive: {
    color: '#171614',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    color: '#d8d3ce',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 7,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    backgroundColor: '#171614',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 13,
    gap: 9,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    paddingVertical: 0,
  },
  error: {
    color: '#ff8c8c',
    fontSize: 12,
    marginBottom: 12,
  },
  submitButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: '#b9f27c',
    borderRadius: 15,
    marginTop: 2,
  },
  submitText: {
    color: '#171614',
    fontSize: 14,
    fontWeight: '900',
  },
  forgotText: {
    color: '#8fae72',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    color: '#77716b',
    fontSize: 11,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#20271d',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(129,182,76,0.24)',
    padding: 14,
  },
  guestPulseWrap: {
    shadowColor: '#81b64c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  guestCopy: {
    flex: 1,
    marginLeft: 11,
  },
  guestTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  guestSubtitle: {
    color: '#9eae91',
    fontSize: 11,
    marginTop: 3,
  },
  legalText: {
    color: '#68635e',
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 18,
  },
});
