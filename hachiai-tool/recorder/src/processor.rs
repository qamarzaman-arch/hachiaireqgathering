use crate::capture::{RawEvent, ActionType};
use crate::window::{WindowInfo, get_current_window};
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProcessedEvent {
    pub timestamp: DateTime<Utc>,
    pub action: ActionType,
    pub window: WindowInfo,
}

pub struct Processor {
    last_event: Option<ProcessedEvent>,
}

impl Processor {
    pub fn new() -> Self {
        Self { last_event: None }
    }

    pub fn process(&mut self, raw_event: RawEvent) -> Option<ProcessedEvent> {
        let current_window = get_current_window();
        let processed_event = ProcessedEvent {
            timestamp: raw_event.timestamp,
            action: raw_event.action.clone(),
            window: current_window,
        };

        if let Some(last) = &self.last_event {
            // Simple debouncing for duplicate clicks in the same location
            if let (ActionType::Click { x: x1, y: y1, .. }, ActionType::Click { x: x2, y: y2, .. }) = (&last.action, &processed_event.action) {
                if x1 == x2 && y1 == y2 && (processed_event.timestamp - last.timestamp).num_milliseconds() < 200 {
                    return None;
                }
            }
        }

        self.last_event = Some(processed_event.clone());
        Some(processed_event)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::capture::ActionType;
    use chrono::Utc;

    #[test]
    fn test_debouncing() {
        let mut processor = Processor::new();
        let now = Utc::now();

        let event1 = RawEvent {
            timestamp: now,
            action: ActionType::Click { x: 100.0, y: 100.0, button: "Left".to_string() },
        };

        let event2 = RawEvent {
            timestamp: now + chrono::Duration::milliseconds(100),
            action: ActionType::Click { x: 100.0, y: 100.0, button: "Left".to_string() },
        };

        let p1 = processor.process(event1);
        let p2 = processor.process(event2);

        assert!(p1.is_some());
        assert!(p2.is_none());
    }
}
