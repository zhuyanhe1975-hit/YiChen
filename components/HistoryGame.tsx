
import React, { useState, useEffect } from 'react';
import { HISTORY_GAME_LEVELS } from '../constants';
import { HistoryEventItem } from '../types';
import { History, RefreshCw, CheckCircle, ArrowRight, HelpCircle } from 'lucide-react';

const HistoryGame: React.FC = () => {
  const [levelIndex, setLevelIndex] = useState(0);
  const [pool, setPool] = useState<HistoryEventItem[]>([]);
  const [timeline, setTimeline] = useState<HistoryEventItem[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isWrong, setIsWrong] = useState(false);

  useEffect(() => {
    initLevel(0);
  }, []);

  const initLevel = (idx: number) => {
    setLevelIndex(idx);
    const level = HISTORY_GAME_LEVELS[idx];
    // Shuffle events for the pool
    const shuffled = [...level.events].sort(() => Math.random() - 0.5);
    setPool(shuffled);
    setTimeline([]);
    setIsSuccess(false);
    setIsWrong(false);
  };

  const handleAddToTimeline = (item: HistoryEventItem) => {
    if (isSuccess) return;
    setPool(prev => prev.filter(p => p.id !== item.id));
    setTimeline(prev => [...prev, item]);
    setIsWrong(false);
  };

  const handleRemoveFromTimeline = (item: HistoryEventItem) => {
    if (isSuccess) return;
    setTimeline(prev => prev.filter(t => t.id !== item.id));
    setPool(prev => [...prev, item]);
    setIsWrong(false);
  };

  const checkResult = () => {
    if (pool.length > 0) {
      alert("请先将所有事件放入时间轴！");
      return;
    }
    
    // Check order
    let correct = true;
    for (let i = 0; i < timeline.length - 1; i++) {
      if (timeline[i].year > timeline[i+1].year) {
        correct = false;
        break;
      }
    }

    if (correct) {
      setIsSuccess(true);
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-951.mp3'); 
      audio.play().catch(() => {}); // Play sound if permitted
    } else {
      setIsWrong(true);
    }
  };

  const nextLevel = () => {
    const next = (levelIndex + 1) % HISTORY_GAME_LEVELS.length;
    initLevel(next);
  };

  return (
    <div className="h-full flex flex-col bg-amber-50 rounded-xl overflow-hidden border-2 border-amber-200">
      <div className="bg-amber-600 p-4 text-white flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-lg">
          <History />
          <span>历史时空修复 - {HISTORY_GAME_LEVELS[levelIndex].title}</span>
        </div>
        <button onClick={() => initLevel(levelIndex)} className="p-2 hover:bg-amber-700 rounded-full transition-colors">
           <RefreshCw size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col md:flex-row gap-6">
        {/* Source Pool */}
        <div className="w-full md:w-1/3 bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
          <h3 className="text-amber-800 font-bold mb-3 flex items-center gap-2">
             <HelpCircle size={16}/> 混乱事件池
          </h3>
          <div className="flex flex-col gap-2">
             {pool.map(item => (
               <button 
                 key={item.id}
                 onClick={() => handleAddToTimeline(item)}
                 className="p-3 bg-amber-50 text-amber-900 rounded-lg border border-amber-200 hover:bg-amber-100 text-left transition-all hover:translate-x-1"
               >
                 {item.content}
               </button>
             ))}
             {pool.length === 0 && (
               <div className="text-center text-gray-400 py-4 text-sm">事件已全部上架</div>
             )}
          </div>
        </div>

        {/* Timeline Area */}
        <div className="flex-1 bg-white p-6 rounded-xl border border-amber-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-amber-800 font-bold">时间轴 (从早到晚 ⬇️)</h3>
             {timeline.length > 0 && !isSuccess && (
                <button 
                  onClick={checkResult}
                  className="px-4 py-1.5 bg-green-500 text-white rounded-full font-bold text-sm shadow-md hover:bg-green-600 transition-colors"
                >
                  验证顺序
                </button>
             )}
          </div>

          <div className="relative flex-1 space-y-4 pl-4 border-l-4 border-amber-200 min-h-[300px]">
             {timeline.map((item, index) => (
                <div key={item.id} className="relative animate-in slide-in-from-left-4 duration-300">
                   {/* Dot */}
                   <div className={`absolute -left-[25px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-sm ${isSuccess ? 'bg-green-500' : 'bg-amber-400'}`}></div>
                   
                   <div 
                     onClick={() => handleRemoveFromTimeline(item)}
                     className={`p-3 rounded-lg border flex justify-between items-center cursor-pointer hover:shadow-md transition-all ${isWrong ? 'bg-red-50 border-red-200' : isSuccess ? 'bg-green-50 border-green-200' : 'bg-white border-amber-200'}`}
                   >
                     <span className="font-bold">{item.content}</span>
                     {isSuccess && <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">{item.displayDate}</span>}
                   </div>
                   
                   {index < timeline.length - 1 && (
                      <div className="absolute left-1/2 -bottom-4 text-amber-300">
                         ⬇️
                      </div>
                   )}
                </div>
             ))}

             {timeline.length === 0 && (
                <div className="flex h-full items-center justify-center opacity-40 text-amber-800">
                   点击左侧事件添加到此处
                </div>
             )}
          </div>

          {isSuccess && (
             <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-xl flex flex-col items-center animate-bounce">
                <div className="flex items-center gap-2 font-bold text-lg mb-2">
                   <CheckCircle /> 时空修复成功！
                </div>
                <button onClick={nextLevel} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700">
                   下一关 <ArrowRight size={16}/>
                </button>
             </div>
          )}
          
          {isWrong && (
             <div className="mt-4 p-2 bg-red-100 text-red-800 rounded-lg text-center text-sm">
                顺序有误，请重新调整！(点击事件放回左侧)
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryGame;
