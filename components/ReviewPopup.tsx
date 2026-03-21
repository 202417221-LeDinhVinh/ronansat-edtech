"use client";

import { useState } from "react";
import { X, Sparkles, Calculator, BookOpen, AlertCircle } from "lucide-react";
import DesmosCalculator from "@/components/DesmosCalculator"; 
import ReviewChatbot from "@/components/ReviewChatbot";       

interface ReviewPopupProps {
    ans: any;
    onClose: () => void;
    expandedExplanation: string | undefined;
    loadingExplanation: boolean;
    onExpandExplanation: (qId: string) => void;
}

export default function ReviewPopup({ ans, onClose, expandedExplanation, loadingExplanation, onExpandExplanation }: ReviewPopupProps) {
    const q = ans?.questionId;
    
    const [showCalculator, setShowCalculator] = useState(false);
    const [showAI, setShowAI] = useState(false);
    const [isExplanationVisible, setIsExplanationVisible] = useState(false);

    if (!q) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col items-center justify-center gap-4">
                <p className="text-red-500 font-bold text-lg">Question data is missing or corrupted.</p>
                <button onClick={onClose} className="px-6 py-2 bg-slate-300 hover:bg-slate-400 rounded-md font-medium transition">Close</button>
            </div>
        );
    }

    const isMath = q?.subject?.toLowerCase() === "math" || q?.domain?.toLowerCase()?.includes("math");
    const optionLabels = ["A", "B", "C", "D"];
    
    // Lấy danh sách 4 đáp án (nếu API có trả về)
    const choices = q?.choices || [];

    const handleToggleExplanation = () => {
        if (!isExplanationVisible && !expandedExplanation) {
            onExpandExplanation(q._id);
        }
        setIsExplanationVisible(!isExplanationVisible);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#f7f8f9] flex flex-col">
            
            <DesmosCalculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} />

            {/* Header */}
            <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-slate-800">Review Question</span>
                        {q.domain && <span className="text-sm bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">{q.domain}</span>}
                    </div>
                    {isMath && (
                        <button onClick={() => setShowCalculator(!showCalculator)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${showCalculator ? "bg-slate-800 text-white" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"}`}>
                            <Calculator className="w-4 h-4" /> Desmos
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleToggleExplanation} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${isExplanationVisible ? "bg-blue-600 text-white shadow-inner" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"}`}>
                        <BookOpen className="w-4 h-4" /> 
                        {loadingExplanation ? "Loading..." : "Explanation"}
                    </button>
                    <button onClick={() => setShowAI(!showAI)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${showAI ? "bg-indigo-600 text-white shadow-inner" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"}`}>
                        <Sparkles className="w-4 h-4" /> Ask AI Tutor
                    </button>
                    <div className="w-px h-6 bg-slate-300 mx-1"></div>
                    <button onClick={onClose} className="p-2 bg-slate-200 hover:bg-red-100 hover:text-red-600 rounded-md transition flex items-center gap-2 font-medium text-sm">
                        <X className="w-4 h-4" /> Close
                    </button>
                </div>
            </div>

            {/* Nội dung chính */}
            <div className="flex-1 overflow-hidden flex relative">
                
                <div className="flex-1 flex bg-[#f7f8f9] h-full overflow-hidden">
                    {/* Cột Passage */}
                    <div className={`${q.passage ? "w-1/2 border-r border-slate-300" : "hidden"} h-full overflow-y-auto p-8 lg:p-12`}>
                        {q.imageUrl && (
                            <div className="flex justify-center w-full bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                                <img src={q.imageUrl} alt="Reference" className="max-w-full max-h-[350px] object-contain rounded shadow-sm" />
                            </div>
                        )}
                        {q.passage && (
                            <div className="bg-white p-8 border border-slate-200 text-lg leading-relaxed font-serif text-slate-800 rounded-lg shadow-sm">
                                <div dangerouslySetInnerHTML={{ __html: q.passage.replace(/\n/g, '<br/>') }} />
                            </div>
                        )}
                    </div>

                    {/* Cột Câu hỏi & Lựa chọn */}
                    <div className={`${q.passage ? "w-1/2" : "w-full max-w-4xl mx-auto"} h-full overflow-y-auto p-8 lg:p-12 bg-white shadow-sm border-x border-slate-200`}>
                        
                        {!q.passage && q.imageUrl && (
                            <div className="flex justify-center w-full bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                                <img src={q.imageUrl} alt="Reference" className="max-w-full max-h-[350px] object-contain rounded shadow-sm" />
                            </div>
                        )}

                        <div className="prose max-w-none text-xl text-slate-900 mb-8 font-medium leading-relaxed">
                            {q.questionText}
                        </div>

                        {/* KIỂM TRA DỮ LIỆU CHOICES TỪ API */}
                        {choices.length === 0 ? (
                            // Giao diện dự phòng nếu API thiếu mảng 'choices'
                            <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg text-amber-900">
                                <div className="flex items-center gap-2 font-bold mb-2">
                                    <AlertCircle className="w-5 h-5" />
                                    Thiếu dữ liệu "choices" từ Backend API!
                                </div>
                                <p className="text-sm mb-4">Để hiển thị bảng A B C D, bạn cần update API lấy lịch sử test (app/api/results/route.ts) để trả về mảng <code className="bg-amber-100 px-1 rounded">choices</code> của từng câu hỏi.</p>
                                
                                <div className="bg-white p-4 rounded border border-amber-100 space-y-3">
                                    <div className="flex items-start gap-2">
                                        <span className="font-semibold text-slate-500 whitespace-nowrap">Học sinh chọn:</span>
                                        <span className={`font-bold ${ans.isCorrect ? "text-emerald-600" : "text-red-600"}`}>
                                            {ans.userAnswer || "Omitted"}
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="font-semibold text-slate-500 whitespace-nowrap">Đáp án đúng:</span>
                                        <span className="font-bold text-emerald-600">{q.correctAnswer}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Vẽ giao diện 4 đáp án y hệt thiết kế
                            <div className="space-y-4">
                                {choices.map((choice: string, i: number) => {
                                    const isUserChoice = ans?.userAnswer === choice;
                                    const isCorrectChoice = q?.correctAnswer === choice;
                                    
                                    let bgColor = "bg-white border-slate-300 hover:border-slate-400";
                                    let circleColor = "border-slate-400 text-slate-500 bg-white";

                                    if (isCorrectChoice) {
                                        // LUÔN XANH cho đáp án đúng
                                        bgColor = "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm";
                                        circleColor = "bg-emerald-600 border-emerald-600 text-white";
                                    } else if (isUserChoice && !isCorrectChoice) {
                                        // CHỈ ĐỎ khi học sinh khoanh sai
                                        bgColor = "bg-red-50 border-red-500 text-red-900 shadow-sm";
                                        circleColor = "bg-red-500 border-red-500 text-white";
                                    }

                                    return (
                                        <div key={i} className={`flex items-start gap-4 p-4 border-2 rounded-lg transition-all ${bgColor}`}>
                                            <div className="pt-1">
                                                <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 font-bold ${circleColor}`}>
                                                    {optionLabels[i] || ""}
                                                </div>
                                            </div>
                                            <span className="flex-1 pt-1.5 text-lg font-medium">{choice}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {isExplanationVisible && expandedExplanation && (
                            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg animate-in slide-in-from-top-4 duration-300 shadow-inner">
                                <h3 className="font-bold text-lg text-blue-900 mb-2 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5" /> Explanation
                                </h3>
                                <div className="whitespace-pre-wrap text-blue-900/80 leading-relaxed text-base">
                                    {expandedExplanation}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {showAI && (
                    <div className="w-[450px] border-l border-slate-300 bg-white flex flex-col shrink-0 animate-in slide-in-from-right-8 duration-300 shadow-xl z-20">
                        <div className="bg-indigo-600 text-white px-4 py-3 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-200" />
                                <div>
                                    <p className="font-bold text-sm">AI Study Tutor</p>
                                    <p className="text-xs text-indigo-200">Powered by Gemini</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAI(false)} className="p-1.5 hover:bg-indigo-500 rounded-full transition"><X className="w-4 h-4"/></button>
                        </div>
                        <div className="flex-1 overflow-hidden relative bg-slate-50">
                             <ReviewChatbot questionId={q._id} questionText={q.questionText} headless />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}