import React from 'react';
import { Play, FileText, Settings, History, Trash2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import Editor from './Editor';
import FloatingRecorder from './components/FloatingRecorder';
import { ScreenshotCapture } from './utils/screenshot';
import { EventCapture, UserEvent } from './utils/eventCapture';

interface RecordingStep {
  id: string;
  title: string;
  description: string;
  app_name: string;
  timestamp: number;
  screenshot?: string;
  event?: UserEvent;
}

interface Recording {
  id: string;
  title: string;
  date: string;
  steps: RecordingStep[];
  createdAt: number;
  duration: number;
}

export default function Home() {
  const [isRecording, setIsRecording] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [view, setView] = React.useState<'home' | 'editor'>('home');
  const [recordings, setRecordings] = React.useState<Recording[]>([]);
  const [currentRecordingSteps, setCurrentRecordingSteps] = React.useState<RecordingStep[]>([]);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [recordingStartTime, setRecordingStartTime] = React.useState<number>(0);
  const [selectedRecordingSteps, setSelectedRecordingSteps] = React.useState<RecordingStep[]>([]);

  const screenshotCapture = React.useRef(ScreenshotCapture.getInstance());
  const eventCapture = React.useRef(EventCapture.getInstance());

  // Load recordings from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem('hachiai-recordings');
    if (stored) {
      setRecordings(JSON.parse(stored));
    }
  }, []);

  // Save recordings to localStorage
  const saveRecordings = (newRecordings: Recording[]) => {
    localStorage.setItem('hachiai-recordings', JSON.stringify(newRecordings));
    setRecordings(newRecordings);
  };

  const deleteRecording = (id: string) => {
    const updatedRecordings = recordings.filter(r => r.id !== id);
    saveRecordings(updatedRecordings);
  };

  // Process events into human-readable steps
  const processEventToStep = async (event: UserEvent): Promise<RecordingStep> => {
    let title = 'Unknown Action';
    let description = '';
    let screenshot: string | undefined;

    switch (event.type) {
      case 'click':
        title = event.element?.text ? `Click "${event.element.text}"` : 'Click Element';
        description = `Clicked on ${event.element?.tagName || 'element'}${event.element?.className ? ` with class "${event.element.className}"` : ''}`;
        if (event.element) {
        // Note: In web environment, we can't highlight specific elements
        // without actual DOM references, so we'll just capture the screen
        const screenshotData = await screenshotCapture.current.captureScreen();
          screenshot = screenshotData.dataUrl;
        }
        break;
      
      case 'keypress':
        title = `Press ${event.key || 'Key'}`;
        description = `Pressed keyboard key: ${event.key || 'Unknown'}`;
        break;
      
      case 'scroll':
        title = 'Scroll Page';
        description = 'Scrolled the page content';
        break;
      
      case 'navigation':
        title = 'Navigate';
        description = `Navigated to ${event.url || 'new page'}`;
        break;
    }

    return {
      id: event.id,
      title,
      description,
      app_name: event.application,
      timestamp: event.timestamp,
      screenshot,
      event
    };
  };

  // Capture screenshot and process events during recording
  React.useEffect(() => {
    if (!isRecording || isPaused) return;

    const interval = setInterval(async () => {
      try {
        // Capture current screen
        const screenshotData = await screenshotCapture.current.captureScreen();
        
        // Get recent events
        const events = eventCapture.current.getEvents();
        const recentEvents = events.filter(e => e.timestamp > (recordingStartTime + (currentRecordingSteps.length * 2000)));
        
        if (recentEvents.length > 0) {
          // Process the most recent event
          const latestEvent = recentEvents[recentEvents.length - 1];
          const step = await processEventToStep(latestEvent);
          
          setCurrentRecordingSteps(prev => {
            // Avoid duplicate steps
            if (prev.length === 0 || prev[prev.length - 1].title !== step.title) {
              return [...prev, step];
            }
            return prev;
          });
        } else {
          // Create a step for the screenshot if no specific event
          const step: RecordingStep = {
            id: Date.now().toString(),
            title: 'Screen Capture',
            description: 'Captured current screen state',
            app_name: 'Hachiai',
            timestamp: Date.now(),
            screenshot: screenshotData.dataUrl
          };
          
          setCurrentRecordingSteps(prev => [...prev, step]);
        }
      } catch (error) {
        console.error('Error during recording:', error);
      }
    }, 2000); // Capture every 2 seconds

    return () => clearInterval(interval);
  }, [isRecording, isPaused, recordingStartTime, currentRecordingSteps.length]);

  const startRecording = async () => {
    try {
      // Check if running in Tauri environment
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        await invoke('start_recording');
      }
      
      // Start web recording
      setRecordingStartTime(Date.now());
      setCurrentRecordingSteps([]);
      setIsRecording(true);
      setIsPaused(false);
      eventCapture.current.startRecording();
      
      // Take initial screenshot
      const initialScreenshot = await screenshotCapture.current.captureScreen();
      const initialStep: RecordingStep = {
        id: Date.now().toString(),
        title: 'Recording Started',
        description: 'Began recording workflow',
        app_name: 'Hachiai',
        timestamp: Date.now(),
        screenshot: initialScreenshot.dataUrl
      };
      setCurrentRecordingSteps([initialStep]);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const pauseRecording = () => {
    setIsPaused(true);
  };

  const resumeRecording = () => {
    setIsPaused(false);
  };

  const stopRecording = async () => {
    try {
      // Check if running in Tauri environment
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        await invoke('stop_recording');
      }
      
      // Stop web recording
      setIsRecording(false);
      setIsPaused(false);
      eventCapture.current.stopRecording();
      
      // Take final screenshot
      const finalScreenshot = await screenshotCapture.current.captureScreen();
      const finalStep: RecordingStep = {
        id: Date.now().toString(),
        title: 'Recording Stopped',
        description: 'Finished recording workflow',
        app_name: 'Hachiai',
        timestamp: Date.now(),
        screenshot: finalScreenshot.dataUrl
      };
      
      const allSteps = [...currentRecordingSteps, finalStep];
      
      // Save recording
      const duration = Date.now() - recordingStartTime;
      const newRecording: Recording = {
        id: Date.now().toString(),
        title: `Recording ${recordings.length + 1}`,
        date: new Date().toLocaleDateString(),
        steps: allSteps,
        createdAt: Date.now(),
        duration
      };
      
      saveRecordings([...recordings, newRecording]);
      setCurrentRecordingSteps([]);
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  if (view === 'editor') {
    return <Editor onBack={() => setView('home')} recordingSteps={selectedRecordingSteps} />;
  }

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 text-gray-800">
      {/* Floating Recorder Widget */}
      <FloatingRecorder
        isRecording={isRecording}
        isPaused={isPaused}
        onStart={startRecording}
        onPause={pauseRecording}
        onResume={resumeRecording}
        onStop={stopRecording}
        onMinimize={() => setIsMinimized(!isMinimized)}
        isMinimized={isMinimized}
        recordingCount={currentRecordingSteps.length}
      />
      {/* Sidebar */}
      <div className="flex h-full">
        <div className="w-20 bg-hachiai-purple-dark flex flex-col items-center py-8 space-y-8 flex-shrink-0">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-hachiai-purple font-bold text-xl">
            H
          </div>
          <nav className="flex flex-col space-y-6">
            <button 
              onClick={() => console.log('History clicked')}
              className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
              title="History"
            >
              <History size={24} />
            </button>
            <button 
              onClick={() => console.log('Documents clicked')}
              className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
              title="Documents"
            >
              <FileText size={24} />
            </button>
            <button 
              onClick={() => console.log('Settings clicked')}
              className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
              title="Settings"
            >
              <Settings size={24} />
            </button>
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Previous Recordings</h2>
              <div className="flex items-center space-x-2">
                {isRecording && (
                  <div className="flex items-center space-x-2 text-red-500">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">Recording {currentRecordingSteps.length} steps...</span>
                    {isPaused && <span className="text-xs">(Paused)</span>}
                  </div>
                )}
                <span className="text-sm text-gray-400">{recordings.length} Total Recordings</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recordings.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-500 mb-2">No Recordings Yet</h3>
                  <p className="text-gray-400">Start recording to create your first workflow</p>
                </div>
              ) : (
                recordings.map((recording) => (
                  <div
                    key={recording.id}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div 
                        onClick={() => {
                          setSelectedRecordingSteps(recording.steps);
                          setView('editor');
                        }}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="w-full h-32 bg-gray-100 rounded-xl mb-4 flex items-center justify-center text-gray-400 overflow-hidden">
                          {recording.steps.length > 0 && recording.steps[0].screenshot ? (
                            <img 
                              src={recording.steps[0].screenshot} 
                              alt="Recording preview" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText size={32} />
                          )}
                        </div>
                        <h3 className="font-bold text-lg">{recording.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{recording.date}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRecording(recording.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg text-red-500"
                        title="Delete Recording"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-hachiai-purple-light/30 text-hachiai-purple-dark px-2 py-1 rounded-full font-bold">
                          {recording.steps.length} Steps
                        </span>
                        {recording.duration > 0 && (
                          <span className="text-xs text-gray-400">
                            {Math.round(recording.duration / 1000)}s
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(recording.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
