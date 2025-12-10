import React, { useState } from 'react';
import { KnowledgeMapData, KnowledgeNodeItem } from '../types';
import { Share2, ExternalLink } from 'lucide-react';

interface KnowledgeNetworkProps {
  data: KnowledgeMapData | null;
}

const KnowledgeNetwork: React.FC<KnowledgeNetworkProps> = ({ data }) => {
  // State for hover tooltip
  const [hoveredNode, setHoveredNode] = useState<{ x: number, y: number, item: KnowledgeNodeItem } | null>(null);

  if (!data) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-white rounded-lg shadow-md border-2 border-dashed border-gray-200">
        <Share2 size={48} className="mb-4 text-gray-300" />
        <p className="text-lg font-medium">知识雷达未激活</p>
        <p className="text-sm">在对话中询问一个知识点（如“光合作用”）， YiChen 将为你构建元气弹知识网络！</p>
      </div>
    );
  }

  // Safe data access helpers (Backward compatibility for old string-only data)
  const getLabel = (item: any): string => (typeof item === 'string' ? item : item.label);
  const getDesc = (item: any): string => (typeof item === 'string' ? '点击查看该词条的搜索结果' : item.description);

  const handleNodeClick = (item: any) => {
    const label = getLabel(item);
    window.open(`https://www.baidu.com/s?wd=${encodeURIComponent(label)}`, '_blank');
  };

  const handleMouseEnter = (e: React.MouseEvent, item: any) => {
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const parentRect = target.offsetParent?.getBoundingClientRect() || { left: 0, top: 0 };
      
      setHoveredNode({
          x: rect.left - parentRect.left + rect.width / 2,
          y: rect.top - parentRect.top, // Above the node
          item: typeof item === 'string' ? { label: item, description: '点击搜索' } : item
      });
  };

  const handleMouseLeave = () => {
      setHoveredNode(null);
  };

  const renderNode = (item: any, colorClass: string, icon: string) => (
    <div 
        className={`px-4 py-2 rounded-lg border text-sm shadow-lg backdrop-blur-sm cursor-pointer hover:scale-105 transition-all flex items-center gap-2 group ${colorClass}`}
        onClick={() => handleNodeClick(item)}
        onMouseEnter={(e) => handleMouseEnter(e, item)}
        onMouseLeave={handleMouseLeave}
    >
        <span>{icon} {getLabel(item)}</span>
        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );

  return (
    <div className="h-full bg-gradient-to-br from-indigo-900 to-purple-900 rounded-lg shadow-xl p-6 text-white overflow-hidden relative border-2 border-indigo-500">
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <h3 className="text-xl font-comic text-yellow-400 mb-6 flex items-center gap-2 relative z-10">
        <Share2 className="animate-pulse"/> 元气弹知识网络
      </h3>
      
      <div className="flex flex-col items-center justify-center h-[80%] relative z-10 space-y-8">
        {/* Parents */}
        <div className="flex gap-4">
          {data.parents.map((p, i) => (
             <React.Fragment key={i}>
                 {renderNode(p, "bg-blue-600/80 border-blue-400 text-white", "⬆️")}
             </React.Fragment>
          ))}
        </div>

        {/* Center */}
        <div className="relative group cursor-pointer" 
             onClick={() => handleNodeClick(data.center)}
             onMouseEnter={(e) => handleMouseEnter(e, data.center)}
             onMouseLeave={handleMouseLeave}
        >
             <div className="absolute -inset-4 bg-yellow-500 rounded-full opacity-30 blur-xl animate-pulse"></div>
            <div className="bg-gradient-to-r from-orange-500 to-red-600 w-40 h-40 rounded-full flex items-center justify-center text-center p-4 border-4 border-yellow-400 shadow-2xl relative z-10 font-bold text-lg transform group-hover:scale-110 transition-transform duration-300">
                <div>
                    <div>{getLabel(data.center)}</div>
                    <div className="text-[10px] font-normal opacity-80 mt-1 flex items-center justify-center gap-1">
                        点击探索 <ExternalLink size={10} />
                    </div>
                </div>
            </div>
        </div>

        {/* Children & Related */}
        <div className="flex flex-wrap justify-center gap-8 w-full">
            <div className="flex flex-col items-center gap-2">
                 <span className="text-xs text-green-300 font-bold tracking-widest uppercase">延伸 (Downstream)</span>
                 <div className="flex gap-3 flex-wrap justify-center">
                    {data.children.map((c, i) => (
                        <React.Fragment key={i}>
                             {renderNode(c, "bg-green-600/80 border-green-400 text-white", "⬇️")}
                        </React.Fragment>
                    ))}
                 </div>
            </div>
            
            {data.related.length > 0 && (
                <div className="flex flex-col items-center gap-2 border-l border-white/20 pl-8">
                    <span className="text-xs text-purple-300 font-bold tracking-widest uppercase">关联 (Related)</span>
                    <div className="flex gap-3 flex-wrap justify-center">
                        {data.related.map((r, i) => (
                            <React.Fragment key={i}>
                                {renderNode(r, "bg-purple-600/80 border-purple-400 text-white", "🔗")}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Interactive Tooltip */}
      {hoveredNode && (
          <div 
             className="absolute z-50 bg-gray-900/95 text-white p-3 rounded-lg shadow-2xl border border-gray-600 max-w-xs pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 animate-in fade-in zoom-in duration-200"
             style={{ left: hoveredNode.x, top: hoveredNode.y }}
          >
             <div className="font-bold text-yellow-400 mb-1 border-b border-gray-700 pb-1 flex justify-between">
                 {hoveredNode.item.label}
             </div>
             <div className="text-xs text-gray-300 leading-relaxed">
                 {hoveredNode.item.description}
             </div>
             <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 border-r border-b border-gray-600 transform rotate-45"></div>
          </div>
      )}

    </div>
  );
};

export default KnowledgeNetwork;