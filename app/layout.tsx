import type { Metadata } from "next";      // Cấu hình tab trình duyệt
import AuthProvider from "@/components/AuthProvider";     // Quản lý đăng nhập
import Navbar from "@/components/Navbar";                 // Thanh điều hướng
import { Geist, Geist_Mono } from "next/font/google"; 
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {         
  title: "Ronan SAT",                                // Hiển thị ở thẻ tab của trình duyệt và Phần text to trên trình duyệt
  description: "Master the Digital SAT with Ronan SAT's Real, Full-Length Tests.",    // Phần description dưới text to của trình duyệt  
};

export default function RootLayout({
  children,                                    // children đại diện trang hiện tại mà user đang truy cập 
}: Readonly<{                     // Không được thay đổi
  children: React.ReactNode;      // React.ReactNode là bất cứ thứ gì có thể hiển thị lên màn hình (HTML, components,...)
                                  // Việc ép children ở dạng React.ReactNode khiến những thứ truyền vào children chỉ là những thứ hiện lên được, nếu k hiển thị được (như 1 bài toán +-) thì báo lỗi ngay từ lúc viết code
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>    {/**Bọc toàn bộ web ktra liên tục xem đã login chưa*/}
          <Navbar />      {/**Thanh điều hướng đặt trên cùng */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}