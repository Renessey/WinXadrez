import React, { useMemo, useState } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Chess, Color, Square } from 'chess.js';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const pieceSymbols: Record<Color, Record<string, string>> = {
  w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
  b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' },
};

export default function GameScreen({ navigation }: Props) {
  const [game, setGame] = useState(() => new Chess());
  const [fen, setFen] = useState(game.fen());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const board = useMemo(() => game.board(), [fen, game]);
  const legalTargets = useMemo(
    () => selectedSquare ? game.moves({ square: selectedSquare, verbose: true }).map((move) => move.to) : [],
    [selectedSquare, fen, game],
  );

  const resetGame = () => {
    const nextGame = new Chess();
    setGame(nextGame);
    setFen(nextGame.fen());
    setSelectedSquare(null);
    setLastMove(null);
    setErrorMessage('');
  };

  const handleSquarePress = (square: Square) => {
    setErrorMessage('');
    const piece = game.get(square);

    if (selectedSquare && legalTargets.includes(square)) {
      try {
        const move = game.move({ from: selectedSquare, to: square, promotion: 'q' });
        setFen(game.fen());
        setLastMove({ from: move.from as Square, to: move.to as Square });
        setSelectedSquare(null);
        return;
      } catch {
        setErrorMessage('Esse movimento não é válido.');
        return;
      }
    }

    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
    } else {
      setSelectedSquare(null);
    }
  };

  const gameStatus = game.isCheckmate()
    ? `Xeque-mate. ${game.turn() === 'w' ? 'Pretas' : 'Brancas'} venceram.`
    : game.isDraw()
      ? 'Empate. A partida terminou.'
      : game.isCheck()
        ? `Xeque nas ${game.turn() === 'w' ? 'brancas' : 'pretas'}.`
        : `Vez das ${game.turn() === 'w' ? 'brancas' : 'pretas'}`;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>Júlia</Text>
          <Text style={styles.playerElo}>Elo 1450</Text>
        </View>

        <View style={[styles.timerBox, game.isCheck() && styles.timerBoxAlert]}>
          <Ionicons name="time" size={16} color="#f7d36d" />
          <Text style={styles.timerText}>{gameStatus}</Text>
        </View>

        <View style={styles.playerInfoRight}>
          <Text style={styles.playerName}>Você</Text>
          <Text style={styles.playerElo}>Elo 1620</Text>
        </View>
      </View>

      <View style={styles.boardArea}>
        <View style={styles.boardWrapper}>
          {board.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.row}>
              {row.map((piece, colIndex) => {
                const square = `${files[colIndex]}${8 - rowIndex}` as Square;
                const isDark = (rowIndex + colIndex) % 2 === 1;
                const isSelected = selectedSquare === square;
                const isTarget = legalTargets.includes(square);
                const isLastMove = lastMove?.from === square || lastMove?.to === square;

                return <TouchableOpacity
                  key={`cell-${rowIndex}-${colIndex}`}
                  style={[
                    styles.cell,
                    isDark ? styles.darkCell : styles.lightCell,
                    isLastMove && styles.lastMoveCell,
                    isSelected && styles.selectedCell,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleSquarePress(square)}
                >
                  {isTarget && <View style={piece ? styles.captureTarget : styles.moveTarget} />}
                  {piece ? <Text style={[styles.piece, piece.color === 'b' ? styles.blackPiece : styles.whitePiece]}>{pieceSymbols[piece.color][piece.type]}</Text> : null}
                </TouchableOpacity>;
              })}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.statusBar}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>{gameStatus}</Text>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </View>

      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.actionButtonSecondary}
          activeOpacity={0.8}
          onPress={() => Alert.alert('Abandonar partida?', 'Você poderá iniciar uma nova partida depois.', [
            { text: 'Continuar jogando', style: 'cancel' },
            { text: 'Abandonar', style: 'destructive', onPress: resetGame },
          ])}
        >
          <Ionicons name="flag" size={18} color="#ffffff" />
          <Text style={styles.actionText}>Abandonar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButtonPrimary} activeOpacity={0.8} onPress={resetGame}>
          <Ionicons name="shuffle" size={18} color="#ffffff" />
          <Text style={styles.actionText}>Nova partida</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        activeOpacity={0.7}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={18} color="#ffffff" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171614',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  playerInfo: {
    flex: 1,
    backgroundColor: '#1d1b1a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  playerInfoRight: {
    flex: 1,
    backgroundColor: '#1d1b1a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'flex-end',
  },
  playerName: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  playerElo: {
    color: '#a9a5a2',
    fontSize: 11,
    marginTop: 2,
  },
  timerBox: {
    width: 112,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#201f1d',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  timerText: {
    color: '#f7d36d',
    fontWeight: '800',
    fontSize: 10,
    textAlign: 'center',
    maxWidth: 82,
  },
  timerBoxAlert: {
    borderColor: 'rgba(255,107,107,0.5)',
  },
  boardArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  boardWrapper: {
    width: '100%',
    maxWidth: 420,
    aspectRatio: 1,
    backgroundColor: '#1f1d1b',
    borderRadius: 22,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lastMoveCell: {
    backgroundColor: '#c9b458',
  },
  selectedCell: {
    backgroundColor: '#81b64c',
  },
  lightCell: {
    backgroundColor: '#f0d9b5',
  },
  darkCell: {
    backgroundColor: '#b58863',
  },
  piece: {
    fontSize: 28,
    lineHeight: 28,
    color: '#111111',
    textAlign: 'center',
  },
  blackPiece: {
    color: '#151311',
    textShadowColor: 'rgba(255,255,255,0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  whitePiece: {
    color: '#fffaf0',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  moveTarget: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(40,40,35,0.38)',
  },
  captureTarget: {
    position: 'absolute',
    top: 4,
    right: 4,
    bottom: 4,
    left: 4,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: 'rgba(40,40,35,0.35)',
  },
  statusBar: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 4,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#81b64c',
  },
  statusText: {
    flex: 1,
    color: '#c5c0bb',
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    color: '#ff8c8c',
    fontSize: 10,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  actionButtonPrimary: {
    flex: 1,
    backgroundColor: '#81b64c',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: '#4e4b48',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  actionText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4a75a0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 14,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
