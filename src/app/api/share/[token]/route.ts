import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = createServerSupabase();
  const token = params.token;
  const { data: link } = await supabase
    .from("shared_links")
    .select("*, documents(*)")
    .eq("share_token", token)
    .single();
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (new Date(link.expires_at) < new Date()) return NextResponse.json({ error: "Link expired" }, { status: 410 });
  return NextResponse.redirect(link.documents.file_url);
}


