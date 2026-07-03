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
  ArrowLeft, ChevronDown, ChevronUp, Copy, Play, Plus, Save, Trash2, Loader2, Settings
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
      toast.success("Saved successfully");
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
      const first = slides[0];
      await supabase.from("sessions").update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("presentation_id", id).eq("status", "live");
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
    return <div className="flex min-h-screen items-center justify-center bg-gray-50"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }
  if (presentationQ.error) return <div className="p-10 text-center text-gray-900 font-bold">Presentation not found.</div>;

  return (
    <div className="flex h-screen flex-col bg-transparent text-gray-900 font-sans">
      {/* Top Toolbar */}
      <header className="flex h-14 items-center justify-between border-b border-white/50 glass px-4 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded text-gray-700 hover:bg-white/50 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="h-6 w-px bg-white/40 mx-1" />
          <Input
            value={presentationQ.data?.title ?? ""}
            onChange={(e) => {
              const next = { ...(presentationQ.data as Presentation), title: e.target.value };
              qc.setQueryData(["presentation", id], next);
            }}
            className="w-64 border-0 bg-transparent text-sm font-bold text-gray-900 focus-visible:ring-0 px-2 shadow-none hover:bg-white/40 rounded placeholder:text-gray-600 transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={saveAll} disabled={saving} className="rounded glass border-white/60 text-gray-900 hover:bg-white/60 font-bold h-9 px-4 transition-colors">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
          <Button size="sm" onClick={startPresentation} disabled={starting} className="rounded bg-black hover:bg-neutral-800 text-white font-bold shadow-md h-9 px-6 transition-colors">
            {starting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4 fill-current" />}
            Present
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Slides List */}
        <aside className="w-[240px] flex-shrink-0 border-r border-white/50 glass flex flex-col overflow-hidden shadow-xl z-10">
          <div className="p-4 border-b border-white/40">
            <Button onClick={addSlide} className="w-full rounded glass border border-white/60 hover:bg-white/60 text-gray-900 shadow-sm font-bold h-10 transition-colors">
              <Plus className="mr-2 h-4 w-4" /> New slide
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {slides.map((s, i) => (
              <div
                key={s.id}
                className={`group flex items-start gap-3 cursor-pointer p-1 -mx-1 rounded transition-colors ${
                  selectedSlideId === s.id ? "bg-white/40" : "hover:bg-white/20"
                }`}
                onClick={() => setSelectedSlideId(s.id)}
              >
                <div className="font-bold text-gray-700 text-[11px] pt-1 w-4 text-center">{i + 1}</div>
                <div className={`flex-1 rounded-md border-2 transition-all overflow-hidden ${selectedSlideId === s.id ? 'border-blue-500 shadow-md bg-white/50' : 'border-white/40 hover:border-white/60 bg-white/20'}`}>
                  {/* Thumbnail Preview */}
                  <div className="aspect-[4/3] bg-white/30 flex flex-col items-center justify-center p-2 relative backdrop-blur-sm">
                    <span className="text-gray-900/20 text-4xl font-black opacity-30">{i + 1}</span>
                    
                    {/* Hover Actions */}
                    <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="rounded glass border border-white/60 p-1 shadow-sm hover:bg-white/80 text-gray-800 transition-colors" onClick={(e) => { e.stopPropagation(); duplicateSlide(s); }}><Copy className="h-3 w-3" /></button>
                      <button className="rounded glass border border-white/60 p-1 shadow-sm hover:bg-red-100 hover:border-red-300 text-red-600 transition-colors" onClick={(e) => { e.stopPropagation(); deleteSlide(s.id); }}><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                  {/* Label */}
                  <div className="bg-white/40 border-t border-white/50 py-1.5 px-2">
                    <p className="text-[10px] font-bold text-gray-800 uppercase tracking-wide truncate">
                      {SLIDE_TYPE_LABELS[s.type]}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Center Canvas */}
        <main className="flex-1 bg-transparent overflow-auto flex items-center justify-center p-4 md:p-8 relative">
          {selectedSlide ? (
            <motion.div
              key={selectedSlide.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="glass-panel rounded-xl shadow-2xl border border-white/80 p-6 md:p-12 flex flex-col overflow-hidden"
              style={{
                aspectRatio: "16/9",
                width: "100%",
                maxHeight: "calc(100vh - 12rem)",
                maxWidth: "calc((100vh - 12rem) * 16 / 9)"
              }}
            >
              <SlideEditor slide={selectedSlide} onChange={patchSlideLocal} />
            </motion.div>
          ) : (
            <div className="text-center text-sm font-bold text-gray-700 glass px-6 py-3 rounded-full shadow-lg border border-white/60">Select a slide to edit</div>
          )}
        </main>

        {/* Right Sidebar - Configuration */}
        <aside className="w-[340px] flex-shrink-0 border-l border-white/50 glass flex flex-col overflow-hidden shadow-xl z-10">
          <div className="flex items-center gap-4 px-6 py-4 border-b border-white/40 bg-white/20">
             <div className="font-bold text-sm text-gray-900 border-b-2 border-blue-600 pb-1 drop-shadow-sm">Content</div>
             <div className="font-bold text-sm text-gray-500 hover:text-gray-800 pb-1 cursor-pointer transition-colors">Design</div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Slide Type Selection */}
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-gray-600 drop-shadow-sm">Slide type</p>
              {selectedSlide && (
                <SlideTypePicker value={selectedSlide.type} onChange={changeType} />
              )}
            </div>
            
            {/* Settings */}
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-gray-600 drop-shadow-sm">Settings</p>
              <div className="rounded-lg border border-white/60 glass p-4 shadow-sm flex items-center gap-3">
                 <Settings className="h-5 w-5 text-gray-700" />
                 <span className="text-sm font-bold text-gray-900">Advanced settings available during presentation.</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
