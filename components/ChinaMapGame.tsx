import React, { useState, useEffect } from 'react';
import { CHINA_PROVINCES_DATA } from '../constants';
import { ProvinceData } from '../types';
import { Map, Trophy, HelpCircle, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

const ChinaMapGame: React.FC = () => {
  const [mode, setMode] = useState<'learn' | 'quiz_name' | 'quiz_capital' | 'quiz_abbr'>('learn');
  const [selectedProv, setSelectedProv] = useState<ProvinceData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<ProvinceData | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  useEffect(() => {
    if (mode !== 'learn') {
      startQuiz();
    } else {
      setCurrentQuestion(null);
      setFeedback(null);
    }
  }, [mode]);

  const startQuiz = () => {
    const randomProv = CHINA_PROVINCES_DATA[Math.floor(Math.random() * CHINA_PROVINCES_DATA.length)];
    setCurrentQuestion(randomProv);
    setFeedback(null);
    setSelectedProv(null);
  };

  const handleProvinceClick = (prov: ProvinceData) => {
    if (mode === 'learn') {
      setSelectedProv(prov);
    } else if (currentQuestion && !feedback) {
      if (prov.id === currentQuestion.id) {
        setFeedback('correct');
        setScore(s => s + 10);
        setStreak(s => s + 1);
        setTimeout(startQuiz, 1500);
      } else {
        setFeedback('wrong');
        setStreak(0);
      }
    }
  };

  const getQuestionText = () => {
    if (!currentQuestion) return "";
    switch (mode) {
      case 'quiz_name': return `请找出：${currentQuestion.name}`;
      case 'quiz_capital': return `哪个省份的行政中心是：${currentQuestion.capital}？`;
      case 'quiz_abbr': return `哪个省份的简称是：${currentQuestion.abbr}？`;
      default: return "";
    }
  };

  return (
    <div className="h-full flex flex-col bg-sky-50 rounded-xl overflow-hidden border-2 border-sky-200">
      {/* Header */}
      <div className="bg-sky-500 p-4 text-white flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Map />
          <span>神州大地 - 知识训练场</span>
        </div>
        <div className="flex gap-2">
           <select 
             className="bg-sky-600 border border-sky-400 rounded-lg px-2 py-1 text-sm outline-none"
             value={mode}
             onChange={(e) => setMode(e.target.value as any)}
           >
             <option value="learn">📖 自由探索模式</option>
             <option value="quiz_name">🎯 挑战：找省份</option>
             <option value="quiz_capital">🏛️ 挑战：找省会</option>
             <option value="quiz_abbr">🔤 挑战：找简称</option>
           </select>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
        {/* Sidebar Info */}
        <div className="w-full md:w-64 bg-white/80 p-4 flex flex-col gap-4 border-r border-sky-100 z-10 backdrop-blur-sm order-2 md:order-1">
          
          {mode !== 'learn' && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-sky-100">
               <div className="flex justify-between items-end mb-2">
                 <span className="text-gray-500 text-sm font-bold">战斗力 (Score)</span>
                 <span className="text-2xl font-comic text-orange-500">{score}</span>
               </div>
               <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                 <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${Math.min(score, 100)}%` }}></div>
               </div>
               <div className="mt-2 text-xs text-center text-gray-400">
                 {streak > 2 ? `🔥 连对 ${streak} 题！状态火热！` : '加油！积累知识！'}
               </div>
            </div>
          )}

          {mode === 'learn' && selectedProv ? (
             <div className="bg-white p-6 rounded-xl shadow-md border-2 border-sky-200 text-center animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-3xl font-bold text-sky-600 mb-2">{selectedProv.name}</h3>
                <div className="space-y-3 text-left">
                   <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-500">简称</span>
                      <span className="font-bold text-gray-800 text-xl">{selectedProv.abbr}</span>
                   </div>
                   <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-500">行政中心</span>
                      <span className="font-bold text-gray-800">{selectedProv.capital}</span>
                   </div>
                </div>
             </div>
          ) : mode === 'learn' ? (
             <div className="text-gray-400 text-center mt-10">
                <HelpCircle size={48} className="mx-auto mb-2 opacity-50" />
                <p>点击地图上的区域<br/>查看详细信息</p>
             </div>
          ) : (
             <div className="bg-orange-50 p-4 rounded-xl border-2 border-orange-200 text-center">
                <h3 className="font-bold text-orange-800 mb-2">当前任务</h3>
                <p className="text-lg font-medium text-gray-800">{getQuestionText()}</p>
                {feedback === 'correct' && (
                    <div className="mt-4 p-2 bg-green-100 text-green-700 rounded-lg flex items-center justify-center gap-2 animate-bounce">
                        <CheckCircle size={20} /> 正确！欧斯！
                    </div>
                )}
                {feedback === 'wrong' && (
                    <div className="mt-4 p-2 bg-red-100 text-red-700 rounded-lg flex items-center justify-center gap-2 animate-shake">
                        <XCircle size={20} /> 哎呀！再试一次！
                    </div>
                )}
                {feedback && (
                   <button onClick={startQuiz} className="mt-4 text-sm text-sky-600 underline">跳过此题</button>
                )}
             </div>
          )}
        </div>

        {/* Map Area */}
        <div className="flex-1 bg-sky-100 relative overflow-hidden cursor-move order-1 md:order-2 flex items-center justify-center p-4">
           {/* Simple Map Visualization */}
           <svg viewBox="0 0 800 800" className="w-full h-full max-w-2xl drop-shadow-xl select-none">
              <defs>
                 <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge>
                       <feMergeNode in="coloredBlur"/>
                       <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                 </filter>
              </defs>
              {CHINA_PROVINCES_DATA.map((prov) => {
                 const isSelected = selectedProv?.id === prov.id;
                 const isTarget = currentQuestion?.id === prov.id;
                 
                 // Dynamic styling based on state
                 let fill = "#fff";
                 let stroke = "#38bdf8"; // sky-400
                 
                 if (mode === 'learn') {
                    if (isSelected) fill = "#fca5a5"; // red-300
                 } else {
                    if (feedback === 'correct' && isTarget) fill = "#86efac"; // green-300
                    if (feedback === 'wrong' && isSelected) fill = "#fca5a5"; // red-300
                 }

                 return (
                    <g key={prov.id} onClick={() => handleProvinceClick(prov)}>
                       <path 
                         d={prov.path} 
                         fill={fill}
                         stroke={stroke}
                         strokeWidth="2"
                         className="transition-all duration-200 hover:opacity-80 cursor-pointer hover:stroke-orange-400 hover:stroke-4"
                       />
                       {/* Labels - only show in learn mode or if guessed correctly */}
                       {(mode === 'learn' || (feedback === 'correct' && isTarget)) && (
                           <text x={prov.cx} y={prov.cy} fontSize="12" textAnchor="middle" fill="#475569" className="pointer-events-none font-bold">
                               {prov.name}
                           </text>
                       )}
                    </g>
                 );
              })}
           </svg>
        </div>
      </div>
    </div>
  );
};

export default ChinaMapGame;