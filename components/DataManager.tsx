
import React, { useState, useRef } from 'react';
import { AppState, ImportPreviewStats } from '../types';
import { Download, Upload, Cloud, Link as LinkIcon, ExternalLink, AlertTriangle, FileJson, CheckCircle, RefreshCcw, Save } from 'lucide-react';

interface DataManagerProps {
  currentCloudUrl: string;
  onSaveCloudUrl: (url: string) => void;
  onExportData: () => void;
  onExecuteImport: (data: AppState, strategy: 'merge' | 'overwrite') => void;
}

const DataManager: React.FC<DataManagerProps> = ({ 
  currentCloudUrl, 
  onSaveCloudUrl, 
  onExportData, 
  onExecuteImport 
}) => {
  const [cloudUrl, setCloudUrl] = useState(currentCloudUrl);
  const [previewData, setPreviewData] = useState<AppState | null>(null);
  const [stats, setStats] = useState<ImportPreviewStats | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed: AppState = JSON.parse(text);
        
        // Basic Validation
        if (!Array.isArray(parsed.messages) || !Array.isArray(parsed.wrongQuestions)) {
            throw new Error("Invalid data format: Missing core arrays");
        }

        analyzeData(parsed);
        setPreviewData(parsed);
        setImportError(null);
      } catch (err) {
        setImportError("文件解析失败：格式不正确或已损坏。");
        setPreviewData(null);
        setStats(null);
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const analyzeData = (data: AppState) => {
      const msgs = data.messages || [];
      const questions = data.wrongQuestions || [];
      const tasks = data.homeworkTasks || [];

      let startDate: number | null = null;
      let endDate: number | null = null;

      // Check timestamps in messages
      msgs.forEach(m => {
          if (!startDate || m.timestamp < startDate) startDate = m.timestamp;
          if (!endDate || m.timestamp > endDate) endDate = m.timestamp;
      });

      // Check timestamps in questions (using ID as approx timestamp if needed, but questions have date string)
      // Let's stick to messages for "Days of data" mainly as that's the chat history
      
      let dateRangeStr = "无时间记录";
      let totalDays = 0;

      if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          dateRangeStr = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
          const diffTime = Math.abs(end.getTime() - start.getTime());
          totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; 
      }

      setStats({
          messageCount: msgs.length,
          taskCount: tasks.length,
          questionCount: questions.length,
          startDate: startDate ? new Date(startDate!).toLocaleDateString() : undefined,
          endDate: endDate ? new Date(endDate!).toLocaleDateString() : undefined,
          totalDays
      });
  };

  const handleImportStrategy = (strategy: 'merge' | 'overwrite') => {
      if (previewData) {
          onExecuteImport(previewData, strategy);
          setPreviewData(null);
          setStats(null);
      }
  };

  const handleOpenCloud = () => {
      if (cloudUrl) window.open(cloudUrl, '_blank');
  };

  const handleSaveUrl = () => {
      onSaveCloudUrl(cloudUrl);
      alert("云端链接已保存");
  };

  return (
    <div className="h-full bg-gray-50 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center mb-8">
            <h2 className="text-2xl font-comic text-gray-800 mb-2 flex items-center justify-center gap-2">
                <Cloud className="text-blue-500"/> 数据中心 (Data Center)
            </h2>
            <p className="text-gray-500 text-sm">备份你的修炼记录，确保数据安全！</p>
        </div>

        {/* 1. Cloud Link Config */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <LinkIcon size={20} className="text-indigo-500"/> 
                云端永久存储 (Cloud Storage)
            </h3>
            <div className="flex flex-col md:flex-row gap-3">
                <input 
                    type="text" 
                    value={cloudUrl}
                    onChange={(e) => setCloudUrl(e.target.value)}
                    placeholder="粘贴你的 Google Drive / Dropbox / 坚果云 分享链接..."
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                />
                <button 
                    onClick={handleSaveUrl}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold transition-colors"
                >
                    <Save size={18} />
                </button>
                {cloudUrl && (
                    <button 
                        onClick={handleOpenCloud}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold border border-indigo-200 transition-colors flex items-center gap-2"
                    >
                        <ExternalLink size={18} /> 打开网盘
                    </button>
                )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
                提示：应用数据仅存储在浏览器本地。为了防止丢失，建议定期导出JSON文件并上传到您的个人网盘。
            </p>
        </div>

        {/* 2. Import / Export Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Export */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center hover:border-green-300 transition-colors">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <Download size={32} />
                </div>
                <h3 className="font-bold text-lg text-gray-800 mb-2">导出数据</h3>
                <p className="text-sm text-gray-500 mb-6">生成包含所有对话、错题和设置的 JSON 备份文件。</p>
                <button 
                    onClick={onExportData}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all active:scale-95"
                >
                    立即导出备份
                </button>
            </div>

            {/* Import */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center hover:border-blue-300 transition-colors">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                    <Upload size={32} />
                </div>
                <h3 className="font-bold text-lg text-gray-800 mb-2">导入数据</h3>
                <p className="text-sm text-gray-500 mb-6">从备份文件恢复。支持合并或覆盖现有数据。</p>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    accept=".json"
                    className="hidden"
                    onChange={handleFileSelect}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                    选择备份文件
                </button>
            </div>
        </div>

        {/* 3. Import Preview Dialog */}
        {previewData && stats && (
            <div className="bg-white p-6 rounded-xl border-2 border-orange-200 shadow-xl animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 mb-4 text-orange-600 border-b border-orange-100 pb-3">
                    <FileJson size={24} />
                    <h3 className="font-bold text-lg">备份文件解析成功</h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatItem label="对话记录" value={`${stats.messageCount} 条`} />
                    <StatItem label="错题本" value={`${stats.questionCount} 题`} />
                    <StatItem label="作业任务" value={`${stats.taskCount} 项`} />
                    <StatItem label="时间跨度" value={stats.totalDays ? `约 ${stats.totalDays} 天` : '未知'} />
                </div>
                
                {stats.startDate && (
                     <p className="text-xs text-gray-500 mb-6 text-center">
                        数据记录范围：{stats.startDate} 至 {stats.endDate}
                     </p>
                )}

                <div className="bg-orange-50 p-4 rounded-lg mb-6 flex items-start gap-3">
                    <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={18} />
                    <div className="text-sm text-orange-800">
                        <strong>请选择导入策略：</strong>
                        <ul className="list-disc list-inside mt-1 opacity-90 space-y-1">
                            <li><strong>合并 (Merge)</strong>: 保留现有数据，将新数据添加进来（自动去重）。适合合并不同设备的记录。</li>
                            <li><strong>覆盖 (Overwrite)</strong>: 清空当前所有数据，完全替换为备份文件内容。适合数据恢复。</li>
                        </ul>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={() => handleImportStrategy('merge')}
                        className="flex-1 py-3 bg-white border-2 border-green-500 text-green-700 rounded-xl font-bold hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCcw size={18} /> 合并数据
                    </button>
                    <button 
                        onClick={() => handleImportStrategy('overwrite')}
                        className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                        <AlertTriangle size={18} /> 覆盖重置
                    </button>
                    <button 
                        onClick={() => { setPreviewData(null); setStats(null); }}
                        className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        取消
                    </button>
                </div>
            </div>
        )}

        {importError && (
            <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-red-700 flex items-center gap-3 animate-pulse">
                <AlertTriangle size={20} />
                <span>{importError}</span>
            </div>
        )}

      </div>
    </div>
  );
};

const StatItem = ({ label, value }: { label: string, value: string }) => (
    <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-200">
        <div className="text-xs text-gray-500 mb-1">{label}</div>
        <div className="font-bold text-gray-800 text-lg">{value}</div>
    </div>
);

export default DataManager;
