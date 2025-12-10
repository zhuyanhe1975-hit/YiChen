
import React from 'react';
import { TimelineData } from '../types';
import { Clock, History } from 'lucide-react';

interface TimelineRendererProps {
  data: TimelineData;
}

const TimelineRenderer: React.FC<TimelineRendererProps> = ({ data }) => {
  return (
    <div className="w-full mt-4 bg-orange-50/50 rounded-xl border-2 border-orange-200 overflow-hidden shadow-sm">
      <div className="p-3 bg-orange-100 border-b border-orange-200 flex items-center gap-2">
        <History className="text-orange-600" size={18} />
        <span className="font-bold text-orange-800 text-sm">{data.title} - 时空穿线</span>
      </div>
      
      <div className="overflow-x-auto p-6 scrollbar-thin">
        <div className="min-w-[max-content] flex flex-col relative py-8">
          
          {/* Main Axis Line */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-orange-300 via-red-400 to-orange-300 rounded-full z-0"></div>

          <div className="flex gap-4 z-10 px-4">
            {data.events.map((event, index) => {
              const isEven = index % 2 === 0;
              return (
                <div key={index} className="flex flex-col items-center w-48 relative group">
                  
                  {/* Top Card (for Even items) */}
                  <div className={`mb-4 transition-all duration-300 ${isEven ? 'opacity-100 translate-y-0' : 'opacity-0 h-0 overflow-hidden'}`}>
                    <div className="bg-white p-3 rounded-lg border border-orange-200 shadow-md hover:shadow-lg hover:border-orange-400 transition-all text-center">
                      <div className="text-orange-600 font-bold text-lg font-comic">{event.date}</div>
                      <div className="text-gray-800 font-bold text-sm mb-1">{event.title}</div>
                      <p className="text-xs text-gray-500 leading-tight">{event.description}</p>
                    </div>
                    {/* Connector Line */}
                    <div className="w-0.5 h-4 bg-orange-300 mx-auto mt-1"></div>
                  </div>

                  {/* Node on Axis */}
                  <div className="w-4 h-4 rounded-full bg-white border-4 border-orange-500 shadow-sm relative z-20 group-hover:scale-125 transition-transform">
                     {/* Pulse effect */}
                     <div className="absolute top-0 left-0 w-full h-full rounded-full bg-orange-400 animate-ping opacity-20"></div>
                  </div>

                  {/* Bottom Card (for Odd items) */}
                  <div className={`mt-4 transition-all duration-300 ${!isEven ? 'opacity-100 translate-y-0' : 'opacity-0 h-0 overflow-hidden'}`}>
                    {/* Connector Line */}
                    <div className="w-0.5 h-4 bg-orange-300 mx-auto mb-1"></div>
                    <div className="bg-white p-3 rounded-lg border border-orange-200 shadow-md hover:shadow-lg hover:border-orange-400 transition-all text-center">
                      <div className="text-orange-600 font-bold text-lg font-comic">{event.date}</div>
                      <div className="text-gray-800 font-bold text-sm mb-1">{event.title}</div>
                      <p className="text-xs text-gray-500 leading-tight">{event.description}</p>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineRenderer;
