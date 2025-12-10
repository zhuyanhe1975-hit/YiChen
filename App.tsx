

import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import KnowledgeNetwork from './components/KnowledgeNetwork';
import WrongQuestionBook from './components/WrongQuestionBook';
import PowerDashboard from './components/PowerDashboard';
import SettingsModal from './components/SettingsModal';
import TrainingGround from './components/TrainingGround';
import HomeworkHelper from './components/HomeworkHelper';
import KnowledgeBase from './components/KnowledgeBase';
import DataManager from './components/DataManager';
import { Message, MessageRole, KnowledgeMapData, WrongQuestion, Subject, UserStats, TrainingRecommendation, SubjectGuidelines, HomeworkTask, Tab, AppState, VertexAIConfig, TencentConfig, AlibabaRAGConfig, RAGProvider, AIConfig } from './types';
import { MessageCircle, Share2, BookOpen, Zap, Settings, Map, ClipboardList, Database, HardDrive } from 'lucide-react';
import { INITIAL_GREETING, APP_NAME, DEFAULT_SUBJECT_GUIDELINES, DEFAULT_AI_CONFIG } from './constants';
import { analyzeWeakness } from './services/geminiService';

const STORAGE_KEY = 'dragon_ball_ai_assistant_data';

const App: React.FC = () => {
  // Helper to load state synchronously
  const loadInitialState = (): AppState | null => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (e) {
      console.error("Failed to load saved data", e);
    }
    return null;
  };

  const initialState = loadInitialState();

  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHAT);
  
  const [messages, setMessages] = useState<Message[]>(initialState?.messages || [
    {
      id: 'init',
      role: MessageRole.MODEL,
      content: INITIAL_GREETING,
      timestamp: Date.now()
    }
  ]);
  
  const [knowledgeData, setKnowledgeData] = useState<KnowledgeMapData | null>(initialState?.knowledgeData || null);
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>(initialState?.wrongQuestions || []);
  const [recommendations, setRecommendations] = useState<TrainingRecommendation[]>(initialState?.recommendations || []);
  const [homeworkTasks, setHomeworkTasks] = useState<HomeworkTask[]>(initialState?.homeworkTasks || []);
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [guidelines, setGuidelines] = useState<SubjectGuidelines>(initialState?.guidelines || DEFAULT_SUBJECT_GUIDELINES);
  const [vertexConfig, setVertexConfig] = useState<VertexAIConfig>(initialState?.vertexAIConfig || { projectId: '', location: 'global', dataStoreId: '' });
  const [tencentConfig, setTencentConfig] = useState<TencentConfig>(initialState?.tencentConfig || { secretId: '', secretKey: '', knowledgeBaseId: '', region: 'ap-guangzhou' });
  const [alibabaConfig, setAlibabaConfig] = useState<AlibabaRAGConfig>(initialState?.alibabaRAGConfig || { appId: '', apiKey: '' });
  const [ragProvider, setRagProvider] = useState<RAGProvider>(initialState?.ragProvider || 'google');
  const [cloudStorageUrl, setCloudStorageUrl] = useState<string>(initialState?.cloudStorageUrl || '');
  
  // Initialize AI Config
  const [aiConfig, setAIConfig] = useState<AIConfig>(() => {
    const saved = initialState?.aiConfig;
    const defaultConfig = { ...DEFAULT_AI_CONFIG, apiKey: process.env.API_KEY || '' };
    
    if (saved) {
       // Restore saved config, but ensure we don't overwrite a valid env key with an empty string if using gemini default
       if ((!saved.apiKey || saved.apiKey === '') && saved.provider === 'gemini' && process.env.API_KEY) {
           saved.apiKey = process.env.API_KEY;
       }
       return saved;
    }
    return defaultConfig;
  });

  // Stats
  const [stats, setStats] = useState<UserStats>(initialState?.stats || {
    powerLevel: 5000,
    subjects: {
      [Subject.CHINESE]: 75,
      [Subject.MATH]: 60,
      [Subject.ENGLISH]: 80,
      [Subject.PHYSICS]: 55,
      [Subject.CHEMISTRY]: 65,
      [Subject.HISTORY]: 85,
      [Subject.GEOGRAPHY]: 70,
      [Subject.BIOLOGY]: 90,
    }
  });

  // Save Data on Change
  useEffect(() => {
    const appState: AppState = {
      messages,
      knowledgeData,
      wrongQuestions,
      homeworkTasks,
      stats,
      guidelines,
      recommendations,
      vertexAIConfig: vertexConfig,
      tencentConfig: tencentConfig,
      alibabaRAGConfig: alibabaConfig,
      ragProvider: ragProvider,
      aiConfig: aiConfig,
      cloudStorageUrl: cloudStorageUrl
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }, [messages, knowledgeData, wrongQuestions, homeworkTasks, stats, guidelines, recommendations, vertexConfig, tencentConfig, alibabaConfig, ragProvider, aiConfig, cloudStorageUrl]);

  // Export Data
  const handleExportData = () => {
    const appState: AppState = {
      messages,
      knowledgeData,
      wrongQuestions,
      homeworkTasks,
      stats,
      guidelines,
      recommendations,
      vertexAIConfig: vertexConfig,
      tencentConfig: tencentConfig,
      alibabaRAGConfig: alibabaConfig,
      ragProvider: ragProvider,
      aiConfig: aiConfig,
      cloudStorageUrl: cloudStorageUrl
    };
    const dataStr = JSON.stringify(appState, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dragon_ball_ai_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExecuteImport = (parsed: AppState, strategy: 'merge' | 'overwrite') => {
    try {
        if (strategy === 'overwrite') {
            // Overwrite strategy: Direct Replacement
            if (parsed.messages) setMessages(parsed.messages);
            if (parsed.knowledgeData) setKnowledgeData(parsed.knowledgeData);
            if (parsed.wrongQuestions) setWrongQuestions(parsed.wrongQuestions);
            if (parsed.homeworkTasks) setHomeworkTasks(parsed.homeworkTasks);
            if (parsed.stats) setStats(parsed.stats);
            if (parsed.guidelines) setGuidelines(parsed.guidelines);
            if (parsed.recommendations) setRecommendations(parsed.recommendations);
            if (parsed.vertexAIConfig) setVertexConfig(parsed.vertexAIConfig);
            if (parsed.tencentConfig) setTencentConfig(parsed.tencentConfig);
            if (parsed.alibabaRAGConfig) setAlibabaConfig(parsed.alibabaRAGConfig);
            if (parsed.ragProvider) setRagProvider(parsed.ragProvider);
            if (parsed.cloudStorageUrl) setCloudStorageUrl(parsed.cloudStorageUrl);
            if (parsed.aiConfig) {
                 if ((!parsed.aiConfig.apiKey || parsed.aiConfig.apiKey === '') && parsed.aiConfig.provider === 'gemini' && process.env.API_KEY) {
                    parsed.aiConfig.apiKey = process.env.API_KEY;
                }
                setAIConfig(parsed.aiConfig);
            }
            alert("数据已成功覆盖重置！");
        } else {
            // Merge strategy: Deduplicate and Append
            // 1. Messages
            if (parsed.messages && Array.isArray(parsed.messages)) {
                 const newMsgs = parsed.messages.filter(nm => !messages.some(em => em.id === nm.id));
                 setMessages(prev => [...prev, ...newMsgs].sort((a,b) => a.timestamp - b.timestamp));
            }
            // 2. Wrong Questions
            if (parsed.wrongQuestions && Array.isArray(parsed.wrongQuestions)) {
                 const newQs = parsed.wrongQuestions.filter(nq => !wrongQuestions.some(eq => eq.id === nq.id));
                 setWrongQuestions(prev => [...newQs, ...prev]);
            }
            // 3. Homework Tasks
            if (parsed.homeworkTasks && Array.isArray(parsed.homeworkTasks)) {
                 const newTasks = parsed.homeworkTasks.filter(nt => !homeworkTasks.some(et => et.id === nt.id));
                 setHomeworkTasks(prev => [...newTasks, ...prev]);
            }
            
            // For configs, we prefer the import if our local is empty, otherwise keep local? 
            // Or overwrite? Simple merge usually implies taking latest or keeping existing. 
            // Here we just merge lists. Configs are left as is unless user specifically overwrites.
            
            alert("数据已成功合并！(新增了未重复的记录)");
        }
    } catch (error) {
        console.error("Import Execution Failed", error);
        alert("导入过程中发生错误。");
    }
  };

  const handleAddToWrongQuestions = (q: WrongQuestion) => {
    setWrongQuestions(prev => [q, ...prev]);
  };
  
  const handleDeleteWrongQuestion = (id: string) => {
      setWrongQuestions(prev => prev.filter(q => q.id !== id));
  };

  const generateTrainingPlan = async () => {
    const topics = wrongQuestions.map(q => q.topic || q.analysis.substring(0, 20));
    if (topics.length === 0) {
        setRecommendations([
            { focusArea: "全科基础", suggestion: "你还没有录入错题。先去聊天框上传几道难题吧！", difficulty: "Basic" }
        ]);
        return;
    }

    const result = await analyzeWeakness(topics, aiConfig);
    if (result && result.suggestions) {
        setRecommendations(result.suggestions);
    }
  };

  const handleStartReview = (task: HomeworkTask) => {
    setActiveTab(Tab.CHAT);
    const hasImages = task.imageUrls && task.imageUrls.length > 0;
    
    const userMsg: Message = {
        id: Date.now().toString(),
        role: MessageRole.USER,
        content: `我明天要考 ${task.subject}。${hasImages ? '请根据我上传的图片内容' : `内容是：${task.content}`}。请监督我复习，对我进行提问！`,
        images: hasImages ? task.imageUrls : undefined,
        timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    
    setTimeout(() => {
        const aiAckMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: MessageRole.MODEL,
            content: `欧斯！收到“超级赛亚人”备考请求！\n\n既然明天要考 **${task.subject}**，那我们不能浪费时间了！${hasImages ? '我正在分析你上传的图片内容...' : ''}\n\n🔥 **第一回合**：\n请简要阐述该内容的核心概念，或者直接开始背诵第一段！我会严格检查！`,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, aiAckMsg]);
    }, 500);
  };

  const handleSaveSettings = (newGuidelines: SubjectGuidelines, newVertexConfig?: VertexAIConfig, newTencentConfig?: TencentConfig, newAlibabaConfig?: AlibabaRAGConfig, newRagProvider?: RAGProvider, newAIConfig?: AIConfig) => {
      setGuidelines(newGuidelines);
      if (newVertexConfig) setVertexConfig(newVertexConfig);
      if (newTencentConfig) setTencentConfig(newTencentConfig);
      if (newAlibabaConfig) setAlibabaConfig(newAlibabaConfig);
      if (newRagProvider) setRagProvider(newRagProvider);
      if (newAIConfig) setAIConfig(newAIConfig);
  };

  // Message Deletion Logic
  const handleDeleteMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const handleDeleteMultipleMessages = (ids: string[]) => {
    setMessages(prev => prev.filter(m => !ids.includes(m.id)));
  };

  const handleClearMessages = () => {
    if (confirm('确定要清空所有对话记录吗？此操作无法撤销。')) {
       setMessages([{
          id: 'init',
          role: MessageRole.MODEL,
          content: INITIAL_GREETING,
          timestamp: Date.now()
       }]);
    }
  };

  // Nav Item Helper
  const NavItem = ({ tab, icon: Icon, label }: { tab: Tab; icon: any; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all w-full md:w-auto text-sm md:text-base ${
        activeTab === tab 
          ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 font-bold scale-105' 
          : 'text-gray-500 hover:bg-orange-50 hover:text-orange-500'
      }`}
    >
      <Icon size={20} />
      <span className="hidden md:inline">{label}</span>
    </button>
  );

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-[#fff7ed]">
      {/* Settings Modal - Now simplified without Data features */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        guidelines={guidelines}
        onSave={handleSaveSettings}
        initialVertexConfig={vertexConfig}
        initialTencentConfig={tencentConfig}
        initialAlibabaConfig={alibabaConfig}
        initialRagProvider={ragProvider}
        initialAIConfig={aiConfig}
      />

      {/* Sidebar / Bottom Nav for Mobile */}
      <div className="md:w-64 bg-white border-r border-orange-100 flex md:flex-col justify-between p-4 z-20 shadow-sm order-2 md:order-1 h-16 md:h-full shrink-0">
        <div className="hidden md:flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                悟
            </div>
            <div>
                <h1 className="font-comic text-xl text-gray-800 leading-none">{APP_NAME}</h1>
                <span className="text-xs text-orange-400 font-bold tracking-wider">Saiyan AI</span>
            </div>
        </div>
        
        <nav className="flex md:flex-col justify-around md:justify-start gap-1 md:gap-3 w-full overflow-x-auto md:overflow-visible scrollbar-hide">
            <NavItem tab={Tab.CHAT} icon={MessageCircle} label="对话" />
            <NavItem tab={Tab.KNOWLEDGE} icon={Database} label="知识库" />
            <NavItem tab={Tab.HOMEWORK} icon={ClipboardList} label="作业帮手" />
            <NavItem tab={Tab.TRAINING} icon={Map} label="训练场" />
            <NavItem tab={Tab.NETWORK} icon={Share2} label="知识雷达" />
            <NavItem tab={Tab.WRONG_BOOK} icon={BookOpen} label="错题本" />
            <NavItem tab={Tab.STATS} icon={Zap} label="战斗力" />
            <NavItem tab={Tab.DATA} icon={HardDrive} label="数据中心" />
        </nav>

        <div className="hidden md:flex flex-col mt-auto gap-4">
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 px-4 py-3 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors w-full text-left"
            >
                <Settings size={20} />
                <span>AI 配置</span>
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-[calc(100vh-64px)] md:h-screen overflow-hidden order-1 md:order-2 p-2 md:p-6 relative">
          
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-2 px-2">
            <span className="font-comic font-bold text-lg text-gray-800">{APP_NAME}</span>
            <div className="flex gap-2">
                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 text-gray-500 hover:text-orange-500 bg-white rounded-full shadow-sm"
                >
                    <Settings size={18} />
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-hidden relative rounded-2xl shadow-sm border border-orange-100 bg-white">
            {activeTab === Tab.CHAT && (
                <ChatInterface 
                    messages={messages} 
                    setMessages={setMessages}
                    onAddToWrongQuestions={handleAddToWrongQuestions}
                    onUpdateKnowledgeMap={setKnowledgeData}
                    guidelines={guidelines}
                    vertexConfig={vertexConfig}
                    tencentConfig={tencentConfig}
                    alibabaConfig={alibabaConfig}
                    ragProvider={ragProvider}
                    aiConfig={aiConfig}
                    onDeleteMessage={handleDeleteMessage}
                    onDeleteMultipleMessages={handleDeleteMultipleMessages}
                    onClearMessages={handleClearMessages}
                />
            )}
            {activeTab === Tab.KNOWLEDGE && (
                <KnowledgeBase 
                    vertexConfig={vertexConfig}
                    tencentConfig={tencentConfig}
                    alibabaConfig={alibabaConfig}
                    ragProvider={ragProvider}
                    guidelines={guidelines}
                    aiConfig={aiConfig}
                />
            )}
            {activeTab === Tab.HOMEWORK && (
                <HomeworkHelper 
                    tasks={homeworkTasks}
                    setTasks={setHomeworkTasks}
                    onStartReview={handleStartReview}
                />
            )}
            {activeTab === Tab.TRAINING && (
                <TrainingGround />
            )}
            {activeTab === Tab.NETWORK && (
                <div className="h-full p-4">
                    <KnowledgeNetwork data={knowledgeData} />
                </div>
            )}
            {activeTab === Tab.WRONG_BOOK && (
                <div className="h-full p-4">
                    <WrongQuestionBook 
                        questions={wrongQuestions} 
                        onAddQuestion={handleAddToWrongQuestions}
                        onDeleteQuestion={handleDeleteWrongQuestion}
                        aiConfig={aiConfig}
                    />
                </div>
            )}
            {activeTab === Tab.STATS && (
                <PowerDashboard 
                    stats={stats} 
                    recommendations={recommendations} 
                    onGeneratePlan={generateTrainingPlan} 
                />
            )}
            {activeTab === Tab.DATA && (
                <DataManager 
                    currentCloudUrl={cloudStorageUrl}
                    onSaveCloudUrl={setCloudStorageUrl}
                    onExportData={handleExportData}
                    onExecuteImport={handleExecuteImport}
                />
            )}
        </div>
      </div>
    </div>
  );
};

export default App;
