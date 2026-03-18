// TestEngine cũng có Header và Footer nhưng nó chỉ là UI, giao diện thôi
// Header và Footer của file này thì tải câu hỏi, tính toán lùi từng giây, lưu kết quả bài làm => Bộ não

"use client";

import { useState } from "react";     // biến nhớ trạng thái
import {  EyeOff, Eye, ChevronLeft, ChevronRight, Calculator, Check, Settings, Flag } from "lucide-react";  // Các icons

import { Button } from "antd";

interface TestHeaderProps {                     //Khung các dữ liệu cần cho Header
    sectionName: string;                        // Tên section (Verbal/Math)
    timeRemaining: number; // in seconds  
    onTimeUp: () => void;                       // Hàm làm gì khi hết giờ
    isTimerHidden: boolean;                     // Đồng  hồ có đang ẩn k
    setIsTimerHidden: (hide: boolean) => void;  // Cầu giao để bật bật trạng thái đồng hồ
}

export function TestHeader({
    sectionName,
    timeRemaining,
    onTimeUp,                              // FIX
    isTimerHidden,
    setIsTimerHidden,
    onToggleCalculator
}: TestHeaderProps & { onToggleCalculator?: () => void }) {     // Thêm hàm bật tắt Desmos vào khung yêu cầu kia -> ? vì không có hàm này cũng k sao

    const formatTime = (seconds: number) => {    // Format số giây thành số phút + số giây thừa
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`; 
        // trau chuốt lại 2 biến mins và secs ->  5:9 thành 05:09
        // padStart: check đoạn này lúc nào cũng phải có 2 ký tự, k có thì thêm 0 vào trước 
    };

    return (    // Giao diện header: chia làm 3 vùng: Trái là tên Section, giữa là đồng hồ, phải là các công cụ máy tính, nộp bài
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 z-50 fixed top-0 w-full left-0 right-0">
            <div className="flex-1 flex items-center">
                <h1 className="font-bold text-lg text-slate-800 tracking-tight">
                    {sectionName}          {/** Phần tên Section */}
                </h1>
            </div>

            <div className="flex-1 flex justify-center items-center">
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-3">
                        {!isTimerHidden ? (                        // Kiểm tra trạng thái trước xem có đang hidden không, không thì hiện timer
                            <span className={`text-xl font-mono font-bold tracking-wider ${timeRemaining < 300 ? "text-red-600 animate-pulse" : "text-slate-900"
                                }`}>
                                {formatTime(timeRemaining)}         {/** Hiện timer đã được format, nếu còn 5 phút thì text chuyển đỏ */}
                            </span>
                        ) : (
                            <span className="text-xl font-mono text-slate-400 tracking-wider">
                                --:--
                            </span>
                        )}

                        <Button              // Nút ẩn bật tắt timer
                            onClick={() => setIsTimerHidden(!isTimerHidden)}    // Hàm đảo giá trị khi ản vào nút đó
                            type="default"  
                            icon={isTimerHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}    // Đổi icon tùy theo trạng thái
                        >
                            <span className="hidden sm:inline">{isTimerHidden ? "Show" : "Hide"}</span>         {/** Hiện chữ Show hay Hide - trạng thái của timer */}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex justify-end items-center gap-4">
                <Button
                    onClick={onToggleCalculator}                    // Bấm nút bật tắt Desmos
                    icon={<Calculator className="w-4 h-4" />}     
                    type="default"
                >
                    <span className="hidden sm:inline">Calculator</span>
                </Button>

                <Button type="primary">    {/** Nút nộp bài nhưng chưa có hành động onClick nào cả
                 *                           CẦN FIX, nút này đang k liên quan tới TestEngine, 
                 */}
                    End Section
                </Button>
            </div>
        </header>
    );
}

interface TestFooterProps {      // Khung các data cần có của Footer
    currentIndex: number;     // Lấy index của câu hiện tại
    totalQuestions: number;   // lấy tổng số câu
    onNext: () => void;                   // các hàm di chuyển giữa các câu
    onPrev: () => void;
    onJump: (index: number) => void;
    answers: Record<string, string>;   // lưu thành 2 cột: id câu và lựa chọn
    flagged: Record<string, boolean>;  // giống trên, cột 2 là bool về việc có bật hay tắt flag
    questions: any[];                  // mảng chứa các câu hỏi, any[] -> Mảng có thể chứa mọi loại dữ liệu bên trong 
}

export function TestFooter({
    currentIndex,
    totalQuestions,
    onNext,
    onPrev,
    onJump,
    answers,
    flagged,
    questions
}: TestFooterProps) {



    const [isGridOpen, setIsGridOpen] = useState(false);  // Grid là khung hiển thị các câu hỏi ở Footer, ấn vào thì hiện ra khung này để di chuyển giữa các câu

    return (
        <>
            {isGridOpen && (   // Grid mà đang mở thì mới chạy
                <div className="fixed inset-0 bottom-16 bg-white/95 backdrop-blur-sm z-40 border-t border-slate-200 flex flex-col pt-16 mt-16)] transition-all animate-in slide-in-from-bottom-5">
                    <div className="p-8 max-w-5xl mx-auto w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-slate-800 text-center flex-1">Select a Question</h3>
                            <Button       // Nút close tắt Grid
                                onClick={() => setIsGridOpen(false)}
                            >
                                Close
                            </Button>
                        </div>

                        <div className="flex gap-6 mb-8 justify-center text-sm font-medium text-slate-600">
                            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-slate-900 rounded-sm"></div> Current</div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 border border-blue-600 bg-blue-50 text-blue-600 flex items-center justify-center rounded-sm"><Check className="w-3 h-3" /></div> Answered</div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-slate-100 border border-slate-300 rounded-sm hover:border-slate-800"></div> Unanswered</div>
                            <div className="flex items-center gap-2"><Flag className="w-4 h-4 fill-amber-400 text-amber-500" /> For Review</div>
                        </div>

                        <div className="grid grid-cols-10 gap-3 max-w-4xl mx-auto">
                            {questions.map((q, i) => {                         // Nhà máy đúc các nút bấm các câu trong đề
                                const isAnswered = !!answers[q._id];         // Lấy biến bool check xem chúng đã được chọn và flagged chưa
                                const isFlagged = !!flagged[q._id];
                                const isCurrent = i === currentIndex;        // Check xem đây có phải câu hiện tại k

                                return (
                                    <button
                                        key={q._id}
                                        onClick={() => {        // Khi ấn 1 nút để nhảy tới câu khác thì tắt Grid và Jump tới câu đó
                                            onJump(i);
                                            setIsGridOpen(false); 
                                        }}
                                        className={`
                        relative w-12 h-12 flex items-center justify-center rounded text-sm font-semibold transition-all border-2 
                        ${isCurrent ? 'bg-slate-900 border-slate-900 text-white transform scale-105 z-10' :
                                                isAnswered ? 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100 hover:border-blue-300' :
                                                    'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}
                      `}
                                    >
                                        {isAnswered && !isCurrent && <Check className="w-4 h-4 absolute top-0.5 right-0.5 opacity-50" />}    { /** Nếu đã trả lời và k phải câu hiện tại thì hiện dấu tick */}
                                        {i + 1}     {/** In số câu lên ô đó */}
                                        {isFlagged && ( 
                                            <div className="absolute -top-2 -right-2">
                                                <Flag className="w-5 h-5 fill-amber-400 text-amber-500" />       {/** nếu bị flag thì thêm biểu tượng flag vào ô đó */}
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-between px-6 z-50">
                <div className="flex-1 flex items-center">
                    <span className="font-semibold text-slate-700">
                        {sessionStorage.getItem('testName') || "Practice Test"}    {/** Lấy tên bài thi để hiện bên trái */}
                    </span>
                </div>

                <div className="flex-1 flex justify-center items-center">
                    <Button
                        onClick={() => setIsGridOpen(!isGridOpen)}         // Nút bật tắt Grid
                        shape="round"
                        size="large"
                        className="font-bold text-slate-800"
                    >
                        <span>Question {currentIndex + 1} of {totalQuestions}</span>      {/** Hiện vị trí hiện tại vd: Question 1 of 27 */}
                        <ChevronRight className={`w-4 h-4 transition-transform ${isGridOpen ? '-rotate-90' : 'rotate-90'} inline-block ml-2`} />              {/** Mũi tên Interactice xoay theo trạng thái Grid khi mở, đóng Grid */}    
                    </Button>
                </div>

                <div className="flex-1 flex justify-end items-center gap-3">     
                    <Button                               // Nút Prev
                        onClick={onPrev}
                        disabled={currentIndex === 0}
                        type="primary"
                        icon={<ChevronLeft className="w-4 h-4" />}
                        size="large"
                    >
                        Back
                    </Button>

                    <Button
                        onClick={onNext}                                      // Nút Next
                        disabled={currentIndex === totalQuestions - 1}
                        type="primary"
                        size="large"
                    >
                        <span className="flex items-center gap-1">Next <ChevronRight className="w-4 h-4" /></span>
                    </Button>
                </div>
            </footer>
        </>
    );
}
