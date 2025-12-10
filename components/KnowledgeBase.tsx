

import React, { useState } from 'react';
import { VertexAIConfig, TencentConfig, AlibabaRAGConfig, RAGProvider, SubjectGuidelines, AIConfig } from '../types';
import { generateResponse } from '../services/geminiService';
import { Database, Search, UploadCloud, AlertCircle, FileText, ExternalLink, Cloud, Layers } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface KnowledgeBaseProps {
  vertexConfig?: VertexAIConfig;
  tencentConfig?: TencentConfig;
  alibabaConfig?: AlibabaRAGConfig;
  ragProvider?: RAGProvider;
  guidelines: SubjectGuidelines;
  aiConfig: AIConfig;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ vertexConfig, tencentConfig, alibabaConfig, ragProvider = 'google', guidelines, aiConfig }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ text: string, sources?: any[] } | null>(null);

  const handleSearch = async () => {
    // Basic validation based on provider
    if (!query.trim()) return;
    if (ragProvider === 'google' && !vertexConfig?.dataStoreId) return;
    if (ragProvider === 'tencent' && !tencentConfig?.knowledgeBaseId) return;
    if (ragProvider === 'alibaba' && !alibabaConfig?.appId) return;

    setIsLoading(true);
    setResult(null);

    const ragPrompt = `请基于知识库中的文档回答以下问题：${query}。如果知识库中没有相关信息，请明确说明。`;
    
    const response = await generateResponse(
      ragPrompt, 
      undefined, 
      guidelines, 
      vertexConfig, 
      tencentConfig, 
      alibabaConfig,
      ragProvider as RAGProvider,
      aiConfig
    );
    setResult(response);
    setIsLoading(false);
  };

  const isConfigured = () => {
      if (ragProvider === 'google') return !!(vertexConfig?.projectId && vertexConfig?.dataStoreId);
      if (ragProvider === 'tencent') return !!(tencentConfig?.secretId && tencentConfig?.knowledgeBaseId);
      if (ragProvider === 'alibaba') return !!(alibabaConfig?.appId && alibabaConfig?.apiKey);
      return false;
  };

  if (!isConfigured()) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50">
        <Database size={64} className="text-gray-300 mb-6" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">知识库未连接 ({ragProvider === 'google' ? 'Google' : ragProvider === 'alibaba' ? 'Alibaba' : 'Tencent'})</h2>
        <p className="text-gray-500 max-w-md mb-6">
          要启用“超级赛亚人”RAG 知识库检索功能，请先在设置中配置 {ragProvider === 'google' ? 'Vertex AI Search' : ragProvider === 'alibaba' ? '阿里云百炼应用' : '腾讯云知识库'} 的信息。
        </p>
        <div className="bg-blue-50 p-4 rounded-xl text-left text-sm text-blue-800 border border-blue-100 max-w-lg">
           <h4 className="font-bold mb-2 flex items-center gap-2"><AlertCircle size={16}/> 配置指南</h4>
           {ragProvider === 'google' && (
               <ol className="list-decimal list-inside space-y-1">
                 <li>在 Google Cloud Console 创建 Project。</li>
                 <li>启用 Vertex AI Search and Conversation API。</li>
                 <li>创建一个 Data Store 并填入 Project ID 和 Data Store ID。</li>
               </ol>
           )}
           {ragProvider === 'tencent' && (
               <ol className="list-decimal list-inside space-y-1">
                 <li>在腾讯云控制台开通向量知识库服务。</li>
                 <li>获取 SecretId, SecretKey。</li>
                 <li>创建知识库并获取 ID 填入配置。</li>
               </ol>
           )}
           {ragProvider === 'alibaba' && (
               <ol className="list-decimal list-inside space-y-1">
                 <li>登录阿里云百炼 (Model Studio) 控制台。</li>
                 <li>创建并发布一个“知识检索增强”应用。</li>
                 <li>获取 App ID 和 API Key 填入配置。</li>
               </ol>
           )}
        </div>
      </div>
    );
  }

  const getProviderTheme = () => {
      switch(ragProvider) {
          case 'alibaba': return 'bg-orange-600';
          case 'tencent': return 'bg-blue-600';
          default: return 'bg-indigo-600';
      }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className={`p-6 text-white text-center ${getProviderTheme()}`}>
        <h2 className="text-2xl font-comic mb-2 flex items-center justify-center gap-2">
            {ragProvider === 'tencent' ? <Cloud /> : ragProvider === 'alibaba' ? <Layers /> : <Database />} 全能知识库 (RAG)
        </h2>
        <p className="opacity-80 text-sm">
            当前服务: {ragProvider === 'tencent' ? '腾讯云知识库' : ragProvider === 'alibaba' ? '阿里云百炼 (Aliyun)' : 'Google Vertex AI'}
        </p>
      </div>

      {/* Search Area */}
      <div className="p-6 border-b border-gray-100 bg-gray-50">
         <div className="flex gap-2 max-w-3xl mx-auto">
            <div className="flex-1 relative">
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="在知识库中搜索（例如：查找关于二战的历史资料...）"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none shadow-sm text-gray-800 bg-white"
                />
                <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
            </div>
            <button 
                onClick={handleSearch}
                disabled={isLoading || !query.trim()}
                className={`text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 transition-colors shadow-md ${ragProvider === 'tencent' ? 'bg-blue-600 hover:bg-blue-700' : ragProvider === 'alibaba' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
                {isLoading ? '检索中...' : '搜索'}
            </button>
         </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto p-6">
         <div className="max-w-4xl mx-auto">
            {!result && !isLoading && (
                <div className="text-center text-gray-400 py-12">
                    <UploadCloud size={48} className="mx-auto mb-4 opacity-50" />
                    <p>您的个人资料库已就绪。</p>
                    <p className="text-sm">支持检索已上传的 PDF, Word, 或网页内容。</p>
                </div>
            )}

            {result && (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Answer */}
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className={`w-2 h-6 rounded-full ${ragProvider === 'tencent' ? 'bg-blue-500' : ragProvider === 'alibaba' ? 'bg-orange-500' : 'bg-indigo-500'}`}></span>
                            AI 回答
                        </h3>
                        <div className="prose max-w-none bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-gray-800">
                            <ReactMarkdown>{result.text}</ReactMarkdown>
                        </div>
                    </div>

                    {/* Sources */}
                    {result.sources && result.sources.length > 0 && (
                        <div className="w-full lg:w-80 flex-shrink-0">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FileText size={20} className="text-gray-500"/>
                                参考资料 ({result.sources.length})
                            </h3>
                            <div className="space-y-3">
                                {result.sources.map((source, idx) => (
                                    <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <span className="font-bold text-sm text-gray-700 line-clamp-1" title={source.title}>{source.title || "未命名文档"}</span>
                                            {source.uri && (
                                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-700">
                                                    <ExternalLink size={14} />
                                                </a>
                                            )}
                                        </div>
                                        {source.snippet && (
                                            <p className="text-xs text-gray-500 line-clamp-3 bg-white p-2 rounded border border-gray-100">
                                                ...{source.snippet}...
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
