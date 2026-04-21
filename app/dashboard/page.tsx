// Phải tách ra vì cần tách biệt giữa file server và client vì 'use client' thì k đặt tên file được
// Tách ra nnay giúp k đẩy mọi việc cho client, load lâu mà server có thể vẽ được khung trước r mới tải ở trình duyệt

import DashboardPageClient from "@/components/dashboard/DashboardPageClient";

export default function DashboardPage() {
  return <DashboardPageClient />;
}
