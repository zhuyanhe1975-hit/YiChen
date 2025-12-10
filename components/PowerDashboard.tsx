import React, { useMemo } from 'react';
import { Subject, UserStats, TrainingRecommendation } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Zap, TrendingUp, Award } from 'lucide-react';

interface PowerDashboardProps {
  stats: UserStats;
  recommendations: TrainingRecommendation[];
  onGeneratePlan: () => void;
}

const PowerDashboard: React.FC<PowerDashboardProps> = ({ stats, recommendations, onGeneratePlan }) => {
  
  const chartData = useMemo(() => {
    return Object.keys(stats.subjects).map(key => ({
      subject: key,
      A: stats.subjects[key as Subject],
      fullMark: 100,
    }));
  }, [stats]);

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-4 space-y-4">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Radar Chart */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 h-80 flex flex-col">
          <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
            <Zap className="text-yellow-500" /> 战斗力数值 (Combat Power)
          </h3>
          <div className="flex-1 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="战斗力"
                  dataKey="A"
                  stroke="#f97316"
                  strokeWidth={3}
                  fill="#f97316"
                  fillOpacity={0.4}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-xl shadow-lg p-6 text-white flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
           <div>
               <h3 className="text-lg font-bold opacity-90">总战斗力</h3>
               <div className="text-5xl font-comic font-bold mt-2">{stats.powerLevel.toLocaleString()}</div>
               <p className="mt-2 opacity-80 text-sm">超级赛亚人模式：未觉醒</p>
           </div>
           <div className="flex items-center gap-2 mt-4 bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                <Award size={20} className="text-yellow-300" />
                <span className="text-sm font-medium">击败了 85% 的地球战士</span>
           </div>
        </div>
      </div>

      {/* Training Plan */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
         <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <TrendingUp className="text-blue-500" /> 修炼建议 (Super Saiyan Training)
            </h3>
            <button 
                onClick={onGeneratePlan}
                className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full hover:bg-orange-200 transition-colors"
            >
                刷新计划
            </button>
         </div>

         {recommendations.length === 0 ? (
             <div className="text-center py-8 text-gray-400">
                 暂无计划，请先在错题本中录入一些题目！
             </div>
         ) : (
             <div className="space-y-3">
                 {recommendations.map((rec, idx) => (
                     <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-100 hover:border-blue-200 transition-colors">
                         <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                             rec.difficulty === 'Super Saiyan God' ? 'bg-red-500' : 
                             rec.difficulty === 'Super Saiyan' ? 'bg-yellow-400' : 'bg-green-500'
                         }`}></div>
                         <div>
                             <div className="flex items-center gap-2 mb-1">
                                 <span className="font-bold text-gray-800">{rec.focusArea}</span>
                                 <span className="text-[10px] uppercase px-1.5 py-0.5 rounded border border-gray-200 text-gray-500">
                                     {rec.difficulty}
                                 </span>
                             </div>
                             <p className="text-sm text-gray-600 leading-relaxed">{rec.suggestion}</p>
                         </div>
                     </div>
                 ))}
             </div>
         )}
      </div>
    </div>
  );
};

export default PowerDashboard;
