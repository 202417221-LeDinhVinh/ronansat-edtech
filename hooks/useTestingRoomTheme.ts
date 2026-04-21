"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/client";

import {
  DEFAULT_TESTING_ROOM_THEME,
  persistTestingRoomTheme,
  readStoredTestingRoomTheme,
  type TestingRoomTheme,
} from "@/lib/testingRoomTheme";

export function useTestingRoomTheme() {
  const { data: session, status } = useSession();
  const [theme, setTheme] = useState<TestingRoomTheme>(DEFAULT_TESTING_ROOM_THEME);
  const [hasHydrated, setHasHydrated] = useState(false);
  // Máy chủ phải vẽ xong khung mới bơm logic JS cho khung đó (hydrate)

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {    // Vẽ lại màn hình vào lần quét tiếp theo, tránh việc giật từ sáng -> tối vì web assume trắng r mới thấy user chọn đen
      const localTheme = readStoredTestingRoomTheme();   // Đọc theme được lưu trong máy tính và set theme thành theme đó
      setTheme(localTheme);
      setHasHydrated(true);

      if (status === "authenticated" && session?.user?.id) {
        void fetch("/api/user/settings", { cache: "no-store" })   // no store -> Luôn lấy theme mới nhất, k dùng theme cũ 
          .then(async (response) => {
            if (!response.ok) {
              return null;
            }

            // dòng dưới biến đổi response thành JSON và quy định kết quả sẽ chứa dạng {user: testingRoomTheme } nhưng cũng có ? => k thấy cũng k sao
            const payload = (await response.json()) as { user?: { testingRoomTheme?: TestingRoomTheme } };
            return payload.user?.testingRoomTheme;  // kết quả là remoteTheme ở bên dưới
          })
          .then((remoteTheme) => {        // nếu máy chủ trả về 1 theme mới thì đè lên theme cũ
            if (remoteTheme) {
              setTheme(remoteTheme);
              persistTestingRoomTheme(remoteTheme);
            }
          })
          .catch(() => undefined);
      }
    });

    const handleStorage = () => {              // Đồng bộ theme khi mở 2 tab cùng lúc
      setTheme(readStoredTestingRoomTheme());
    };

    window.addEventListener("storage", handleStorage);     // Đổi theme cái là storage bị thay đổi 

    return () => {
      window.cancelAnimationFrame(frameId);                         // Hủy bỏ lệnh chờ vễ giao diện
      window.removeEventListener("storage", handleStorage);         // Tắt các hook đang theo dõi sự thay đổi của trang web này
    };
  }, [session?.user?.id, status]);    // Chạy mỗi khi user login/logout


  // XỬ lý khi ấn nút đổi theme
  const updateTheme = (nextTheme: TestingRoomTheme) => {
    setTheme(nextTheme);   // Đổi theme
    persistTestingRoomTheme(nextTheme);     //  Lưu xuống bộ nhớ trình duyệt

    if (status === "authenticated" && session?.user?.id) {
      void fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ testingRoomTheme: nextTheme }),   // Lưu theme vào database
      }).catch(() => undefined);
    }
  };

  return { theme, setTheme: updateTheme, hasHydrated };   // Trả về 3 biến để biêt theme hiện tại, nút setTheme để updateTheme, và báo cáo vẽ khung HTML xong chưa để bắt đầu vẽ giao diện
                                        // để tránh Hydration mismatch (mặc định vẽ giao diện trắng r check local storage mới thấy đen => Bị chớp khi thay đổi) 
}
