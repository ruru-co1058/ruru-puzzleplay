'use client';

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, RefreshCw, Sparkles, Swords, Timer, Trophy, Volume2 } from 'lucide-react';

const starterImage = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/default-puzzle.png`;
const levels = [
  { size: 3, label: '輕鬆', note: '3 × 3' },
  { size: 4, label: '挑戰', note: '4 × 4' },
  { size: 5, label: '高手', note: '5 × 5' },
];

const ordered = (size: number) => Array.from({ length: size * size }, (_, i) => i);
const reverseOrder = (size: number) => ordered(size).reverse();
const shuffled = (size: number) => {
  const result = ordered(size);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  if (result.every((value, index) => value === index)) [result[0], result[1]] = [result[1], result[0]];
  return result;
};
const formatTime = (tenths: number) => `${String(Math.floor(tenths / 600)).padStart(2, '0')}:${String(Math.floor((tenths % 600) / 10)).padStart(2, '0')}.${tenths % 10}`;

export default function Home({ mode = 'dual' }: { mode?: 'single' | 'dual' }) {
  const [size, setSize] = useState(3);
  const [image, setImage] = useState(starterImage);
  const [hasUploadedImage, setHasUploadedImage] = useState(false);
  const [boards, setBoards] = useState<number[][]>(() => [reverseOrder(3), reverseOrder(3)]);
  const [selected, setSelected] = useState<(number | null)[]>([null, null]);
  const [moves, setMoves] = useState([0, 0]);
  const [times, setTimes] = useState([0, 0]);
  const [finished, setFinished] = useState([false, false]);
  const [countdown, setCountdown] = useState<number | 'GO' | null>(null);
  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(0);
  const audioRef = useRef<AudioContext | null>(null);
  const dragRef = useRef<(number | null)[]>([null, null]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setTimes((current) => current.map((value, player) => finished[player] ? value : value + 1)), 100);
    return () => window.clearInterval(id);
  }, [running, finished]);

  const audio = () => {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioRef.current ??= new AudioContextClass();
    void audioRef.current.resume();
    return audioRef.current;
  };
  const tone = (frequency: number, delay = 0, duration = .16, type: OscillatorType = 'sine', volume = .12) => {
    const ctx = audio(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); const start = ctx.currentTime + delay;
    osc.type = type; osc.frequency.setValueAtTime(frequency, start); gain.gain.setValueAtTime(volume, start); gain.gain.exponentialRampToValueAtTime(.001, start + duration);
    osc.connect(gain).connect(ctx.destination); osc.start(start); osc.stop(start + duration);
  };
  const cheer = () => [523, 659, 784, 1047].forEach((note, index) => tone(note, index * .09, .3, 'triangle', .1));
  const finale = () => {
    for (let i = 0; i < 12; i++) tone(170 + Math.random() * 120, i * .055, .07, 'square', .035);
    [523, 659, 784, 659, 784, 1047].forEach((note, index) => tone(note, .2 + index * .16, .28, 'triangle', .075));
  };

  const prepareRound = (nextSize = size) => {
    const layout = reverseOrder(nextSize);
    setBoards([[...layout], [...layout]]); setSelected([null, null]); setMoves([0, 0]); setTimes([0, 0]); setFinished([false, false]); setRunning(false); setCountdown(null);
  };
  const startRound = () => {
    if (!hasUploadedImage) return;
    audio();
    const layout = shuffled(size);
    setBoards([[...layout], [...layout]]); setSelected([null, null]); setMoves([0, 0]); setTimes([0, 0]); setFinished([false, false]); setRunning(false); setRound((value) => value + 1);
    [3, 2, 1].forEach((number, index) => window.setTimeout(() => { setCountdown(number); tone(440 + index * 110, 0, .18, 'sine', .13); }, index * 800));
    window.setTimeout(() => { setCountdown('GO'); tone(880, 0, .35, 'triangle', .16); setRunning(true); }, 2400);
    window.setTimeout(() => setCountdown(null), 3000);
  };
  const completePlayer = (player: number) => {
    setFinished((current) => {
      const next = [...current]; next[player] = true;
      if (mode === 'single') { setRunning(false); window.setTimeout(finale, 120); }
      else if (next.every(Boolean)) { setRunning(false); window.setTimeout(finale, 120); } else cheer();
      return next;
    });
  };
  const swap = (player: number, from: number, to: number) => {
    if (!running || finished[player] || from === to) return;
    setBoards((current) => {
      const next = current.map((board) => [...board]);
      [next[player][from], next[player][to]] = [next[player][to], next[player][from]];
      if (next[player].every((piece, index) => piece === index)) window.setTimeout(() => completePlayer(player), 0);
      return next;
    });
    setMoves((current) => current.map((value, index) => index === player ? value + 1 : value));
    setSelected((current) => current.map((value, index) => index === player ? null : value));
  };
  const selectPiece = (player: number, index: number) => {
    if (!running || finished[player]) return;
    const current = selected[player];
    if (current === null) setSelected((values) => values.map((value, i) => i === player ? index : value));
    else swap(player, current, index);
  };
  const handleDrop = (event: DragEvent<HTMLButtonElement>, player: number, index: number) => {
    event.preventDefault(); const from = dragRef.current[player]; if (from !== null) swap(player, from, index); dragRef.current[player] = null;
  };
  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader(); reader.onload = () => { setImage(String(reader.result)); setHasUploadedImage(true); prepareRound(size); }; reader.readAsDataURL(file); event.target.value = '';
  };

  const players = mode === 'single' ? [0] : [0, 1];
  const leader = mode === 'dual' && finished[0] !== finished[1] ? (finished[0] ? 0 : 1) : null;
  const progress = useMemo(() => boards.map((board) => Math.round(board.filter((piece, index) => piece === index).length / board.length * 100)), [boards]);

  return (
    <main className={`pk-shell ${mode === 'single' ? 'single-puzzle' : ''}`}>
      <header className="pk-topbar">
        <div className="pk-logo"><Swords size={25} /></div>
        <div><p className="eyebrow">{mode === 'dual' ? '雙人公平挑戰' : '單人計時挑戰'}</p><h1>{mode === 'dual' ? '拼圖 PK 賽！' : '照片拼圖挑戰'}</h1></div>
        <label className="upload-button"><ImagePlus size={20} /><span>選擇圖片</span><input type="file" accept="image/*" onChange={upload} /></label>
      </header>

      <section className="control-deck">
        <div className="level-picker" role="radiogroup" aria-label="選擇難度">
          {levels.map((level) => <button key={level.size} type="button" role="radio" aria-checked={size === level.size} disabled={running || countdown !== null} className={size === level.size ? 'active' : ''} onClick={() => { setSize(level.size); prepareRound(level.size); }}><strong>{level.label}</strong><span>{level.note}</span></button>)}
        </div>
        <div className="fair-note"><Sparkles size={18} /><span>{mode === 'dual' ? '兩邊的拼圖片順序完全相同' : '完成拼圖並記錄時間'}</span></div>
        <button className="start-button" type="button" disabled={!hasUploadedImage || running || countdown !== null} onClick={startRound}>{round ? <RefreshCw size={21} /> : <Volume2 size={21} />}{round ? (mode === 'dual' ? '再比一場' : '再玩一次') : (mode === 'dual' ? '開始 PK' : '開始拼圖')}</button>
      </section>

      <section className="arena">
        {players.map((player) => (
          <article className={`player-zone player-${player + 1} ${leader === player ? 'winner' : ''}`} key={player}>
            <div className="player-heading">
              <div><span className="player-badge">玩家 {player + 1}</span><strong>{finished[player] ? '完成！' : running ? '加油！' : '準備好了'}</strong></div>
              <div className="player-stats"><span><Timer size={17} />{formatTime(times[player])}</span><span>{moves[player]} 步</span><span>{progress[player]}%</span></div>
            </div>
            <div className={`pk-frame ${finished[player] ? 'complete' : ''}`}>
              <div className="pk-board" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
                {boards[player].map((piece, index) => {
                  const row = Math.floor(piece / size); const column = piece % size;
                  return <button key={`${piece}-${index}`} type="button" disabled={!running || finished[player]} draggable={running && !finished[player]} aria-label={`玩家 ${player + 1} 的第 ${index + 1} 塊拼圖`} className={`pk-piece ${selected[player] === index ? 'selected' : ''}`} onClick={() => selectPiece(player, index)} onDragStart={() => { dragRef.current[player] = index; }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, player, index)} style={{ backgroundImage: `url("${image}")`, backgroundSize: `${size * 100}% ${size * 100}%`, backgroundPosition: `${column / (size - 1) * 100}% ${row / (size - 1) * 100}%` }} />;
                })}
              </div>
              {finished[player] && <div className="finish-stamp"><Trophy size={32} /><strong>{leader === player ? '率先完成！' : '挑戰完成！'}</strong><span>{formatTime(times[player])}</span></div>}
            </div>
          </article>
        ))}
      </section>

      {!running && countdown === null && round === 0 && <p className="start-hint">{!hasUploadedImage ? '請先上傳一張照片，才能開始遊戲。' : mode === 'dual' ? '照片已準備完成，兩位玩家準備好後按下「開始 PK」' : '照片已準備完成，按下「開始拼圖」'}</p>}
      {countdown !== null && <div className="countdown" role="status" aria-live="assertive"><span>{countdown === 'GO' ? '開始！' : countdown}</span></div>}
      {mode === 'dual' && finished.every(Boolean) && <div className="all-finished" role="status"><Sparkles size={28} /><strong>兩位都完成了！</strong><span>為彼此拍拍手！</span></div>}
    </main>
  );
}
