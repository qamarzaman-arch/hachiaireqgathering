use active_win_pos_rs::get_active_window;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct WindowInfo {
    pub title: String,
    pub app_name: String,
    pub process_id: u32,
}

pub fn get_current_window() -> WindowInfo {
    match get_active_window() {
        Ok(window) => WindowInfo {
            title: window.title,
            app_name: window.app_name,
            process_id: window.process_id as u32,
        },
        Err(_) => WindowInfo::default(),
    }
}
