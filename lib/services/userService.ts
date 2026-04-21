// Lấy dữ liệu user về 

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { mapDatabaseRolesToAppRole } from "@/lib/auth/session";
import type { DashboardOverview } from "@/types/dashboard";

export const userService = {
  async getUserProfile(userId: string) {
    const supabase = createSupabaseAdminClient();
    const [{ data: profile, error: profileError }, { data: authUser, error: authError }] = await Promise.all([   
     // Promise.all -> Thay vì lấy username r mới tới email thì nó lấy cả 2 cùng lúc
      supabase
        .from("profiles")   // vào profiles để lấy data user  -> Đây là các thông tin Public
        .select(
          `
            display_name,
            username,
            birth_date,
            created_at,
            updated_at,
            user_roles (   
              roles (
                code
              )
            )
          `
        )
        .eq("id", userId)
        .maybeSingle(),
        /**   Làm như này để 1 user có nhiều role được và dễ update
         * user_roles (    chứa thông tin các mã role của user này
              roles (      tra mã code này ứng với role nào (STUDENT, ADMIN,...)
                code
              )
            )   
         */
      supabase.auth.admin.getUserById(userId),   // thông tin user được bảo mật => Chỉ có quyền admin mới access được
    ]);

    if (profileError || !profile || authError || !authUser.user) {
      throw new Error("User not found");
    }

    const roleCodes = (profile.user_roles ?? []).map((userRole) => {    // Kết quả user_roles từ Supabase thường là Nested => Hàm này trích về thành 1 array chỉ chứa các role
                          // Chưa có role nào thì trả [] để map k bị lỗi
      const rolesValue = (userRole as { roles?: { code?: string } | Array<{ code?: string }> }).roles;    // ép kiểu cho userRole là 1 object hoặc array chứa nhiều object
      return Array.isArray(rolesValue) ? rolesValue[0]?.code : rolesValue?.code;  // Kiểm tra kết quả là trường hợp nào (object hay array) để lấy kết quả
   /** supabase có thể trả kết quả code trong 1 [] để đảm bảo an toàn khi thiết lập Foreign key chưa chặt chẽ -> [0] kh phải role đầu tiên mà để lấy role trong [] mà supabase bọc cho chắc đó
    *   { 
          roles: [ { code: "ADMIN" } ] 
        }
    * 
    */
   
    });

    return {    // Đóng gói thông tin user lấy được từ database để trả cho FE xử lý
      name: profile.display_name,
      username: profile.username,
      birthDate: profile.birth_date,
      email: authUser.user.email,                   // email được bảo mật
      role: mapDatabaseRolesToAppRole(roleCodes),   // Dùng hàm phụ để dịch mã role mà database trả sang quyền hạn mà FE quy định
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  },

  async getUserStats(userId: string) {   // Trả về stats dựa vào ID
    const supabase = createSupabaseAdminClient();
    const [{ count: testsTaken, error: countError }, { data: bestAttempt, error: bestError }] = await Promise.all([
      supabase.from("test_attempts").select("id", { count: "exact", head: true }).eq("user_id", userId),  // Đếm số testTaken trong test_attempts
                                     // Chỉ đếm số lượng hàm tránh lấy thừa
      supabase
        .from("test_attempts")
        .select("score")         // Chỉ lấy duy nhất cột score
        .eq("user_id", userId)   // Chỉ tìm các bài của user id này
        .eq("mode", "full")   // Chỉ tìm các bài full length
        .not("score", "is", null)    // Loại bỏ các bài k có điểm (null), score is null mới đúng, score = null -> Sai
        .order("score", { ascending: false })   // Sắp từ cao xuống thấp
        .limit(1)   // Chỉ lấy cái đầu tiên   
        .maybeSingle(),
    ]);     

    if (countError || bestError) {
      throw new Error("User not found");
    }

    return {
      testsTaken: testsTaken ?? 0,   // K thấy thì trả về 0
      highestScore: bestAttempt?.score ?? 0,
    };
  },

  async getDashboardOverview(userId: string) {
    const supabase = createSupabaseAdminClient();
    // bth phải tìm từng bảng r ghép lại để lấy data từ DB, rpc cho phép gọi 1 hàm phức tạp và chỉ trả về data
    const { data, error } = await supabase.rpc("get_user_dashboard_overview", {     // dùng rpc gọi hàm và truyền vào userId
      target_user_id: userId,
    });

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to load dashboard overview");
    }

    return data as DashboardOverview;
  },
};
