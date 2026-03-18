// Component này có thể tải lịch sử trò chuyện cũ, hiển thị tin nhắn của user với AI và hỗ trọ định dạng văn bản (in đậm, tạo danh sách,...) để câu trả lời AI dễ đọc hơn

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import api from "@/lib/axios";
import { API_PATHS } from "@/lib/apiPaths";
 

// Khuôn cho 1 tin nhắn: nó là 1 bong bóng chat thôi chứ k phải toàn bộ lịch sử tin nhắn
interface Message {      
    role: "user" | "model";         // Tin nhắn phải có role là tin nhắn từ user hay từ AI 
    parts: { text: string }[];      // 1 bong bóng chat thôi nhưng vẫn dùng array để linh hoạt: Trường hợp bth gửi 1 text thì y hệt như string
                                    // nhưng lỡ gửi 2 text hoặc 1 text 1 image (url ở dạng string) thì cần tách ra để xử lý => Use array
                                    /* ví dụ:
                                    parts: [
                                    { text: "Đây là câu hỏi của tôi:" },
                                    { text: "Biến trong lập trình là gì?" }
                                    ]
                                    */ 
}

interface ReviewChatbotProps {    // Props => Các thông tin cần cung cấp cho thẻ này nếu muốn dùng nó
    questionId: string;           // Lấy mã của câu hỏi đó
    questionText: string;         // Nội dung của câu đó
    headless?: boolean;           //  boolean để xem có ẩn tiêu đề thanh chat không
}

export default function ReviewChatbot({ questionId, questionText, headless = false }: ReviewChatbotProps) {    // Nhận dự liệu như quy định của prop
    const [messages, setMessages] = useState<Message[]>([]);                   // Lưu danh sách messages toàn bộ tin nhắn theo khuôn của message
    const [input, setInput] = useState("");                                    // Đang gõ gì vào ô chat
    const [isLoading, setIsLoading] = useState(false);                         // trạng thái để bật/tắt load
    const [isFetchingHistory, setIsFetchingHistory] = useState(true);          // Biến nhớ xem có đang tải lịch sử chat cũ k
    const messagesEndRef = useRef<HTMLDivElement>(null);                       // useRef là 1 mỏ neo điều khiển 1 thẻ giao diện
    //  HTMLDivElement khai báo thẻ này là div ( của AI Chatbot trên màn hình )



    // Lấy lịch sử chat của 1 câu hỏi cụ thể theo questionId
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get(API_PATHS.getChatByQuestionId(questionId));    // truyền lệnh GET về BE để lấy lịch sử rồi gán vào res
                if (res.status === 200) {       // Lấy thành công thì lấy data ra ( data là lịch sử chat )
                    const data = res.data;
                    if (data.messages && data.messages.length > 0) {       // Check có lấy về tin nhắn nào k và số tnh phải >= 1
                        setMessages(data.messages);                        // Có tin nhắn thì cập nhật data tin nhắn này vào bộ nhớ để hiển thị
                    }
                }
            } catch (error) {
                console.error("Failed to load chat history:", error);
            } finally {
                setIsFetchingHistory(false);            // Kết thúc việc lấy dữ liệu lịch sử chat
            }
        };

        fetchHistory();    // Gọi hàm để thực thi việc lấy dữ liệu
    }, [questionId]);    // Khi chuyển từ câu này sang câu khác => questionId thay đổi => Tự động  lấy lịch sử chat của câu đó

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);    // Mỗi khi danh sách tin nhắn thay đổi (tức là có tin nhắn mới được thêm vào) thì chạy đoạn này
    // messagesEndRef là mỏ neo,   .current? là chỉ tới thẻ div nó đang móc vào <nếu có tồn tại> (  ? để tránh sập nếu k có  )
    // scrollIntoView() là lệnh của các trình duyệt ép thẻ đó phải hiện trước tầm nhìn của user 
    // mỏ neo móc vào 1 cái div cực nhỏ ở cuối khung chat để khi có message mới thì nó scroll các tin nhắn lên tránh để che div đó
    // smooth thứ là scoll nhẹ nhàng thay vì giật đột ngột


    const handleSend = async (e: React.FormEvent) => {     // Hàm kiểm soát việc gửi tin nhắn
        e.preventDefault();
        if (!input.trim() || isLoading) return;   // input.trim() để cắt các khoảng space thừa khỏi input, cắt xong mà rỗng  => Toàn ấn space => K cho submit
                                                  // Đang load cũng k cho tránh spam nút

        const userMsg = input.trim();   // lấy message gọn, k thừa space
        setInput("");     // Xóa ô nhập để nhập tiếp sau khi submit  


        const newMessage: Message = { role: "user", parts: [{ text: userMsg }] }; // Đóng gói tin nhắn theo khung parts ở trên: Tnh từ user và bao gồm nội dung tnh đc gửi đi
        setMessages((prev) => [...prev, newMessage]);  // Chèn ngay tin nhắn vừa submit lên màn hình => Cảm giác mượt, nhanh kể cả khi chưa gửi
        setIsLoading(true);    // Đang gửi => Bật trạng thái load
 
        try {
            const res = await api.post(API_PATHS.CHAT, { questionId, message: userMsg });   // Gửi yêu cầu POST lên AI, chỉ cần questionId vì BE sẽ vào DB lấy nội dung câu  
            /**
             *  khi dùng api, res sẽ chứa nhiều data thừa 
             * {
                    status: 200,             // Giấy biên nhận: Mã 200 nghĩa là giao dịch mạng thành công tốt đẹp.
                    statusText: "OK",        // Chữ đi kèm mã trạng thái.
                    headers: { ... },        // Tem mác bưu điện: Chứa thông tin về loại dữ liệu, thời gian gửi...
                    config: { ... },         // Thông tin về chuyến xe lúc bạn gửi đi (gửi đến địa chỉ nào, mang theo cái gì).
                    
                    // ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT
                    data: {                  // Lõi thùng hàng: Chứa thứ mà lập trình viên máy chủ (Backend) cố tình nhét vào cho bạn.
                        response: "Đây là câu trả lời của AI nè bạn!" 
               }
}
             */

            const data = res.data;

            if (data.messages) {                      // Nếu res trả lại toàn bộ lịch sử chat -> Màn hình có thể sai nhưng data máy chủ gửi lên always đúng
                setMessages(data.messages);           // Xóa hết lịch sử chat cũ để hiện lại lên  màn hình
            } else if (data.response) {     // Nếu máy chủ chỉ trả về câu trả lời của AI
                setMessages((prev) => [...prev, { role: "model", parts: [{ text: data.response }] }]);  // Lưu cái cũ, thêm cái mới + gán role là của model vào nháp (React k cho update trực tiếp mà phải update vào bản nháp)
            } else if (data.error) {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            setMessages((prev) => [
                ...prev,
                { role: "model", parts: [{ text: "Sorry, I ran into an error processing your request. Please try again." }] }
            ]);
        } finally {
            setIsLoading(false);     // Send xong, tắt loading
        }
    };

    // Convert Gemini's markdown to safe HTML for rendering
    const renderMarkdown = (text: string) => {         // Hàm nhận về câu trả lời của AI, tìm các ký hiệu đặc biệt (vd ** or *) và dịch thành ngôn ngữ HTML thông thường để có thể in đậm, list,...
        const html = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            // Bold
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            // Markdown links [text](url)
            .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "<a href='$2' target='_blank' rel='noopener noreferrer' class='text-indigo-600 underline hover:text-indigo-800'>$1</a>")
            // Bare URLs
            .replace(/(^|[^'"])(https?:\/\/[^\s<]+)/g, "$1<a href='$2' target='_blank' rel='noopener noreferrer' class='text-indigo-600 underline hover:text-indigo-800'>$2</a>")
            // Bullet points — wrap consecutive <li> blocks in a <ul>
            .replace(/^\* (.+)$/gm, "<li>$1</li>")
            .replace(/(<li>[^]*?<\/li>\n?)+/g, (match) => `<ul class='list-disc list-inside my-1 space-y-1'>${match}</ul>`)
            // Line breaks
            .replace(/\n/g, "<br />");
        return html;
    };

    return (
        <div className={`flex flex-col ${headless ? "flex-1 h-full" : "h-[500px] bg-white rounded-lg border border-indigo-100 shadow-sm"} overflow-hidden`}>
            {/* Header — hidden in headless/sidebar mode */}
            {!headless && (       // Nếu bool headless là đúng thì ẩn tên của khung chat AI này đi
                <div className="bg-indigo-50 border-b border-indigo-100 p-4 flex items-center gap-3 shrink-0">
                    <div className="bg-indigo-600 p-2 rounded-lg">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h4 className="font-bold text-indigo-950">AI Study Tutor</h4>
                        <p className="text-xs text-indigo-600 font-medium">Powered by Gemini</p>
                    </div>
                </div>
            )}

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {isFetchingHistory ? (    //  Đang lấy lịch sử chat thì k vẽ tin nhắn mà hiện animation loading
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                    </div>
                ) : messages.length === 0 ? (     // Nếu load lịch sử chat xong mà số tin nhắn = 0 (chưa chat) thì hiện 2 thẻ <p> dưới
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                        <Bot className="w-12 h-12 text-indigo-200 mb-3" />
                        <p className="text-sm">I'm here to help you understand this question!</p>
                        <p className="text-xs mt-2 text-slate-400">Ask me anything about the concepts</p>
                    </div>
                ) : (     // Nếu đã có tin nhắn thì dùng loop đi qua mảng messages vẽ ra từng tin nhắn
                    messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                            <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center shadow-sm ${msg.role === "user" ? "bg-blue-600" : "bg-indigo-600"
                                }`}>
                                {msg.role === "user" ? (       // Nếu role của tin nhắn là user thì màu nền xanh đậm và đẩy tin nhắn sang phải
                                    <User className="w-4 h-4 text-white" />
                                ) : (
                                    <Sparkles className="w-4 h-4 text-white" />   // Nếu role của message là của AI thì nền trắng và căn trái
                                )}
                            </div>
                            <div className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm shadow-sm ${msg.role === "user"
                                ? "bg-blue-600 text-white rounded-tr-sm"
                                : "bg-white border border-indigo-50 text-slate-700 rounded-tl-sm"
                                }`}>
                                <div
                                    className="leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.parts[0].text) }}   // Ép nội dung dùng hàm phiên dịch từ AI sang text HTML vào bong bóng chat
                                />
                            </div>
                        </div>
                    ))
                )}
                {isLoading && (    // Nếu AI đang gõ chữ thì vẽ bong bóng 3 chấm chớp nháy
                    <div className="flex gap-3 flex-row">
                        <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center shadow-sm bg-indigo-600">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="px-5 py-4 rounded-2xl bg-white border border-indigo-50 flex items-center gap-1 rounded-tl-sm shadow-sm">
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />    {/** Đây là thẻ div dùng để kéo màn hình xuống */}
            </div>

            {/* Thanh gõ chữ */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 shrink-0">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}    // update lên màn hình ở phần thanh gõ
                        onChange={(e) => setInput(e.target.value)}   // lưu phần user type ở thanh gõ vào bộ nhớ
                        placeholder="Ask for a hint or explanation..."
                        className="w-full bg-slate-100 text-slate-900 placeholder:text-slate-400 rounded-full py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        disabled={isLoading || isFetchingHistory}   // AI đang load hoặc đang tải lịch sử chat thì k được input tránh lỗi
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading || isFetchingHistory}   // đang load/lẩy lịch sử chat/gõ toàn space thì k được send
                        className="absolute right-1 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-full transition-colors flex items-center justify-center"
                    >
                        <Send className="w-4 h-4 ml-[2px]" />
                    </button>
                </div>
            </form >
        </div >
    );
}
