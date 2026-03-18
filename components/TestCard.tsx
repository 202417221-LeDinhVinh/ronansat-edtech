// Lấy thông tin 1 bài kiểm tra, vẽ ra 1 tấm thẻ, đáy thẻ có 1 nút bấm để chuyển sang trang làm bài thi

import Link from "next/link";    // Công  cụ chuyển trang k làm web bị giật đen màn hình khi chuyển
import { Clock, BookOpen, GraduationCap } from "lucide-react";

interface Test {   // Khuôn chứa các thông tin của bài Test
    _id: string;    // id bài test
    title: string;       // tên
    timeLimit: number;   // thời gian
    difficulty: string;  // độ khó bài test     ***************** bài nào cũng có độ khó y như nhau maybe nên bỏ 
    sections: any[];     // Các phần của bài test ( Verbal and Math )
}

export default function TestCard({ test }: { test: Test }) {     // nhận vào data dạng Test ở trên, test chứa mọi thông tin về bài test
    // Simple heuristic for total questions based on sections
    const totalQuestions =     // Lấy tổng số câu hỏi của bài thi

        test.sections?.reduce((acc, sec) => acc + sec.questionsCount, 0) || 0;
        // test là toàn bộ bài thi, section là từng section (Verbal or Math), questionsCount là số câu hỏi của từng phần đó
        // .reduce() là công cụ lặp qua 1 danh sách và gom tất cả thành 1 giá trị duy nhất (this case là tính tổng)
        //   , 0) là giá trị ban đầu của acc
        // ? -> Đề phòng lỗi k có section  => Trả về 0 ( || 0 ) thay vì undefined
    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-blue-200 transition-all group flex flex-col h-full">
            <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-700">
                        {test.title}       {/** In tên bài thi lên góc trái thẻ */}
                    </h3>
                    <span           // Đổi màu text dựa trên độ khó, easy = xanh, trung bình = cam, hard = đỏ, might need to delete
                        className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full ${test.difficulty === "easy"
                                ? "bg-green-100 text-green-700"
                                : test.difficulty === "hard"         
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700"
                            }`}
                    >
                        {test.difficulty}    {/** In độ khó */}
                    </span>  
                </div>

                <div className="space-y-2 mt-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{test.timeLimit} Minutes Total</span>   {/** In thời gian */}
                    </div>
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        <span>{test.sections?.length || 0} Sections</span> {/**  need to fix: In số section?, nếu mất dữ liệu section thì in ra 0 thay vì sập */}
                    </div>
                    <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-slate-400" />  
                        <span>{totalQuestions} Questions</span>    {/** In ra tổng có bnh câu hỏi */}
                    </div>
                </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto">
                <Link
                    href={`/test/${test._id}`}       // Link đường dẫn tới bài test theo Id
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                >
                    Start Practice
                </Link>
            </div>
        </div>
    );
}
