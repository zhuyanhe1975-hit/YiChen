
import React, { useState, useRef } from 'react';
import { SubjectGuidelines, AppState } from '../types';
import { X, Save, RotateCcw, Settings, Download, Upload, AlertTriangle } from 'lucide-react';
import { DEFAULT_SUBJECT_GUIDELINES } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  guidelines: SubjectGuidelines;
  onSave: (newGuidelines: SubjectGuidelines) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  guidelines, 
  onSave,
  onExportData,
  onImportData
}) => {
  const [localGuidelines, setLocalGuidelines] = useState<SubjectGuidelines>(guidelines);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleChange = (subject: string, value: string) => {
    setLocalGuidelines(prev => ({
      ...prev,
      [subject]: value
    }));
  };

  const handleReset = () => {
    if (confirm("确定要恢复默认的学科准则吗？")) {
        setLocalGuidelines(DEFAULT_SUBJECT_GUIDELINES);
    }
  };

  const handleSave = () => {
    onSave(localGuidelines);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (confirm("导入数据将覆盖当前所有记录，确定继续吗？")) {
        onImportData(e.target.files[0]);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border-2 border-orange-200 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-orange-50">
          <div className="flex items-center gap-2 text-orange-600 font-bold text-lg">
            <Settings size={24} />
            <h2>系统配置</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-8">
          
          {/* Section 1: Data Management */}
          <div>
            <h3 className="text-gray-800 font-bold mb-3 flex items-center gap-2">
              <Upload size={18} className="text-blue-500" /> 数据备份与恢复
            </h3>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="text-sm text-gray-500">
                <p>可以将当前的修炼记录（聊天、错题、作业、战斗力）导出保存，或者导入之前的备份。</p>
              </div>
              <div className="flex gap-3">
                 <button 
                   onClick={onExportData}
                   className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-300"
                 >
                   <Download size={16} /> 导出数据
                 </button>
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-200"
                 >
                   <Upload size={16} /> 导入数据
                 </button>
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   accept=".json" 
                   className="hidden" 
                   onChange={handleFileChange} 
                 />
              </div>
            </div>
          </div>

          {/* Section 2: Guidelines */}
          <div>
            <h3 className="text-gray-800 font-bold mb-3 flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-500" /> 学科特定行为准则
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(localGuidelines).map(([subject, rule]) => (
                <div key={subject} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-orange-200 focus-within:border-orange-400 transition-all">
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center justify-between">
                    {subject}
                    <span className="text-xs font-normal text-gray-400">提示词指令</span>
                  </label>
                  <textarea
                    value={rule}
                    onChange={(e) => handleChange(subject, e.target.value)}
                    className="w-full h-32 p-3 text-sm border border-gray-100 rounded-lg bg-gray-50 focus:bg-white focus:outline-none resize-none"
                    placeholder={`输入${subject}学科的特定AI行为准则...`}
                  />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center">
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <RotateCcw size={16} /> 恢复默认准则
          </button>
          
          <div className="flex gap-3">
            <button 
                onClick={onClose}
                className="px-6 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
                取消
            </button>
            <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-lg shadow-orange-200 transition-transform active:scale-95"
            >
                <Save size={16} /> 保存配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
