import { CheckCircle, XCircle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

interface ReviewCardProps {              // Hợp đồng yêu cầu component cha phải cung cấp dữ liệu dưới
    idx: number;        // index của câu hỏi 0 1 2...
    ans: any;           // ans là 1 object chứa Hs chọn gì, kết quả đúng hay sai, toàn bộ thông tin của đề bài câu đó
          // ans là 1 object chứa 1 object khác (Nested Object)
    loadingExplanation: boolean;     //   loading 
    expandedExplanation?: string;    //  Lời giải thích của câu đó, có ? nghĩa là optional (k phải câu nào cũng có)
    isActiveChat: boolean;           // Biến check học sinh có đang chat không
    onExpandExplanation: (questionId: string) => void;                    // Thẻ cha khi gọi thẻ con này sẽ truyền vào chỗ này id câu để hàm lấy explanation của câu đó
    onToggleChat: (questionId: string, questionText: string) => void;     // truyền vào 2 biến này để thẻ tra xử lý bật tắt khung chat AI
}

export default function ReviewCard({
    idx,
    ans,
    loadingExplanation,
    expandedExplanation,
    isActiveChat,
    onExpandExplanation,
    onToggleChat
}: ReviewCardProps) {

    const isCorrect = ans.isCorrect;   // Lấy trạng thái câu đúng hay sai
    const q = ans.questionId;          // q = 1 object chứa bản thân dữ liệu câu hỏi, ví dụ như nội dung chữ, đáp án đúng
                  // Thẻ cha sẽ truyền vào 1 object ở chỗ ans.questionId

    return (  
 
        // Logic dưới khi chưa fix: câu đó đúng thì hiện kết quả cơ bản thôi, sai thì mở khóa 3 tính năng: Hiện đáp án đúng, chat AI, và lời giải chi tiết
        // Đã fix: Làm đúng cũng được hỏi AI và lời giải 
         
        <div className={`rounded-lg border overflow-hidden ${isCorrect ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}>

            {/* Answer Header */}
            <div className="flex items-start justify-between p-4">
                <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center font-bold text-white mt-0.5 ${isCorrect ? "bg-emerald-500" : "bg-red-500"}`}>
                        {idx + 1}   {/** In ra đây là câu hỏi số mấy = index câu đó + 1 */}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-900">
                            Your answer: <span className="font-bold">{ans.userAnswer || "Omitted"}</span>     {/** Hiển thị ans của user, nếu chưa chọn thì in ra Omitted */}
                        </p>
                        {!isCorrect && q && (    // Xử lý khi đáp án sai và lấy được data của câu hỏi (q) -> Nếu sai thì in ra đáp án đúng (q.correctAnswer)
                            <p className="text-sm font-medium text-emerald-700 mt-1">
                                Correct answer: <span className="font-bold">{q.correctAnswer}</span>    
                            </p>
                        )}
                        {!isCorrect && q && (
                            <p className="text-xs text-slate-500 mt-2 line-clamp-2">{q.questionText}</p>      // In cả nội dung của câu sai đó ra
                        )}
                    </div>
                </div>
                <div className="shrink-0 ml-3">
                    {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                    )}
                </div>
            </div>

            {/* Actions — wrong answers only */}
            {q && (
                <>
                     {/** Nếu ấn vào nút expand thì lấy question id để tìm Explanation *
                          nếu đang load explanation thì vô hiệu hóa nút vì chưa lấy được data explanation về       */}
                    <button
                        onClick={() => onExpandExplanation(q._id)}   
                        disabled={loadingExplanation}                  
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-red-50 border-t border-red-100 text-sm font-medium text-blue-700 hover:bg-red-100 transition-colors"
                    >
                        <span>{loadingExplanation ? "Loading..." : expandedExplanation ? "Hide Explanation" : "View Explanation"}</span>     {/** Thay đổi UI của nút, nếu đang load thì hiện Loading, nếu đã expand explanation (đã mở giải thích rồi) thì nội dung nút thành Hide, nếu chưa thì nội dung nút là View explanation */}
                        {expandedExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}                       {/** Thay đổi icon mũi tên lên xuống tùy đang đóng hay mở explanation */}
                    </button>

                    {/* Explanation Body */}
                    {expandedExplanation && (
                        <div className="px-4 py-3 bg-red-50 border-t border-red-100 text-sm text-slate-700 animate-in slide-in-from-top-1 duration-150">
                            <span className="font-bold text-slate-800">Explanation: </span>    {/** Nếu đang Expand thì lấy lời giải thích để In ra màn hình */}
                            {expandedExplanation}
                        </div>
                    )}

                    {/* AI Tutor Button */}
                    <div className="px-4 py-2.5 border-t border-red-100 flex">

                        {/** Concern: Mỗi lần user ấn vào nút này là lại gửi đi thông tin câu hỏi và nội dung câu 1 lần => Khi đóng cũng gửi => Thừa
                         *  Thực tế: Nó chỉ là component con có nghĩa vụ gửi 2 thông tin cho component cha khi gọi thẻ này, component cha sẽ có logic only sử dụng 2 thông tin này để gửi AI khi mở thanh chat, khi đóng  thì sẽ lấy 2 thông tin này làm tín hiệu tắt chat và k dùng chúng
                         
                         hàm onToggleChat gửi nội dung câu hỏi (questionText) k phải để hỏi AI mà để display lên đầu khung chat với AI
                         
                         
                         */}
                        <button                
                            onClick={() => onToggleChat(q._id, q.questionText)}     
                            className={`text-sm font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${isActiveChat
                                ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                                : "bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                }`}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            {isActiveChat ? "Tutoring this" : "Ask AI Tutor"}    {/** Kiểm tra khung chat AI có đang mở hay không, nếu có thì đổi sang text 1, k thì text 2 */}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
