import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server";
import { getProfilePermissionCodes, getProfileRoleCodes, mapDatabaseRolesToAppRole } from "@/lib/auth/session";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: profile, error } = await supabase
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
        `
      )
      .eq("id", session.user.id)
      .maybeSingle();

    if (error || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const role = mapDatabaseRolesToAppRole(getProfileRoleCodes(profile));
    const permissions = getProfilePermissionCodes(profile);

    return NextResponse.json(
      {
        role,
        permissions,
        username: profile.username ?? undefined,
        birthDate: profile.birth_date ?? undefined,
        displayName: profile.display_name ?? undefined,
        hasCompletedProfile: Boolean(profile.username && profile.birth_date),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/user/profile-gate error:", error);
    return NextResponse.json({ error: "Failed to resolve profile gate" }, { status: 500 });
  }
}
