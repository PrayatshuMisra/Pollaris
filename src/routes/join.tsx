import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Radio } from "lucide-react";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join a session — Pollaris" },
      { name: "description", content: "Enter a session code to join a live Pollaris session." },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("id")
        .eq("join_code", c)
        .eq("status", "live")
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        toast.error("No live session with that code");
        return;
      }
      navigate({ to: "/p/$code", params: { code: c } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mesh-bg flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-8"
        >
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-indigo-500">
              <Radio className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold">Join a session</h1>
          </div>
          <p className="text-sm text-muted-foreground">Enter the code shown on the presenter's screen.</p>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8}
            placeholder="ABC123"
            className="mt-6 text-center font-mono text-3xl tracking-[0.4em] uppercase h-16"
            autoFocus
          />
          <Button type="submit" disabled={loading || code.length < 4} className="mt-4 w-full rounded-full">
            {loading ? "…" : "Join"}
          </Button>
        </motion.form>
      </div>
    </div>
  );
}
