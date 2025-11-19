"use client";

import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

export default function UploadPage() {
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [tags, setTags] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("categories").select("id,name").then(({ data }) => setCategories(data || []));
  }, [supabase]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!file) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMessage("Please log in");
      return;
    }

    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (uploadError) {
      setMessage(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("documents").getPublicUrl(path);
    const fileUrl = publicUrlData.publicUrl;

    const { error: insertError } = await supabase.from("documents").insert({
      user_id: user.id,
      file_name: file.name,
      file_url: fileUrl,
      document_type: documentType || null,
      tags: tags ? tags.split(",").map((t) => t.trim()) : null,
      expiry_date: expiryDate || null,
      status: "Pending",
      category_id: categoryId === "" ? null : Number(categoryId),
    });
    if (insertError) {
      setMessage(insertError.message);
      return;
    }
    setMessage("Upload successful! You can see it in your dashboard.");
    setFile(null);
    setDocumentType("");
    setTags("");
    setExpiryDate("");
    setCategoryId("");
  }

  return (
    <div className="min-h-screen upload-bg">
      <AppShell>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Upload Document</h1>
            <p className="text-gray-300">Securely upload your important documents</p>
          </div>

          <div className="dark-card rounded-xl p-8">
            <form onSubmit={handleUpload} className="space-y-6">
              <div>
                <div
                  className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f) setFile(f);
                  }}
                >
                  <div className="text-white/60 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-white mb-4 font-medium">Drag and drop a file here, or click to choose</p>
                  <input
                    type="file"
                    className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  {file && (
                    <div className="mt-4 p-3 bg-blue-600/20 border border-blue-500/30 rounded-lg">
                      <p className="text-blue-300 font-medium">Selected: {file.name}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Document type</label>
                  <input
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full rounded-lg border border-white/20 px-4 py-3 bg-white/5 text-white placeholder-white/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 transition-all"
                    placeholder="Passport, Driver License"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Tags (comma separated)</label>
                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full rounded-lg border border-white/20 px-4 py-3 bg-white/5 text-white placeholder-white/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 transition-all"
                    placeholder="identity, visa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Expiry date</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full rounded-lg border border-white/20 px-4 py-3 bg-white/5 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full rounded-lg border border-white/20 px-4 py-3 bg-white/5 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 transition-all"
                  >
                    <option value="" className="bg-gray-800">Select…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-gray-800">{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors shadow-lg">Upload Document</Button>
              </div>

              {message && (
                <div className="p-4 bg-green-600/20 border border-green-500/30 rounded-lg">
                  <p className="text-green-300 font-medium">{message}</p>
                </div>
              )}
            </form>
          </div>
        </div>
      </AppShell>
    </div>
  );
}


