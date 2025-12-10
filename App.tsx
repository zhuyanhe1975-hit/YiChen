
import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import KnowledgeNetwork from './components/KnowledgeNetwork';
import WrongQuestionBook from './components/WrongQuestionBook';
import PowerDashboard from './components/PowerDashboard';
import SettingsModal from './components/SettingsModal';
import TrainingGround from './components/TrainingGround';
import HomeworkHelper from './components/HomeworkHelper';
import { Message, MessageRole, KnowledgeMapData, WrongQuestion, Subject, UserStats, TrainingRecommendation, SubjectGuidelines, HomeworkTask, Tab, AppState } from './types';
import { MessageCircle, Share2, BookOpen, Zap, Settings, Map, ClipboardList } from 'lucide-react';
import { INITIAL_GREETING, APP_NAME, DEFAULT_SUBJECT_GUIDELINES } from './constants';
import { analyzeWeakness } from './services/geminiService';

const STORAGE_KEY = 'dragon_ball_ai_assistant_data';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHAT);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: MessageRole.MODEL,
      content: INITIAL_GREETING,
      timestamp: Date.now()
    }
  ]);
  const [knowledgeData, setKnowledgeData] = useState<KnowledgeMapData | null>(null);
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([]);
  const [recommendations, setRecommendations] = useState<TrainingRecommendation[]>([]);
  const [homeworkTasks, setHomeworkTasks] = useState<HomeworkTask[]>([]);
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [guidelines, setGuidelines] = useState<SubjectGuidelines>(DEFAULT_SUBJECT_GUIDELINES);

  // Stats
  const [stats, setStats] = useState<UserStats>({
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

  // Load Data on Mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed: AppState = JSON.parse(savedData);
        if (parsed.messages) setMessages(parsed.messages);
        if (parsed.knowledgeData) setKnowledgeData(parsed.knowledgeData);
        if (parsed.wrongQuestions) setWrongQuestions(parsed.wrongQuestions);
        if (parsed.homeworkTasks) setHomeworkTasks(parsed.homeworkTasks);
        if (parsed.stats) setStats(parsed.stats);
        if (parsed.guidelines) setGuidelines(parsed.guidelines);
        if (parsed.recommendations) setRecommendations(parsed.recommendations);
      } catch (e) {
        console.error("Failed to load saved data", e);
      }
    }
  }, []);

  // Save Data on Change
  useEffect(() => {
    const appState: AppState = {
      messages,
      knowledgeData,
      wrongQuestions,
      homeworkTasks,
      stats,
      guidelines,
      recommendations
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }, [messages, knowledgeData, wrongQuestions, homeworkTasks, stats, guidelines, recommendations]);

  // Export Data
  const handleExportData = () => {
    const appState: AppState = {
      messages,
      knowledgeData,
      wrongQuestions,
      homeworkTasks,
      stats,
      guidelines,
      recommendations
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

  // Import Data
  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed: AppState = JSON.parse(text);
        
        // Restore State
        if (parsed.messages) setMessages(parsed.messages);
        if (parsed.knowledgeData) setKnowledgeData(parsed.knowledgeData);
        if (parsed.wrongQuestions) setWrongQuestions(parsed.wrongQuestions);
        if (parsed.homeworkTasks) setHomeworkTasks(parsed.homeworkTasks);
        if (parsed.stats) setStats(parsed.stats);
        if (parsed.guidelines) setGuidelines(parsed.guidelines);
        if (parsed.recommendations) setRecommendations(parsed.recommendations);
        
        alert("数据导入成功！您的战斗力已恢复！");
      } catch (error) {
        alert("数据文件格式错误，无法解析！");
      }
    };
    reader.readAsText(file);
  };

  const handleAddToWrongQuestions = (q: WrongQuestion) => {
    setWrongQuestions(prev => [q, ...prev]);
  };

  const generateTrainingPlan = async () => {
    const topics = wrongQuestions.map(q => q.topic || q.analysis.substring(0, 20));
    if (topics.length === 0) {
        setRecommendations([
            { focusArea: "全科基础", suggestion: "你还没有录入错题。先去聊天框上传几道难题吧！", difficulty: "Basic" }
        ]);
        return;
    }

    const result = await analyzeWeakness(topics);
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
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        guidelines={guidelines}
        onSave={setGuidelines}
        onExportData={handleExportData}
        onImportData={handleImportData}
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
        
        <nav className="flex md:flex-col justify-around md:justify-start gap-1 md:gap-3 w-full overflow-x-auto md:overflow-visible">
            <NavItem tab={Tab.CHAT} icon={MessageCircle} label="对话" />
            <NavItem tab={Tab.HOMEWORK} icon={ClipboardList} label="作业帮手" />
            <NavItem tab={Tab.TRAINING} icon={Map} label="训练场" />
            <NavItem tab={Tab.NETWORK} icon={Share2} label="知识雷达" />
            <NavItem tab={Tab.WRONG_BOOK} icon={BookOpen} label="错题本" />
            <NavItem tab={Tab.STATS} icon={Zap} label="战斗力" />
        </nav>

        <div className="hidden md:flex flex-col mt-auto gap-4">
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 px-4 py-3 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors w-full text-left"
            >
                <Settings size={20} />
                <span>配置与备份</span>
            </button>

            <div className="p-4 bg-orange-50 rounded-xl">
                <p className="text-xs text-orange-600 mb-1 font-bold">每日格言</p>
                <p className="text-xs text-gray-600 italic">"只有不断超越极限，才能成为超级赛亚人！"</p>
            </div>
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
                    <WrongQuestionBook questions={wrongQuestions} />
                </div>
            )}
            {activeTab === Tab.STATS && (
                <PowerDashboard 
                    stats={stats} 
                    recommendations={recommendations} 
                    onGeneratePlan={generateTrainingPlan} 
                />
            )}
        </div>
      </div>
    </div>
  );
};

export default App;
