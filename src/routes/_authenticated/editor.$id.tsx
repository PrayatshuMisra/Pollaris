import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Slide, Presentation, SlideType } from "@/lib/types";
import { defaultConfigFor, SLIDE_TYPE_LABELS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SlideEditor, SlideTypePicker } from "@/components/slide-editor";
import { ResultsView } from "@/components/results-view";
import { generateJoinCode } from "@/lib/join-code";
import {
  ArrowLeft, ChevronDown, ChevronUp, Copy, Play, Plus, Save, Trash2, Loader2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/editor/$id")({
  head: () => ({ meta: [{ title: "Editor — Pollaris" }] }),
  component: EditorPage,
});

function EditorPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);

  const presentationQ = useQuery({
    queryKey: ["presentation", id],
    queryFn: async (): Promise<Presentation> => {
      const { data, error } = await supabase.from("presentations").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Presentation;
    },
  });

  const slidesQ = useQuery({
    queryKey: ["slides", id],
    queryFn: async (): Promise<Slide[]> => {
      const { data, error } = await supabase
        .from("slides")
        .select("*")
        .eq("presentation_id", id)
        .order("order_index");
      if (error) throw error;
      return (data ?? []) as Slide[];
    },
  });

  const slides = slidesQ.data ?? [];

  useEffect(() => {
    if (!selectedSlideId && slides.length > 0) setSelectedSlideId(slides[0].id);
    if (selectedSlideId && !slides.find((s) => s.id === selectedSlideId) && slides.length > 0) {
      setSelectedSlideId(slides[0].id);
    }
  }, [slides, selectedSlideId]);

  const selectedSlide = slides.find((s) => s.id === selectedSlideId) ?? null;

  const patchSlideLocal = useCallback(
    (patch: Partial<Slide>) => {
      if (!selectedSlide) return;
      qc.setQueryData<Slide[]>(["slides", id], (prev) =>
        (prev ?? []).map((s) => (s.id === selectedSlide.id ? { ...s, ...patch } : s)),
      );
    },
    [qc, id, selectedSlide],
  );

  async function saveAll() {
    setSaving(true);
    try {
      const current = qc.getQueryData<Slide[]>(["slides", id]) ?? [];
      for (const s of current) {
        const { error } = await supabase
          .from("slides")
          .update({
            question: s.question,
            description: s.description,
            type: s.type,
            config: s.config as never,
            order_index: s.order_index,
          })
          .eq("id", s.id);
        if (error) throw error;
      }
      // save presentation title
      const p = presentationQ.data;
      if (p) {
        await supabase.from("presentations").update({ title: p.title, description: p.description }).eq("id", p.id);
      }
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function addSlide() {
    const nextIdx = slides.length;
    const { data, error } = await supabase
      .from("slides")
      .insert({
        presentation_id: id,
        order_index: nextIdx,
        type: "multiple_choice",
        question: "",
        config: defaultConfigFor("multiple_choice") as never,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    qc.setQueryData<Slide[]>(["slides", id], (prev) => [...(prev ?? []), data as Slide]);
    setSelectedSlideId((data as Slide).id);
  }

  async function duplicateSlide(s: Slide) {
    const nextIdx = slides.length;
    const { data, error } = await supabase
      .from("slides")
      .insert({
        presentation_id: id,
        order_index: nextIdx,
        type: s.type,
        question: s.question,
        description: s.description,
        config: s.config as never,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    qc.setQueryData<Slide[]>(["slides", id], (prev) => [...(prev ?? []), data as Slide]);
    setSelectedSlideId((data as Slide).id);
  }

  async function deleteSlide(sid: string) {
    if (slides.length <= 1) return toast.error("Keep at least one slide");
    const { error } = await supabase.from("slides").delete().eq("id", sid);
    if (error) return toast.error(error.message);
    qc.setQueryData<Slide[]>(["slides", id], (prev) => (prev ?? []).filter((s) => s.id !== sid));
  }

  async function move(sid: string, dir: -1 | 1) {
    const idx = slides.findIndex((s) => s.id === sid);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= slides.length) return;
    const a = slides[idx];
    const b = slides[target];
    // swap orders
    const next = slides.map((s) => {
      if (s.id === a.id) return { ...s, order_index: b.order_index };
      if (s.id === b.id) return { ...s, order_index: a.order_index };
      return s;
    }).sort((x, y) => x.order_index - y.order_index);
    qc.setQueryData(["slides", id], next);
    await supabase.from("slides").update({ order_index: b.order_index }).eq("id", a.id);
    await supabase.from("slides").update({ order_index: a.order_index }).eq("id", b.id);
  }

  async function changeType(t: SlideType) {
    if (!selectedSlide) return;
    patchSlideLocal({ type: t, config: defaultConfigFor(t) });
  }

  async function startPresentation() {
    if (slides.length === 0) return toast.error("Add a slide first");
    setStarting(true);
    try {
      await saveAll();
      // reuse existing live session for this presentation, or create one
      const first = slides[0];
      // end any prior live sessions
      await supabase.from("sessions").update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("presentation_id", id).eq("status", "live");
      // create new
      let code = generateJoinCode();
      for (let attempt = 0; attempt < 4; attempt++) {
        const { data, error } = await supabase
          .from("sessions")
          .insert({
            presentation_id: id,
            join_code: code,
            status: "live",
            current_slide_id: first.id,
            started_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (!error && data) {
          navigate({ to: "/present/$id", params: { id } });
          return;
        }
        if (error?.code === "23505") {
          code = generateJoinCode();
          continue;
        }
        throw error;
      }
      throw new Error("Could not generate a unique code");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start");
    } finally {
      setStarting(false);
    }
  }

  if (presentationQ.isLoading || slidesQ.isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (presentationQ.error) return <div className="p-10 text-center">Presentation not found.</div>;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-background">
      {/* toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-background/80 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Input
            value={presentationQ.data?.title ?? ""}
            onChange={(e) => {
              const next = { ...(presentationQ.data as Presentation), title: e.target.value };
              qc.setQueryData(["presentation", id], next);
            }}
            className="max-w-md border-0 bg-transparent text-base font-semibold tracking-tight focus-visible:ring-0 px-0 h-auto"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={saveAll} disabled={saving} className="rounded-md font-medium">
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            Save
          </Button>
          <Button size="sm" onClick={startPresentation} disabled={starting} className="rounded-md font-medium">
            {starting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-1.5 h-3.5 w-3.5" />}
            Present
          </Button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 md:grid-cols-[260px_1fr_360px]">
        {/* Slides sidebar */}
        <aside className="border-r border-border bg-muted/20 p-4">
          <div className="mb-4 flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Slides</span>
            <Button size="icon" variant="ghost" onClick={addSlide} className="h-7 w-7 rounded-md">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {slides.map((s, i) => (
              <div
                key={s.id}
                className={`group cursor-pointer rounded-lg border px-3 py-2.5 text-sm transition-all ${
                  selectedSlideId === s.id ? "border-border bg-card shadow-sm" : "border-transparent bg-muted/40 hover:bg-muted"
                }`}
                onClick={() => setSelectedSlideId(s.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-medium text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                    <button className="rounded-md p-1 hover:bg-background border border-transparent hover:border-border hover:shadow-sm transition-all" onClick={(e) => { e.stopPropagation(); move(s.id, -1); }}><ChevronUp className="h-3 w-3 text-muted-foreground" /></button>
                    <button className="rounded-md p-1 hover:bg-background border border-transparent hover:border-border hover:shadow-sm transition-all" onClick={(e) => { e.stopPropagation(); move(s.id, 1); }}><ChevronDown className="h-3 w-3 text-muted-foreground" /></button>
                    <button className="rounded-md p-1 hover:bg-background border border-transparent hover:border-border hover:shadow-sm transition-all" onClick={(e) => { e.stopPropagation(); duplicateSlide(s); }}><Copy className="h-3 w-3 text-muted-foreground" /></button>
                    <button className="rounded-md p-1 hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all text-destructive" onClick={(e) => { e.stopPropagation(); deleteSlide(s.id); }}><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
                <p className="mt-1.5 truncate text-xs font-medium">
                  {s.question || <span className="text-muted-foreground italic">Untitled</span>}
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {SLIDE_TYPE_LABELS[s.type]}
                </p>
              </div>
            ))}
          </div>
        </aside>

        {/* Center editor */}
        <main className="grid-bg overflow-auto px-8 py-10">
          {selectedSlide ? (
            <motion.div
              key={selectedSlide.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-2xl"
            >
              <SlideEditor slide={selectedSlide} onChange={patchSlideLocal} />
            </motion.div>
          ) : (
            <div className="text-center text-sm font-medium text-muted-foreground mt-20">Select a slide</div>
          )}
        </main>

        {/* Right panel */}
        <aside className="border-l border-border bg-muted/20 p-5">
          <div className="space-y-8">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Slide type</p>
              {selectedSlide && (
                <SlideTypePicker value={selectedSlide.type} onChange={changeType} />
              )}
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Live preview</p>
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                {selectedSlide ? (
                  <>
                    <h4 className="text-sm font-semibold tracking-tight">{selectedSlide.question || "Your question"}</h4>
                    <div className="mt-4">
                      <ResultsView slide={selectedSlide} votes={[]} compact />
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
