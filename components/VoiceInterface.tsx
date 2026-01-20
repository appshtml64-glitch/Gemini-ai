import React from 'react';
import { useLiveSession } from '../hooks/useLiveSession';
import AudioVisualizer from './AudioVisualizer';
import { Mic, MicOff, Activity, AlertCircle } from 'lucide-react';

const VoiceInterface: React.FC = () => {
  const { isConnected, isConnecting, volume, error, connect, disconnect } = useLiveSession();

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg overflow-hidden border border-slate-800 shadow-2xl relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900/50 to-slate-900 pointer-events-none" />
      
      {/* Header */}
      <div className="relative z-10 p-6 flex justify-between items-start">
        <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Activity className="text-emerald-400" />
                Modo de Voz Ao Vivo
            </h2>
            <p className="text-slate-400 mt-1">Converse naturalmente com o Gemini em tempo real.</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-400'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            {isConnected ? 'Conectado' : 'Desconectado'}
        </div>
      </div>

      {/* Main Visualizer Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-8">
        <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
            <AudioVisualizer isActive={isConnected} volume={volume} />
        </div>
        
        {error && (
            <div className="mt-8 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
            </div>
        )}

        <div className="mt-12 text-center space-y-2">
            {!isConnected && !isConnecting && (
                 <p className="text-slate-400 text-sm">Toque no microfone para iniciar a conversa</p>
            )}
            {isConnecting && (
                <p className="text-indigo-400 text-sm animate-pulse">Estabelecendo conexão...</p>
            )}
             {isConnected && (
                <p className="text-slate-500 text-sm">Ouvindo...</p>
            )}
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 p-8 flex justify-center pb-12">
        <button
          onClick={isConnected ? disconnect : connect}
          disabled={isConnecting}
          className={`
            relative group p-6 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg
            ${isConnected 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'
            }
            ${isConnecting ? 'opacity-70 cursor-wait' : ''}
          `}
        >
          {isConnected ? <MicOff size={32} className="text-white" /> : <Mic size={32} className="text-white" />}
          
          {/* Ripple effect hint */}
          {!isConnected && !isConnecting && (
             <span className="absolute -inset-2 rounded-full border border-indigo-500/30 animate-ping pointer-events-none" />
          )}
        </button>
      </div>
    </div>
  );
};

export default VoiceInterface;
