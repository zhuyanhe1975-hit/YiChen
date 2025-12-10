
import React, { useState, useRef, useEffect } from 'react';
import { Message, MessageRole, KnowledgeMapData, WrongQuestion, Subject, SubjectGuidelines } from '../types';
import { generateResponse, generateKnowledgeMap, analyzeImageBatch, generateTimeline } from '../services/geminiService';
import { Send, Mic, Image as ImageIcon, Loader2, BookX, Trash2, StopCircle, Layers, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { SUBJECT_COLORS } from '../constants';
import TimelineRenderer from './TimelineRenderer';

interface ChatInterfaceProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onAddToWrongQuestions: (q: WrongQuestion) => void;
  onUpdateKnowledgeMap: (data: KnowledgeMapData) => void;
  guidelines: SubjectGuidelines;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  setMessages, 
  onAddToWrongQuestions,
  onUpdateKnowledgeMap,
  guidelines
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Initialize Speech Recognition if available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'zh-CN';
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + transcript);
        setIsRecording(false);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const handleSend = async () => {
    if ((!input.trim() && selectedImages.length === 0) || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      content: input,
      images: selectedImages.length > 0 ? [...selectedImages] : undefined,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const currentImages = [...selectedImages];
    setSelectedImages([]);
    setIsLoading(true);

    try {
      let responseText = "";
      let batchData = undefined;
      let timelineData = undefined;

      if (currentImages.length > 0) {
        // Use Batch Analysis
        const result = await analyzeImageBatch(
          currentImages, 
          userMsg.content || "请分类整理这些知识内容",
          guidelines
        );
        responseText = result.text;
        batchData = result.batchData;
      } else if (userMsg.content.includes("时间轴")) {
        // Timeline Detection Trigger
        // If user asks for "Timeline", generate it specifically
        timelineData = await generateTimeline(userMsg.content);
        if (timelineData) {
            responseText = `欧斯！小战士，关于“${timelineData.title}”的时空穿线图已经生成！历史的长河尽在掌握，你的历史战斗力要爆发了！`;
        } else {
            responseText = await generateResponse(userMsg.content, undefined, guidelines);
        }
      } else {
        // Standard Text/Single context flow
        responseText = await generateResponse(
          userMsg.content || "请分析", 
          undefined,
          guidelines
        );
      }
      
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.MODEL,
        content: responseText,
        batchData: batchData,
        timelineData: timelineData || undefined,
        isWrongQuestionAnalysis: !!userMsg.images, 
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, modelMsg]);

      // Heuristic: If response is short and about a concept, try to map it
      if (currentImages.length === 0 && userMsg.content.length < 20 && userMsg.content.length > 1 && !timelineData) {
         const mapData = await generateKnowledgeMap(userMsg.content);
         if (mapData) {
            onUpdateKnowledgeMap(mapData);
         }
      }

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("您的浏览器不支持语音识别功能，请使用Chrome浏览器。");
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages: string[] = [];
      let processed = 0;
      
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          processed++;
          if (processed === files.length) {
             setSelectedImages(prev => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddBatchItem = (item: any, imageUrl?: string) => {
    const q: WrongQuestion = {
        id: Date.now().toString() + Math.random(),
        subject: item.subject as Subject,
        topic: item.topic,
        imageUrl: imageUrl,
        textContent: item.content,
        analysis: item.analysis,
        date: new Date().toISOString()
    };
    onAddToWrongQuestions(q);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-xl overflow-hidden border-2 border-orange-200">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg, index) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === MessageRole.USER ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm ${
              msg.role === MessageRole.USER 
                ? 'bg-orange-500 text-white rounded-tr-none' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
            }`}>
              {/* Image Grid for User Messages */}
              {msg.images && msg.images.length > 0 && (
                <div className={`grid gap-2 mb-3 ${msg.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {msg.images.map((img, idx) => (
                         <div key={idx} className="relative group">
                            <img src={img} alt={`Upload ${idx}`} className="w-full h-32 object-cover rounded-lg border-2 border-white/20" />
                            <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-2 rounded-full">
                                {idx + 1}
                            </div>
                         </div>
                    ))}
                </div>
              )}
              {/* Fallback for legacy single image */}
              {msg.image && !msg.images && (
                 <img src={msg.image} alt="Upload" className="max-w-full h-48 object-cover rounded-lg mb-2" />
              )}

              <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
                 <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>

              {/* Timeline Rendering */}
              {msg.role === MessageRole.MODEL && msg.timelineData && (
                <TimelineRenderer data={msg.timelineData} />
              )}
              
            </div>

            {/* Batch Analysis Results Visualization */}
            {msg.role === MessageRole.MODEL && msg.batchData && msg.batchData.length > 0 && (
                 <div className="mt-4 w-full max-w-[95%] md:max-w-[85%] grid grid-cols-1 md:grid-cols-2 gap-4">
                    {msg.batchData.map((item, idx) => {
                        // Attempt to find the matching image from the PREVIOUS user message
                        // Using index is safer in map loop
                        const prevMsg = messages[index - 1];
                        const matchedImage = prevMsg?.images?.[item.imageIndex];

                        return (
                            <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden flex flex-col hover:border-orange-300 transition-all">
                                <div className="h-1 bg-gradient-to-r from-orange-400 to-red-500"></div>
                                <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                    <span className="font-bold text-gray-700 flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: SUBJECT_COLORS[item.subject] || '#9ca3af' }}></span>
                                        {item.subject}
                                    </span>
                                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">图片 {item.imageIndex + 1}</span>
                                </div>
                                <div className="p-4 flex-1 flex flex-col gap-3">
                                    <div className="flex gap-3">
                                        {matchedImage && (
                                            <img src={matchedImage} className="w-16 h-16 object-cover rounded-md border border-gray-200 shrink-0" alt="thumb" />
                                        )}
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-800 line-clamp-1">{item.topic}</h4>
                                            <p className="text-xs text-gray-500 line-clamp-2">{item.content}</p>
                                        </div>
                                    </div>
                                    <div className="bg-orange-50 p-2 rounded text-xs text-orange-800 max-h-60 overflow-y-auto scrollbar-thin">
                                        <strong className="block mb-1">小助理解析：</strong> 
                                        <ReactMarkdown>{item.analysis}</ReactMarkdown>
                                    </div>
                                </div>
                                <div className="p-2 border-t border-gray-100 bg-gray-50 flex justify-end">
                                    <button 
                                        onClick={() => handleAddBatchItem(item, matchedImage)}
                                        className="text-xs flex items-center gap-1 bg-white border border-orange-200 text-orange-600 px-3 py-1.5 rounded-full hover:bg-orange-500 hover:text-white transition-all shadow-sm"
                                    >
                                        <BookX size={14} /> 收入错题本
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                 </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-200 flex items-center gap-2 shadow-sm">
              <Loader2 className="animate-spin text-orange-500" size={20} />
              <span className="text-gray-500 text-sm">正在积蓄能量生成中...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 relative z-20">
        {selectedImages.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-thin">
                {selectedImages.map((img, idx) => (
                    <div key={idx} className="relative flex-shrink-0 group">
                        <img src={img} alt="preview" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                        <button 
                            onClick={() => removeImage(idx)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={12} />
                        </button>
                        <div className="absolute bottom-0 right-0 bg-orange-500 text-white text-[10px] px-1 rounded-tl-md">
                            {idx + 1}
                        </div>
                    </div>
                ))}
            </div>
        )}
        
        <div className="flex items-center gap-2">
            <input 
                type="file" 
                accept="image/*"
                multiple 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleImageUpload}
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors relative"
                title="上传图片 (支持多选)"
            >
                <Layers size={24} />
                {selectedImages.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                        {selectedImages.length}
                    </span>
                )}
            </button>
            
            <button 
                onClick={toggleRecording}
                className={`p-2 rounded-full transition-colors ${isRecording ? 'text-red-500 bg-red-50 animate-pulse' : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50'}`}
                title="语音输入"
            >
                {isRecording ? <StopCircle size={24} /> : <Mic size={24} />}
            </button>

            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={selectedImages.length > 0 ? "对这些图片有什么问题吗？" : "输入问题、知识点或“xxx时间轴”..."}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
            />
            
            <button 
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && selectedImages.length === 0)}
                className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105 shadow-md shadow-orange-200"
            >
                <Send size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
