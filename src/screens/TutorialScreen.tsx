import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';

type PieceGuide = {
  id: string;
  symbol: string;
  name: string;
  value: string;
  summary: string;
  detail: string;
  color: string;
};

const piecesGuide: PieceGuide[] = [
  {
    id: 'p',
    symbol: '♙',
    name: 'Peão',
    value: '1 pt',
    summary: 'Avança 1 casa (ou 2 no 1º lance) e captura na diagonal.',
    detail:
      'Nunca anda para trás. Ao alcançar a última fileira do tabuleiro, promove-se para Dama, Torre, Bispo ou Cavalo.',
    color: '#81b64c',
  },
  {
    id: 'n',
    symbol: '♘',
    name: 'Cavalo',
    value: '3 pts',
    summary: 'Move-se em formato de "L" e pode pular outras peças.',
    detail:
      'Anda 2 casas em uma direção e 1 perpendicular. É excelente para garfos táticos em posições fechadas.',
    color: '#38bdf8',
  },
  {
    id: 'b',
    symbol: '♗',
    name: 'Bispo',
    value: '3 pts',
    summary: 'Desloca-se pelas diagonais quantas casas livres quiser.',
    detail:
      'Cada bispo permanece na mesma cor de casa durante toda a partida. O par de bispos trabalha muito bem em posições abertas.',
    color: '#f5b858',
  },
  {
    id: 'r',
    symbol: '♖',
    name: 'Torre',
    value: '5 pts',
    summary: 'Anda em linhas retas horizontais e verticais.',
    detail:
      'Brilha em colunas abertas e na 7ª fileira. Também participa do movimento especial chamado Roque junto com o Rei.',
    color: '#5fa8ff',
  },
  {
    id: 'q',
    symbol: '♕',
    name: 'Dama (Rainha)',
    value: '9 pts',
    summary: 'Combina os movimentos da Torre e do Bispo.',
    detail:
      'É a peça mais poderosa do jogo. Evite expô-la cedo demais para não perder tempos fugindo de peças menores.',
    color: '#9b8cff',
  },
  {
    id: 'k',
    symbol: '♔',
    name: 'Rei',
    value: 'Vital',
    summary: 'Anda 1 casa em qualquer direção e precisa estar protegido.',
    detail:
      'Nunca pode mover-se para uma casa atacada. Se estiver em xeque sem nenhuma defesa ou fuga, ocorre o Xeque-mate.',
    color: '#f43f5e',
  },
];

const specialRules = [
  {
    title: 'Roque (Segurança do Rei)',
    icon: 'shield-checkmark',
    color: '#81b64c',
    desc: 'Rei anda 2 casas em direção à Torre e a Torre salta por cima dele. Só vale se nenhum dos dois tiver se movido e sem peças ou xeques no caminho.',
  },
  {
    title: 'En Passant (Captura de Passagem)',
    icon: 'flash',
    color: '#f5b858',
    desc: 'Quando um peão avança 2 casas e para ao lado de um peão adversário, este pode capturá-lo imediatamente na diagonal como se tivesse andado 1 casa.',
  },
  {
    title: 'Promoção do Peão',
    icon: 'arrow-up-circle',
    color: '#38bdf8',
    desc: 'Ao chegar na última fileira (fileira 8 para Brancas, 1 para Pretas), o peão vira imediatamente outra peça — geralmente uma Dama.',
  },
];

export default function TutorialScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [selectedPieceId, setSelectedPieceId] = useState<string>('p');

  const activePiece = piecesGuide.find((p) => p.id === selectedPieceId) ?? piecesGuide[0];

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
          <Text style={[styles.topBarTitle, { color: colors.text }]}>Aprenda Xadrez</Text>
          <Text style={[styles.topBarSub, { color: colors.accent }]}>Guia Completo e Regras</Text>
        </View>

        <View style={[styles.topBarIconWrap, { backgroundColor: `${colors.accent}20` }]}>
          <Ionicons name="school" size={20} color={colors.accent} />
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.kicker, { color: colors.primary }]}>OBJETIVO DO JOGO</Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Como vencer uma partida</Text>
          <Text style={[styles.heroText, { color: colors.textSecondary }]}>
            O objetivo no xadrez é dar <Text style={{ fontWeight: '800', color: colors.text }}>Xeque-mate</Text>: atacar o Rei adversário de modo que ele não consiga escapar, capturar a peça atacante ou bloquear o ataque.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Movimento das Peças</Text>
        <View style={styles.pieceTabsRow}>
          {piecesGuide.map((piece) => {
            const isSelected = piece.id === activePiece.id;
            return (
              <TouchableOpacity
                key={piece.id}
                style={[
                  styles.pieceChip,
                  {
                    backgroundColor: isSelected ? `${piece.color}22` : colors.surface,
                    borderColor: isSelected ? piece.color : colors.border,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedPieceId(piece.id)}
              >
                <Text style={[styles.pieceChipSymbol, { color: colors.text }]}>{piece.symbol}</Text>
                <Text
                  style={[
                    styles.pieceChipName,
                    { color: isSelected ? piece.color : colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {piece.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: activePiece.color }]}>
          <View style={styles.detailHeader}>
            <View style={[styles.detailIconWrap, { backgroundColor: `${activePiece.color}20` }]}>
              <Text style={styles.detailSymbol}>{activePiece.symbol}</Text>
            </View>
            <View style={styles.detailHeaderText}>
              <Text style={[styles.detailTitle, { color: colors.text }]}>{activePiece.name}</Text>
              <Text style={[styles.detailSub, { color: activePiece.color }]}>Valor relativo: {activePiece.value}</Text>
            </View>
          </View>
          <Text style={[styles.detailSummary, { color: colors.text }]}>{activePiece.summary}</Text>
          <Text style={[styles.detailBody, { color: colors.textSecondary }]}>{activePiece.detail}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Regras Especiais</Text>
        <View style={styles.rulesList}>
          {specialRules.map((rule) => (
            <View
              key={rule.title}
              style={[styles.ruleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.ruleIcon, { backgroundColor: `${rule.color}20` }]}>
                <Ionicons name={rule.icon as any} size={18} color={rule.color} />
              </View>
              <View style={styles.ruleTextWrap}>
                <Text style={[styles.ruleTitle, { color: colors.text }]}>{rule.title}</Text>
                <Text style={[styles.ruleDesc, { color: colors.textSecondary }]}>{rule.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={[styles.ctaSecondary, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.85}
            onPress={() => router.push('/puzzle')}
          >
            <Ionicons name="extension-puzzle" size={18} color={colors.accent} />
            <Text style={[styles.ctaSecondaryText, { color: colors.text }]}>Treinar Puzzles</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ctaPrimary, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/game', params: { mode: 'bot', difficulty: 'Fácil' } })}
          >
            <Ionicons name="play" size={18} color="#ffffff" />
            <Text style={styles.ctaPrimaryText}>Jogar Fácil</Text>
          </TouchableOpacity>
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
  content: { padding: 16, paddingBottom: 32 },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  heroTitle: { fontSize: 20, fontWeight: '900', marginBottom: 6 },
  heroText: { fontSize: 13, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  pieceTabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  pieceChip: {
    width: '31%',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  pieceChipSymbol: { fontSize: 22 },
  pieceChipName: { fontSize: 11, fontWeight: '800' },
  detailCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 22,
  },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  detailIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailSymbol: { fontSize: 28 },
  detailHeaderText: { flex: 1 },
  detailTitle: { fontSize: 18, fontWeight: '900' },
  detailSub: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  detailSummary: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  detailBody: { fontSize: 13, lineHeight: 19 },
  rulesList: { gap: 10, marginBottom: 22 },
  ruleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  ruleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleTextWrap: { flex: 1 },
  ruleTitle: { fontSize: 14, fontWeight: '800', marginBottom: 3 },
  ruleDesc: { fontSize: 12, lineHeight: 18 },
  ctaRow: { flexDirection: 'row', gap: 12 },
  ctaSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 13,
  },
  ctaSecondaryText: { fontSize: 14, fontWeight: '800' },
  ctaPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 13,
  },
  ctaPrimaryText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
});
