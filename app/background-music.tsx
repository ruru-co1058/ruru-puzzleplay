'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

type MusicStyle = 'home' | 'match' | 'named' | 'puzzle';
const scores: Record<MusicStyle, { notes: number[]; beat: number; wave: OscillatorType }> = {
  home: { notes: [523, 659, 784, 659, 698, 784, 880, 784], beat: 390, wave: 'sine' },
  match: { notes: [220, 262, 247, 294, 220, 330, 294, 247], beat: 270, wave: 'square' },
  named: { notes: [659, 784, 880, 784, 698, 784, 988, 880], beat: 380, wave: 'sine' },
  puzzle: { notes: [523, 659, 784, 1047, 880, 784, 659, 784], beat: 300, wave: 'triangle' },
};

export default function BackgroundMusic({ style }: { style: MusicStyle }) {
  const [playing, setPlaying] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const stepRef = useRef(0);

  const stop = () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    void contextRef.current?.close();
    contextRef.current = null;
    setPlaying(false);
  };

  const start = () => {
    if (contextRef.current) return;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = new AudioContextClass();
    contextRef.current = context;
    const score = scores[style];
    const playNote = () => {
      if (!contextRef.current) return;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;
      oscillator.type = score.wave;
      oscillator.frequency.setValueAtTime(score.notes[stepRef.current % score.notes.length], now);
      gain.gain.setValueAtTime(.025, now);
      gain.gain.exponentialRampToValueAtTime(.001, now + score.beat / 1000 * .72);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + score.beat / 1000 * .75);
      stepRef.current += 1;
    };
    void context.resume();
    playNote();
    timerRef.current = window.setInterval(playNote, score.beat);
    setPlaying(true);
  };

  useEffect(() => stop, []);

  return <button type="button" className="music-toggle" aria-pressed={playing} onClick={playing ? stop : start}>{playing ? <VolumeX /> : <Volume2 />}<span>{playing ? '關閉音樂' : '開啟音樂'}</span></button>;
}

