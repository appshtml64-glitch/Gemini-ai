import React, { useState } from 'react';
import { AppMode } from './types';
import ChatInterface from './components/ChatInterface';
import VoiceInterface from './components/VoiceInterface';
import { MessageSquareText, Mic } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.TEXT);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-5xl h-[85vh] flex flex-col md:flex-row gap-6">
        
        {/* Sidebar / Navigation */}
        <div className="w-full md:w-20 lg:w-64 bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-row md:flex-col gap-4 shadow-xl shrink-0">
            <div className="hidden md:flex items-center gap-3 px-2 py-4 mb-4 border-b border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
                    <span className="font-bold text-white text-lg">AI</span>
                </div>
                <span className="font-bold text-lg hidden lg:block tracking-tight">Gemini Asst.</span>
            </div>

            <nav className="flex flex-row md:flex-col gap-2 w-full">
                <button
                    onClick={() => setMode(AppMode.TEXT)}
                    className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 p-3 rounded-xl transition-all ${
                        mode === AppMode.TEXT 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                >
                    <MessageSquareText size={20} />
                    <span className="hidden lg:block font-medium">Chat de Texto</span>
                </button>
                
                <button
                    onClick={() => setMode(AppMode.VOICE)}
                    className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 p-3 rounded-xl transition-all ${
                        mode === AppMode.VOICE 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                >
                    <Mic size={20} />
                    <span className="hidden lg:block font-medium">Voz em Tempo Real</span>
                </button>
            </nav>

            <div className="hidden md:block mt-auto p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <p className="text-xs text-slate-500 text-center lg:text-left">
                    <span className="hidden lg:inline">Powered by </span>
                    <strong className="text-slate-400">Gemini 2.5</strong>
                </p>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 h-full min-h-0 relative">
            {mode === AppMode.TEXT ? (
                <ChatInterface />
            ) : (
                <VoiceInterface />
            )}
        </div>

      </div>
    </div>
  );
};

export default App;
