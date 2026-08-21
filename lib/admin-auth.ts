import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminSession = {
  userId: string;
  profileId: string;
  email: string;
  role: "admin";
};

export type AdminAccess =
  | { status: "admin"; session: AdminSession }
  | { status: "forbidden"; email: string }
  | { status: "unauthenticated" };

export async function getAdminAccess(): Promise<AdminAccess> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return { status: "unauthenticated" };
  }

  const email = user.email ?? "";
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    return { status: "forbidden", email };
  }

  return {
    status: "admin",
    session: {
      userId: user.id,
      profileId: profile.id,
      email: profile.email ?? email,
      role: "admin",
    },
  };
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const access = await getAdminAccess();
  return access.status === "admin" ? access.session : null;
}

export async function requireAdmin() {
  const access = await getAdminAccess();

  if (access.status === "unauthenticated") {
    redirect("/admin/login");
  }

  return access;
}
