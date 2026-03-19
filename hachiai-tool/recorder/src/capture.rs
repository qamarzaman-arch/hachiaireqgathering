use rdev::{listen, Event, EventType};
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use std::sync::mpsc::Sender;
use std::sync::{Arc, Mutex};
use lazy_static::lazy_static;

lazy_static! {
    static ref MOUSE_POS: Arc<Mutex<(f64, f64)>> = Arc::new(Mutex::new((0.0, 0.0)));
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum ActionType {
    Click { x: f64, y: f64, button: String },
    KeyPress { key: String },
    Scroll { delta_x: i64, delta_y: i64 },
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RawEvent {
    pub timestamp: DateTime<Utc>,
    pub action: ActionType,
}

pub fn start_listening(tx: Sender<RawEvent>) {
    if let Err(error) = listen(move |event| {
        if let Some(raw_event) = parse_event(event) {
            let _ = tx.send(raw_event);
        }
    }) {
        eprintln!("Error listening to events: {:?}", error);
    }
}

fn parse_event(event: Event) -> Option<RawEvent> {
    match event.event_type {
        EventType::MouseMove { x, y } => {
            let mut pos = MOUSE_POS.lock().unwrap();
            *pos = (x, y);
            None
        }
        EventType::ButtonPress(button) => {
            let pos = MOUSE_POS.lock().unwrap();
            Some(RawEvent {
                timestamp: Utc::now(),
                action: ActionType::Click {
                    x: pos.0,
                    y: pos.1,
                    button: format!("{:?}", button),
                },
            })
        }
        EventType::KeyPress(_) => Some(RawEvent {
            timestamp: Utc::now(),
            action: ActionType::KeyPress {
                key: "*".to_string(), // Masking all keys for privacy in Phase 1
            },
        }),
        EventType::Wheel { delta_x, delta_y } => Some(RawEvent {
            timestamp: Utc::now(),
            action: ActionType::Scroll {
                delta_x,
                delta_y,
            },
        }),
        _ => None,
    }
}
