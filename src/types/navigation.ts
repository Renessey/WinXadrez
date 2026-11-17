export type RootStackParamList = {
  Home: undefined;
  Game: { mode?: 'bot' | 'pvp'; difficulty?: 'Fácil' | 'Médio' | 'Difícil' } | undefined;
  Puzzle: undefined;
  History: undefined;
  Leaderboard: undefined;
  Profile: undefined;
  Tutorial: undefined;
  Openings: undefined;
  Achievements: undefined;
  Levels: undefined;
  MatchDetail: { id?: string } | undefined;
  PlayerDetail: { name?: string } | undefined;
  Settings: undefined;
};
