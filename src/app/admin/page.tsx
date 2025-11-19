import { AppShell } from "@/components/layout/AppShell";
import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function AdminPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = String(profile?.role || "").toLowerCase().trim();
  if (role !== "admin") redirect("/dashboard");

  // First, get documents without trying to join profiles
  const { data: docs, error: docsError } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  // Then get all users/profiles separately
  const { data: allProfiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role");

  // Create a map for quick user lookup
  const userMap = new Map();
  if (allProfiles) {
    allProfiles.forEach(profile => {
      userMap.set(profile.id, profile);
    });
  }

  // Combine docs with user info manually
  const docsWithUsers = docs?.map(doc => ({
    ...doc,
    user: userMap.get(doc.user_id) || null
  })) || [];

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: false });

  async function updateStatus(id: string, status: "Approved" | "Rejected") {
    "use server";
    const supa = createServerSupabase();
    const { error } = await supa.from("documents").update({ status }).eq("id", id);
    // Note: In production, you might want to handle this error more gracefully
    if (error) {
      throw new Error(`Failed to update status: ${error.message}`);
    }
    revalidatePath("/admin");
  }

  async function setRole(userId: string, role: "user" | "admin") {
    "use server";
    const supa = createServerSupabase();
    // Only admins can reach this page; still safe to double-check on RLS side
    await supa.from("profiles").update({ role }).eq("id", userId);
  }

  async function refreshPage() {
    "use server";
    revalidatePath("/admin");
  }

  return (
    <div className="min-h-screen admin-bg">
      <AppShell>
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Clean Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-300 mt-2">
                {docsError || profilesError ? (
                  <span className="text-red-400">⚠️ Error loading data</span>
                ) : (
                  `Managing ${docsWithUsers?.length || 0} documents and ${users?.length || 0} users`
                )}
              </p>
            </div>
            <form action={refreshPage}>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg">
                Refresh Data
              </button>
            </form>
          </div>

          {/* Document Review */}
          <div className="dark-card rounded-xl border border-white/10">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-2xl font-semibold text-white">Document Review</h2>
              <p className="text-gray-400 mt-1">Review and approve uploaded documents</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">User</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Document</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {(!docsWithUsers || docsWithUsers.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        {docsError || profilesError ? (
                          <div>
                            <p className="font-medium text-red-400">Unable to load documents</p>
                            <p className="text-sm mt-1 text-gray-400">Error: {docsError?.message || profilesError?.message}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-white">No documents to review</p>
                            <p className="text-sm mt-1 text-gray-400">Documents will appear here when users upload them</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    docsWithUsers.map((d) => (
                      <tr key={d.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-white">{d.user?.full_name || "Unknown User"}</div>
                            <div className="text-sm text-gray-400">{d.user?.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{d.file_name}</div>
                          <div className="text-sm text-gray-400">Category: {d.category_id || "None"}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${d.status === "Approved" ? "bg-green-600/20 text-green-400 border border-green-500/30" :
                              d.status === "Rejected" ? "bg-red-600/20 text-red-400 border border-red-500/30" :
                                "bg-yellow-600/20 text-yellow-400 border border-yellow-500/30"
                            }`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {new Date(d.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {d.status === "Pending" ? (
                            <div className="flex space-x-2">
                              <form action={updateStatus.bind(null, d.id, "Approved")} className="inline">
                                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors font-medium">
                                  Approve
                                </button>
                              </form>
                              <form action={updateStatus.bind(null, d.id, "Rejected")} className="inline">
                                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors font-medium">
                                  Reject
                                </button>
                              </form>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Management */}
          <div className="dark-card rounded-xl border border-white/10">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-2xl font-semibold text-white">User Management</h2>
              <p className="text-gray-400 mt-1">Manage user roles and permissions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {(users || []).map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{u.full_name || "—"}</td>
                      <td className="px-6 py-4 text-gray-300">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${u.role === 'admin' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-gray-600/20 text-gray-400 border border-gray-500/30'
                          }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <form action={setRole.bind(null, u.id, "admin")} className="inline">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors font-medium">
                              Make Admin
                            </button>
                          </form>
                          <form action={setRole.bind(null, u.id, "user")} className="inline">
                            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors font-medium">
                              Make User
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AppShell>
    </div>
  );
}


