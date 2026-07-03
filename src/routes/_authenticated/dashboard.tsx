import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Presentation, Calendar, ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Presentation as PresentationT } from "@/lib/types";
import { formatDistanceToNowStrict } from "@/lib/format-time";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Pollaris" }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: presentations, isLoading } = useQuery({
    queryKey: ["presentations"],
    queryFn: async (): Promise<PresentationT[]> => {
      const { data, error } = await supabase
        .from("presentations")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PresentationT[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("presentations")
        .insert({ owner_id: userData.user.id, title: "Untitled presentation" })
        .select()
        .single();
      if (error) throw error;
      // seed one slide
      await supabase.from("slides").insert({
        presentation_id: data.id,
        order_index: 0,
        type: "multiple_choice",
        question: "What's on your mind?",
        config: {
          choices: [
            { id: crypto.randomUUID(), label: "Option A" },
            { id: crypto.randomUUID(), label: "Option B" },
            { id: crypto.randomUUID(), label: "Option C" },
          ],
        } as never,
      });
      return data as PresentationT;
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["presentations"] });
      navigate({ to: "/editor/$id", params: { id: p.id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to create"),
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Your studio</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">Presentations</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Build a deck, share a code, watch answers land live.
          </p>
        </div>
        <Button size="lg" className="rounded-full" disabled={create.isPending} onClick={() => create.mutate()}>
          {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          New presentation
        </Button>
      </div>

      <div className="mt-10">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />
            ))}
          </div>
        ) : presentations && presentations.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {presentations.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link to="/editor/$id" params={{ id: p.id }}>
                  <Card className="group h-full cursor-pointer overflow-hidden rounded-2xl border-white/5 bg-white/[0.02] p-6 transition hover:border-white/15 hover:bg-white/[0.04]">
                    <div className="flex items-start justify-between">
                      <Presentation className="h-6 w-6 text-primary" />
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                    </div>
                    <h3 className="mt-6 truncate text-lg font-semibold">{p.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {p.description ?? "No description yet."}
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      Updated {formatDistanceToNowStrict(new Date(p.updated_at))} ago
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-3xl p-12 text-center">
            <Presentation className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No presentations yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Create your first one — it takes seconds.</p>
            <Button className="mt-6 rounded-full" onClick={() => create.mutate()}>
              <Plus className="mr-2 h-4 w-4" /> New presentation
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
