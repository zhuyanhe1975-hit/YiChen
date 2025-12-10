
import React, { useState } from 'react';
import { MATH_GAME_LEVELS } from '../constants';
import { Brain, ChevronRight, Check, X, Lightbulb } from 'lucide-react';

const MathGame: React.FC = () => {
  const [levelIndex, setLevelIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const level = MATH_GAME_LEVELS[levelIndex];

  const handleSubmit = () => {
    if (selectedOption !== null) {
      setIsSubmitted(true);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsSubmitted(false);
    setLevelIndex((prev) => (prev + 1) % MATH_GAME_LEVELS.length);
  };

  const isCorrect = selectedOption === level.correctIndex;

  return (
    <div className="h-full flex flex-col bg-indigo-50 rounded-xl overflow-hidden border-2 border-indigo-200">
      <div className="bg-indigo-600 p-4 text-white flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Brain />
          <span>几何巧思 - {level.title}</span>
        </div>
        <span className="text-sm bg-indigo-700 px-2 py-1 rounded">Level {levelIndex + 1}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
        {/* Visual Area */}
        <div className="w-full max-w-lg bg-white h-64 rounded-xl border-2 border-indigo-100 shadow-inner mb-6 flex items-center justify-center relative overflow-hidden">
             {/* Placeholder for SVG content based on Problem Type */}
             <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
             {levelIndex === 0 && (
                // SAS Triangle Demo
                <svg viewBox="0 0 400 200" className="w-full h-full p-4">
                   <path d="M50,150 L100,50 L150,150 Z" fill="none" stroke="#4f46e5" strokeWidth="3"/>
                   <text x="40" y="160" className="text-xs">B</text>
                   <text x="100" y="40" className="text-xs">A</text>
                   <text x="160" y="160" className="text-xs">C</text>

                   <path d="M250,150 L300,50 L350,150 Z" fill="none" stroke="#4f46e5" strokeWidth="3"/>
                   <text x="240" y="160" className="text-xs">E</text>
                   <text x="300" y="40" className="text-xs">D</text>
                   <text x="360" y="160" className="text-xs">F</text>
                   
                   {/* Marks */}
                   <line x1="60" y1="100" x2="80" y2="100" stroke="red" strokeWidth="2" />
                   <line x1="260" y1="100" x2="280" y2="100" stroke="red" strokeWidth="2" /> {/* AB=DE */}

                   <line x1="80" y1="150" x2="80" y2="140" stroke="red" strokeWidth="2" /> 
                   <line x1="85" y1="150" x2="85" y2="140" stroke="red" strokeWidth="2" /> {/* BC=EF */}

                   <line x1="280" y1="150" x2="280" y2="140" stroke="red" strokeWidth="2" /> 
                   <line x1="285" y1="150" x2="285" y2="140" stroke="red" strokeWidth="2" /> 
                </svg>
             )}
             {levelIndex === 1 && (
                // Parallel Lines
                <svg viewBox="0 0 400 200" className="w-full h-full p-4">
                    <line x1="50" y1="50" x2="350" y2="50" stroke="#4f46e5" strokeWidth="3" />
                    <text x="360" y="55">a</text>
                    <line x1="50" y1="150" x2="350" y2="150" stroke="#4f46e5" strokeWidth="3" />
                    <text x="360" y="155">b</text>
                    <line x1="100" y1="180" x2="250" y2="20" stroke="black" strokeWidth="2" />
                    
                    <text x="185" y="60" fill="red" fontWeight="bold">∠1</text>
                    <text x="140" y="145" fill="red" fontWeight="bold">∠2</text>
                </svg>
             )}
             {levelIndex === 2 && (
                // Right Triangle
                <svg viewBox="0 0 400 200" className="w-full h-full p-4">
                    <path d="M150,150 L150,50 L250,150 Z" fill="none" stroke="#4f46e5" strokeWidth="3"/>
                    <rect x="150" y="130" width="20" height="20" fill="none" stroke="black" />
                    <text x="130" y="100" className="text-lg">3</text>
                    <text x="200" y="170" className="text-lg">4</text>
                    <text x="210" y="90" className="text-lg text-red-500">?</text>
                </svg>
             )}
        </div>

        {/* Question Area */}
        <div className="w-full max-w-lg">
           <p className="text-gray-800 font-medium mb-4 text-lg">{level.description}</p>
           
           <div className="grid grid-cols-1 gap-3">
              {level.options.map((opt, idx) => {
                 let btnClass = "bg-white border-gray-200 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300";
                 
                 if (isSubmitted) {
                    if (idx === level.correctIndex) {
                        btnClass = "bg-green-100 border-green-500 text-green-700 font-bold";
                    } else if (idx === selectedOption) {
                        btnClass = "bg-red-100 border-red-500 text-red-700";
                    } else {
                        btnClass = "bg-gray-50 text-gray-400 opacity-50";
                    }
                 } else if (selectedOption === idx) {
                    btnClass = "bg-indigo-100 border-indigo-500 text-indigo-700 font-bold ring-2 ring-indigo-200";
                 }

                 return (
                    <button 
                       key={idx}
                       disabled={isSubmitted}
                       onClick={() => setSelectedOption(idx)}
                       className={`p-4 rounded-xl border-2 text-left transition-all flex justify-between items-center ${btnClass}`}
                    >
                       <span>{["A", "B", "C", "D"][idx]}. {opt}</span>
                       {isSubmitted && idx === level.correctIndex && <Check size={20} />}
                       {isSubmitted && idx === selectedOption && idx !== level.correctIndex && <X size={20} />}
                    </button>
                 );
              })}
           </div>
        </div>

        {/* Feedback Area */}
        {isSubmitted && (
           <div className={`w-full max-w-lg mt-6 p-4 rounded-xl animate-in fade-in slide-in-from-bottom-4 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
              <h4 className={`font-bold mb-2 flex items-center gap-2 ${isCorrect ? 'text-green-700' : 'text-orange-700'}`}>
                 {isCorrect ? <Check /> : <Lightbulb />}
                 {isCorrect ? "回答正确！" : "解析思路"}
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                 {level.explanation}
              </p>
              <button 
                 onClick={handleNext}
                 className="mt-4 w-full py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2"
              >
                 下一题 <ChevronRight size={18} />
              </button>
           </div>
        )}

        {!isSubmitted && selectedOption !== null && (
            <button 
                onClick={handleSubmit}
                className="mt-6 w-full max-w-lg py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
                提交答案
            </button>
        )}

      </div>
    </div>
  );
};

export default MathGame;
