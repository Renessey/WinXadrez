import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

const boardRows = Array.from({ length: 8 }, (_, rowIndex) =>
  Array.from({ length: 8 }, (_, colIndex) => {
    const isDark = (rowIndex + colIndex) % 2 === 1;
    const piece =
      rowIndex === 1
        ? '♟'
        : rowIndex === 6
          ? '♙'
          : rowIndex === 0 && (colIndex === 0 || colIndex === 7)
            ? '♜'
            : rowIndex === 0 && (colIndex === 1 || colIndex === 6)
              ? '♞'
              : rowIndex === 0 && (colIndex === 2 || colIndex === 5)
                ? '♝'
                : rowIndex === 0 && colIndex === 3
                  ? '♛'
                  : rowIndex === 0 && colIndex === 4
                    ? '♚'
                    : rowIndex === 7 && (colIndex === 0 || colIndex === 7)
                      ? '♖'
                      : rowIndex === 7 && (colIndex === 1 || colIndex === 6)
                        ? '♘'
                        : rowIndex === 7 && (colIndex === 2 || colIndex === 5)
                          ? '♗'
                          : rowIndex === 7 && colIndex === 3
                            ? '♕'
                            : rowIndex === 7 && colIndex === 4
                              ? '♔'
                              : '';

    return { isDark, piece };
  })
);

export default function GameScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>Júlia</Text>
          <Text style={styles.playerElo}>Elo 1450</Text>
        </View>

        <View style={styles.timerBox}>
          <Ionicons name="time" size={16} color="#f7d36d" />
          <Text style={styles.timerText}>10:42</Text>
        </View>

        <View style={styles.playerInfoRight}>
          <Text style={styles.playerName}>Você</Text>
          <Text style={styles.playerElo}>Elo 1620</Text>
        </View>
      </View>

      <View style={styles.boardArea}>
        <View style={styles.boardWrapper}>
          {boardRows.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.row}>
              {row.map((cell, colIndex) => (
                <View
                  key={`cell-${rowIndex}-${colIndex}`}
                  style={[
                    styles.cell,
                    cell.isDark ? styles.darkCell : styles.lightCell,
                  ]}
                >
                  {cell.piece ? <Text style={styles.piece}>{cell.piece}</Text> : null}
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButtonSecondary} activeOpacity={0.8}>
          <Ionicons name="flag" size={18} color="#ffffff" />
          <Text style={styles.actionText}>Abandonar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButtonPrimary} activeOpacity={0.8}>
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
    width: 88,
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
    fontSize: 15,
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
