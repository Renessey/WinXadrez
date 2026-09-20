import * as SQLite from 'expo-sqlite';
import { generate1000RankingBots } from '../data/rankingBots';

export type SkillLevel = 'Não sei jogar' | 'Sei o básico' | 'Sou bom';

export interface UserProfile {
  id: number;
  name: string;
  skill_level: SkillLevel;
  rating: number; // Agora representa os Pontos do Jogador
  matches_count: number;
  wins_count: number;
  losses_count: number;
  draws_count: number;
  created_at: string;
}

export interface MatchRecord {
  id: number;
  opponent: string;
  result: 'Vitória' | 'Derrota' | 'Empate';
  rating_change: number; // Variação de pontos na partida
  player_color: 'w' | 'b';
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  moves_count: number;
  date: string;
}

export interface RankingPlayerItem {
  id: number;
  rank: number;
  name: string;
  points: number;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  tier: string;
  is_user: boolean;
  position_change: number; // Variação de posição (+ subiu, - caiu, 0 estável)
}

export interface RankingResult {
  players: RankingPlayerItem[];
  userRank: number;
  userPoints: number;
  totalPlayers: number;
}

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('winxadrez.db');
    initDatabase(dbInstance);
  }
  return dbInstance;
}

function initDatabase(db: SQLite.SQLiteDatabase): void {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      skill_level TEXT NOT NULL,
      rating INTEGER NOT NULL,
      matches_count INTEGER DEFAULT 0,
      wins_count INTEGER DEFAULT 0,
      losses_count INTEGER DEFAULT 0,
      draws_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opponent TEXT NOT NULL,
      result TEXT NOT NULL,
      rating_change INTEGER NOT NULL,
      player_color TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      moves_count INTEGER NOT NULL,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ranking_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      points INTEGER NOT NULL,
      matches INTEGER NOT NULL DEFAULT 0,
      wins INTEGER NOT NULL DEFAULT 0,
      losses INTEGER NOT NULL DEFAULT 0,
      draws INTEGER NOT NULL DEFAULT 0,
      tier TEXT NOT NULL DEFAULT 'Iniciante',
      is_user INTEGER NOT NULL DEFAULT 0,
      position_change INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_ranking_points ON ranking_players(points DESC);
  `);

  // Reseta todos os pontos para 0 exatamente uma vez para atender à nova regra
  try {
    const hasReset = db.getFirstSync<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'zero_points_v2'"
    );
    if (!hasReset) {
      db.runSync('DELETE FROM ranking_players');
      db.runSync('UPDATE profile SET rating = 0');
      db.runSync(
        "INSERT INTO settings (key, value) VALUES ('zero_points_v2', 'true') ON CONFLICT(key) DO UPDATE SET value = 'true'"
      );
    }
  } catch {
    // ignorar
  }

  // Popula os 1000 bots caso a tabela ainda não os tenha
  seedRankingPlayers(db);

  // Sincroniza o usuário atual na tabela de ranking
  syncUserInRanking(db);
}

/**
 * Popula determinística e rapidamente os 1000 bots no SQLite em lote
 */
function seedRankingPlayers(db: SQLite.SQLiteDatabase): void {
  try {
    const row = db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM ranking_players WHERE is_user = 0'
    );
    if (row && row.count >= 1000) {
      return;
    }

    const bots = generate1000RankingBots();

    db.withTransactionSync(() => {
      db.runSync('DELETE FROM ranking_players WHERE is_user = 0');

      const batchSize = 50;
      for (let i = 0; i < bots.length; i += batchSize) {
        const batch = bots.slice(i, i + batchSize);
        const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, 0, 0)').join(', ');
        const values: any[] = [];
        for (const b of batch) {
          values.push(b.name, b.points, b.matches, b.wins, b.losses, b.draws, b.tier);
        }
        db.runSync(
          `INSERT OR REPLACE INTO ranking_players (name, points, matches, wins, losses, draws, tier, is_user, position_change)
           VALUES ${placeholders}`,
          values
        );
      }
    });
  } catch (err) {
    console.error('Erro ao popular ranking com 1000 bots:', err);
  }
}

/**
 * Garante que o jogador humano esteja presente e atualizado na tabela de ranking
 */
export function syncUserInRanking(db?: SQLite.SQLiteDatabase): void {
  try {
    const database = db ?? getDatabase();
    const profile = database.getFirstSync<UserProfile>(
      'SELECT * FROM profile ORDER BY id ASC LIMIT 1'
    );
    if (!profile) return;

    const points = Math.max(0, profile.rating);
    let tier = 'Iniciante';
    if (points >= 2400) tier = 'Mestre';
    else if (points >= 1700) tier = 'Diamante';
    else if (points >= 1100) tier = 'Ouro';
    else if (points >= 500) tier = 'Prata';
    else if (points >= 200) tier = 'Bronze';

    // Remove qualquer outro registro de usuário para evitar duplicidade
    database.runSync('DELETE FROM ranking_players WHERE is_user = 1');

    database.runSync(
      `INSERT OR REPLACE INTO ranking_players (name, points, matches, wins, losses, draws, tier, is_user, position_change)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)`,
      [
        profile.name,
        points,
        profile.matches_count,
        profile.wins_count,
        profile.losses_count,
        profile.draws_count,
        tier,
      ]
    );
  } catch (err) {
    console.error('Erro ao sincronizar jogador no ranking:', err);
  }
}

/**
 * Simula uma rodada completa da liga com confrontos entre bots, atualizando pontos e posições
 */
export function simulateBotLeagueRound(db?: SQLite.SQLiteDatabase): void {
  try {
    const database = db ?? getDatabase();

    // Seleciona ~160 bots aleatórios para disputarem confrontos entre si
    const candidateBots = database.getAllSync<{
      id: number;
      name: string;
      points: number;
      matches: number;
      wins: number;
      losses: number;
      draws: number;
    }>(
      'SELECT id, name, points, matches, wins, losses, draws FROM ranking_players WHERE is_user = 0 ORDER BY RANDOM() LIMIT 160'
    );

    if (candidateBots.length < 2) return;

    database.withTransactionSync(() => {
      for (let i = 0; i < candidateBots.length - 1; i += 2) {
        const botA = candidateBots[i];
        const botB = candidateBots[i + 1];

        // Probabilidade ponderada pela pontuação
        const diff = botA.points - botB.points;
        const probA = 1 / (1 + Math.pow(10, -diff / 500));
        const roll = Math.random();

        let deltaA = 0;
        let deltaB = 0;
        let winA = 0;
        let winB = 0;
        let draw = 0;

        if (roll < 0.1) {
          // Empate
          draw = 1;
          deltaA = Math.floor(Math.random() * 5) + 4;
          deltaB = Math.floor(Math.random() * 5) + 4;
        } else if (roll < probA) {
          // Vitória de A
          winA = 1;
          deltaA = Math.floor(Math.random() * 16) + 14; // +14 a +29 pts
          deltaB = -(Math.floor(Math.random() * 12) + 6); // -6 a -17 pts
        } else {
          // Vitória de B
          winB = 1;
          deltaB = Math.floor(Math.random() * 16) + 14;
          deltaA = -(Math.floor(Math.random() * 12) + 6);
        }

        const newPointsA = Math.max(30, botA.points + deltaA);
        const newPointsB = Math.max(30, botB.points + deltaB);

        // Variação visual de posição (-3 a +3)
        const posChangeA = deltaA > 0 ? Math.floor(Math.random() * 3) + 1 : deltaA < 0 ? -(Math.floor(Math.random() * 3) + 1) : 0;
        const posChangeB = deltaB > 0 ? Math.floor(Math.random() * 3) + 1 : deltaB < 0 ? -(Math.floor(Math.random() * 3) + 1) : 0;

        database.runSync(
          `UPDATE ranking_players
           SET points = ?, matches = matches + 1, wins = wins + ?, losses = losses + ?, draws = draws + ?, position_change = ?
           WHERE id = ?`,
          [newPointsA, winA, winB, draw, posChangeA, botA.id]
        );

        database.runSync(
          `UPDATE ranking_players
           SET points = ?, matches = matches + 1, wins = wins + ?, losses = losses + ?, draws = draws + ?, position_change = ?
           WHERE id = ?`,
          [newPointsB, winB, winA, draw, posChangeB, botB.id]
        );
      }
    });
  } catch (err) {
    console.error('Erro ao simular rodada da liga de bots:', err);
  }
}

/**
 * Retorna os jogadores do ranking com filtros otimizados para FlatList
 */
export function getRanking(
  limit = 15,
  search = '',
  filter: 'top' | 'nearUser' | 'all' = 'top'
): RankingResult {
  try {
    const db = getDatabase();
    syncUserInRanking(db);

    // 1. Busca todos ordenados para rankear com precisão exata
    const allRows = db.getAllSync<{
      id: number;
      name: string;
      points: number;
      matches: number;
      wins: number;
      losses: number;
      draws: number;
      tier: string;
      is_user: number;
      position_change: number;
    }>('SELECT * FROM ranking_players ORDER BY points DESC, id ASC');

    const totalPlayers = allRows.length;
    let userRank = totalPlayers;
    let userPoints = 0;

    const rankedList: RankingPlayerItem[] = allRows.map((r, idx) => {
      const isUser = r.is_user === 1;
      if (isUser) {
        userRank = idx + 1;
        userPoints = r.points;
      }
      return {
        id: r.id,
        rank: idx + 1,
        name: r.name,
        points: r.points,
        matches: r.matches,
        wins: r.wins,
        losses: r.losses,
        draws: r.draws,
        tier: r.tier,
        is_user: isUser,
        position_change: r.position_change,
      };
    });

    // 2. Aplica filtro de busca por texto se digitado
    const query = search.trim().toLowerCase();
    if (query.length > 0) {
      const filtered = rankedList.filter((p) => p.name.toLowerCase().includes(query));
      return {
        players: filtered.slice(0, limit),
        userRank,
        userPoints,
        totalPlayers,
      };
    }

    // 3. Aplica filtros de exibição
    if (filter === 'nearUser') {
      const startIdx = Math.max(0, userRank - 8);
      const endIdx = Math.min(totalPlayers, userRank + 7);
      return {
        players: rankedList.slice(startIdx, endIdx),
        userRank,
        userPoints,
        totalPlayers,
      };
    }

    // 'top' ou 'all' retornam os primeiros colocados conforme o limite solicitado (ex: 15)
    return {
      players: rankedList.slice(0, limit),
      userRank,
      userPoints,
      totalPlayers,
    };
  } catch (err) {
    console.error('Erro ao buscar ranking:', err);
    return {
      players: [],
      userRank: 1,
      userPoints: 0,
      totalPlayers: 0,
    };
  }
}

/**
 * Retorna a posição e os pontos atuais do usuário no ranking
 */
export function getUserRankingPosition(): { rank: number; points: number; total: number } {
  try {
    const db = getDatabase();
    syncUserInRanking(db);

    const userRow = db.getFirstSync<{ points: number }>(
      'SELECT points FROM ranking_players WHERE is_user = 1'
    );
    const userPoints = userRow?.points ?? 0;

    const rankRow = db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM ranking_players WHERE points > ?',
      [userPoints]
    );
    const userRank = (rankRow?.count ?? 0) + 1;

    const totalRow = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM ranking_players');
    const total = totalRow?.count ?? 1000;

    return { rank: userRank, points: userPoints, total };
  } catch (err) {
    return { rank: 1, points: 0, total: 1000 };
  }
}

export function getProfile(): UserProfile | null {
  try {
    const db = getDatabase();
    const row = db.getFirstSync<UserProfile>('SELECT * FROM profile ORDER BY id ASC LIMIT 1');
    return row ?? null;
  } catch (err) {
    console.error('Erro ao buscar perfil SQLite:', err);
    return null;
  }
}

export function createProfile(name: string, skill_level: SkillLevel): UserProfile {
  const db = getDatabase();
  const trimmedName = name.trim() || 'Jogador';
  
  // Pontos começam em 0
  const initialPoints = 0;
  const now = new Date().toISOString();
  
  const result = db.runSync(
    `INSERT INTO profile (name, skill_level, rating, matches_count, wins_count, losses_count, draws_count, created_at)
     VALUES (?, ?, ?, 0, 0, 0, 0, ?)`,
    [trimmedName, skill_level, initialPoints, now]
  );

  syncUserInRanking(db);

  return {
    id: result.lastInsertRowId,
    name: trimmedName,
    skill_level,
    rating: initialPoints,
    matches_count: 0,
    wins_count: 0,
    losses_count: 0,
    draws_count: 0,
    created_at: now,
  };
}

export function updateProfileName(name: string): void {
  try {
    const db = getDatabase();
    const trimmed = name.trim();
    if (trimmed.length > 0) {
      db.runSync('UPDATE profile SET name = ? WHERE id = (SELECT id FROM profile ORDER BY id ASC LIMIT 1)', [trimmed]);
      syncUserInRanking(db);
    }
  } catch (err) {
    console.error('Erro ao atualizar nome do perfil:', err);
  }
}

/**
 * Registra o resultado da partida, atualiza Pontos e simula a rodada da liga de bots
 */
export function recordMatchResult(
  result: 'Vitória' | 'Derrota' | 'Empate',
  pointsChange: number,
  difficulty: 'Fácil' | 'Médio' | 'Difícil',
  movesCount: number,
  opponent = 'Bot WinXadrez',
  playerColor: 'w' | 'b' = 'w'
): { userPoints: number; userRank: number; pointsEarned: number } {
  try {
    const db = getDatabase();
    const now = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Lógica inteligente de pontuação por dificuldade se pointsChange não for especificado
    let delta = pointsChange;
    if (delta === 0) {
      if (result === 'Vitória') {
        delta = difficulty === 'Fácil' ? 25 : difficulty === 'Médio' ? 40 : 60;
      } else if (result === 'Empate') {
        delta = 10;
      } else {
        delta = -10;
      }
    }

    db.runSync(
      `INSERT INTO matches (opponent, result, rating_change, player_color, difficulty, moves_count, date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [opponent, result, delta, playerColor, difficulty, movesCount, now]
    );

    const isWin = result === 'Vitória' ? 1 : 0;
    const isLoss = result === 'Derrota' ? 1 : 0;
    const isDraw = result === 'Empate' ? 1 : 0;

    // Atualiza perfil garantindo que pontos nunca fiquem negativos (mínimo 0)
    db.runSync(
      `UPDATE profile
       SET matches_count = matches_count + 1,
           wins_count = wins_count + ?,
           losses_count = losses_count + ?,
           draws_count = draws_count + ?,
           rating = MAX(0, rating + ?)
       WHERE id = (SELECT id FROM profile ORDER BY id ASC LIMIT 1)`,
      [isWin, isLoss, isDraw, delta]
    );

    // Sincroniza o usuário no ranking
    syncUserInRanking(db);

    // Simula a rodada entre os bots automaticamente!
    simulateBotLeagueRound(db);

    // Obtém a nova posição do usuário
    const { rank, points } = getUserRankingPosition();

    return { userPoints: points, userRank: rank, pointsEarned: delta };
  } catch (err) {
    console.error('Erro ao registrar resultado da partida no SQLite:', err);
    return { userPoints: 0, userRank: 1000, pointsEarned: 0 };
  }
}

export function getMatches(): MatchRecord[] {
  try {
    const db = getDatabase();
    return db.getAllSync<MatchRecord>('SELECT * FROM matches ORDER BY id DESC LIMIT 50') ?? [];
  } catch (err) {
    console.error('Erro ao buscar partidas:', err);
    return [];
  }
}

export function getSetting(key: string, defaultValue: string): string {
  try {
    const db = getDatabase();
    const row = db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
    return row ? row.value : defaultValue;
  } catch (err) {
    return defaultValue;
  }
}

export function setSetting(key: string, value: string): void {
  try {
    const db = getDatabase();
    db.runSync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, value]
    );
  } catch (err) {
    console.error(`Erro ao salvar configuração ${key}:`, err);
  }
}

export interface LevelDifficultyProgress {
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  level: number;
  totalWins: number;
  winsPerLevel: number;
  currentProgress: number;
  percent: number;
}

export interface UserLevelsSummary {
  totalLevel: number;
  facil: LevelDifficultyProgress;
  medio: LevelDifficultyProgress;
  dificil: LevelDifficultyProgress;
}

/**
 * Níveis sobem com vitórias:
 * - Fácil: 10 vitórias por nível
 * - Médio: 6 vitórias por nível
 * - Difícil: 4 vitórias por nível
 */
export function getUserLevels(): UserLevelsSummary {
  try {
    const db = getDatabase();
    const rows =
      db.getAllSync<{ difficulty: string; count: number }>(
        "SELECT difficulty, COUNT(*) as count FROM matches WHERE result = 'Vitória' GROUP BY difficulty"
      ) ?? [];

    let facilWins = 0;
    let medioWins = 0;
    let dificilWins = 0;

    rows.forEach((r) => {
      if (r.difficulty === 'Fácil') facilWins = r.count;
      else if (r.difficulty === 'Médio') medioWins = r.count;
      else if (r.difficulty === 'Difícil') dificilWins = r.count;
    });

    const facilLevel = Math.floor(facilWins / 10);
    const facilProgress = facilWins % 10;
    const facilPercent = Math.min(100, Math.round((facilProgress / 10) * 100));

    const medioLevel = Math.floor(medioWins / 6);
    const medioProgress = medioWins % 6;
    const medioPercent = Math.min(100, Math.round((medioProgress / 6) * 100));

    const dificilLevel = Math.floor(dificilWins / 4);
    const dificilProgress = dificilWins % 4;
    const dificilPercent = Math.min(100, Math.round((dificilProgress / 4) * 100));

    const totalLevel = facilLevel + medioLevel + dificilLevel;

    return {
      totalLevel,
      facil: {
        difficulty: 'Fácil',
        level: facilLevel,
        totalWins: facilWins,
        winsPerLevel: 10,
        currentProgress: facilProgress,
        percent: facilPercent,
      },
      medio: {
        difficulty: 'Médio',
        level: medioLevel,
        totalWins: medioWins,
        winsPerLevel: 6,
        currentProgress: medioProgress,
        percent: medioPercent,
      },
      dificil: {
        difficulty: 'Difícil',
        level: dificilLevel,
        totalWins: dificilWins,
        winsPerLevel: 4,
        currentProgress: dificilProgress,
        percent: dificilPercent,
      },
    };
  } catch (err) {
    console.error('Erro ao calcular níveis de usuário:', err);
    return {
      totalLevel: 0,
      facil: { difficulty: 'Fácil', level: 0, totalWins: 0, winsPerLevel: 10, currentProgress: 0, percent: 0 },
      medio: { difficulty: 'Médio', level: 0, totalWins: 0, winsPerLevel: 6, currentProgress: 0, percent: 0 },
      dificil: { difficulty: 'Difícil', level: 0, totalWins: 0, winsPerLevel: 4, currentProgress: 0, percent: 0 },
    };
  }
}

export interface ActiveMatchState {
  fen: string;
  whiteTime: number;
  blackTime: number;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  lastMove: { from: string; to: string } | null;
  historyLength: number;
  opponentName?: string;
  gameMode?: 'bot' | 'pvp';
}

export function saveActiveMatch(state: ActiveMatchState): void {
  setSetting('active_match_state', JSON.stringify(state));
}

export function getActiveMatch(): ActiveMatchState | null {
  try {
    const raw = getSetting('active_match_state', '');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearActiveMatch(): void {
  setSetting('active_match_state', '');
}

export function resetLossesAndCache(): void {
  try {
    const db = getDatabase();
    db.runSync('UPDATE profile SET losses_count = 0');
    db.runSync("DELETE FROM matches WHERE result = 'Derrota'");
    db.runSync('UPDATE profile SET matches_count = wins_count + draws_count');
    clearActiveMatch();
    syncUserInRanking(db);
  } catch (err) {
    console.error('Erro ao resetar derrotas e cache:', err);
  }
}
