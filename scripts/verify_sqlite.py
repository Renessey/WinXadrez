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
