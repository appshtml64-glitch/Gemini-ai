import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { createPCM16Blob, base64ToBytes, decodeAudioData } from '../utils/audioUtils';

interface UseLiveSessionReturn {
  isConnected: boolean;
  isConnecting: boolean;
  volume: number; // For visualization (0-1)
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const useLiveSession = (): UseLiveSessionReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);

  // Refs for audio handling to avoid re-renders
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null); // Type 'any' used for the session object which is internal to SDK
  const activeSessionRef = useRef<any>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Disconnect input audio nodes
    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
      inputSourceRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }

    // Stop all scheduled output audio
    scheduledSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
    });
    scheduledSourcesRef.current.clear();

    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    // Close session if possible (SDK doesn't expose explicit close on the promise result easily, 
    // but we reset state). Ideally we would call session.close() if we stored the resolved session.
    if (activeSessionRef.current && typeof activeSessionRef.current.close === 'function') {
        activeSessionRef.current.close();
    }
    activeSessionRef.current = null;
    sessionPromiseRef.current = null;

    setIsConnected(false);
    setIsConnecting(false);
    setVolume(0);
    nextStartTimeRef.current = 0;
  }, []);

  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return;

    setIsConnecting(true);
    setError(null);

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key not found");

      const ai = new GoogleGenAI({ apiKey });

      // Initialize Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: 'Você é um assistente virtual prestativo e amigável. Fale português do Brasil de forma natural e concisa.',
        },
      };

      // Connect to Live API
      const sessionPromise = ai.live.connect({
        ...config,
        callbacks: {
          onopen: async () => {
            console.log("Session opened");
            setIsConnected(true);
            setIsConnecting(false);

            if (!inputAudioContextRef.current || !streamRef.current) return;

            // Setup Input Pipeline
            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            inputSourceRef.current = source;
            
            // Use ScriptProcessor for raw PCM access (Standard for this API currently)
            const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Simple volume meter logic
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              setVolume(Math.min(rms * 5, 1)); // Amplify a bit for visualizer

              const pcmBlob = createPCM16Blob(inputData);
              
              // Send data when session is ready
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => {
                    activeSessionRef.current = session;
                    session.sendRealtimeInput({ media: pcmBlob });
                });
              }
            };

            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (!outputAudioContextRef.current) return;

            // Handle Server Audio
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              try {
                const ctx = outputAudioContextRef.current;
                const audioBuffer = await decodeAudioData(
                  base64ToBytes(base64Audio),
                  ctx,
                  24000
                );

                // Scheduling logic
                const currentTime = ctx.currentTime;
                if (nextStartTimeRef.current < currentTime) {
                  nextStartTimeRef.current = currentTime;
                }

                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;

                scheduledSourcesRef.current.add(source);
                source.onended = () => {
                  scheduledSourcesRef.current.delete(source);
                };
              } catch (err) {
                console.error("Error decoding audio", err);
              }
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              console.log("Interrupted");
              scheduledSourcesRef.current.forEach(source => source.stop());
              scheduledSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            console.log("Session closed");
            cleanup();
          },
          onerror: (err) => {
            console.error("Session error", err);
            setError("Erro na conexão com o assistente.");
            cleanup();
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (err: any) {
      console.error("Connection failed", err);
      setError(err.message || "Falha ao conectar.");
      cleanup();
    }
  }, [cleanup, isConnected, isConnecting]);

  const disconnect = useCallback(() => {
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return { isConnected, isConnecting, volume, error, connect, disconnect };
};
