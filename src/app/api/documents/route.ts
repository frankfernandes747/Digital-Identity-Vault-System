import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// GET /api/documents?tag=...&document_type=...&category_id=...
export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tag = req.nextUrl.searchParams.get("tag");
  const documentType = req.nextUrl.searchParams.get("document_type");
  const categoryId = req.nextUrl.searchParams.get("category_id");

  // Check role
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  let query = supabase.from("documents").select("*, profiles(full_name,email)").order("created_at", { ascending: false }) as any;
  if (!profile || profile.role !== "admin") {
    query = query.eq("user_id", user.id);
  }
  if (tag) query = query.contains("tags", [tag]);
  if (documentType) query = query.eq("document_type", documentType);
  if (categoryId) query = query.eq("category_id", Number(categoryId));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

// POST /api/documents - create metadata (after uploading file)
export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { file_name, file_url, document_type, tags, expiry_date, category_id } = body;
  const { data, error } = await supabase.from("documents").insert({
    user_id: user.id,
    file_name,
    file_url,
    document_type: document_type ?? null,
    tags: tags ?? null,
    expiry_date: expiry_date ?? null,
    category_id: category_id ?? null,
    status: "Pending",
  }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

// DELETE /api/documents - delete a document
export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { document_id } = body;

  if (!document_id) {
    return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
  }

  // First check if the document belongs to the user or if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = profile?.role === "admin";

  // Get the document to check ownership and get file URL for deletion
  const { data: document, error: fetchError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", document_id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Check if user owns the document or is admin
  if (document.user_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden: You can only delete your own documents" }, { status: 403 });
  }

  // Delete the document record from database
  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", document_id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  // Optionally delete the file from storage
  // if (document.file_url) {
  //   const fileName = document.file_url.split('/').pop();
  //   await supabase.storage.from('documents').remove([fileName]);
  // }

  return NextResponse.json({ message: "Document deleted successfully" });
}


