import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppRole = "STUDENT" | "TEACHER" | "ADMIN";

export type AppSessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role: AppRole;
  permissions: string[];
  username?: string;
  birthDate?: string;
  hasCompletedProfile: boolean;
};

export type AppSession = {
  user: AppSessionUser;
};

export function mapDatabaseRolesToAppRole(roleCodes: Array<string | null | undefined>): AppRole {
  if (roleCodes.includes("admin")) {
    return "ADMIN";
  }

  if (roleCodes.includes("teacher")) {
    return "TEACHER";
  }

  return "STUDENT";
}

type ProfileRow = {
  id?: string;
  username: string | null;
  display_name: string | null;
  birth_date: string | null;
  user_roles: Array<{
    roles: {
      code: string;
      role_permissions?: Array<{
        permissions?: {
          code?: string | null;
        } | Array<{
          code?: string | null;
        }> | null;
      }> | null;
    } | Array<{
      code: string;
      role_permissions?: Array<{
        permissions?: {
          code?: string | null;
        } | Array<{
          code?: string | null;
        }> | null;
      }> | null;
    }> | null;
  }> | null;
};

function readNestedCode(value: { code?: string | null } | Array<{ code?: string | null }> | null | undefined) {
  return Array.isArray(value) ? value[0]?.code : value?.code;
}

function readRolePermissions(
  value:
    | {
        role_permissions?: Array<{
          permissions?: { code?: string | null } | Array<{ code?: string | null }> | null;
        }> | null;
      }
    | Array<{
        role_permissions?: Array<{
          permissions?: { code?: string | null } | Array<{ code?: string | null }> | null;
        }> | null;
      }>
    | null
    | undefined,
) {
  return Array.isArray(value) ? value[0]?.role_permissions ?? [] : value?.role_permissions ?? [];
}

export function getProfileRoleCodes(profile: ProfileRow | null | undefined) {
  return (profile?.user_roles ?? []).map((userRole) => readNestedCode(userRole.roles)).filter((code): code is string => Boolean(code));
}

export function getProfilePermissionCodes(profile: ProfileRow | null | undefined) {
  const permissionCodes = new Set<string>();

  for (const userRole of profile?.user_roles ?? []) {
    const rolePermissions = readRolePermissions(userRole.roles);

    for (const rolePermission of rolePermissions) {
      const code = readNestedCode(rolePermission.permissions);

      if (code) {
        permissionCodes.add(code);
      }
    }
  }

  return Array.from(permissionCodes).sort();
}

export function mapDatabaseRoleToAppRole(roleCode: string | null | undefined): AppRole {
  return mapDatabaseRolesToAppRole([roleCode]);
}

export function hasCompletedProfileValue(profile: { username?: string | null; birth_date?: string | null; birthDate?: string | null }) {
  return Boolean(profile.username && (profile.birth_date || profile.birthDate));
}

export function buildAppSession(user: User, profile: ProfileRow | null): AppSession {
  const roleCodes = getProfileRoleCodes(profile);
  const permissions = getProfilePermissionCodes(profile);
  const role = mapDatabaseRolesToAppRole(roleCodes);
  const birthDate = profile?.birth_date ?? undefined;
  const username = profile?.username ?? undefined;
  const name = profile?.display_name ?? user.user_metadata?.name ?? user.email ?? null;

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
      name,
      role,
      permissions,
      username,
      birthDate,
      hasCompletedProfile: hasCompletedProfileValue({ username, birthDate }),
    },
  };
}

export async function getServerAppSession(): Promise<AppSession | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
        id,
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
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  return buildAppSession(user, profile ?? null);
}
