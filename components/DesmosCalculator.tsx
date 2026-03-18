"use client";   // Desmos cần tương tác user

import React, { useEffect, useRef, useState } from "react";     // useRef sử dụng khi chỉ muốn thay đổi thông tin của 1 component mà k làm cả giao diện web phải thay đổi như useState
import { X, Maximize2, Minimize2 } from "lucide-react";   // 3 icon để đóng, phóng to, thu nhỏ

interface DesmosCalculatorProps {    // Thông tin cần cung cấp cho máy tính Desmos
    isOpen: boolean;                 // Kiểm tra xem nó có đang đc mở ra k
    onClose: () => void;             // Hành động khi user ấn X
}

  // Desmos k có trong hệ thống Window -> Khi dùng desmos cần xin phép cho biến desmos
declare global {            // Thông báo Desmos dùng được cho mọi file, k chỉ file này
    interface Window {      // trình duyệt đã có interface Window chứa các thông tin cơ bản, khi viết vậy, nó chỉ thêm vào interface Window cũ
        Desmos: any;        // Desmos rất nhiều kiểu file, nếu k đặt any phải cấu hình chi tiết từng phần 1 => Rất mất tgian
    }
}

export default function DesmosCalculator({ isOpen, onClose }: DesmosCalculatorProps) {
    // Các bộ nhớ trạng thái 
    const calculatorRef = useRef<HTMLDivElement>(null);            // Đánh dấu vị trí trên trang web để đặt bộ máy Desmos vào        
    const [calculator, setCalculator] = useState<any>(null);       // Nhớ máy đã đc bật chưa, null là chưa bật còn khi bật thì truyền window.Desmos.GraphingCalculator(...) vào state này => Dữ liệu phức tạp => Use any
    const [isExpanded, setIsExpanded] = useState(false);           // Nhớ xem đang phóng to full màn hình k

    const [position, setPosition] = useState({ x: 0, y: 0 });      // Nhớ tọa độ của góc trên cùng bên trái của window Desmos
    const [isDragging, setIsDragging] = useState(false);           // Công tắc check chuột có đang drag Desmos không
    const dragStart = useRef({ x: 0, y: 0 });                      // Ghi nhớ pointer của user cách bảng bao xa

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {      // Xử lý khi ấn chuột trái, type: HTMLDivElement để báo sự kiện kích chuột (PointerEvent) chỉ xảy ra trong 1 thẻ div
        if (isExpanded) return;                                                 // phóng to full màn hình rồi => K được kéo mà return, dưới xử lý kéo
        if ((e.target as HTMLElement).closest('button')) return;                // Xử lý khi ấn nhầm vào X hoặc phóng to/bé và k muốn Drag => e.target là pixel mình vừa ấn, check xem nó có gần các nút đó k, nếu gần thì assume ấn nhầm => K cho drag và return
                                                                                // e.target có thể là rất nhiều sự kiện (file âm thanh, tab,...) => ép dạng là HTMLElement để đảm bảo nút ấn là 1 phần của giao diện web (HTML) -> Vậy mới dùng được .closest()
        setIsDragging(true);    // bật công thức báo user đang Drage
        dragStart.current = {    // update vị trí chuột mới vào bộ trớ, useRef là bộ nhớ tên là dragStart, không thể gán giá trị dragStart = được mà cần mở bộ nhớ  dragStart.current = {}
            x: e.clientX - position.x,      // Khi drag cửa sổ desmos thường dùng chuột ấn vào giữa -> Sẽ cách lề trái của cửa sổ Desmos 1 khoảng, nếu k lưu khoảng này thì mỗi khi di chuột nó sẽ dính chặt vào lề trên bên trái của cửa sổ desmos 
            y: e.clientY - position.y        
        };

        // Nếu vẩy chuột để con trỏ chạy ra ngoài mép thanh Desmos, mặc định trình duyệt nghĩ handlePointerDown chạy xong rồi, nhấc chuột khỏi Desmos rồi 
        // e chứa toàn bộ thông tin về cú bấm chuột, 
        // (e.target as HTMLElement) -> target của cú nhập chuột là thanh tiêu đề (1 HTMLElement), trói thanh đó với chuột (e.pointerId)
        // pointerId: Trên đth, có thể ấn nhiều ngón 1 lúc, mỗi ngón đc cấp 1 id -> Cấp e.pointerId để biết Capture ngón nào
        // setPointerCapture để báo cáo mọi cử động của pointer cho thanh tiêu đề kể cả khi vẩy chuột khỏi chỗ đó thì việc kéo vẫn k ảnh hưởng
        (e.target as HTMLElement).setPointerCapture(e.pointerId);      
    };

    //  update vị trí của window desmos liên tục khi user drag
    // e: thông tin sự kiện drag (vị trí mới của pointer)
    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {  
        if (!isDragging || isExpanded) return;    // Nếu công tắc báo hiệu drag của handlePointerDown đang tắt or đã expand full màn => return
        setPosition({                             // vị trí góc trên cùng bên trái của window Desmos
            x: e.clientX - dragStart.current.x,     // Lấy vị trí hiện tại của chuột (e.clientX ) trừ khoảng cách từ vtri đó tới mép trái tính được ở handlePointerDown
            y: e.clientY - dragStart.current.y      
        });
    };   

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;                                           // Hàm chỉ chạy nếu trước đó đang drag, nếu trước k drag thì 
        setIsDragging(false);                                              // Nhấc ngón tay => k drag nữa
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);      // Trước dùng setPointerCapture để trói chuột vào tiêu đề, bây giờ mở trói cho nó đi tự do
    };

    useEffect(() => {    // Chạy khi vừa mở cửa sổ lên và khi isOpen bị thay đổi
        if (!isOpen) return;    // Nếu desmos đang đóng => Dừng, k phí thời gian chạy máy tính ngầm

        const initCalculator = () => {   // Hàm khởi động Desmos
            if (window.Desmos && calculatorRef.current && !calculator) {    // Điều kiện bắt buộc để khởi động lắp Desmos
                // window.Desmos, trình duyệt phải có Desmos
                // calculatorRef.current : trình duyệt phải có chỗ để đặt Desmos
                // !calculator : chỉ khởi động khi chưa có Desmos nào được bật, tránh tạo ra 2 3 cái thừa
                const calc = window.Desmos.GraphingCalculator (calculatorRef.current, {     // calculatorRef.current -> vị trí muốn đặt máy tính vào 
                    keypad: true,                       // cho phép các đặc tính của Desmos
                    expressions: true,
                    settingsMenu: true,
                    zoomButtons: true,
                    expressionsTopbar: true,
                    lockViewport: false,          // không lock => Cho phép user kéo chuột đi xung quanh đồ thị
                });
                setCalculator(calc);   // Lưu máy tính vào bộ nhớ để k tạo thêm
            }
        };

        const existingScript = document.getElementById("desmos-script");
        // document là đại diện trang web chứa tất cả các components
        // Tìm xem desmos script đã được tải về web chưa, để tránh tải đi tải lại nhiều lần phí tài nguyên

        if (existingScript) {    // Nếu chưa tải desmos thì tải về
            initCalculator();
        } else {
            // Load the script dynamically if it doesn't exist
            const script = document.createElement("script");    // Tạo ra 1 thẻ <script> trong document chuyên lấy code từ bên ngoài vào web  
            script.src = "https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6";  // Lấy từ api này
            script.id = "desmos-script";       // đặt id để lần sau gặp id này thì k tải lại Desmos vào web
            script.async = true;               // Cho phép async => Bất đồng bộ -> Tải web này trong lúc các thứ khác được chạy
            script.onload = () => {            // onload = khi tải xong
                initCalculator();              // Tải xong dữ liệu thì cấu hình đúc máy tính
            };
            document.body.appendChild(script);    // Các bước trên chỉ là viết yêu cầu, bước này mới thực sự gán máy tính vào body của trang web -> Ở bước này mới kết nối internet và tải
        }

        return () => {                // trong useEffect(), bất cứ thứ gì sau return được gọi là hàm dọn dẹp (Clean up func) -> Chạy khi bấm X hoặc tắt web
            if (calculator) {    
                calculator.destroy();       // Xóa hết các phương trình, thông tin, ... trả lại Ram tránh Desmos chạy ngầm
                setCalculator(null);        // Xóa bộ nhớ về máy tính để lần sau mở thì tạo 1 Desmos mới
            }
        };
    }, [isOpen]);   // Chỉ chạy khi isOpen bị thay đổi

    // Don't render anything if not open
    if (!isOpen) return null;   // Code dưới sẽ vẽ ra 1 khung cho window Desmos, dòng này chặn, nếu Desmos đang đóng/bị tắt thì không vẽ khung

    return (
        <div
            className={`fixed bg-white shadow-2xl rounded-lg border border-slate-300 z-50 flex flex-col ${!isDragging ? "transition-all duration-300 ease-in-out" : ""} ${isExpanded
                ? "top-16 left-0 right-0 bottom-16 w-full h-[calc(100vh-8rem)] rounded-none"
                : "top-20 right-6 w-[450px] h-[600px] sm:w-[500px]"
                }`}
            style={{
                transform: isExpanded ? 'none' : `translate(${position.x}px, ${position.y}px)`
            }}
        >
            {/* Header / Drag Handle area */}
            <div
                className="bg-slate-800 text-white p-2 rounded-t-lg flex justify-between items-center cursor-move select-none"
                onPointerDown={handlePointerDown}      //  Các lệnh onPointer xử lý hành động của pointer
                onPointerMove={handlePointerMove} 
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <span className="font-semibold text-sm pl-2">Desmos Graphing Calculator</span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 hover:bg-slate-700 rounded transition-colors"
                        title={isExpanded ? "Restore size" : "Maximize"}
                    >
                        {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-700 hover:text-red-400 rounded transition-colors"
                        title="Close calculator"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Calculator Container */}
            <div
                ref={calculatorRef}
                className="flex-1 w-full rounded-b-lg overflow-hidden"
            >
                {/* Desmos will inject its DOM here */}
            </div>
        </div>
    );
}
