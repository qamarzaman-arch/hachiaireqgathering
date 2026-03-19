import React from 'react';
import { Square, Pause, Play } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

export default function RecorderWidget() {
  const [isPaused, setIsPaused] = React.useState(false);

  const stopRecording = async () => {
    await invoke('stop_recording');
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="flex items-center justify-between w-full h-screen bg-hachiai-purple-dark text-white px-4 shadow-2xl rounded-lg border border-white/20 select-none data-[tauri-drag-region]:cursor-move" data-tauri-drag-region>
      <div className="flex items-center space-x-2 pointer-events-none">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        <span className="font-bold text-sm">REC</span>
      </div>

      <div className="flex items-center space-x-4">
        <button onClick={togglePause} className="hover:bg-white/10 p-2 rounded-full transition-colors">
          {isPaused ? <Play size={20} fill="white" /> : <Pause size={20} fill="white" />}
        </button>
        <button onClick={stopRecording} className="bg-red-500 hover:bg-red-600 p-2 rounded-full transition-colors shadow-lg">
          <Square size={20} fill="white" />
        </button>
      </div>
    </div>
  );
}
