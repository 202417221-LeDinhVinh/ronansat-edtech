"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { API_PATHS } from "@/lib/apiPaths";
import { ListPlus, CheckCircle, Save, Upload } from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";

export default function CreateQuestionForm({ tests }: { tests: any[] }) {
    // State for Question Creation
    const [selectedTestId, setSelectedTestId] = useState("");  // Lúc mới mở ra, chưa chọn bài test nào để update nên ID của bài test được selected = ""
 
    // Các thông tin mặc định ban đầu của 1 question
    // state này chứa mọi thông tin của 1 câu hỏi
    const [questionForm, setQuestionForm] = useState({
        section: "Reading and Writing",
        module: 1,
        questionType: "multiple_choice", // THÊM MỚI: Thêm loại câu hỏi. Mặc định là Trắc nghiệm. Nếu muốn Tự luận là mặc định, đổi chữ này thành "spr"
        questionText: "",
        passage: "",
        imageUrl: "",
        choices: ["", "", "", ""],      // Bao gồm các lựa chọn
        correctAnswer: "",
        sprAnswers: ["", "", ""],        // THÊM MỚI: Thêm mảng 3 ô trống để chứa 3 cách viết đáp án tự luận
        explanation: "",
        difficulty: "medium",
        points: 10
    });

    //Thông báo kết quả việc tạo câu hỏi ( Thành công, thiếu ô nào,... )
    // Nếu thiếu đáp án đúng thì setQuestionMessage("Thiếu đáp án")
    const [questionMessage, setQuestionMessage] = useState("");

    // Auto chọn bài test đầu tiên nếu danh sách test đã tải xong và chưa chọn
    useEffect(() => {
        if (tests.length > 0 && !selectedTestId) {
            setSelectedTestId(tests[0]._id);
        }
    }, [tests, selectedTestId]);

    //Cập nhật nội dung của một lựa chọn -> Hàm use quy tắc của React: Không thay đổi trên đồ gốc mà nó copy nội dung ra bản nháp, update nội dung trên bản nháp đó rồi chỉ update phần thay đổi ở bản chính
    const handleChoiceChange = (index: number, value: string) => {     // index cho biết đáp án thứ mấy, value là nội dung mới của lựa chọn mới nhập
        const newChoices = [...questionForm.choices];                  // questionForm.choice là một tờ giấy có 4 đáp án ban đầu
                                                                       // ... là Spread Operator copy mọi đáp án gốc ra newChoices, nếu ko dùng [... ] thì JS sẽ gán newChoices cùng là tên của questionForm.choices => Nếu sửa newChoices thì sẽ ảnh hưởng bản gốc
        newChoices[index] = value;  // Update nội dung choice đó = value mới điền
        setQuestionForm({ ...questionForm, choices: newChoices });     // update lại nội dung Question, chứ mọi data cũ + choices chứa array bao gồm Option đã sửa
    };

    // Xử lý khi bấm nút câu hỏi -> Kiểm tra xem: 
    // 1. Ktra điền đủ + đúng ycau form chưa
    // 2. Gửi data câu hỏi lên máy chủ
    // 3. Xóa mọi ô nhập liệu nhưng vẫn giữ thông tin bài thi cho lần điền sau
    const handleCreateQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        setQuestionMessage("");  // Xóa mọi thông báo từ trước để màn hình sạch

        if (!selectedTestId) {     // Ktra đã chọn bài test mà question này thuộc về chưa
            setQuestionMessage("Please select a test first.");
            return;
        }

        // THÊM MỚI: Tách biệt cách kiểm tra lỗi giữa Trắc nghiệm và Tự luận
        if (questionForm.questionType === "multiple_choice") {
            // Đán án đúng questionForm.correctAnswer phải thuộc 1 trong 4 option của câu
            if (!questionForm.choices.includes(questionForm.correctAnswer)) {
                setQuestionMessage("The correct answer must exactly match one of the choices.");
                return;
            }
        } else {
            // Nếu là tự luận, bắt buộc phải điền ô đáp án số 1
            if (!questionForm.sprAnswers[0].trim()) {
                setQuestionMessage("Vui lòng điền ít nhất 1 đáp án cho câu tự luận.");
                return;
            }
        }

        try {    // Đóng gói all nội dung câu hỏi (...questionForm), đings vào mã testID rồi gửi(post) lên máy chủ (API_PATHS.QUESTIONS)
            const res = await api.post(API_PATHS.QUESTIONS, {    
                ...questionForm,        // ở bước này, questionForm đã có mọi thông tin của câu hỏi rồi
                testId: selectedTestId
            });

            if (res.status === 200 || res.status === 201) {
                setQuestionMessage("Question added successfully!");
                // Reset form but keep section and test selection
                setQuestionForm({      // Add thành công thì reset lại cho lần sau
                    ...questionForm,
                    questionText: "",
                    passage: "",
                    imageUrl: "",
                    choices: ["", "", "", ""],
                    correctAnswer: "",
                    sprAnswers: ["", "", ""], // THÊM MỚI: Xóa trắng lại 3 ô tự luận
                    explanation: "",
                });
            } else {
                console.error("Failed to add question:", res.data);
                setQuestionMessage(`Error: ${res.data.error || "Unknown database error"}`);
            }
        } catch (err: any) {
            console.error(err);
            setQuestionMessage("Network error");
        }
    };

    return (
        <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-800 font-bold">
                        <ListPlus className="w-5 h-5 text-blue-600" />
                        Step 2: Add Questions to Test
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-slate-600">Select Test:</label>
                        <select
                            value={selectedTestId}
                            onChange={(e) => setSelectedTestId(e.target.value)}
                            className="px-3 py-1.5 border border-slate-300 rounded-md font-medium text-sm outline-none bg-white text-slate-900 min-w-[200px]"
                        >
                            {tests.map(t => (                                         // map liệt kê hết các test đang có trong mảng tests-> .map cần key để k nhầm lẫn giữa các phần tử trong map => Gán bằng _id của phần tử hiện tại, value là giá trị nếu mình chọn test đó thì máy sẽ gửi value lên máy chủ 
                                <option key={t._id} value={t._id}>{t.title}</option>  // {t.title} là phần hiện lên tên của bài test hiện tại
                            ))}  
                            {tests.length === 0 && <option value="">No tests available</option>}     {/* Nếu không có test nào để chọn thì hiện No test available */}
                        </select>
                    </div>
                </div>

                <form className="p-6 space-y-6" onSubmit={handleCreateQuestion}>
                    {questionMessage && (
                        <div className={`p-4 rounded-lg font-medium text-sm flex items-center gap-2 ${questionMessage.includes('success') ? 'bg-green-50 justify-center text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {questionMessage.includes('success') && <CheckCircle className="w-5 h-5" />}
                            {questionMessage}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Section</label>
                            <select
                                value={questionForm.section}      // update lựa chọn vào mục section của questionForm
                                onChange={(e) => setQuestionForm({ ...questionForm, section: e.target.value })}   // Chọn section Reading and Writing hay Math
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                            >
                                <option value="Reading and Writing">Reading and Writing</option>
                                <option value="Math">Math</option>
                            </select>
                        </div>

                    <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Module</label>
                            <select
                                value={questionForm.module}      
                                // parseInt để ép kiểu string "1" hoặc "2" thành số nguyên (number) trước khi lưu
                                onChange={(e) => setQuestionForm({ ...questionForm, module: parseInt(e.target.value) })}   
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                            >
                                <option value={1}>Module 1</option>
                                <option value={2}>Module 2</option>
                            </select>
                    </div>

                    {/* THÊM MỚI: PHẦN CHỌN LOẠI CÂU HỎI */}
                    <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Loại câu hỏi</label>
                            <select
                                value={questionForm.questionType}      
                                onChange={(e) => setQuestionForm({ ...questionForm, questionType: e.target.value })}   
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 font-medium"
                            >
                                <option value="multiple_choice">Trắc nghiệm</option>
                                <option value="spr">Tự luận</option>
                            </select>
                    </div>


                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Difficulty</label>
                            <select
                                value={questionForm.difficulty}                                                        // Update vào difficulty
                                onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}     // Chọn độ khó
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Points</label>
                            <input
                                type="number"
                                required
                                value={Number.isNaN(questionForm.points) ? "" : questionForm.points}                        // Truyền lên phải là 1 con số
                                onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) })}    // Chọn số điểm của câu đó
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Passage</label>
                            <textarea       // Input chỉ cho gõ ở 1 dòng, textarea cho gõ dài
                                rows={4}    // Mặc định 4 dòng
                                value={questionForm.passage}   // update vào passae
                                onChange={(e) => setQuestionForm({ ...questionForm, passage: e.target.value })}
                                placeholder="Text passage for reading questions..."
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-serif resize-none bg-white text-slate-900"
                            />
                        </div>

                    {/* KHU VỰC THÊM ẢNH CHO CÂU HỎI (OPTIONAL) */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Question Image / Chart (Optional)</label>
                            <div className="border border-slate-300 rounded-lg p-3 bg-slate-50">
                                {questionForm.imageUrl ? (
                                    <div className="relative">
                                        <img src={questionForm.imageUrl} alt="Question preview" className="max-h-40 mx-auto rounded shadow-sm" />
                                        <button 
                                            type="button" 
                                            onClick={() => setQuestionForm({...questionForm, imageUrl: ""})} 
                                            className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg rounded-tr-lg text-xs hover:bg-red-600"
                                        >
                                            Xóa ảnh
                                        </button>
                                    </div>
                                ) : (

                                        <>
                        <div>
                            <div className="border border-slate-300 rounded-lg bg-slate-50">
                                
                                {/* GIỮ CLDUPLOADWIDGET Ở NGOÀI CÙNG ĐỂ KHÔNG BỊ LỖI KẸT CHUỘT */}
                                <CldUploadWidget
                                    uploadPreset="ronan_sat_edTech"
                                    onSuccess={(result: any) => {
                                        if (result?.event === "success") {
                                            setQuestionForm(prev => ({ ...prev, imageUrl: result.info.secure_url }));
                                            document.body.style.overflow = "auto";
                                        }
                                    }}
                                    onClose={() => {
                                        document.body.style.overflow = "auto";
                                    }}
                                >
                                    {({ open }) => (
                                        <div>
                                            {questionForm.imageUrl ? (
                                                <div className="relative">
                                                    <img src={questionForm.imageUrl} alt="Preview" className="max-h-40 mx-auto rounded shadow-sm" />
                                                    <button 
                                                        type="button" 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            setQuestionForm(prev => ({...prev, imageUrl: ""})); 
                                                        }} 
                                                        className="absolute top-0 right-0 bg-red-500 text-white p-1 px-3 rounded-bl-lg rounded-tr-md text-xs font-bold hover:bg-red-600"
                                                    >
                                                        Xóa ảnh
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    type="button" 
                                                    onClick={(e) => { e.preventDefault(); open(); }}
                                                    className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all font-medium flex items-center justify-center gap-2"
                                                >
                                                    <Upload className="w-5 h-5" /> Tải ảnh đồ thị/biểu đồ lên (Không bắt buộc)
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </CldUploadWidget>

                            </div>
                        </div>
                        
                        {/* Dưới này là ô nhập Question Text cũ của bạn */}
                                    </>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Question Text *</label>
                            <textarea
                                rows={3}
                                required
                                value={questionForm.questionText}    // update vào questionText
                                onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                                placeholder="The actual question..."
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium resize-none bg-white text-slate-900"
                            />
                        </div>

                        {/* THÊM MỚI: KIỂM TRA ĐIỀU KIỆN ĐỂ HIỂN THỊ GIAO DIỆN PHÙ HỢP */}
                        {questionForm.questionType === "multiple_choice" ? (
                            <>
                                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <label className="block text-sm font-bold text-slate-800">Multiple Choice Options</label>
                                    {questionForm.choices.map((choice, i) => (    // Mỗi lần loop lấy 2 thông tin: Nội dung lựa chọn và index của đáp án này ( 0 -> 3 )
                                                                                // choices có 4 vị trí, map chỉ chạy hết 4 vị trí đó rồi dừng
                                        <div key={i} className="flex items-center gap-3">
                                            <span className="w-8 h-8 flex items-center justify-center bg-slate-200 text-slate-700 font-bold rounded shrink-0">
                                                {String.fromCharCode(65 + i)}     {/* Span này hiện 1 ô vuông kèm chữ A B C or D (65 66 67 68) bên trái ô nhập nội dung Option, từ Ascii chuyển thành string để hiện trong ô này*/}
                                            </span>
                                            <input
                                                type="text"
                                                required
                                                value={choice}  // Update vào choice (nội dung của lựa chọn này)
                                                onChange={(e) => handleChoiceChange(i, e.target.value)}   // Truyền vào index và nội dung mới của lựa chọn này
                                                placeholder={`Option ${String.fromCharCode(65 + i)}`}   
                                                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-emerald-700 mb-1">Correct Answer *</label>
                                        <select
                                            required
                                            value={questionForm.correctAnswer}   // Update đáp án đúng
                                            onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                                            className="w-full px-4 py-2 border border-emerald-300 bg-emerald-50 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900"
                                        >
                                            <option value="" disabled className="">Select correct choice</option>
                                            {questionForm.choices.map((choice, i) => (
                                                <option key={i} value={choice} disabled={!choice} className="">   {/**disabled={!choice} -> Nếu lựa chọn chưa được điền nội dung thì nó k được làm đáp án đúng => Disable để k chọn đc */}
                                                    {choice ? `Option ${String.fromCharCode(65 + i)}: ${choice}` : `Option ${String.fromCharCode(65 + i)} (Empty)`}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-slate-500 mt-1">Select from the choices above.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Explanation *</label>
                                        <textarea
                                            rows={2}
                                            required
                                            value={questionForm.explanation}     // update lời giải thích cho câu hỏi
                                            onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                                            placeholder="Why is this correct?"
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-white text-slate-900"
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* THÊM MỚI: GIAO DIỆN CHO CÂU TỰ LUẬN (SPR) */}
                                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <label className="block text-sm font-bold text-slate-800">Đáp án tự luận (Hỗ trợ tối đa 3 cách viết)</label>
                                    <p className="text-xs text-slate-500 mb-3">Ví dụ: Điền 1/3 ở cách 1; điền 0.333 ở cách 2; điền .333 ở cách 3</p>
                                    {[0, 1, 2].map((i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 font-bold rounded shrink-0">
                                                {i + 1}
                                            </span>
                                            <input
                                                type="text"
                                                required={i === 0} // Chỉ bắt buộc nhập ở ô đầu tiên
                                                value={questionForm.sprAnswers[i]}
                                                onChange={(e) => {
                                                    const newAnswers = [...questionForm.sprAnswers];
                                                    newAnswers[i] = e.target.value;
                                                    setQuestionForm({ ...questionForm, sprAnswers: newAnswers });
                                                }}
                                                placeholder={i === 0 ? "Cách viết đáp án 1 (Bắt buộc) - VD: 1/3" : `Cách viết đáp án ${i + 1} (Tùy chọn) - VD: 0.333`}
                                                className={`w-full px-4 py-2 border ${i === 0 ? 'border-blue-300 bg-blue-50' : 'border-slate-300'} rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900`}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Explanation</label>
                                    <textarea
                                        rows={2}
                                        required
                                        value={questionForm.explanation}     // update lời giải thích cho câu hỏi
                                        onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                                        placeholder="Why is this correct?"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-white text-slate-900"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="pt-6 border-t border-slate-200 flex justify-end">
                        <button
                            type="submit"   // Ấn Save question cái là React dùng api.post để BE xử lý data bài test mới
                            disabled={!selectedTestId || tests.length === 0}   // Nếu chưa chọn bài test hoặc hệ thống đang k có bài test nào => Nút Save bị disabled
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg flex items-center gap-2 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-5 h-5" /> Save Question
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}