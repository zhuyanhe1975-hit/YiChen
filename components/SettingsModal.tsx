
import React, { useState } from 'react';
import { SubjectGuidelines, VertexAIConfig, TencentConfig, AlibabaRAGConfig, RAGProvider, AIConfig, ModelProvider } from '../types';
import { X, Save, RotateCcw, Settings, AlertTriangle, Database, Cloud, Cpu, Layers } from 'lucide-react';
import { DEFAULT_SUBJECT_GUIDELINES, AI_PROVIDER_PRESETS } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  guidelines: SubjectGuidelines;
  onSave: (newGuidelines: SubjectGuidelines, vertexConfig?: VertexAIConfig, tencentConfig?: TencentConfig, alibabaConfig?: AlibabaRAGConfig, ragProvider?: RAGProvider, aiConfig?: AIConfig) => void;
  initialVertexConfig?: VertexAIConfig;
  initialTencentConfig?: TencentConfig;
  initialAlibabaConfig?: AlibabaRAGConfig;
  initialRagProvider?: RAGProvider;
  initialAIConfig?: AIConfig;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  guidelines, 
  onSave,
  initialVertexConfig,
  initialTencentConfig,
  initialAlibabaConfig,
  initialRagProvider,
  initialAIConfig,
}) => {
  const [localGuidelines, setLocalGuidelines] = useState<SubjectGuidelines>(guidelines);
  const [ragProvider, setRagProvider] = useState<RAGProvider>(initialRagProvider || 'google');
  
  // AI Model Config
  const [aiConfig, setAIConfig] = useState<AIConfig>(initialAIConfig || { provider: 'gemini', apiKey: '', modelName: 'gemini-2.5-flash' });

  const [vertexConfig, setVertexConfig] = useState<VertexAIConfig>(initialVertexConfig || { projectId: '', location: 'global', dataStoreId: '' });
  const [tencentConfig, setTencentConfig] = useState<TencentConfig>(initialTencentConfig || { secretId: '', secretKey: '', knowledgeBaseId: '', region: 'ap-guangzhou' });
  const [alibabaConfig, setAlibabaConfig] = useState<AlibabaRAGConfig>(initialAlibabaConfig || { appId: '', apiKey: '' });

  // Update presets when provider changes
  const handleProviderChange = (provider: ModelProvider) => {
    const preset = AI_PROVIDER_PRESETS[provider];
    setAIConfig(prev => ({
        ...prev,
        provider,
        baseUrl: preset.baseUrl || '',
        modelName: preset.modelName || ''
    }));
  };

  if (!isOpen) return null;

  const handleChange = (subject: string, value: string) => {
    setLocalGuidelines(prev => ({
      ...prev,
      [subject]: value
    }));
  };
  
  const handleVertexChange = (key: keyof VertexAIConfig, value: string) => {
    setVertexConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleTencentChange = (key: keyof TencentConfig, value: string) => {
    setTencentConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleAlibabaChange = (key: keyof AlibabaRAGConfig, value: string) => {
    setAlibabaConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    if (confirm("确定要恢复默认的学科准则吗？")) {
        setLocalGuidelines(DEFAULT_SUBJECT_GUIDELINES);
    }
  };

  const handleSave = () => {
    onSave(localGuidelines, vertexConfig, tencentConfig, alibabaConfig, ragProvider, aiConfig);
    onClose();
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
          
          {/* Section 0: AI Brain Configuration */}
          <div>
            <h3 className="text-gray-800 font-bold mb-3 flex items-center gap-2">
               <Cpu size={18} className="text-purple-500" /> 大模型接入 (AI Model Provider)
            </h3>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                    {[
                        { id: 'gemini', label: 'Gemini' },
                        { id: 'chatgpt', label: 'ChatGPT' },
                        { id: 'deepseek', label: 'DeepSeek' },
                        { id: 'tencent', label: '腾讯混元' },
                        { id: 'alibaba', label: '阿里通义' },
                        { id: 'baidu', label: '百度文心' }
                    ].map(p => (
                        <button
                            key={p.id}
                            onClick={() => handleProviderChange(p.id as ModelProvider)}
                            className={`p-2 rounded-lg text-xs font-bold transition-all ${aiConfig.provider === p.id ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">API Key {aiConfig.provider === 'baidu' ? '(Access Token)' : ''}</label>
                        <input 
                            type="password"
                            value={aiConfig.apiKey}
                            onChange={(e) => setAIConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                            placeholder={aiConfig.provider === 'baidu' ? "输入 Access Token" : "sk-..."}
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:border-purple-500 outline-none font-mono"
                        />
                         <p className="text-[10px] text-gray-400 mt-1">
                            {aiConfig.provider === 'gemini' && 'Google AI Studio Key'}
                            {aiConfig.provider === 'deepseek' && 'DeepSeek API Key'}
                            {aiConfig.provider === 'tencent' && 'Hunyuan API Key (API v3)'}
                            {aiConfig.provider === 'alibaba' && 'DashScope API Key'}
                         </p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Model Name</label>
                        <input 
                            type="text"
                            value={aiConfig.modelName}
                            onChange={(e) => setAIConfig(prev => ({ ...prev, modelName: e.target.value }))}
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:border-purple-500 outline-none font-mono"
                        />
                    </div>
                </div>
                
                {aiConfig.provider !== 'gemini' && (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">API Base URL (Optional)</label>
                        <input 
                            type="text"
                            value={aiConfig.baseUrl || ''}
                            onChange={(e) => setAIConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                            placeholder="https://api.openai.com/v1"
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:border-purple-500 outline-none font-mono text-gray-600"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">
                           用于接入中转/代理地址。如果使用官方API，通常无需修改（预设值已自动填入）。
                        </p>
                    </div>
                )}
            </div>
          </div>
          
          {/* Section 2: Knowledge Base Config */}
          <div>
            <h3 className="text-gray-800 font-bold mb-3 flex items-center gap-2">
              <Database size={18} className="text-indigo-500" /> 知识库服务配置 (RAG)
            </h3>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                
                {/* Provider Selector */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 border-b border-gray-100 pb-4">
                    <span className="text-sm font-bold text-gray-600 whitespace-nowrap">服务提供商:</span>
                    <div className="flex flex-wrap gap-2">
                        <button 
                            onClick={() => setRagProvider('google')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${ragProvider === 'google' ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                            <Cloud size={14} /> Google Vertex
                        </button>
                        <button 
                            onClick={() => setRagProvider('tencent')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${ragProvider === 'tencent' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                            <Database size={14} /> 腾讯云
                        </button>
                        <button 
                            onClick={() => setRagProvider('alibaba')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${ragProvider === 'alibaba' ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                            <Layers size={14} /> 阿里云 (百炼)
                        </button>
                    </div>
                </div>

                {/* Google Config */}
                {ragProvider === 'google' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">GCP Project ID</label>
                            <input 
                                type="text" 
                                value={vertexConfig.projectId}
                                onChange={(e) => handleVertexChange('projectId', e.target.value)}
                                placeholder="my-gcp-project"
                                className="w-full p-2 text-sm border border-gray-300 rounded focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Location (e.g. global)</label>
                            <input 
                                type="text" 
                                value={vertexConfig.location}
                                onChange={(e) => handleVertexChange('location', e.target.value)}
                                placeholder="global"
                                className="w-full p-2 text-sm border border-gray-300 rounded focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Data Store ID</label>
                            <input 
                                type="text" 
                                value={vertexConfig.dataStoreId}
                                onChange={(e) => handleVertexChange('dataStoreId', e.target.value)}
                                placeholder="my-datastore-id"
                                className="w-full p-2 text-sm border border-gray-300 rounded focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                )}

                {/* Tencent Config */}
                {ragProvider === 'tencent' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">SecretId</label>
                            <input 
                                type="text" 
                                value={tencentConfig.secretId}
                                onChange={(e) => handleTencentChange('secretId', e.target.value)}
                                placeholder="AKID..."
                                className="w-full p-2 text-sm border border-gray-300 rounded focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">SecretKey</label>
                            <input 
                                type="password" 
                                value={tencentConfig.secretKey}
                                onChange={(e) => handleTencentChange('secretKey', e.target.value)}
                                placeholder="Your Secret Key"
                                className="w-full p-2 text-sm border border-gray-300 rounded focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Knowledge Base ID</label>
                            <input 
                                type="text" 
                                value={tencentConfig.knowledgeBaseId}
                                onChange={(e) => handleTencentChange('knowledgeBaseId', e.target.value)}
                                placeholder="Knowledge Base ID"
                                className="w-full p-2 text-sm border border-gray-300 rounded focus:border-blue-500 outline-none"
                            />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Region</label>
                            <input 
                                type="text" 
                                value={tencentConfig.region}
                                onChange={(e) => handleTencentChange('region', e.target.value)}
                                placeholder="ap-guangzhou"
                                className="w-full p-2 text-sm border border-gray-300 rounded focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>
                )}

                 {/* Alibaba Config */}
                 {ragProvider === 'alibaba' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">App ID (应用ID)</label>
                            <input 
                                type="text" 
                                value={alibabaConfig.appId}
                                onChange={(e) => handleAlibabaChange('appId', e.target.value)}
                                placeholder="app-..."
                                className="w-full p-2 text-sm border border-gray-300 rounded focus:border-orange-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">API Key (DashScope)</label>
                            <input 
                                type="password" 
                                value={alibabaConfig.apiKey}
                                onChange={(e) => handleAlibabaChange('apiKey', e.target.value)}
                                placeholder="sk-..."
                                className="w-full p-2 text-sm border border-gray-300 rounded focus:border-orange-500 outline-none"
                            />
                        </div>
                        <div className="col-span-full">
                           <p className="text-xs text-gray-400">
                             请前往阿里云百炼 (Model Studio) 控制台创建一个应用并发布，获取 App ID 和 API Key。
                           </p>
                        </div>
                    </div>
                )}
            </div>
          </div>

          {/* Section 3: Guidelines */}
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
