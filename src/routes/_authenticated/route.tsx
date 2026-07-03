import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Radio className="h-3.5 w-3.5" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold tracking-tight">Pollaris</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <Link to="/dashboard" activeProps={{ className: "bg-muted text-foreground" }} className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <LayoutDashboard className="mr-1.5 inline h-3.5 w-3.5" /> Dashboard
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {user?.email && (
              <span className="hidden text-xs font-medium text-muted-foreground md:inline-flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5" /> {user.email}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={signOut} className="font-medium rounded-md">
              <LogOut className="mr-1.5 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
