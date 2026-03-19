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

    pub fn group_events(&self, events: Vec<ProcessedEvent>) -> Vec<LogicalStep> {
        let mut steps = Vec::new();
        let mut current_step: Option<LogicalStep> = None;

        for event in events {
            match &mut current_step {
                Some(step) if step.can_merge(&event) => {
                    step.add_event(event);
                }
                _ => {
                    if let Some(step) = current_step.take() {
                        steps.push(step);
                    }
                    current_step = Some(LogicalStep::new(event));
                }
            }
        }

        if let Some(step) = current_step {
            steps.push(step);
        }

        steps
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LogicalStep {
    pub title: String,
    pub description: String,
    pub events: Vec<ProcessedEvent>,
    pub app_name: String,
}

impl LogicalStep {
    pub fn new(event: ProcessedEvent) -> Self {
        let mut step = Self {
            title: "Action".to_string(),
            description: String::new(),
            app_name: event.window.app_name.clone(),
            events: Vec::new(),
        };
        step.add_event(event);
        step
    }

    pub fn can_merge(&self, event: &ProcessedEvent) -> bool {
        if self.app_name != event.window.app_name {
            return false;
        }

        // Merge consecutive key presses in the same app
        if let (ActionType::KeyPress { .. }, ActionType::KeyPress { .. }) = (&self.events.last().unwrap().action, &event.action) {
            return true;
        }

        false
    }

    pub fn add_event(&mut self, event: ProcessedEvent) {
        self.events.push(event);
        self.update_intent();
    }

    fn update_intent(&mut self) {
        if self.events.is_empty() { return; }

        let first_event = &self.events[0];
        let app_name = &self.app_name;

        match &first_event.action {
            ActionType::Click { button, .. } => {
                self.title = format!("Click {} in {}", button, app_name);
                self.description = format!("The user clicked the {} button in {}.", button, app_name);
            }
            ActionType::KeyPress { .. } => {
                let key_count = self.events.len();
                self.title = format!("Type in {}", app_name);
                self.description = format!("The user typed {} characters in {}.", key_count, app_name);
            }
            ActionType::Scroll { .. } => {
                self.title = format!("Scroll in {}", app_name);
                self.description = format!("The user scrolled in {}.", app_name);
            }
        }
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
