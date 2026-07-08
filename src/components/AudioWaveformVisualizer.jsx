import React, { useEffect, useRef } from 'react';

export const AudioWaveformVisualizer = ({ stream, isRecording }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    if (!stream || !isRecording) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (stream === 'simulated') {
      let phase = 0;
      const drawSimulated = () => {
        if (!canvas) return;
        animationRef.current = requestAnimationFrame(drawSimulated);
        phase += 0.15;

        ctx.fillStyle = '#1e293b'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw horizontal center guideline
        ctx.strokeStyle = '#334155'; 
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        const numBars = 32;
        const barWidth = canvas.width / numBars;
        let x = 0;

        for (let i = 0; i < numBars; i++) {
          // Generate a complex combination of sinusoids + noise for beautiful organic look
          const freqMultiplier1 = Math.sin(phase + i * 0.25);
          const freqMultiplier2 = Math.cos(phase * 0.8 + i * 0.4);
          const randNoise = Math.random() * 0.2 + 0.8;
          const amplitude = Math.abs(freqMultiplier1 * 0.6 + freqMultiplier2 * 0.3) * randNoise;
          const barHeight = amplitude * canvas.height * 0.75;

          const yTop = (canvas.height - barHeight) / 2;

          const intensity = amplitude;
          const red = Math.min(255, Math.floor(16 + intensity * 230));
          const green = Math.max(10, Math.floor(185 - intensity * 150));
          const blue = Math.max(10, Math.floor(129 - intensity * 100));
          ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;

          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, yTop, barWidth - 2, Math.max(2, barHeight), 2);
          } else {
            ctx.rect(x, yTop, barWidth - 2, Math.max(2, barHeight));
          }
          ctx.fill();

          x += barWidth;
        }
      };

      drawSimulated();
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }

    let audioCtx;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;
    } catch (e) {
      console.error('AudioContext not supported', e);
      return;
    }

    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    
    // Set up Analyser properties
    analyser.fftSize = 128; 
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);

    const draw = () => {
      if (!canvas) return;
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      // Slate-900/slate-950 visual theme matching military guardian dashboard
      ctx.fillStyle = '#1e293b'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw horizontal center guideline
      ctx.strokeStyle = '#334155'; 
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      const barWidth = (canvas.width / bufferLength) * 1.5;
      let x = 0;

      // Draw symmetric bouncing bars from the center horizontal axis
      for (let i = 0; i < bufferLength; i++) {
        const amplitude = dataArray[i];
        // scale height based on the frequency value
        const barHeight = (amplitude / 255) * canvas.height * 0.85;

        // Center bars vertically
        const yTop = (canvas.height - barHeight) / 2;

        // Custom vibrant spectrum mapping from emerald (low) to bright amber/crimson (high volume spikes)
        const intensity = amplitude / 255;
        const red = Math.min(255, Math.floor(16 + intensity * 230));
        const green = Math.max(10, Math.floor(185 - intensity * 150));
        const blue = Math.max(10, Math.floor(129 - intensity * 100));
        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;

        // Draw bar
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, yTop, barWidth - 1.5, Math.max(2, barHeight), 2);
        } else {
          ctx.rect(x, yTop, barWidth - 1.5, Math.max(2, barHeight));
        }
        ctx.fill();

        x += barWidth;
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(err => console.log('Error closing audioCtx', err));
        }
      }
    };
  }, [stream, isRecording]);

  return (
    <div className="w-full flex flex-col items-center justify-center p-3 bg-slate-900 rounded-2xl border border-slate-800 shadow-inner">
      <div className="text-[10px] uppercase font-black tracking-widest text-[#10B981] mb-2 animate-pulse flex items-center gap-1.5">
        <span className="h-2 w-2 bg-red-600 rounded-full animate-ping"></span>
        <span>{stream === 'simulated' ? 'SIMULATED SAFE MICROPHONE TELEMETRY' : 'LIVE DECI-BAND MIC VOLTAGE ACTIVE'}</span>
      </div>
      <canvas 
        ref={canvasRef} 
        width={340} 
        height={60} 
        className="w-full max-w-sm h-14 rounded-xl overflow-hidden shadow-md border border-slate-800"
      />
    </div>
  );
};
