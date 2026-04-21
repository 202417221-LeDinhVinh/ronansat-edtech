import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server";
import { getProfilePermissionCodes, getProfileRoleCodes, mapDatabaseRolesToAppRole } from "@/lib/auth/session";
     // CSDL lưu data dưới dạng code phức tạp -> Hàm này dịch chúng  thành ngôn ngữ FE dễ hiểu

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: profile, error } = await supabase    // Kết nối DB, thành công thi cất vào profile, fail thì vào err
      .from("profiles")
      .select(
        `
          username,
          display_name,
          birth_date,
          user_roles (
            roles (    
              code,
              role_permissions (
                permissions (
                  code
                )
              )
            )
          )
        `                              // Lấy về quyền và role
      )
      .eq("id", session.user.id)     // Only lấy user có id này
      .maybeSingle();

    if (error || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const role = mapDatabaseRolesToAppRole(getProfileRoleCodes(profile));  // Dùng các hàm phụ để ánh xạ từ role code mà DB lưu về role mà dự án yêu cầu
    const permissions = getProfilePermissionCodes(profile);

    return NextResponse.json(     // Gói tất cả data và trả về FE
      {
        role,
        permissions,
        username: profile.username ?? undefined,
        birthDate: profile.birth_date ?? undefined,
        displayName: profile.display_name ?? undefined,
        hasCompletedProfile: Boolean(profile.username && profile.birth_date),   // đây là biến bool, nếu đủ cả 2 biến con mới trả true, thiếu là false
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/user/profile-gate error:", error);
    return NextResponse.json({ error: "Failed to resolve profile gate" }, { status: 500 });
  }
}
