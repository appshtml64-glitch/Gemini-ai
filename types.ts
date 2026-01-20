export type Role = 'user' | 'model';

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export enum AppMode {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
}

export interface AudioVisualizerProps {
  isPlaying: boolean;
  volume: number;
}
