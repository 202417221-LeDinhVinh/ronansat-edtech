"use client";

import { useState } from "react";
import { Flag, X } from "lucide-react";

interface QuestionViewerProps {    // Khung câu hỏi, khung này k được tự lưu kết quả bài thi => Phải dùng 2 hàm onAnswerSelect và onToggleFlag để báo lên hệ thống 
    question: any;            // nội dung câu hỏi
    userAnswer: string;       // đáp án user đang chọn (nếu có)
    onAnswerSelect: (questionId: string, choice: string) => void;     // Hàm xử lý việc chọn đáp án, cần lưu câu nào và chọn choice gì
                                                        // => void để báo hệ thống là hàm này chỉ có nhiệm vụ gửi các thông tin này, k trả lại gì cả
    isFlagged: boolean;      // cho biết câu này có bị flag k
    onToggleFlag: (questionId: string) => void;                       // Hàm xử lý bật flag cho câu nào, chỉ cần lưu id câu hỏi
    index: number;           // số thứ tự của câu hỏi
}


/**
 * Ở file khác nếu muốn dùng thẻ QuestionViewer thì sẽ truyền vào từng giá trị dưới và truyền vào hàm ở chỗ onAnswerSelect và onToggleFlag
 */


export default function QuestionViewer({
    question,
    userAnswer,
    onAnswerSelect,                              
    isFlagged,
    onToggleFlag,
    index
}: QuestionViewerProps) {
    // Danh sách 4 câu hỏi
    const optionLabels = ["A", "B", "C", "D"];

    // danh sách ghi nhớ các đáp án đã bị loại trừ, các phần tử là string và crossedOut là 1 mảng
    const [crossedOut, setCrossedOut] = useState<string[]>([]);


    // Hàm chạy khi ấn vào dấu X cạnh đáp án 
    const toggleCrossOut = (e: React.MouseEvent, choice: string) => {  
        // propagation: sự truyền bá
        e.stopPropagation();  // X thường đè lên khung của option. Khi ấn X, chuột sẽ xuyên qua X và chọn đáp án đó thay vì loại nó -> Dòng này báo học sinh chỉ đang tương tác với dấu X, đừng truyền xuống dưới mà chọn đáp án này
        if (crossedOut.includes(choice)) {        // Nếu ấn X và danh sách các đáp bị crossed đã có choice vừa ấn => Xóa option đó khỏi danh sách
            setCrossedOut(crossedOut.filter(c => c !== choice));     // filter dùng cho mảng và đi qua từng món đồ, nếu thỏa mãn điều kiện thì Add và danh sách mới, nếu rớt thì bỏ
                                           // Hãy duyệt qua từng chữ c trong sổ, nếu c khác choice mà mình vừa cross thì giữ
        } else {
            setCrossedOut([...crossedOut, choice]);   // Nếu ấn X mà chưa có option đó trong danh sách => Tạo 1 bản copy chứa các cái cũ rồi thêm choice đó vào bản copy rồi update vào bản gốc
        }
    };

    return (   // Chia màn hình làm 2 nửa
        <div className="flex-1 flex bg-[#f7f8f9] h-[calc(100vh-8rem)] mt-16 mb-16 overflow-hidden">

            {/* Left Panel: Passage Text (if exists) */}
            <div className={`
        ${question.passage ? "w-1/2 border-r border-slate-300" : "hidden"} 
        h-full overflow-y-auto p-8 lg:p-12
      `}>
                {question.passage && (
                    <div className="bg-white p-8 border border-slate-200 text-lg leading-relaxed font-serif text-slate-800 rounded-lg selection:bg-yellow-200 selection:text-black">
                        {/* trong văn bản thường dùng Enter để xuống dòng, trình duyệt k hiểu => Thay đó là <br /> (thẻ xuống dòng HTML) */}
                        <div dangerouslySetInnerHTML={{ __html: question.passage.replace(/\n/g, '<br/>') }} />
                    </div>
                )}
            </div>

            {/* Right Panel: Question & Answers */}
            <div className={`
        ${question.passage ? "w-1/2" : "w-full max-w-4xl mx-auto"} 
        h-full overflow-y-auto p-8 lg:p-12 bg-white
      `}>
                <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-900 text-white w-8 h-8 flex items-center justify-center font-bold text-lg rounded-sm">
                            {index + 1}
                        </div>
                        {isFlagged && <div className="text-sm font-semibold text-amber-600 flex items-center gap-1"><Flag className="w-4 h-4 fill-amber-500" /> Marked for Review</div>}
                    </div>

                    <button
                        onClick={() => onToggleFlag(question._id)}    // Khi ấn vào nút Flag thì truyền question id vào hàm onToggleFlag để lưu lại
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-semibold text-sm border ${isFlagged
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                            }`}
                    >
                        <Flag className={`w-4 h-4 ${isFlagged ? "fill-amber-500" : ""}`} />
                        Mark for Review
                    </button>
                </div>

                <div className="prose max-w-none text-xl text-slate-900 mb-8 font-medium leading-relaxed">
                    {question.questionText}
                </div>

                <div className="space-y-4">              
                    {question.choices.map((choice: string, i: number) => {    // Loop qua từng choice trong danh sách choices, mỗi lượt lấy ra choice (nội dung của đáp án) và i ( index 0 1 2 3 )
                        const isSelected = userAnswer === choice;             // so sánh userAnswer (đáp án học sinh đang click) với choice (đáp án trong danh sách), nếu trùng thì isSelected sẽ = true, k thì = false
                        const isCrossed = crossedOut.includes(choice);        // Kiểm tra danh sách crossedOut có bao gồm lựa chọn đó không, có thì true, k thì false
                        const label = optionLabels[i] || "";                  // gán A B C D cho choice này dựa vào index từ mảng optionLabels , 0 = A, 1 = B, 2 = C, 3 = D
                                                                              // Nếu có 5 đáp án -> đi vào optionLabels[4] sẽ gây sập => Trả về rỗng tránh sập

                        // Đoạn này đi qua từng đáp án để xem nó có được select chưa, bị crossed chưa để hiện effect phù hợp
                        return (
                            <div
                                key={i}
                                className={`relative flex items-center group cursor-pointer`}        
                                onClick={() => !isCrossed && onAnswerSelect(question._id, choice)}   // Nếu !isCrossed chưa crossed thì mới được khoanh
                                                             // Nếu chưa crossed và click vào đáp án thì truyền id mã câu và nội dung đáp án (choice) về để máy chủ chấm điểm
                            >
                                <button
                                    onClick={(e) => toggleCrossOut(e, choice)}       // Sự kiện Cross out khi ấn vào X, truyền vào sự kiện e để chặn xuyên thấu và nội dung đáp án 
                                    className="absolute -left-12 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                                    title="Cross out choice"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <div className={`
                   flex-1 flex items-start gap-4 p-4 border-2 rounded-lg transition-all
                   ${isSelected ? "border-blue-600 bg-blue-50" : "border-slate-300 bg-white hover:border-slate-500"}
                   ${isCrossed ? "opacity-40 grayscale pointer-events-none" : ""}
                 `}>
                                    {/* Radio Button simulating Bluebook bubble */}
                                    <div className="pt-1">
                                        <div className={`
                        w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold
                        ${isSelected ? "border-blue-600 font-bold" : "border-slate-400 text-slate-500"}
                      `}>
                                            {isSelected ? (
                                                <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center rounded-full">
                                                    {label}
                                                </div>
                                            ) : (
                                                label
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 pt-1.5 text-lg text-slate-800 font-medium">
                                        <span className={isCrossed ? "line-through text-slate-400" : ""}>
                                            {choice}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}
