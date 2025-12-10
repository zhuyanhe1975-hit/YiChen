
import React, { useState, useRef } from 'react';
import { WrongQuestion, Subject, AIConfig } from '../types';
import { BookOpen, Calendar, ChevronRight, Plus, Trash2, Image as ImageIcon, Wand2, X, Loader2, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { analyzeImageBatch } from '../services/geminiService';
import { SUBJECT_COLORS } from '../constants';

interface WrongQuestionBookProps {
  questions: WrongQuestion[];
  onAddQuestion: (q: WrongQuestion) => void;
  onDeleteQuestion: (id: string) => void;
  aiConfig: AIConfig;
}

const WrongQuestionBook: React.FC<WrongQuestionBookProps> = ({ questions, onAddQuestion, onDeleteQuestion, aiConfig }) => {
  const [selectedQ, setSelectedQ] = useState<WrongQuestion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Form State
  const [formSubject, setFormSubject] = useState<Subject>(Subject.MATH);
  const [formTopic, setFormTopic] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formAnalysis, setFormAnalysis] = useState('');
  const [formImage, setFormImage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              setFormImage(ev.target?.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleAIAnalyze = async () => {
      if (!formImage) {
          alert("请先上传一张图片！");
          return;
      }
      setIsAnalyzing(true);
      try {
          // Reusing analyzeImageBatch for single image analysis to get structured data
          const result = await analyzeImageBatch([formImage], "Please analyze this single wrong question image and return structured data.", undefined, aiConfig);
          
          if (result.batchData && result.batchData.length > 0) {
              const item = result.batchData[0];
              setFormSubject(item.subject as Subject);
              setFormTopic(item.topic);
              setFormContent(item.content);
              setFormAnalysis(item.analysis);
          } else {
              setFormAnalysis(result.text); // Fallback to raw text if struct fails
          }
      } catch (error) {
          console.error("Analysis failed", error);
          alert("AI 分析失败，请稍后重试或手动填写。");
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleSubmit = () => {
      if (!formContent && !formImage) {
          alert("请至少输入题目内容或上传图片");
          return;
      }

      const newQ: WrongQuestion = {
          id: Date.now().toString(),
          subject: formSubject,
          topic: formTopic || "未命名知识点",
          textContent: formContent || "图片题",
          imageUrl: formImage,
          analysis: formAnalysis || "待补充解析",
          date: new Date().toISOString()
      };

      onAddQuestion(newQ);
      closeModal();
  };

  const closeModal = () => {
      setIsModalOpen(false);
      setFormSubject(Subject.MATH);
      setFormTopic('');
      setFormContent('');
      setFormAnalysis('');
      setFormImage('');
  };

  const handleDelete = (id: string) => {
      if (confirm("确定要删除这道错题吗？删除后不可恢复。")) {
          onDeleteQuestion(id);
          if (selectedQ?.id === id) setSelectedQ(null);
      }
  };

  return (
    <div className="h-full flex flex-col gap-4 bg-orange-50 rounded-lg p-4 relative">
      
      {/* Header / Toolbar */}
      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-orange-100 shadow-sm">
          <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2">
              <BookOpen size={20}/> 错题记录 ({questions.length})
          </h3>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md transition-colors"
          >
              <Plus size={16} /> 录入错题
          </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        {/* List */}
        <div className={`${selectedQ ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-1/3 gap-3 overflow-y-auto pr-2`}>
            {questions.length === 0 ? (
                <div className="text-center text-gray-400 py-10 flex flex-col items-center">
                    <BookOpen size={48} className="opacity-30 mb-2" />
                    <p>暂无错题，点击右上角录入！</p>
                </div>
            ) : (
                questions.map(q => (
                <div 
                    key={q.id}
                    onClick={() => setSelectedQ(q)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md relative group ${selectedQ?.id === q.id ? 'bg-orange-500 text-white border-orange-600 shadow-lg scale-[1.02]' : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'}`}
                >
                    <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${selectedQ?.id === q.id ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'}`}>
                        {q.subject}
                    </span>
                    <span className="text-xs opacity-70 flex items-center gap-1">
                        <Calendar size={10} /> {new Date(q.date).toLocaleDateString()}
                    </span>
                    </div>
                    <p className="text-sm line-clamp-2 font-medium">{q.topic || "未知知识点"}</p>
                    <p className="text-xs opacity-70 line-clamp-1 mt-1">{q.textContent.substring(0, 30)}...</p>
                    
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }}
                        className={`absolute top-2 right-2 p-1.5 rounded-full hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100 ${selectedQ?.id === q.id ? 'text-white hover:bg-white/20' : 'text-gray-400'}`}
                        title="删除"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
                ))
            )}
        </div>

        {/* Detail */}
        <div className={`${!selectedQ ? 'hidden md:flex' : 'flex'} flex-1 bg-white rounded-xl shadow-sm border border-orange-100 flex-col overflow-hidden`}>
            {selectedQ ? (
                <>
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-orange-50/50">
                        <button onClick={() => setSelectedQ(null)} className="md:hidden text-gray-500 flex items-center text-sm">
                            ⬅ 返回
                        </button>
                        <span className="font-bold text-gray-700 flex items-center gap-2">
                             <span className="w-3 h-3 rounded-full" style={{ backgroundColor: SUBJECT_COLORS[selectedQ.subject] }}></span>
                             {selectedQ.subject} - {selectedQ.topic}
                        </span>
                        <button onClick={() => handleDelete(selectedQ.id)} className="text-gray-400 hover:text-red-500 md:hidden">
                            <Trash2 size={18} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {selectedQ.imageUrl && (
                            <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm max-w-sm">
                                <img src={selectedQ.imageUrl} alt="Problem" className="w-full" />
                            </div>
                        )}
                        <div>
                            <h4 className="font-bold text-gray-800 mb-2">题目内容</h4>
                            <p className="text-gray-600 text-sm whitespace-pre-wrap">{selectedQ.textContent}</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-orange-600 mb-2 border-l-4 border-orange-500 pl-2">题目解析</h4>
                            <div className="prose prose-sm max-w-none text-gray-600 bg-gray-50 p-4 rounded-lg">
                                <ReactMarkdown>{selectedQ.analysis}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                    <p>选择一道错题开始深度剖析</p>
                </div>
            )}
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in duration-200">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-orange-50 rounded-t-2xl">
                      <h3 className="font-bold text-orange-800 flex items-center gap-2">
                          <Plus size={20} /> 录入新错题
                      </h3>
                      <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1 rounded-full"><X size={20}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {/* Image Upload Area */}
                      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-orange-400 transition-colors relative group">
                          {formImage ? (
                              <div className="relative inline-block">
                                  <img src={formImage} alt="Preview" className="max-h-48 rounded-lg shadow-sm" />
                                  <button 
                                    onClick={() => setFormImage('')}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600"
                                  >
                                      <Trash2 size={14} />
                                  </button>
                              </div>
                          ) : (
                              <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer py-8 text-gray-400 flex flex-col items-center gap-2">
                                  <ImageIcon size={32} />
                                  <span>点击上传题目图片 (支持粘贴)</span>
                              </div>
                          )}
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageUpload} 
                          />
                      </div>

                      {/* AI Action */}
                      <div className="flex justify-end">
                           <button 
                             onClick={handleAIAnalyze}
                             disabled={!formImage || isAnalyzing}
                             className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-bold text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-200 transition-all"
                           >
                               {isAnalyzing ? <Loader2 size={16} className="animate-spin"/> : <Wand2 size={16}/>}
                               {isAnalyzing ? '正在分析...' : 'AI 智能识别'}
                           </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">科目</label>
                              <select 
                                value={formSubject}
                                onChange={(e) => setFormSubject(e.target.value as Subject)}
                                className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-orange-500 text-sm"
                              >
                                  {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">知识点/标题</label>
                              <input 
                                type="text"
                                value={formTopic}
                                onChange={(e) => setFormTopic(e.target.value)}
                                placeholder="例如：二次函数"
                                className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-orange-500 text-sm"
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">题目内容</label>
                          <textarea 
                             value={formContent}
                             onChange={(e) => setFormContent(e.target.value)}
                             rows={3}
                             className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-orange-500 text-sm resize-none"
                             placeholder="题目文字描述..."
                          />
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">详细解析</label>
                          <textarea 
                             value={formAnalysis}
                             onChange={(e) => setFormAnalysis(e.target.value)}
                             rows={6}
                             className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-orange-500 text-sm resize-none font-mono bg-gray-50"
                             placeholder="AI 分析结果将显示在这里，也可以手动输入..."
                          />
                      </div>
                  </div>

                  <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-white rounded-b-2xl">
                      <button onClick={closeModal} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-bold text-sm transition-colors">取消</button>
                      <button onClick={handleSubmit} className="px-6 py-2 bg-orange-500 text-white rounded-lg font-bold text-sm hover:bg-orange-600 shadow-lg shadow-orange-200 flex items-center gap-2">
                          <Save size={16} /> 保存录入
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default WrongQuestionBook;
