
import React, { useState } from 'react';
import ChinaMapGame from './ChinaMapGame';
import HistoryGame from './HistoryGame';
import MathGame from './MathGame';
import { Map, History, Brain, ArrowLeft } from 'lucide-react';

const TrainingGround: React.FC = () => {
  const [activeModule, setActiveModule] = useState<'hub' | 'map' | 'history' | 'math'>('hub');

  const modules = [
    { id: 'map', title: '神州大地', desc: '地理行政区划训练', icon: Map, color: 'bg-sky-500' },
    { id: 'history', title: '时空修复', desc: '历史事件时间轴排序', icon: History, color: 'bg-amber-500' },
    { id: 'math', title: '几何巧思', desc: '数学图形规律挑战', icon: Brain, color: 'bg-indigo-500' },
  ];

  if (activeModule === 'map') return <Wrapper onBack={() => setActiveModule('hub')}><ChinaMapGame /></Wrapper>;
  if (activeModule === 'history') return <Wrapper onBack={() => setActiveModule('hub')}><HistoryGame /></Wrapper>;
  if (activeModule === 'math') return <Wrapper onBack={() => setActiveModule('hub')}><MathGame /></Wrapper>;

  return (
    <div className="h-full bg-gray-50 p-6 overflow-y-auto">
       <div className="text-center mb-8">
          <h2 className="text-2xl font-comic text-orange-600 mb-2">精神时光屋 - 专项训练场</h2>
          <p className="text-gray-500 text-sm">选择一个领域进行强化修炼，快速提升战斗力！</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {modules.map((m) => (
             <button 
               key={m.id}
               onClick={() => setActiveModule(m.id as any)}
               className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-orange-300 hover:-translate-y-1 transition-all group flex flex-col items-center text-center"
             >
                <div className={`${m.color} text-white p-4 rounded-full mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                   <m.icon size={32} />
                </div>
                <h3 className="font-bold text-lg text-gray-800 mb-1">{m.title}</h3>
                <p className="text-xs text-gray-500">{m.desc}</p>
             </button>
          ))}
       </div>
    </div>
  );
};

const Wrapper: React.FC<{ children: React.ReactNode, onBack: () => void }> = ({ children, onBack }) => (
  <div className="h-full flex flex-col relative">
     <button 
       onClick={onBack}
       className="absolute top-2 left-2 z-10 bg-white/90 p-2 rounded-full shadow border border-gray-200 text-gray-600 hover:text-orange-500 hover:bg-orange-50"
       title="返回大厅"
     >
        <ArrowLeft size={20} />
     </button>
     {children}
  </div>
);

export default TrainingGround;
