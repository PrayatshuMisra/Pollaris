import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Radio } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Pollaris" },
      { name: "description", content: "Sign in or create your Pollaris account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Welcome to Pollaris!");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function signInGoogle() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-6 py-10 text-gray-900 font-sans">
      <div className="w-full max-w-[400px]">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-black transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-white/60 glass-panel p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-black text-white shadow-sm">
              <Radio className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-black tracking-tight drop-shadow-sm">
              {mode === "signin" ? "Welcome back" : "Create an account"}
            </h1>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-md font-bold h-10 glass border-white/60 hover:bg-white/60 text-black shadow-sm transition-colors"
            onClick={signInGoogle}
          >
            <GoogleIcon /> Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-gray-500 drop-shadow-sm">
            <div className="h-px flex-1 bg-white/40" /> or <div className="h-px flex-1 bg-white/40" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-bold uppercase text-gray-700 drop-shadow-sm">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} className="h-10 rounded-md glass border-white/50 focus-visible:ring-black placeholder:text-gray-500 font-medium" />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-bold uppercase text-gray-700 drop-shadow-sm">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10 rounded-md glass border-white/50 focus-visible:ring-black placeholder:text-gray-500 font-medium" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs font-bold uppercase text-gray-700 drop-shadow-sm">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-10 rounded-md glass border-white/50 focus-visible:ring-black placeholder:text-gray-500 font-medium" />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-md font-bold mt-4 h-11 bg-black text-white hover:bg-neutral-800 shadow-md transition-colors">
              {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm font-bold text-gray-700 drop-shadow-sm">
            {mode === "signin" ? "New to Pollaris?" : "Already have an account?"}{" "}
            <button
              className="font-black text-black hover:underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              type="button"
            >
              {mode === "signin" ? "Sign up" : "Log in"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className="mr-2">
      <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.2 1.6l3.1-3.1C17.5 1.7 15 .7 12 .7 7.4.7 3.4 3.3 1.4 7.1l3.6 2.8C6 6.9 8.7 5 12 5z" />
      <path fill="#4285F4" d="M23.3 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4c-.3 1.5-1.1 2.7-2.4 3.6l3.7 2.8c2.2-2 3.6-5 3.6-8.6z" />
      <path fill="#FBBC05" d="M5 14.1c-.3-.8-.4-1.6-.4-2.5s.1-1.7.4-2.5L1.4 6.3C.5 8 0 9.9 0 12s.5 4 1.4 5.7l3.6-2.8z" />
      <path fill="#34A853" d="M12 23.3c3.2 0 5.9-1 7.8-2.9l-3.7-2.8c-1 .7-2.4 1.2-4.1 1.2-3.3 0-6-2-7-4.9L1.4 16.7C3.4 20.5 7.4 23.3 12 23.3z" />
    </svg>
  );
}
