import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import type { Slide, Session, Vote } from "@/lib/types";
import { ResultsView } from "@/components/results-view";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Copy, Loader2, PowerOff, Users,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/present/$id")({
  head: () => ({ meta: [{ title: "Present — Pollaris" }] }),
  component: PresentPage,
});

function PresentPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [votes, setVotes] = useState<Vote[]>([]);
  const [audienceCount, setAudienceCount] = useState(0);

  const sessionQ = useQuery({
    queryKey: ["session", "live", id],
    queryFn: async (): Promise<Session | null> => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("presentation_id", id)
        .eq("status", "live")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Session | null;
    },
  });
  const session = sessionQ.data;

  const slidesQ = useQuery({
    queryKey: ["slides", id],
    enabled: !!id,
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
  const currentIdx = Math.max(0, slides.findIndex((s) => s.id === session?.current_slide_id));
  const currentSlide = slides[currentIdx] ?? null;

  // Load votes for current slide
  useEffect(() => {
    if (!session || !currentSlide) return;
    let cancelled = false;
    supabase
      .from("votes")
      .select("*")
      .eq("slide_id", currentSlide.id)
      .then(({ data }) => {
        if (!cancelled) setVotes((data ?? []) as Vote[]);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.id, currentSlide?.id]);

  // Realtime channel for votes + participants
  useEffect(() => {
    if (!session) return;
    const ch = supabase
      .channel(`session:${session.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "votes", filter: `session_id=eq.${session.id}` },
        (payload) => {
          const v = payload.new as Vote;
          if (v.slide_id !== session.current_slide_id) return;
          setVotes((prev) => (prev.find((x) => x.id === v.id) ? prev : [...prev, v]));
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "participants", filter: `session_id=eq.${session.id}` },
        () => setAudienceCount((c) => c + 1),
      )
      .subscribe();

    supabase
      .from("participants")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session.id)
      .then(({ count }) => setAudienceCount(count ?? 0));

    return () => {
      supabase.removeChannel(ch);
    };
  }, [session?.id]);

  // Reset votes when slide changes
  useEffect(() => {
    setVotes([]);
  }, [currentSlide?.id]);

  // QR
  useEffect(() => {
    if (!session) return;
    const url = `${window.location.origin}/p/${session.join_code}`;
    QRCode.toDataURL(url, { margin: 1, color: { dark: "#ffffff", light: "#00000000" }, width: 240 })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [session?.join_code]);

  async function goto(delta: number) {
    if (!session || !slides.length) return;
    const next = slides[Math.max(0, Math.min(slides.length - 1, currentIdx + delta))];
    if (!next || next.id === session.current_slide_id) return;
    await supabase.from("sessions").update({ current_slide_id: next.id }).eq("id", session.id);
    sessionQ.refetch();
  }

  async function endSession() {
    if (!session) return;
    await supabase.from("sessions")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", session.id);
    toast.success("Presentation ended");
    navigate({ to: "/editor/$id", params: { id } });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " " ) { e.preventDefault(); goto(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goto(-1); }
      if (e.key === "Escape") endSession();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session?.id, currentIdx, slides.length]);

  const joinUrl = useMemo(
    () => (session ? `${window.location.origin}/p/${session.join_code}` : ""),
    [session?.join_code],
  );

  if (sessionQ.isLoading || slidesQ.isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!session) {
    return (
      <div className="mesh-bg flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">No live session</h1>
          <p className="mt-2 text-muted-foreground">Go back to the editor and press Present.</p>
          <Link to="/editor/$id" params={{ id }}>
            <Button className="mt-6 rounded-full">Back to editor</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mesh-bg flex min-h-[calc(100vh-3.5rem)] flex-col">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-6 py-3">
        <div className="flex items-center gap-3">
          <Link to="/editor/$id" params={{ id }} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">● Live</span>
          <span className="text-sm text-muted-foreground">
            Slide {currentIdx + 1} of {slides.length}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" /> {audienceCount}
          </div>
          <Button size="sm" variant="outline" className="rounded-full" onClick={endSession}>
            <PowerOff className="mr-1 h-3.5 w-3.5" /> End
          </Button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-6 p-6 md:grid-cols-[1fr_320px]">
        {/* Main stage */}
        <div className="flex flex-col rounded-3xl border border-white/5 bg-white/[0.02] p-8 md:p-12">
          <AnimatePresence mode="wait">
            {currentSlide && (
              <motion.div
                key={currentSlide.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="flex-1 flex flex-col"
              >
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {currentSlide.type.replace("_", " ")}
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
                  {currentSlide.question || "Untitled question"}
                </h1>
                {currentSlide.description && (
                  <p className="mt-3 text-lg text-muted-foreground">{currentSlide.description}</p>
                )}
                <div className="mt-8 flex-1">
                  <ResultsView slide={currentSlide} votes={votes} />
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 text-sm text-muted-foreground">
                  <span>{votes.length} vote{votes.length === 1 ? "" : "s"}</span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => goto(-1)} disabled={currentIdx === 0}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => goto(1)} disabled={currentIdx >= slides.length - 1}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* QR side */}
        <div className="glass rounded-3xl p-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Join at</p>
          <p className="mt-2 font-mono text-xl">{window.location.host}/join</p>
          <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">Code</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-3xl font-semibold tracking-widest">{session.join_code}</span>
            <button
              className="rounded-md p-1 text-muted-foreground hover:bg-white/5 hover:text-foreground"
              onClick={() => {
                navigator.clipboard.writeText(session.join_code);
                toast.success("Code copied");
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          {qrDataUrl && (
            <div className="mt-6 rounded-xl bg-white/[0.03] p-4">
              <img src={qrDataUrl} alt="Join QR code" className="w-full" />
              <p className="mt-3 text-center text-xs text-muted-foreground">Or scan to join</p>
            </div>
          )}
          <p className="mt-6 text-xs text-muted-foreground">
            ← → to change slide · Esc to end
          </p>
        </div>
      </div>
    </div>
  );
}
