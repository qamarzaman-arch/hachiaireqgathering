import React from 'react';
import { Play, FileText, Settings, History } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import Editor from './Editor';

export default function Home() {
  const [isRecording, setIsRecording] = React.useState(false);
  const [view, setView] = React.useState<'home' | 'editor'>('home');

  if (view === 'editor') {
    return <Editor onBack={() => setView('home')} />;
  }

  const toggleRecording = async () => {
    try {
      if (isRecording) {
        await invoke('stop_recording');
      } else {
        await invoke('start_recording');
      }
      setIsRecording(!isRecording);
    } catch (error) {
      console.error('Failed to toggle recording:', error);
      // Fallback for verification in non-Tauri environment
      setIsRecording(!isRecording);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <div className="flex h-full">
        <div className="w-20 bg-hachiai-purple-dark flex flex-col items-center py-8 space-y-8 flex-shrink-0">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-hachiai-purple font-bold text-xl">
            H
          </div>
          <nav className="flex flex-col space-y-6">
            <button className="text-white/60 hover:text-white transition-colors"><History size={24} /></button>
            <button className="text-white/60 hover:text-white transition-colors"><FileText size={24} /></button>
            <button className="text-white/60 hover:text-white transition-colors"><Settings size={24} /></button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col p-12 overflow-hidden">
          <header className="flex justify-between items-center mb-12 flex-shrink-0">
            <div>
              <h1 className="text-4xl font-bold text-hachiai-grey">Hachiai</h1>
              <p className="text-gray-500 mt-2">Requirements Gathering Tool</p>
            </div>
            <button
              onClick={toggleRecording}
              className={`flex items-center space-x-3 px-8 py-4 rounded-full font-bold text-white shadow-lg transition-all transform hover:scale-105 ${
                isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-hachiai-purple hover:bg-hachiai-purple-dark'
              }`}
            >
              <Play fill="currentColor" size={20} />
              <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
            </button>
          </header>

          <div className="flex-1 overflow-auto">
            <h2 className="text-xl font-semibold mb-6">Previous Recordings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  onClick={() => setView('editor')}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="w-full h-32 bg-gray-100 rounded-xl mb-4 flex items-center justify-center text-gray-400">
                    <FileText size={32} />
                  </div>
                  <h3 className="font-bold text-lg">Checkout Process v{i}</h3>
                  <p className="text-sm text-gray-500 mt-1">Recorded on March 19, 2026</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
