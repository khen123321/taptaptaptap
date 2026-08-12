import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const deniedMessage = "You do not have permission to access the admin dashboard.";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user?.id) {
    return redirectWithError(request, "Invalid admin credentials.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    await supabase.auth.signOut();
    return redirectWithError(request, deniedMessage);
  }

  return NextResponse.redirect(new URL("/admin", request.url));
}

function redirectWithError(request: Request, message: string) {
  const params = new URLSearchParams({ error: message });
  return NextResponse.redirect(new URL(`/admin/login?${params.toString()}`, request.url));
}
