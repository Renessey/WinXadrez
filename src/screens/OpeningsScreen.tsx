import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Chess, type PieceSymbol } from 'chess.js';
import { useAppTheme } from '../context/ThemeContext';

type OpeningItem = {
  id: string;
  name: string;
  eco: string;
  side: 'Brancas' | 'Pretas';
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  moves: string[];
  idea: string;
  color: string;
};

const openingsCatalog: OpeningItem[] = [
  {
    id: 'italian',
    name: 'Abertura Italiana',
    eco: 'C50',
    side: 'Brancas',
    difficulty: 'Iniciante',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'],
    idea: 'Desenvolvimento rápido e pressão imediata sobre o ponto f7 das Pretas, buscando roque rápido e controle central.',
    color: '#81b64c',
  },
  {
    id: 'sicilian',
    name: 'Defesa Siciliana',
    eco: 'B20',
    side: 'Pretas',
    difficulty: 'Avançado',
    moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4'],
    idea: 'A resposta mais combativa contra 1.e4. Cria assimetria na estrutura de peões e abre a coluna c para contra-ataque.',
    color: '#f43f5e',
  },
  {
    id: 'queens-gambit',
    name: 'Gambito da Dama',
    eco: 'D06',
    side: 'Brancas',
    difficulty: 'Intermediário',
    moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6'],
    idea: 'Oferece o peão lateral de c4 para desviar o peão central de d5 e dominar o centro com e4 ou desenvolvimento sólido.',
    color: '#f5b858',
  },
  {
    id: 'ruy-lopez',
    name: 'Ruy Lopez (Espanhola)',
    eco: 'C60',
    side: 'Brancas',
    difficulty: 'Intermediário',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6'],
    idea: 'Pressiona o cavalo que defende e5, preparando vantagem posicional duradoura no centro e na ala do rei.',
    color: '#5fa8ff',
  },
  {
    id: 'french',
    name: 'Defesa Francesa',
    eco: 'C00',
    side: 'Pretas',
    difficulty: 'Intermediário',
    moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4'],
    idea: 'Estrutura sólida que desafia imediatamente o centro branco em d4 e busca contrajogo na ala da dama.',
    color: '#9b8cff',
  },
  {
    id: 'london',
    name: 'Sistema London',
    eco: 'D02',
    side: 'Brancas',
    difficulty: 'Iniciante',
    moves: ['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'c5'],
    idea: 'Esquema confiável e fácil de memorizar, formando uma pirâmide sólida de peões em c3-d4-e3 com o bispo ativo fora da cadeia.',
    color: '#38bdf8',
  },
];

const pieceSymbols: Record<'w' | 'b', Record<PieceSymbol, string>> = {
  w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
  b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' },
};

export default function OpeningsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const [selectedId, setSelectedId] = useState<string>(openingsCatalog[0].id);
  const activeOpening = useMemo(
    () => openingsCatalog.find((o) => o.id === selectedId) ?? openingsCatalog[0],
    [selectedId]
  );

  const squareSize = Math.floor(Math.min(windowWidth - 96, 264) / 8);
  const boardSize = squareSize * 8;

  const { board, lastMoveSquares } = useMemo(() => {
    const chess = new Chess();
    let lastFrom = '';
    let lastTo = '';
    for (const san of activeOpening.moves) {
      const m = chess.move(san);
      if (m) {
        lastFrom = m.from;
        lastTo = m.to;
      }
    }
    return {
      board: chess.board(),
      lastMoveSquares: new Set([lastFrom, lastTo]),
    };
  }, [activeOpening]);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

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
          <Text style={[styles.topBarTitle, { color: colors.text }]}>Biblioteca de Aberturas</Text>
          <Text style={[styles.topBarSub, { color: colors.primary }]}>Teoria & Posições</Text>
        </View>

        <View style={[styles.topBarIconWrap, { backgroundColor: `${colors.primary}20` }]}>
          <Ionicons name="book" size={20} color={colors.primary} />
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.previewHeader}>
            <View style={[styles.ecoBadge, { backgroundColor: `${activeOpening.color}22` }]}>
              <Text style={[styles.ecoText, { color: activeOpening.color }]}>
                ECO {activeOpening.eco} • {activeOpening.side.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.diffText, { color: colors.textSecondary }]}>{activeOpening.difficulty}</Text>
          </View>

          <View style={[styles.miniBoard, { width: boardSize + 2, borderColor: colors.borderStrong }]}>
            {board.map((row, rIdx) => (
              <View key={`row-${rIdx}`} style={{ flexDirection: 'row', width: boardSize, height: squareSize }}>
                {row.map((piece, cIdx) => {
                  const sq = `${files[cIdx]}${8 - rIdx}`;
                  const isDark = (rIdx + cIdx) % 2 === 1;
                  const isHighlighted = lastMoveSquares.has(sq);
                  return (
                    <View
                      key={sq}
                      style={{
                        width: squareSize,
                        height: squareSize,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isDark ? colors.boardDark : colors.boardLight,
                      }}
                    >
                      {isHighlighted && (
                        <View
                          style={[
                            StyleSheet.absoluteFill,
                            { backgroundColor: 'rgba(245, 246, 130, 0.42)' },
                          ]}
                        />
                      )}
                      {piece && (
                        <Text
                          style={[
                            styles.pieceText,
                            { fontSize: Math.floor(squareSize * 0.72) },
                            piece.color === 'b' ? styles.pieceBlack : styles.pieceWhite,
                          ]}
                        >
                          {pieceSymbols[piece.color][piece.type]}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          <Text style={[styles.openingTitle, { color: colors.text }]}>{activeOpening.name}</Text>
          <View style={[styles.movesPill, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
            <Text style={[styles.movesText, { color: colors.accent }]}>
              Lances: {activeOpening.moves.join('  ')}
            </Text>
          </View>
          <Text style={[styles.ideaText, { color: colors.textSecondary }]}>{activeOpening.idea}</Text>

          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/game', params: { mode: 'bot' } })}
          >
            <Ionicons name="play" size={16} color="#ffffff" />
            <Text style={styles.playButtonText}>Praticar contra o Bot</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Selecionar Abertura</Text>

        <View style={styles.list}>
          {openingsCatalog.map((item) => {
            const selected = item.id === activeOpening.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.openingRow,
                  {
                    backgroundColor: colors.surface,
                    borderColor: selected ? item.color : colors.border,
                    borderWidth: selected ? 2 : 1,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedId(item.id)}
              >
                <View style={[styles.rowBadge, { backgroundColor: `${item.color}20` }]}>
                  <Text style={[styles.rowEco, { color: item.color }]}>{item.eco}</Text>
                </View>
                <View style={styles.rowInfo}>
                  <Text style={[styles.rowName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
                    {item.side} • {item.difficulty}
                  </Text>
                </View>
                <Ionicons
                  name={selected ? 'checkmark-circle' : 'chevron-forward'}
                  size={18}
                  color={selected ? item.color : colors.textSecondary}
                />
              </TouchableOpacity>
            );
          })}
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
  previewCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  ecoBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  ecoText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.7 },
  diffText: { fontSize: 12, fontWeight: '700' },
  miniBoard: {
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
  },
  pieceText: { fontWeight: '900', textAlign: 'center', includeFontPadding: false },
  pieceBlack: { color: '#1a1a1a' },
  pieceWhite: {
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 2,
  },
  openingTitle: { fontSize: 20, fontWeight: '900', marginBottom: 8 },
  movesPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  movesText: { fontSize: 12, fontWeight: '800' },
  ideaText: { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
  },
  playButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  list: { gap: 10 },
  openingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
  },
  rowBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowEco: { fontSize: 12, fontWeight: '900' },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '800' },
  rowMeta: { fontSize: 12, marginTop: 2 },
});
