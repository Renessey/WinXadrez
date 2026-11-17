import re
import sqlite3
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DB_SOURCE = ROOT / "src" / "database" / "db.ts"


def extract_schema() -> str:
    source = DB_SOURCE.read_text(encoding="utf-8")
    statements = re.findall(
        r"(CREATE TABLE IF NOT EXISTS .*?;|CREATE INDEX IF NOT EXISTS .*?;|CREATE UNIQUE INDEX IF NOT EXISTS .*?;)",
        source,
        flags=re.DOTALL,
    )
    if len(statements) < 5:
        raise AssertionError("Nao foi possivel encontrar o esquema SQLite completo")
    return "\n".join(statements)


def test_database(database_path: Path) -> None:
    connection = sqlite3.connect(database_path)
    try:
        connection.execute("PRAGMA journal_mode = WAL")
        connection.executescript(extract_schema())

        table_names = {
            row[0]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            )
        }
        required_tables = {"profile", "matches", "settings", "ranking_players"}
        missing = required_tables - table_names
        if missing:
            raise AssertionError(f"Tabelas ausentes: {sorted(missing)}")

        connection.execute(
            "DELETE FROM profile WHERE id NOT IN "
            "(SELECT id FROM profile ORDER BY id ASC LIMIT 1)"
        )
        connection.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_singleton "
            "ON profile ((1))"
        )

        cursor = connection.execute(
            """
            INSERT INTO profile (
                name, skill_level, rating, matches_count,
                wins_count, losses_count, draws_count, created_at
            ) VALUES (?, ?, ?, 0, 0, 0, 0, ?)
            """,
            ("Jogador Teste", "Sei o básico", 0, "2026-11-17"),
        )
        profile_id = cursor.lastrowid

        try:
            connection.execute(
                """
                INSERT INTO profile (
                    name, skill_level, rating, matches_count,
                    wins_count, losses_count, draws_count, created_at
                ) VALUES (?, ?, ?, 0, 0, 0, 0, ?)
                """,
                ("Segundo Perfil", "Não sei jogar", 0, "2026-11-17"),
            )
        except sqlite3.IntegrityError:
            pass
        else:
            raise AssertionError("O banco permitiu criar um segundo perfil")

        cursor = connection.execute(
            """
            INSERT INTO matches (
                opponent, result, rating_change, player_color,
                difficulty, moves_count, date
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            ("Bot Teste", "Vitória", 25, "w", "Fácil", 12, "2026-11-17"),
        )
        match_id = cursor.lastrowid

        connection.execute(
            "INSERT INTO settings (key, value) VALUES (?, ?)",
            ("sqlite_verification", "persisted"),
        )
        connection.execute(
            """
            INSERT INTO ranking_players (
                name, points, matches, wins, losses, draws,
                tier, is_user, position_change
            ) VALUES (?, ?, 0, 0, 0, 0, ?, 1, 0)
            """,
            ("Jogador Teste", 0, "Iniciante"),
        )
        connection.commit()

        assert connection.execute(
            "SELECT name FROM profile WHERE id = ?", (profile_id,)
        ).fetchone() == ("Jogador Teste",)
        assert connection.execute(
            "SELECT result FROM matches WHERE id = ?", (match_id,)
        ).fetchone() == ("Vitória",)
        assert connection.execute(
            "SELECT value FROM settings WHERE key = ?", ("sqlite_verification",)
        ).fetchone() == ("persisted",)

        connection.execute(
            "UPDATE settings SET value = ? WHERE key = ?",
            ("updated", "sqlite_verification"),
        )
        connection.commit()
        assert connection.execute(
            "SELECT value FROM settings WHERE key = ?", ("sqlite_verification",)
        ).fetchone() == ("updated",)

        connection.execute("DELETE FROM matches WHERE id = ?", (match_id,))
        connection.commit()
        assert connection.execute(
            "SELECT COUNT(*) FROM matches"
        ).fetchone()[0] == 0

        connection.execute(
            "UPDATE profile SET rating = 100, matches_count = 1,"
            " wins_count = 1, losses_count = 0, draws_count = 0"
        )
        connection.commit()

        connection.execute("SAVEPOINT match_transaction")
        connection.execute(
            """
            INSERT INTO matches (
                opponent, result, rating_change, player_color,
                difficulty, moves_count, date
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            ("Rollback Test", "Vitória", 25, "w", "Fácil", 8, "2026-11-17"),
        )
        connection.execute(
            """
            UPDATE profile
            SET matches_count = matches_count + 1,
                wins_count = wins_count + 1,
                rating = rating + 25
            """,
        )
        connection.execute("ROLLBACK TO match_transaction")
        connection.execute("RELEASE match_transaction")

        assert connection.execute(
            "SELECT COUNT(*) FROM matches"
        ).fetchone()[0] == 0
        assert connection.execute(
            "SELECT matches_count, wins_count, rating FROM profile"
        ).fetchone() == (1, 1, 100)

        valid_active_match = (
            '{"fen":"startpos","whiteTime":600,"blackTime":600,'
            '"difficulty":"Fácil","lastMove":null,"historyLength":0}'
        )
        invalid_active_match = '{"fen":"","whiteTime":-1,"blackTime":600}'
        connection.execute(
            "INSERT INTO settings (key, value) VALUES (?, ?)",
            ("active_match_state", valid_active_match),
        )
        connection.execute(
            "INSERT INTO settings (key, value) VALUES (?, ?)",
            ("invalid_active_match", invalid_active_match),
        )

        valid_progress = '{"streak":3,"solvedIds":["puzzle-1","puzzle-2"]}'
        invalid_progress = '{"streak":-3,"solvedIds":"puzzle-1"}'
        connection.execute(
            "INSERT INTO settings (key, value) VALUES (?, ?)",
            ("puzzle_progress", valid_progress),
        )
        connection.execute(
            "INSERT INTO settings (key, value) VALUES (?, ?)",
            ("invalid_puzzle_progress", invalid_progress),
        )
        connection.commit()

        active = connection.execute(
            "SELECT value FROM settings WHERE key = 'active_match_state'"
        ).fetchone()[0]
        invalid_active = connection.execute(
            "SELECT value FROM settings WHERE key = 'invalid_active_match'"
        ).fetchone()[0]
        progress = connection.execute(
            "SELECT value FROM settings WHERE key = 'puzzle_progress'"
        ).fetchone()[0]
        invalid_progress_value = connection.execute(
            "SELECT value FROM settings WHERE key = 'invalid_puzzle_progress'"
        ).fetchone()[0]

        import json
        active_data = json.loads(active)
        assert active_data["fen"] == "startpos"
        assert active_data["historyLength"] == 0
        assert json.loads(invalid_active)["fen"] == ""
        assert json.loads(progress)["streak"] == 3
        assert json.loads(invalid_progress_value)["streak"] == -3

        connection.execute(
            """
            UPDATE profile
            SET losses_count = 2,
                wins_count = 3,
                draws_count = 1,
                matches_count = 6
            """
        )
        connection.execute(
            """
            INSERT INTO matches (
                opponent, result, rating_change, player_color,
                difficulty, moves_count, date
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            ("Reset Test", "Derrota", -10, "w", "Médio", 10, "2026-11-17"),
        )
        connection.execute(
            "INSERT INTO settings (key, value) VALUES (?, ?) "
            "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            ("active_match_state", '{"fen":"reset-test"}'),
        )
        connection.commit()

        connection.execute("SAVEPOINT reset_transaction")
        connection.execute("UPDATE profile SET losses_count = 0")
        connection.execute("DELETE FROM matches WHERE result = 'Derrota'")
        connection.execute(
            "UPDATE profile SET matches_count = wins_count + draws_count"
        )
        connection.execute(
            "UPDATE settings SET value = '' WHERE key = 'active_match_state'"
        )
        connection.execute("ROLLBACK TO reset_transaction")
        connection.execute("RELEASE reset_transaction")

        assert connection.execute(
            "SELECT losses_count, matches_count FROM profile"
        ).fetchone() == (2, 6)
        assert connection.execute(
            "SELECT COUNT(*) FROM matches WHERE result = 'Derrota'"
        ).fetchone()[0] == 1
        assert connection.execute(
            "SELECT value FROM settings WHERE key = 'active_match_state'"
        ).fetchone()[0] != ""

        connection.execute("DELETE FROM ranking_players")
        connection.execute(
            """
            INSERT INTO ranking_players (
                name, points, matches, wins, losses, draws,
                tier, is_user, position_change
            ) VALUES (?, 100, 1, 1, 0, 0, 'Bronze', 0, 0)
            """,
            ("Jogador Empatado A",),
        )
        connection.execute(
            """
            INSERT INTO ranking_players (
                name, points, matches, wins, losses, draws,
                tier, is_user, position_change
            ) VALUES (?, 100, 1, 1, 0, 0, 'Bronze', 1, 0)
            """,
            ("Jogador Usuario",),
        )
        connection.execute(
            """
            INSERT INTO ranking_players (
                name, points, matches, wins, losses, draws,
                tier, is_user, position_change
            ) VALUES (?, 100, 1, 1, 0, 0, 'Bronze', 0, 0)
            """,
            ("Jogador Empatado B",),
        )
        connection.commit()

        ordered = connection.execute(
            "SELECT name FROM ranking_players ORDER BY points DESC, id ASC"
        ).fetchall()
        assert [row[0] for row in ordered] == [
            "Jogador Empatado A",
            "Jogador Usuario",
            "Jogador Empatado B",
        ]
        user_index = [row[0] for row in ordered].index("Jogador Usuario")
        assert user_index + 1 == 2
    finally:
        connection.close()

    reopened = sqlite3.connect(database_path)
    try:
        assert reopened.execute(
            "SELECT COUNT(*) FROM profile"
        ).fetchone()[0] == 1
        assert reopened.execute(
            "SELECT value FROM settings WHERE key = ?", ("sqlite_verification",)
        ).fetchone() == ("updated",)
    finally:
        reopened.close()


if __name__ == "__main__":
    with tempfile.TemporaryDirectory() as directory:
        database_path = Path(directory) / "winxadrez-verification.db"
        test_database(database_path)

    print("Verificacao SQLite concluida: esquema, CRUD e persistencia OK.")
