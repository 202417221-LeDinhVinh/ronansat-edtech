import { getServerSession } from "@/lib/auth/server";
import { mapDatabaseRolesToAppRole } from "@/lib/auth/session";
import { redirect } from "next/navigation";

import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const session = await getServerSession();

  if (!session?.user?.id) {
    redirect("/auth");
  }

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
        username,
        birth_date,
        user_roles (
          roles (
            code
          )
        )
      `
    )
    .eq("id", session.user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/auth");
  }

  if (!profile.username || !profile.birth_date) {
    redirect("/welcome");
  }

  const role = mapDatabaseRolesToAppRole(
    (profile.user_roles ?? []).map((userRole) => {
      const rolesValue = userRole.roles as { code?: string } | Array<{ code?: string }> | undefined;
      return Array.isArray(rolesValue) ? rolesValue[0]?.code : rolesValue?.code;
    }),
  );

  if (role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <AdminDashboardClient />;
}
