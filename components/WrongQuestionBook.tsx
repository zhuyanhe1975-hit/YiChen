import React from 'react';
import { WrongQuestion, Subject } from '../types';
import { BookOpen, Calendar, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface WrongQuestionBookProps {
  questions: WrongQuestion[];
}

const WrongQuestionBook: React.FC<WrongQuestionBookProps> = ({ questions }) => {
  const [selectedQ, setSelectedQ] = React.useState<WrongQuestion | null>(null);

  if (questions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white rounded-lg shadow-md border-2 border-gray-100">
        <BookOpen size={64} className="mb-4 text-orange-200" />
        <p className="text-lg">精神时光屋是空的！</p>
        <p className="text-sm text-gray-500">在对话中上传错题，点击“加入错题本”开始修炼。</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 bg-orange-50 rounded-lg p-4">
      {/* List */}
      <div className={`${selectedQ ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-1/3 gap-3 overflow-y-auto pr-2`}>
        <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2 mb-2">
            <BookOpen size={20}/> 错题记录 ({questions.length})
        </h3>
        {questions.map(q => (
          <div 
            key={q.id}
            onClick={() => setSelectedQ(q)}
            className={`p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md ${selectedQ?.id === q.id ? 'bg-orange-500 text-white border-orange-600 shadow-lg scale-[1.02]' : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'}`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${selectedQ?.id === q.id ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'}`}>
                {q.subject}
              </span>
              <span className="text-xs opacity-70 flex items-center gap-1">
                  <Calendar size={10} /> {new Date(parseInt(q.id)).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm line-clamp-2 font-medium">{q.topic || "未知知识点"}</p>
            <p className="text-xs opacity-70 line-clamp-1 mt-1">{q.textContent.substring(0, 30)}...</p>
          </div>
        ))}
      </div>

      {/* Detail */}
      <div className={`${!selectedQ ? 'hidden md:flex' : 'flex'} flex-1 bg-white rounded-xl shadow-sm border border-orange-100 flex-col overflow-hidden`}>
        {selectedQ ? (
            <>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-orange-50/50">
                    <button onClick={() => setSelectedQ(null)} className="md:hidden text-gray-500 flex items-center text-sm">
                        ⬅ 返回
                    </button>
                    <span className="font-bold text-gray-700">{selectedQ.subject} - {selectedQ.topic}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {selectedQ.imageUrl && (
                        <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm max-w-sm">
                            <img src={selectedQ.imageUrl} alt="Problem" className="w-full" />
                        </div>
                    )}
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
  );
};

export default WrongQuestionBook;
