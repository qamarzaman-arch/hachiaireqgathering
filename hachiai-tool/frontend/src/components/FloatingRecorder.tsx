import { Play, Pause, Square, Minimize2, Maximize2 } from 'lucide-react';

interface FloatingRecorderProps {
  isRecording: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
  recordingCount: number;
}

export default function FloatingRecorder({
  isRecording,
  isPaused,
  onStart,
  onPause,
  onResume,
  onStop,
  onMinimize,
  isMinimized,
  recordingCount
}: FloatingRecorderProps) {
  return (
    <div
      className={`fixed top-4 right-4 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 transition-all duration-300 ${
        isMinimized ? 'w-auto' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between p-3">
        <div className={`flex items-center space-x-2 ${isMinimized ? 'hidden' : 'block'}`}>
          {isRecording && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">
                {isPaused ? 'Paused' : 'Recording'}
              </span>
              <span className="text-xs text-gray-500">({recordingCount} steps)</span>
            </div>
          )}
          {!isRecording && (
            <span className="text-sm font-medium text-gray-700">Ready</span>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          {!isRecording ? (
            <button
              onClick={onStart}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              title="Start Recording"
            >
              <Play size={16} fill="currentColor" />
            </button>
          ) : (
            <>
              <button
                onClick={isPaused ? onResume : onPause}
                className="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} />}
              </button>
              <button
                onClick={onStop}
                className="p-2 bg-gray-800 text-white rounded-full hover:bg-gray-900 transition-colors"
                title="Stop Recording"
              >
                <Square size={16} />
              </button>
            </>
          )}
          
          <button
            onClick={onMinimize}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
