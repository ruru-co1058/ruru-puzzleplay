'use client';

import { useState } from 'react';
import { ArrowLeft, Home as HomeIcon, User, Users } from 'lucide-react';
import PuzzleGame from './puzzle-game';
import './mode.css';

export const dynamic = 'force-static';

export default function Home() {
  const [mode, setMode] = useState<'single' | 'dual' | null>(null);
  if (!mode) return <main className="mode-screen"><a href="https://ruru-co1058.github.io/ruru-knowme-eplay/"><ArrowLeft/>回到遊戲首頁</a><div className="mode-card"><p>選擇遊戲方式</p><h1>照片拼圖小遊戲</h1><div><button onClick={()=>setMode('single')}><User/><strong>單人計時</strong><span>一個人完成拼圖並記錄時間</span></button><button onClick={()=>setMode('dual')}><Users/><strong>雙人 PK</strong><span>一起選好照片，倒數後同時開始</span></button></div></div></main>;
  return <div className="mode-game"><div className="mode-nav"><a href="https://ruru-co1058.github.io/ruru-knowme-eplay/"><HomeIcon/>遊戲首頁</a><button onClick={()=>setMode(null)}>切換模式</button></div><PuzzleGame mode={mode}/></div>;
}
