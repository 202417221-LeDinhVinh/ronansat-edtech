// Heatmap, ngày nào k học thì xám, ngày nào làm nhiều thì màu xanh sẽ càng đậm

"use client";

import React, { useMemo } from "react";   // useMemo giúp ghi nhớ kết quả 1 phép tính phức tạp

interface ActivityHeatmapProps {       // ActivityHeatmap là họa sĩ vẽ biểu đồ nhưng cần data (props) để sẽ
    results: any[];                    // Quy tắc yêu cầu của vật liệu của ông họa sĩ, vật liệu phải là mảng có tên là results
}                                      // results là danh sách các bài thi user đã làm

export default function ActivityHeatmap({ results }: ActivityHeatmapProps) {
    const { heatmapData } = useMemo(() => {   
        const today = new Date();     // Lấy thời gian chính xác hôm nay
        today.setHours(0, 0, 0, 0);   // Set thời gian về đúng 0 giờ 0 phút 0 giây
                                      // Vì mình chỉ quan tâm tới NGÀY, k phải giờ và khi tính các ngày trước, mình sẽ trừ 1 ngày => Cố dịnh thời gian lúc 0 giờ 0 phút 0 giây 

        const last30Days = Array.from({ length: 30 }, (_, i) => {     // Tạo 1 array 30 ô, i là index từng ô từ 0 -> 29
            const d = new Date(today);            // d = bản sao của ngày hôm nay
            d.setDate(d.getDate() - (29 - i));    // d trừ đi 1 số ngày nhất định: i = 0 thì d - 29 => Ngày xa nhất
                                                  //                               i = 29 thì d - 0 => Ngày hiện tại
            return d;                             // Đặt ngày vừa tính được vào trong tủ Array này
        });    // last30Days là ngăn tủ chứa 30 ngày trc hnay, index = 0 là ngày 1 tháng trc, index = 29 là hnay 

        const activityMap = new Map<string, number>();    // Map là kiểu dữ liệu có 2 cột, string cho ngày, number cho số bài đã làm ngày đó


        /**results là tổng hợp tất cả thời gian của số bài test được làm, hàm forEach này chạy qua từng thời gian và xem đó là ngày nào rồi +1 vào số lần làm của ngày đó */
        results.forEach((result) => {     // Đi qua từng giá trị trong results và gán từng giá trị đó là result
            const resultDate = new Date(result.createdAt || result.date || result.updatedAt);   //Tìm xem bài này nộp lúc nào, tìm ở 3 chỗ cho chắc
            resultDate.setHours(0, 0, 0, 0);                                      // Bỏ giờ, chỉ quan tâm ngày
            const dateKey = resultDate.toISOString().split("T")[0];               // Cách lưu tgian 2026-03-11T18:00:00.000Z -> Cắt chỉ lấy ngày tháng năm -> vd: dateKey = 2026-03-11
            activityMap.set(dateKey, (activityMap.get(dateKey) || 0) + 1);        // Thêm giá trị vào danh sách thời gian + số test đã làm 
                                                                                  // activityMap.get(dateKey) lấy số lần làm của 1 ngày, nếu không thấy thì đã làm 0 lần và + 1 -> Cộng số lần làm cho ngày đó 
        });

        const data = last30Days.map((date) => {
            const dateKey = date.toISOString().split("T")[0];   // lấy ngày vd 2026-03-11
            const count = activityMap.get(dateKey) || 0;        // lấy count của dateKey đó trong activityMap, k có thì trả về 0
            return { date, count, dateKey };   // Gộp 3 thông tin vào 1 object để gán vào từng ô của Array last30Days
                                               // date và dateKey đều là ngày tháng nhưng định dạng khác nhau: dateKey là 1 chuỗi thô cứng để dò tìm từng ô còn date là Date Object -> Có thể tách ngày tháng năm ra để use
        });

        return { heatmapData: data };
    }, [results]);                             // Tính thì nhanh nhưng để tiết kiệm thời gian, chỉ tính lại khi user làm thêm 1 test khiến results bị thay đổi 
                                               // chưa làm thêm test -> results chưa thay đổi => Vẫn dùng kết quả cũ
 
    const getColorClass = (count: number) => {                   // Màu ứng với từng số test làm
        if (count === 0) return "bg-slate-100 dark:bg-slate-800";
        if (count === 1) return "bg-blue-300 dark:bg-blue-900";
        if (count === 2) return "bg-blue-400 dark:bg-blue-700";
        if (count === 3) return "bg-blue-500 dark:bg-blue-600";
        return "bg-blue-600 dark:bg-blue-500";
    };

    return (
        <div className="w-full h-full flex flex-col justify-end pt-2">

            <div className="flex flex-col items-center w-full pb-1">
                <div className="flex flex-wrap gap-1 sm:gap-1.5 justify-center w-full">
                    {heatmapData.map((day, i) => (
                        <div
                            key={day.dateKey}
                            className="group relative"
                        >
                            <div
                                className={`w-3 h-3 sm:w-4 sm:h-4 rounded-sm shrink-0 transition-colors duration-200 hover:ring-2 hover:ring-offset-1 hover:ring-blue-400 ${getColorClass(
                                    day.count    // Lấy màu của ô đó
                                )}`}
                            />
                            {/* Tooltip */}
                            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded pointer-events-none whitespace-nowrap z-10 w-auto">
                                {day.count} test{day.count !== 1 ? 's' : ''} on {day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                {/** nếu số test = 1 thì k hiện s trong tests -> Grammar         undefined là chế độ auto, toLocaleDateString lấy thời gian dịch sang ngôn ngữ máy user đang sử dụng    'short' là viết tắt March -> Mar   vd tiếng Việt nó dịch là 3 tests on 11 thg 3, 2026  */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );
}
