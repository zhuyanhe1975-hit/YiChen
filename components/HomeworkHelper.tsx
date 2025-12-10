
import React, { useState, useEffect, useRef } from 'react';
import { HomeworkTask, Subject } from '../types';
import { SUBJECT_COLORS } from '../constants';
import { Plus, Clock, Check, Play, Square, GraduationCap, Trash2, Image as ImageIcon, Volume2, AlertCircle, Edit2, Save } from 'lucide-react';

interface HomeworkHelperProps {
  tasks: HomeworkTask[];
  setTasks: React.Dispatch<React.SetStateAction<HomeworkTask[]>>;
  onStartReview: (task: HomeworkTask) => void;
}

const HomeworkHelper: React.FC<HomeworkHelperProps> = ({ tasks, setTasks, onStartReview }) => {
  const [newTask, setNewTask] = useState<Partial<HomeworkTask>>({
    subject: Subject.CHINESE,
    content: '',
    isTestPrep: false,
    imageUrls: [],
    targetDuration: 0
  });
  const [targetMinutes, setTargetMinutes] = useState<string>('');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  
  // Edit Mode State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio Context for Alarm
  const playAlarm = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.4);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTaskId) {
      interval = setInterval(() => {
        setTasks(prev => prev.map(t => {
          if (t.id === activeTaskId) {
            const newTime = t.timeSpent + 1;
            if (t.targetDuration && newTime === t.targetDuration) {
              playAlarm();
            }
            return { ...t, timeSpent: newTime };
          }
          return t;
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTaskId, setTasks]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const readers: Promise<string>[] = [];
      Array.from(files).forEach(file => {
        readers.push(new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        }));
      });

      Promise.all(readers).then(images => {
          setNewTask(prev => ({ ...prev, imageUrls: [...(prev.imageUrls || []), ...images] }));
      });
    }
  };

  const removeNewImage = (index: number) => {
      setNewTask(prev => ({
          ...prev,
          imageUrls: prev.imageUrls?.filter((_, i) => i !== index)
      }));
  };

  const addOrUpdateTask = () => {
    if (!newTask.content && (!newTask.imageUrls || newTask.imageUrls.length === 0)) return;
    
    const durationSeconds = targetMinutes ? parseInt(targetMinutes) * 60 : undefined;

    if (editingTaskId) {
       // Update existing
       setTasks(prev => prev.map(t => {
           if (t.id === editingTaskId) {
               return {
                   ...t,
                   subject: newTask.subject as Subject,
                   content: newTask.content || t.content,
                   isTestPrep: newTask.isTestPrep || false,
                   imageUrls: newTask.imageUrls,
                   targetDuration: durationSeconds
               };
           }
           return t;
       }));
       setEditingTaskId(null);
    } else {
       // Add new
       const task: HomeworkTask = {
         id: Date.now().toString(),
         subject: newTask.subject as Subject,
         content: newTask.content || (newTask.imageUrls?.length ? '图片作业任务' : '未命名任务'),
         isTestPrep: newTask.isTestPrep || false,
         imageUrls: newTask.imageUrls,
         status: 'todo',
         timeSpent: 0,
         targetDuration: durationSeconds
       };
       setTasks(prev => [task, ...prev]);
    }

    // Reset Form
    setNewTask({
        subject: Subject.CHINESE,
        content: '',
        isTestPrep: false,
        imageUrls: [],
        targetDuration: 0
    });
    setTargetMinutes('');
  };

  const startEdit = (task: HomeworkTask) => {
      setEditingTaskId(task.id);
      setNewTask({
          subject: task.subject,
          content: task.content,
          isTestPrep: task.isTestPrep,
          imageUrls: task.imageUrls || [],
          targetDuration: task.targetDuration
      });
      setTargetMinutes(task.targetDuration ? (task.targetDuration / 60).toString() : '');
  };

  const cancelEdit = () => {
      setEditingTaskId(null);
      setNewTask({
        subject: Subject.CHINESE,
        content: '',
        isTestPrep: false,
        imageUrls: [],
        targetDuration: 0
    });
    setTargetMinutes('');
  };

  const toggleTimer = (id: string) => {
    if (activeTaskId === id) {
      setActiveTaskId(null);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'doing' } : t));
    } else {
      setActiveTaskId(id);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'doing' } : t));
    }
  };

  const completeTask = (id: string) => {
    if (activeTaskId === id) setActiveTaskId(null);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'done' } : t));
  };
  
  const removeTask = (id: string) => {
      if (activeTaskId === id) setActiveTaskId(null);
      setTasks(prev => prev.filter(t => t.id !== id));
      if (editingTaskId === id) cancelEdit();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 bg-orange-50/50 p-4">
      {/* Input Section */}
      <div className={`w-full md:w-1/3 bg-white p-6 rounded-xl shadow-sm border ${editingTaskId ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-gray-200'} flex flex-col gap-4 overflow-y-auto transition-all`}>
        <h3 className={`font-bold text-lg text-gray-800 flex items-center gap-2 ${editingTaskId ? 'text-indigo-600' : ''}`}>
          {editingTaskId ? <Edit2 className="bg-indigo-500 text-white rounded-full p-1.5" size={24} /> : <Plus className="bg-orange-500 text-white rounded-full p-1" size={24} />}
          {editingTaskId ? '修改任务' : '添加修炼任务'}
        </h3>
        
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">科目</label>
          <div className="flex flex-wrap gap-2">
            {Object.values(Subject).map(sub => (
              <button
                key={sub}
                onClick={() => setNewTask(prev => ({ ...prev, subject: sub }))}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${newTask.subject === sub ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">任务设定</label>
          <div className="flex gap-2 mb-2">
              <div className="flex-1 relative">
                  <input 
                    type="number" 
                    placeholder="限时(分)" 
                    value={targetMinutes}
                    onChange={(e) => setTargetMinutes(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:border-orange-500 outline-none"
                  />
                  <Clock size={14} className="absolute left-2.5 top-2.5 text-gray-400"/>
              </div>
              <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-orange-500 transition-colors"
              >
                  <ImageIcon size={16} /> 图片
              </button>
              <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  multiple 
                  onChange={handleImageUpload} 
              />
          </div>
          
          {newTask.imageUrls && newTask.imageUrls.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
                  {newTask.imageUrls.map((img, idx) => (
                      <div key={idx} className="relative flex-shrink-0 w-16 h-16 group">
                          <img src={img} className="w-full h-full object-cover rounded-md border border-gray-200" alt="preview" />
                          <button 
                              onClick={() => removeNewImage(idx)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          >
                              <Trash2 size={10} />
                          </button>
                      </div>
                  ))}
              </div>
          )}

          <textarea 
            className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none resize-none h-20"
            placeholder="内容描述：例如 数学卷子、背诵课文..."
            value={newTask.content}
            onChange={e => setNewTask(prev => ({ ...prev, content: e.target.value }))}
          />
        </div>

        <div className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => setNewTask(prev => ({ ...prev, isTestPrep: !prev.isTestPrep }))}>
           <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${newTask.isTestPrep ? 'bg-red-500 border-red-500' : 'border-gray-300 bg-white'}`}>
              {newTask.isTestPrep && <Check size={14} className="text-white" />}
           </div>
           <div>
               <span className={`text-sm font-medium ${newTask.isTestPrep ? 'text-red-600' : 'text-gray-600'}`}>明日考测</span>
               <p className="text-[10px] text-gray-400">开启后AI将辅助监督复习</p>
           </div>
        </div>

        <div className="flex gap-2 mt-auto">
            {editingTaskId && (
                <button 
                  onClick={cancelEdit}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
            )}
            <button 
              onClick={addOrUpdateTask}
              disabled={!newTask.content && (!newTask.imageUrls || newTask.imageUrls.length === 0)}
              className={`flex-1 py-3 text-white rounded-xl font-bold transition-colors disabled:opacity-50 shadow-lg ${editingTaskId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-800 hover:bg-black'}`}
            >
              {editingTaskId ? '保存修改' : '发布任务'}
            </button>
        </div>
      </div>

      {/* List Section */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
         {tasks.length === 0 && (
             <div className="text-center text-gray-400 py-10">
                 <p>还没有任务，快去添加吧！</p>
             </div>
         )}
         
         {/* Active/Todo */}
         {tasks.filter(t => t.status !== 'done').map(task => {
             const isOvertime = task.targetDuration && task.timeSpent >= task.targetDuration;
             const progressPercent = task.targetDuration ? Math.min((task.timeSpent / task.targetDuration) * 100, 100) : 0;
             const isEditing = editingTaskId === task.id;

             return (
             <div key={task.id} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 transition-all relative overflow-hidden ${activeTaskId === task.id ? 'border-l-green-500 ring-2 ring-green-100' : isEditing ? 'border-l-indigo-500 ring-2 ring-indigo-50 scale-[1.02]' : 'border-l-orange-500 hover:shadow-md'}`}>
                {/* Progress Bar Background */}
                {task.targetDuration && (
                    <div className="absolute bottom-0 left-0 h-1 bg-gray-100 w-full">
                        <div 
                            className={`h-full transition-all duration-1000 ${isOvertime ? 'bg-red-500' : 'bg-green-500'}`} 
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                )}

                <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center gap-2">
                      <span className="text-xs text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: SUBJECT_COLORS[task.subject as string] || '#999' }}>
                          {task.subject}
                      </span>
                      {task.isTestPrep && (
                          <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded border border-red-200 font-bold flex items-center gap-1">
                              <GraduationCap size={12} /> 明日考测
                          </span>
                      )}
                      {task.targetDuration && (
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-mono flex items-center gap-1 ${isOvertime ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                              <Clock size={10} /> 限时 {Math.round(task.targetDuration / 60)} 分
                          </span>
                      )}
                   </div>
                   <div className="flex gap-1">
                      <button onClick={() => startEdit(task)} className="text-gray-400 hover:text-indigo-500 p-1" title="编辑"><Edit2 size={14}/></button>
                      <button onClick={() => removeTask(task.id)} className="text-gray-400 hover:text-red-500 p-1" title="删除"><Trash2 size={14}/></button>
                   </div>
                </div>
                
                <div className="flex gap-3 mb-3">
                    {task.imageUrls && task.imageUrls.length > 0 && (
                        <div className="flex -space-x-2 overflow-hidden py-1">
                            {task.imageUrls.map((img, i) => (
                                <img key={i} src={img} className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" alt="task attachment" />
                            ))}
                        </div>
                    )}
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-800 text-sm md:text-base leading-snug">{task.content}</h4>
                    </div>
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-end gap-3 mt-2">
                   <div className={`flex items-center gap-2 font-mono text-lg px-3 py-1 rounded-lg transition-colors ${isOvertime ? 'bg-red-100 text-red-600 font-bold animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
                      {isOvertime ? <AlertCircle size={16} /> : <Clock size={16} className={activeTaskId === task.id ? "text-green-500" : "text-gray-400"} />}
                      {formatTime(task.timeSpent)}
                      {task.targetDuration && <span className="text-xs text-gray-400 opacity-60">/ {formatTime(task.targetDuration)}</span>}
                   </div>
                   
                   <div className="flex gap-2 w-full md:w-auto">
                      {task.isTestPrep && (
                          <button 
                             onClick={() => onStartReview(task)}
                             className="flex-1 md:flex-initial px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center justify-center gap-1"
                          >
                             <GraduationCap size={16} /> 监督复习
                          </button>
                      )}
                      
                      <button 
                          onClick={() => toggleTimer(task.id)}
                          className={`flex-1 md:flex-initial p-2 rounded-lg text-white transition-colors shadow-md flex justify-center ${activeTaskId === task.id ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                      >
                          {activeTaskId === task.id ? <Square size={20} fill="white" /> : <Play size={20} fill="white" />}
                      </button>
                      
                      <button 
                          onClick={() => completeTask(task.id)}
                          className="flex-1 md:flex-initial p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-md transition-colors flex justify-center"
                      >
                          <Check size={20} />
                      </button>
                   </div>
                </div>
             </div>
             );
         })}

         {/* Done */}
         {tasks.filter(t => t.status === 'done').length > 0 && (
            <div className="mt-8">
               <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">已完成 (Done)</h4>
               <div className="space-y-2 opacity-60">
                 {tasks.filter(t => t.status === 'done').map(task => (
                    <div key={task.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 text-green-600 p-1 rounded-full">
                                <Check size={12} />
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 block">{task.subject}</span>
                                <span className="text-sm text-gray-600 line-through decoration-gray-400">{task.content}</span>
                            </div>
                        </div>
                        <span className="font-mono text-xs text-gray-400">{formatTime(task.timeSpent)}</span>
                    </div>
                 ))}
               </div>
            </div>
         )}
      </div>
    </div>
  );
};

export default HomeworkHelper;
