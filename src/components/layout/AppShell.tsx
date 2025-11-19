"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import { LogOut, FilePlus2, Home, User, ShieldCheck, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import React from "react";
import { createClient } from "@/lib/supabase/client";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const supabase = React.useMemo(() => createClient(), []);
  const [role, setRole] = React.useState<"admin" | "user" | null>(null);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) setRole(null);
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (mounted) setRole((profile?.role as any) === "admin" ? "admin" : "user");
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const nav = React.useMemo(() => {
    if (role === "admin") {
      return [
        { href: "/profile", label: "Profile", icon: User },
        { href: "/admin", label: "Admin", icon: ShieldCheck },
      ];
    }
    // Default (including while loading role): show user menu
    return [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/upload", label: "Upload", icon: FilePlus2 },
      { href: "/profile", label: "Profile", icon: User },
    ];
  }, [role]);

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[240px_1fr] dashboard-bg">
      <aside className="hidden md:block bg-black/20 backdrop-blur-xl">
        <Link href="/" className="p-4 font-semibold flex items-center gap-2 text-white hover:bg-white/10 transition-colors rounded-md mx-2 mt-2">
          <Home className="w-5 h-5" /> Digital Identity Vault
        </Link>
        <nav className="px-2 space-y-1 mt-4">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors",
                  active && "bg-white/10 font-medium text-white"
                )}
              >
                <Icon className="w-4 h-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4">
          <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </aside>
      <div className="flex flex-col">
        <header className="sticky top-0 z-10 bg-black/20 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold text-white flex items-center gap-2 hover:text-gray-300 transition-colors">
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Digital Identity Vault</span>
              <span className="sm:hidden">DIV</span>
            </Link>
            <div className="md:hidden">
              <Link href="/profile" className="text-sm text-white hover:text-gray-300 transition-colors">Profile</Link>
            </div>
          </div>
        </header>
        <main className="p-4 md:p-6 flex-1 relative overflow-hidden">{children}</main>
      </div>
    </div>
  );
}


