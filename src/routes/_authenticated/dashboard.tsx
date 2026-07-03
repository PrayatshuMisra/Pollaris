import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Presentation, FolderOpen, LayoutTemplate, Trash2, MoreVertical, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Presentation as PresentationT } from "@/lib/types";
import { formatDistanceToNowStrict } from "@/lib/format-time";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "My presentations - Pollaris" }] }),
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
        .insert({ owner_id: userData.user.id, title: "My new presentation" })
        .select()
        .single();
      if (error) throw error;
      await supabase.from("slides").insert({
        presentation_id: data.id,
        order_index: 0,
        type: "multiple_choice",
        question: "What's on your mind?",
        config: {
          choices: [
            { id: crypto.randomUUID(), label: "Option 1" },
            { id: crypto.randomUUID(), label: "Option 2" },
            { id: crypto.randomUUID(), label: "Option 3" },
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
    <div className="flex min-h-[calc(100vh-64px)] text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 glass border-r border-white/50 hidden md:block">
        <div className="p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start font-bold bg-white/50 text-blue-700 hover:bg-white/70 h-10 px-4 shadow-sm border border-white/60">
            <Presentation className="mr-3 h-5 w-5" /> My presentations
          </Button>
          <Button variant="ghost" onClick={() => toast.info("Folders feature coming soon!")} className="w-full justify-start font-bold text-gray-800 hover:bg-white/40 h-10 px-4">
            <FolderOpen className="mr-3 h-5 w-5" /> Folders
          </Button>
          <Button variant="ghost" onClick={() => toast.info("Inspiration templates coming soon!")} className="w-full justify-start font-bold text-gray-800 hover:bg-white/40 h-10 px-4">
            <LayoutTemplate className="mr-3 h-5 w-5" /> Inspiration
          </Button>
          <div className="h-px bg-white/40 my-4 mx-4" />
          <Button variant="ghost" onClick={() => toast.info("Trash coming soon!")} className="w-full justify-start font-bold text-gray-800 hover:bg-white/40 h-10 px-4">
            <Trash2 className="mr-3 h-5 w-5" /> Trash
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 max-w-6xl mx-auto">
          <h1 className="text-[1.75rem] font-black text-gray-900 tracking-tight drop-shadow-sm">My presentations</h1>
          <Button size="lg" className="rounded bg-black hover:bg-neutral-800 text-white shadow-md font-bold h-11 px-6" disabled={create.isPending} onClick={() => create.mutate()}>
            {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            New presentation
          </Button>
        </div>

        <div className="mt-8 max-w-6xl mx-auto">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-[4/3] animate-pulse rounded-lg bg-white/20" />
              ))}
            </div>
          ) : presentations && presentations.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {presentations.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="group relative flex flex-col rounded-lg glass shadow-md border border-white/60 hover:shadow-lg hover:border-white/80 transition-all overflow-hidden"
                >
                  <Link to="/editor/$id" params={{ id: p.id }} className="flex-1 flex flex-col">
                    <div className="h-32 bg-white/30 border-b border-white/40 flex items-center justify-center relative group-hover:bg-white/50 transition-colors">
                      <Presentation className="h-10 w-10 text-gray-600/50" strokeWidth={1} />
                      <div className="absolute inset-0 bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                        <div className="rounded-full bg-white p-2 shadow-lg text-gray-900 hover:text-blue-600">
                          <Play className="h-4 w-4 fill-current" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900 truncate leading-tight drop-shadow-sm">{p.title}</h3>
                        <button className="text-gray-700 hover:text-black p-1 -mr-2 -mt-1 rounded-sm hover:bg-white/50" onClick={(e) => { e.preventDefault(); }}>
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-1.5 text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                        {p.updated_at ? `Updated ${formatDistanceToNowStrict(new Date(p.updated_at))} ago` : "Just now"}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg glass border border-white/60 p-16 text-center shadow-lg">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/50 border border-white/60 mb-5 shadow-inner">
                <Presentation className="h-7 w-7 text-gray-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 drop-shadow-sm">No presentations yet</h3>
              <p className="mt-2 text-sm text-gray-800 font-bold">Create your first interactive presentation and engage your audience.</p>
              <Button className="mt-6 rounded bg-black hover:bg-neutral-800 text-white shadow-md font-bold h-11 px-6" onClick={() => create.mutate()}>
                <Plus className="mr-2 h-4 w-4" /> New presentation
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
