use screenshots::Display;
use std::fs;
use std::path::Path;
use image::ImageFormat;

pub fn capture_screen(output_path: &Path) -> Result<(), String> {
    let displays = Display::all().map_err(|e| e.to_string())?;

    // For Phase 1/2, we'll capture the primary display
    if let Some(display) = displays.first() {
        let image = display.capture().map_err(|e| e.to_string())?;

        // Ensure parent directory exists
        if let Some(parent) = output_path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }

        // Save as WebP for compression
        image.save_with_format(output_path, ImageFormat::WebP).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("No displays found".to_string())
    }
}
