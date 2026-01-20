import React, { useEffect, useRef } from 'react';

interface Props {
  isActive: boolean;
  volume: number; // 0 to 1
}

const AudioVisualizer: React.FC<Props> = ({ isActive, volume }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Fix: Initialize useRef with null to avoid "Expected 1 arguments, but got 0" error
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const draw = () => {
      if (!isActive) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Base radius plus volume modification
      const baseRadius = 40;
      const dynamicRadius = baseRadius + (volume * 50);

      // Draw glowing orb
      const gradient = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.5, centerX, centerY, dynamicRadius);
      gradient.addColorStop(0, 'rgba(124, 58, 237, 0.8)'); // Violet
      gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.5)'); // Blue
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, dynamicRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw rings
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.3)'; // Light Blue
      ctx.lineWidth = 2;
      
      for (let i = 1; i <= 3; i++) {
        const ringRadius = baseRadius + (Math.sin(phase + i) * 10) + (volume * 20 * i);
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(0, ringRadius), 0, Math.PI * 2);
        ctx.stroke();
      }

      phase += 0.05;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, volume]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={300} 
      className="w-full h-full max-w-[300px] max-h-[300px]"
    />
  );
};

export default AudioVisualizer;