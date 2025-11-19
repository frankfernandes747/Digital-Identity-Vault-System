import { AppShell } from "@/components/layout/AppShell";
import { createServerSupabase } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="p-6">
        <p>Please <a href="/auth" className="text-blue-600">login</a>.</p>
      </div>
    );
  }

  const { data: docs } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <AppShell>
      <DashboardClient docs={docs || []} />
    </AppShell>
  );
}
