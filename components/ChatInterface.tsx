

import React, { useState, useRef, useEffect } from 'react';
import { Message, MessageRole, KnowledgeMapData, WrongQuestion, Subject, SubjectGuidelines, VertexAIConfig, TencentConfig, AlibabaRAGConfig, RAGProvider, AIConfig } from '../types';
import { generateResponse, generateKnowledgeMap, analyzeImageBatch, generateTimeline, generateImage } from '../services/geminiService';
import { Send, Mic, Image as ImageIcon, Loader2, BookX, Trash2, StopCircle, Layers, CheckCircle, Volume2, Database, Palette, ExternalLink, CheckSquare, Square, X, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { SUBJECT_COLORS, GEMINI_WEB_URL } from '../constants';
import TimelineRenderer from './TimelineRenderer';

interface ChatInterfaceProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onAddToWrongQuestions: (q: WrongQuestion) => void;
  onUpdateKnowledgeMap: (data: KnowledgeMapData) => void;
  guidelines: SubjectGuidelines;
  vertexConfig?: VertexAIConfig;
  tencentConfig?: TencentConfig;
  alibabaConfig?: AlibabaRAGConfig;
  ragProvider?: RAGProvider;
  aiConfig: AIConfig;
  onDeleteMessage: (id: string) => void;
  onDeleteMultipleMessages: (ids: string[]) => void;
  onClearMessages: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  setMessages, 
  onAddToWrongQuestions,
  onUpdateKnowledgeMap,
  guidelines,
  vertexConfig,
  tencentConfig,
  alibabaConfig,
  ragProvider = 'google',
  aiConfig,
  onDeleteMessage,
  onDeleteMultipleMessages,
  onClearMessages
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRagMode, setIsRagMode] = useState(false);
  
  // Selection / Deletion Mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set());
  
  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        // Prevent default paste behavior if it's an image (to avoid pasting file name as text)
        // Note: If you want to allow pasting text AND images mixed, logic needs to be more complex.
        // e.preventDefault(); 
        
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setSelectedImages(prev => [...prev, event.target!.result as string]);
            }
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

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
      let ragSources = undefined;
      let genImage = undefined;

      // Check for Image Generation Keywords
      const isImageGenRequest = /画|生成图片|drawing|image/i.test(userMsg.content) && currentImages.length === 0 && !isRagMode;

      if (currentImages.length > 0) {
        // Use Batch Analysis
        const result = await analyzeImageBatch(
          currentImages, 
          userMsg.content || "请分类整理这些知识内容",
          guidelines,
          aiConfig
        );
        responseText = result.text;
        batchData = result.batchData;
      } else if (userMsg.content.includes("时间轴")) {
        // Timeline Detection Trigger
        timelineData = await generateTimeline(userMsg.content, aiConfig);
        if (timelineData) {
            responseText = `欧斯！小战士，关于“${timelineData.title}”的时空穿线图已经生成！历史的长河尽在掌握，你的历史战斗力要爆发了！`;
        } else {
            const resp = await generateResponse(userMsg.content, undefined, guidelines, undefined, undefined, undefined, 'google', aiConfig);
            responseText = resp.text;
        }
      } else if (isImageGenRequest && aiConfig.provider === 'gemini') {
          // Image Generation Flow
          const imageBase64 = await generateImage(userMsg.content, aiConfig);
          if (imageBase64) {
              genImage = imageBase64;
              responseText = "龟派气功！🖼️ 你的想象力已经具象化了！看看这幅杰作！";
          } else {
              responseText = "抱歉，我的绘画能量暂时不足（生成失败），请稍后再试。";
          }
      } else {
        // Standard Text flow (check for RAG)
        const resp = await generateResponse(
          userMsg.content || "请分析", 
          undefined,
          guidelines,
          isRagMode ? vertexConfig : undefined,
          isRagMode ? tencentConfig : undefined,
          isRagMode ? alibabaConfig : undefined,
          (isRagMode ? ragProvider : 'google') as RAGProvider,
          aiConfig
        );
        responseText = resp.text;
        ragSources = resp.sources;
      }
      
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.MODEL,
        content: responseText,
        batchData: batchData,
        timelineData: timelineData || undefined,
        ragSources: ragSources,
        generatedImage: genImage || undefined,
        isWrongQuestionAnalysis: !!userMsg.images, 
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, modelMsg]);

      // Speak if enabled (Basic Logic)
      if (isSpeaking) {
          speakText(responseText);
      }

      // Heuristic: If response is short and about a concept, try to map it
      if (currentImages.length === 0 && userMsg.content.length < 20 && userMsg.content.length > 1 && !timelineData && !isRagMode && !genImage) {
         const mapData = await generateKnowledgeMap(userMsg.content, aiConfig);
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

  const speakText = (text: string) => {
      // Clean markdown roughly for speech
      const cleanText = text.replace(/[*#`]/g, '').replace(/\[.*?\]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'zh-CN';
      utterance.rate = 1.2; // Slightly faster for energetic feel
      window.speechSynthesis.speak(utterance);
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
        reader.readAsDataURL(file as Blob);
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

  const openCamera = async () => {
      setIsCameraOpen(true);
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
          }
      } catch (err) {
          console.error("Camera Access Error", err);
          alert("无法访问摄像头，请检查权限。");
          setIsCameraOpen(false);
      }
  };

  const closeCamera = () => {
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
      }
      setIsCameraOpen(false);
  };

  const capturePhoto = () => {
      if (videoRef.current) {
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(videoRef.current, 0, 0);
              const dataUrl = canvas.toDataURL('image/jpeg');
              setSelectedImages(prev => [...prev, dataUrl]);
              closeCamera();
          }
      }
  };

  // Selection Logic
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedMsgIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedMsgIds(newSet);
  };

  const handleBatchDelete = () => {
    if (selectedMsgIds.size === 0) return;
    if (confirm(`确定要删除选中的 ${selectedMsgIds.size} 条消息吗？`)) {
      onDeleteMultipleMessages(Array.from(selectedMsgIds));
      setSelectedMsgIds(new Set());
      setIsSelectionMode(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-xl overflow-hidden border-2 border-orange-200 relative">
      
      {/* Top Toolbar for Message Management */}
      <div className="absolute top-0 left-0 right-0 z-10 p-2 flex justify-between items-center pointer-events-none">
          <div className="pointer-events-auto flex gap-2">
            <button 
                onClick={() => {
                    setIsSelectionMode(!isSelectionMode);
                    setSelectedMsgIds(new Set());
                }}
                className={`p-2 rounded-full shadow-sm backdrop-blur-sm border transition-all ${isSelectionMode ? 'bg-orange-500 text-white border-orange-600' : 'bg-white/80 text-gray-500 hover:text-orange-500 border-gray-200'}`}
                title="消息管理"
            >
                {isSelectionMode ? <CheckCircle size={18} /> : <CheckSquare size={18} />}
            </button>

            {isSelectionMode && selectedMsgIds.size > 0 && (
                <button
                    onClick={handleBatchDelete}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 text-xs font-bold animate-in fade-in"
                >
                    <Trash2 size={14} /> 删除 ({selectedMsgIds.size})
                </button>
            )}
          </div>
          
          <div className="pointer-events-auto">
             <button
                onClick={onClearMessages}
                className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-sm border border-gray-200 transition-colors"
                title="清空聊天记录"
             >
                <RotateCcw size={18} />
             </button>
          </div>
      </div>

      {/* Camera Overlay */}
      {isCameraOpen && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-8 flex gap-8 items-center">
                  <button onClick={closeCamera} className="bg-white/20 text-white p-4 rounded-full backdrop-blur-sm hover:bg-white/30">
                      <StopCircle size={32} />
                  </button>
                  <button onClick={capturePhoto} className="bg-white p-2 rounded-full border-4 border-gray-300 hover:border-orange-500 transition-colors">
                      <div className="w-16 h-16 bg-white rounded-full border-2 border-black"></div>
                  </button>
              </div>
          </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 pt-12 space-y-4 bg-slate-50">
        {messages.map((msg, index) => (
          <div key={msg.id} className={`flex ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'} group relative items-end gap-2`}>
            
            {/* Selection Checkbox (Left side for Model, Right side for User) */}
            {isSelectionMode && (
                <div 
                    onClick={() => toggleSelection(msg.id)}
                    className={`cursor-pointer text-gray-400 hover:text-orange-500 mb-4 order-${msg.role === MessageRole.USER ? 'last' : 'first'}`}
                >
                    {selectedMsgIds.has(msg.id) ? (
                        <CheckSquare size={20} className="text-orange-500 fill-orange-50" />
                    ) : (
                        <Square size={20} />
                    )}
                </div>
            )}

            {/* Delete Button (Hover in Normal Mode) */}
            {!isSelectionMode && (
                <button
                    onClick={() => onDeleteMessage(msg.id)}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-300 hover:text-red-500 mb-4 order-${msg.role === MessageRole.USER ? 'first' : 'last'}`}
                    title="删除此条"
                >
                    <Trash2 size={14} />
                </button>
            )}

            <div className={`flex flex-col ${msg.role === MessageRole.USER ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                <div className={`rounded-2xl p-4 shadow-sm w-full ${
                msg.role === MessageRole.USER 
                    ? 'bg-orange-500 text-white rounded-tr-none' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                } ${isSelectionMode && selectedMsgIds.has(msg.id) ? 'ring-2 ring-orange-400 ring-offset-2' : ''}`}>
                
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

                {/* AI Generated Image */}
                {msg.generatedImage && (
                    <div className="mb-3 rounded-lg overflow-hidden border-2 border-orange-200 shadow-md">
                        <img src={msg.generatedImage} alt="AI Generated" className="w-full object-cover" />
                        <div className="bg-orange-50 p-2 text-xs text-orange-600 flex items-center gap-1 font-bold">
                            <Palette size={14} /> AI 绘图
                        </div>
                    </div>
                )}

                <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>

                {/* RAG Sources */}
                {msg.ragSources && msg.ragSources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                        <p className="text-xs font-bold text-gray-500 mb-2">📚 知识库来源:</p>
                        <ul className="space-y-1">
                            {msg.ragSources.map((source, idx) => (
                                <li key={idx} className="text-xs text-indigo-600 bg-indigo-50 p-2 rounded block">
                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:underline font-medium block mb-1">
                                        {source.title}
                                    </a>
                                    {source.snippet && <span className="text-gray-500 block truncate">{source.snippet}</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Timeline Rendering */}
                {msg.role === MessageRole.MODEL && msg.timelineData && (
                    <TimelineRenderer data={msg.timelineData} />
                )}
                
                </div>

                {/* Batch Analysis Results Visualization */}
                {msg.role === MessageRole.MODEL && msg.batchData && Array.isArray(msg.batchData) && msg.batchData.length > 0 && (
                    <div className="mt-4 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                        {msg.batchData.map((item, idx) => {
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
                onClick={openCamera}
                className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
                title="拍照"
            >
                <ImageIcon size={24} />
            </button>

            <button 
                onClick={toggleRecording}
                className={`p-2 rounded-full transition-colors ${isRecording ? 'text-red-500 bg-red-50 animate-pulse' : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50'}`}
                title="语音输入"
            >
                {isRecording ? <StopCircle size={24} /> : <Mic size={24} />}
            </button>
            
            {/* RAG Toggle */}
            <button
                onClick={() => setIsRagMode(!isRagMode)}
                className={`p-2 rounded-full transition-colors ${isRagMode ? 'text-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'text-gray-400 hover:text-indigo-500'}`}
                title={isRagMode ? "RAG模式已开启：将检索知识库" : "点击开启 RAG 知识库检索"}
            >
                <Database size={20} />
            </button>
            
            {/* External Gemini Web Link */}
            <a 
                href={GEMINI_WEB_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                title="打开 Gemini 官网 (超级大脑模式)"
            >
                <ExternalLink size={20} />
            </a>

            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isRagMode ? "搜索知识库..." : (selectedImages.length > 0 ? "对这些图片有什么问题吗？" : "输入问题 (支持粘贴图片)...")}
                className={`flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 transition-all text-gray-800 placeholder-gray-400 ${isRagMode ? 'border-indigo-200 focus:border-indigo-500 focus:ring-indigo-200 bg-indigo-50/20' : 'border-gray-200 focus:border-orange-500 focus:ring-orange-200'}`}
            />
            
            <button
                onClick={() => setIsSpeaking(!isSpeaking)}
                className={`p-2 rounded-full transition-colors ${isSpeaking ? 'text-orange-500 bg-orange-50' : 'text-gray-400 hover:text-gray-600'}`}
                title="语音播报回复"
            >
                <Volume2 size={20} />
            </button>

            <button 
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && selectedImages.length === 0)}
                className={`p-2 text-white rounded-full transition-transform hover:scale-105 shadow-md ${isRagMode ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'}`}
            >
                <Send size={20} />
            </button>
        </div>
        <div className="text-[10px] text-gray-300 text-center mt-1">
            Using Model: {aiConfig.modelName} ({aiConfig.provider})
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
