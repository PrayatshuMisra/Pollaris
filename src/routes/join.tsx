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
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-[400px]">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-8 shadow-sm"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Radio className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Join a session</h1>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">Enter the 6-character code shown on the presenter's screen.</p>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8}
            placeholder="ABC123"
            className="mt-6 text-center font-mono text-3xl tracking-[0.3em] uppercase h-16 rounded-md bg-muted/50 border-border"
            autoFocus
          />
          <Button type="submit" disabled={loading || code.length < 4} className="mt-4 w-full rounded-md font-medium h-11">
            {loading ? "…" : "Join"}
          </Button>
        </motion.form>
      </div>
    </div>
  );
}
