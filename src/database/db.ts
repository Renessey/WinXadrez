import * as SQLite from 'expo-sqlite';

export type SkillLevel = 'Não sei jogar' | 'Sei o básico' | 'Sou bom';

export interface UserProfile {
  id: number;
  name: string;
  skill_level: SkillLevel;
  rating: number;
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
  rating_change: number;
  player_color: 'w' | 'b';
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  moves_count: number;
  date: string;
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
  `);
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
  
  // Rating de Elo começa em 0 conforme especificação
  const initialRating = 0;
  const now = new Date().toISOString();
  
  const result = db.runSync(
    `INSERT INTO profile (name, skill_level, rating, matches_count, wins_count, losses_count, draws_count, created_at)
     VALUES (?, ?, ?, 0, 0, 0, 0, ?)`,
    [trimmedName, skill_level, initialRating, now]
  );

  return {
    id: result.lastInsertRowId,
    name: trimmedName,
    skill_level,
    rating: initialRating,
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
    }
  } catch (err) {
    console.error('Erro ao atualizar nome do perfil:', err);
  }
}

export function recordMatchResult(
  result: 'Vitória' | 'Derrota' | 'Empate',
  ratingChange: number,
  difficulty: 'Fácil' | 'Médio' | 'Difícil',
  movesCount: number,
  opponent = 'Bot WinXadrez',
  playerColor: 'w' | 'b' = 'w'
): void {
  try {
    const db = getDatabase();
    const now = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    db.runSync(
      `INSERT INTO matches (opponent, result, rating_change, player_color, difficulty, moves_count, date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [opponent, result, ratingChange, playerColor, difficulty, movesCount, now]
    );

    const isWin = result === 'Vitória' ? 1 : 0;
    const isLoss = result === 'Derrota' ? 1 : 0;
    const isDraw = result === 'Empate' ? 1 : 0;

    db.runSync(
      `UPDATE profile
       SET matches_count = matches_count + 1,
           wins_count = wins_count + ?,
           losses_count = losses_count + ?,
           draws_count = draws_count + ?,
           rating = MAX(400, rating + ?)
       WHERE id = (SELECT id FROM profile ORDER BY id ASC LIMIT 1)`,
      [isWin, isLoss, isDraw, ratingChange]
    );
  } catch (err) {
    console.error('Erro ao registrar resultado da partida no SQLite:', err);
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
  currentProgress: number; // vitórias no nível atual
  percent: number; // progresso 0 a 100%
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

