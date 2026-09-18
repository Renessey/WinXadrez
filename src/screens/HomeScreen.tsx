import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
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
  {
    title: 'Partida / Tabuleiro',
    subtitle: 'Jogar vs Bot ou Online',
    screen: 'Game',
    icon: 'game-controller',
    color: '#81b64c',
  },
  {
    title: 'Quebra-cabeças',
    subtitle: 'Treine táticas e desafios',
    screen: 'Puzzle',
    icon: 'extension-puzzle',
    color: '#e58f2a',
  },
  {
    title: 'Histórico de Partidas',
    subtitle: 'Resultados e confrontos recentes',
    screen: 'History',
    icon: 'time',
    color: '#4a75a0',
  },
  {
    title: 'Ranking',
    subtitle: 'Classificação global e amigos',
    screen: 'Leaderboard',
    icon: 'trophy',
    color: '#e2b33c',
  },
  {
    title: 'Perfil',
    subtitle: 'Estatísticas e configurações',
    screen: 'Profile',
    icon: 'person',
    color: '#8b5cf6',
  },
];

export default function HomeScreen({ navigation }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={28} color="#81b64c" />
        <Text style={styles.title}>WinXadrez</Text>
        <Text style={styles.subtitle}>Navegue pelas 6 telas do aplicativo</Text>
      </View>

      <View style={styles.list}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={[styles.iconWrapper, { backgroundColor: item.color + '22' }]}>
              <Ionicons name={item.icon} size={26} color={item.color} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8b8987" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#302e2b',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#989795',
    marginTop: 4,
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262421',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3d3b38',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#989795',
    marginTop: 2,
  },
});
