use rusqlite::{Connection, Result};
use std::path::Path;

pub fn initialize_db(db_path: &Path) -> Result<Connection> {
    let conn = Connection::open(db_path)?;

    // Create sessions table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT
        )",
        [],
    )?;

    // Create events table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            action_type TEXT NOT NULL,
            action_data TEXT NOT NULL,
            app_name TEXT,
            window_title TEXT,
            screenshot_path TEXT,
            FOREIGN KEY (session_id) REFERENCES sessions (id)
        )",
        [],
    )?;

    Ok(conn)
}
