import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

// POST /api/share { document_id, expires_in_minutes }
export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { document_id, expires_in_minutes = 60 } = await req.json();
  if (!document_id) return NextResponse.json({ error: "document_id required" }, { status: 400 });

  // Ensure the document belongs to the user (or user is admin)
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const { data: doc } = await supabase.from("documents").select("user_id").eq("id", document_id).single();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (profile?.role !== "admin" && doc.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const token = randomUUID();
  const expires_at = new Date(Date.now() + expires_in_minutes * 60_000).toISOString();
  const { data, error } = await supabase.from("shared_links").insert({ document_id, share_token: token, expires_at }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data, url: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/share/${token}` });
}


