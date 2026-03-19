mod capture;
mod window;
mod processor;

use std::sync::mpsc::channel;
use std::thread;
use processor::Processor;

fn main() {
    println!("🟦 Hachiai Recorder Phase 1 - CLI Test");
    println!("Recording actions... Press Ctrl+C to stop.\n");

    let (tx, rx) = channel();

    // Start the listener thread
    thread::spawn(move || {
        capture::start_listening(tx);
    });

    let mut processor = Processor::new();

    // Process events in the main thread
    for raw_event in rx {
        if let Some(processed_event) = processor.process(raw_event) {
            println!("{}", serde_json::to_string(&processed_event).unwrap());
        }
    }
}
