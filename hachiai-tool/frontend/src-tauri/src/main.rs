use std::sync::{Arc, Mutex};
use std::thread;
use std::sync::mpsc::{channel, Sender};
use hachiai_recorder::capture::{self, RawEvent};
use hachiai_recorder::processor::Processor;
use hachiai_recorder::db;
use rusqlite::Connection;
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

struct AppState {
    is_recording: Arc<Mutex<bool>>,
    session_id: Arc<Mutex<Option<String>>>,
    db_conn: Arc<Mutex<Connection>>,
}

#[tauri::command]
fn start_recording(state: State<'_, AppState>) -> Result<String, String> {
    let mut is_recording = state.is_recording.lock().unwrap();
    if *is_recording {
        return Err("Already recording".into());
    }

    let id = Uuid::new_v4().to_string();
    *state.session_id.lock().unwrap() = Some(id.clone());
    *is_recording = true;

    let (tx, rx) = channel::<RawEvent>();
    let stop_flag = state.is_recording.clone();
    let id_clone = id.clone();

    // Start the low-level listener in a separate thread
    thread::spawn(move || {
        capture::start_listening(tx);
    });

    // Start the event processor and DB writer
    let db_conn_clone = state.db_conn.clone();
    thread::spawn(move || {
        let mut processor = Processor::new();

        // Initial session record
        {
            let conn = db_conn_clone.lock().unwrap();
            let _ = conn.execute(
                "INSERT INTO sessions (id, name, start_time) VALUES (?, ?, ?)",
                [&id_clone, &format!("Recording {}", id_clone), &Utc::now().to_rfc3339()],
            );
        }

        while *stop_flag.lock().unwrap() {
            if let Ok(raw_event) = rx.recv_timeout(std::time::Duration::from_millis(100)) {
                if let Some(processed) = processor.process(raw_event) {
                    let conn = db_conn_clone.lock().unwrap();
                    let _ = conn.execute(
                        "INSERT INTO events (session_id, timestamp, action_type, action_data, app_name, window_title) VALUES (?, ?, ?, ?, ?, ?)",
                        (
                            &id_clone,
                            processed.timestamp.to_rfc3339(),
                            format!("{:?}", processed.action),
                            serde_json::to_string(&processed.action).unwrap(),
                            processed.window.app_name,
                            processed.window.title,
                        ),
                    );
                }
            }
        }

        // Close session
        let conn = db_conn_clone.lock().unwrap();
        let _ = conn.execute(
            "UPDATE sessions SET end_time = ? WHERE id = ?",
            [&Utc::now().to_rfc3339(), &id_clone],
        );
    });

    println!("Recording started: {}", id);
    Ok(format!("Recording started with ID: {}", id))
}

#[tauri::command]
fn stop_recording(state: State<'_, AppState>) -> Result<String, String> {
    let mut is_recording = state.is_recording.lock().unwrap();
    if !*is_recording {
        return Err("Not recording".into());
    }
    *is_recording = false;

    let id = state.session_id.lock().unwrap().take().unwrap_or_default();
    println!("Recording stopped: {}", id);
    Ok(format!("Recording stopped: {}", id))
}

#[tauri::command]
fn get_sessions(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let conn = state.db_conn.lock().unwrap();
    let mut stmt = conn.prepare("SELECT id, name, start_time FROM sessions ORDER BY start_time DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "name": row.get::<_, String>(1)?,
            "date": row.get::<_, String>(2)?,
        }))
    }).map_err(|e| e.to_string())?;

    let mut sessions = Vec::new();
    for row in rows {
        sessions.push(row.map_err(|e| e.to_string())?);
    }
    Ok(sessions)
}

fn main() {
    let db_path = std::path::Path::new("hachiai.db");
    let conn = db::initialize_db(db_path).expect("Failed to initialize database");

    tauri::Builder::default()
        .manage(AppState {
            is_recording: Arc::new(Mutex::new(false)),
            session_id: Arc::new(Mutex::new(None)),
            db_conn: Arc::new(Mutex::new(conn)),
        })
        .invoke_handler(tauri::generate_handler![start_recording, stop_recording, get_sessions])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
