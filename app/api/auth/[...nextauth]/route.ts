// [... ] khi là tên folder là Catch-all Route -> Không cần viết đường dẫn riêng như /api/auth/signout và /api/auth/signin ,... nữa 
// chứ theo đường dẫn api/auth là đẩy vào file route.ts này để xử lý

import NextAuth from "next-auth";                    // Thư viện (chuyên gia) phụ trách bảo mật (tạo session, token,...)
import { authOptions } from "@/lib/authOptions";     // authOptions là bản nội quy cho thư viện kia cho phép những thứ website có thể làm

const handler = NextAuth(authOptions);   // Đưa nội quy cho chuyên gia (NextAuth)
 
export { handler as GET, handler as POST };    // handler xử lý yêu cầu GET và POST của FE tới BE
