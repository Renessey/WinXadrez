import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Puzzle'>;

export default function PuzzleScreen({ navigation }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.iconCircle}>
          <Ionicons name="extension-puzzle" size={42} color="#f5b858" />
        </View>
        <Text style={styles.title}>Tática do dia</Text>
        <Text style={styles.description}>
          Encontre o melhor lance em 2 movimentos e aumente seu rating em sequência.
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>8</Text>
          <Text style={styles.statLabel}>Séries</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>84%</Text>
          <Text style={styles.statLabel}>Acerto</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>#18</Text>
          <Text style={styles.statLabel}>Ranking</Text>
        </View>
      </View>

      <View style={styles.actionCard}>
        <Text style={styles.sectionTitle}>Desafio atual</Text>
        <Text style={styles.taskText}>Mate em 2. Explique a ideia principal da posição.</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
        <Ionicons name="play" size={18} color="#ffffff" />
        <Text style={styles.primaryButtonText}>Iniciar quebra-cabeça</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        activeOpacity={0.7}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={18} color="#ffffff" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171614',
  },
  content: {
    padding: 18,
    paddingBottom: 30,
  },
  heroCard: {
    backgroundColor: '#1d1b1a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    marginBottom: 16,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 184, 88, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#b6b1ad',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1d1b1a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
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
  actionCard: {
    backgroundColor: '#1d1b1a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 17,
    marginBottom: 8,
  },
  taskText: {
    color: '#d7d3cf',
    fontSize: 14,
    lineHeight: 22,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e58f2a',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 14,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4a75a0',
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
