import { createFileRoute, Outlet, redirect, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { LayoutDashboard, LogOut, Radio, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-transparent text-gray-900 font-sans">
      {isDashboard && (
        <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50">
          <div className="mx-auto flex items-center justify-between gap-4 px-6 py-3 rounded-full backdrop-blur-2xl bg-white/20 border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all">
            <Link to="/dashboard" className="flex items-center gap-2 text-gray-900 hover:opacity-80 transition-opacity pr-4">
              <img src="/logo4.png" alt="Pollaris Logo" className="h-7 object-contain" />
              <span className="text-xl font-black tracking-tight drop-shadow-sm text-gray-900">Pollaris</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              <Link to="/dashboard" activeProps={{ className: "bg-white/40 shadow-sm" }} className="rounded-full px-4 py-2 text-sm font-bold text-gray-800 hover:bg-white/30 transition-colors">
                <LayoutDashboard className="mr-1.5 inline h-4 w-4" /> Dashboard
              </Link>
            </nav>
            <div className="flex items-center gap-3 pl-4">
              {user?.email && (
                <span className="hidden text-xs font-bold text-gray-700 md:inline-flex items-center gap-1.5 drop-shadow-sm">
                  <UserIcon className="h-3.5 w-3.5" /> {user.email}
                </span>
              )}
              <Button variant="ghost" size="sm" onClick={signOut} className="font-bold text-gray-800 hover:text-black hover:bg-red-100/50 hover:text-red-700 rounded-full px-4 transition-all">
                <LogOut className="mr-1.5 h-4 w-4" /> Sign out
              </Button>
            </div>
          </div>
        </header>
      )}
      <main className={isDashboard ? "pt-24 h-screen overflow-y-auto" : "h-screen overflow-hidden"}>
        <Outlet />
      </main>
    </div>
  );
}
