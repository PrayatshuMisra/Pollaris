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
  ArrowLeft, ChevronLeft, ChevronRight, Copy, Loader2, PowerOff, Users, Maximize, Minimize, Timer
} from "lucide-react";
import { toast } from "sonner";
import { generateResultsPDF } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/present/$id")({
  head: () => ({ meta: [{ title: "Present - Pollaris" }] }),
  component: PresentPage,
});

function PresentPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [votes, setVotes] = useState<Vote[]>([]);
  const [audienceCount, setAudienceCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  useEffect(() => {
    if (!currentSlide || !session) return;
    const config = currentSlide.config as any;
    // Auto-start the timer if it's configured but hasn't been started (e.g., first slide)
    if (config?.timer && !config.timer_started_at) {
      supabase.from("slides").update({
        config: { ...config, timer_started_at: Date.now() }
      }).eq("id", currentSlide.id).then(() => {
        slidesQ.refetch();
      });
    }
  }, [currentSlide?.id, session?.id]);

  const timer = (currentSlide?.config as any)?.timer as number | undefined;
  const timerStartedAt = (currentSlide?.config as any)?.timer_started_at as number | undefined;
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!timer || !timerStartedAt) {
      setTimeLeft(null);
      return;
    }
    const update = () => {
      const elapsed = Math.floor((Date.now() - timerStartedAt) / 1000);
      const remaining = Math.max(0, timer - elapsed);
      setTimeLeft(remaining);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timer, timerStartedAt]);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

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
    if (!session || !currentSlide) return;
    const ch = supabase
      .channel(`session:${session.id}:slide:${currentSlide.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "votes", filter: `session_id=eq.${session.id}` },
        (payload) => {
          const v = payload.new as Vote;
          if (v.slide_id !== currentSlide.id) return;
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
  }, [session?.id, currentSlide?.id]);

  // Reset votes when slide changes
  useEffect(() => {
    setVotes([]);
  }, [currentSlide?.id]);

  // QR
  useEffect(() => {
    if (!session) return;
    const url = `${window.location.origin}/p/${session.join_code}`;
    QRCode.toDataURL(url, { margin: 1, color: { dark: "#000000ff", light: "#00000000" }, width: 240 })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [session?.join_code]);

  async function goto(delta: number) {
    if (!session || !slides.length) return;
    const next = slides[Math.max(0, Math.min(slides.length - 1, currentIdx + delta))];
    if (!next || next.id === session.current_slide_id) return;
    
    if (next.config && (next.config as any).timer) {
      await supabase.from("slides").update({
        config: { ...next.config, timer_started_at: Date.now() }
      }).eq("id", next.id);
    }

    await supabase.from("sessions").update({ current_slide_id: next.id }).eq("id", session.id);
    sessionQ.refetch();
    slidesQ.refetch();
  }

  async function endSession() {
    if (!session) return;
    
    try {
      // Fetch all votes for the session to generate the final PDF report
      const { data: allVotes } = await supabase
        .from("votes")
        .select("*")
        .eq("session_id", session.id);
        
      if (allVotes && allVotes.length > 0) {
        toast.info("Generating results PDF...");
        generateResultsPDF(slides, allVotes as Vote[], session.join_code);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF");
    }

    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
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
      if (e.key === "f") { e.preventDefault(); toggleFullscreen(); }
      if (e.key === "Escape" && !document.fullscreenElement) endSession();
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
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background px-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">No live session</h1>
          <p className="mt-2 text-muted-foreground">Go back to the editor and press Present.</p>
          <Link to="/editor/$id" params={{ id }}>
            <Button className="mt-6 rounded-md font-medium">Back to editor</Button>
          </Link>
        </div>
      </div>
    );
  }

  const bgUrl = (currentSlide?.config as any)?.bg_image_url as string | undefined;
  const isDark = (currentSlide?.config as any)?.design?.theme === 'dark';
  const fontSize = (currentSlide?.config as any)?.design?.fontSize || 'normal';

  const titleSizes = {
    normal: "text-3xl md:text-5xl",
    large: "text-4xl md:text-6xl",
    huge: "text-5xl md:text-7xl"
  };
  const descSizes = {
    normal: "text-xl",
    large: "text-2xl",
    huge: "text-3xl"
  };

  return (
    <div className={`flex min-h-[calc(100vh-3.5rem)] flex-col pt-20 transition-colors duration-700 ${isDark ? 'bg-[#222222] text-white' : 'bg-gray-50 text-gray-900'} ${((currentSlide?.config as any)?.design?.font || 'font-sans')}`}>
      {/* Header bar */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-[1800px] z-50">
        <div className={`mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-2 rounded-full backdrop-blur-2xl transition-all ${isDark ? 'bg-white/10 border border-white/20' : 'bg-white/20 border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)]'}`}>
          <div className="flex items-center gap-4">
            <Link to="/editor/$id" params={{ id }} className={`${isDark ? 'text-white hover:bg-white/20' : 'text-gray-700 hover:text-gray-900 hover:bg-white/50'} p-2 rounded-full transition-colors`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400 shadow-sm border border-green-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Live
            </span>
            <span className={`text-sm font-bold drop-shadow-sm ml-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Slide {currentIdx + 1} of {slides.length}
            </span>
          </div>
          <div className="flex items-center gap-5">
            {timeLeft !== null && (
              <div className={`flex items-center gap-2 text-sm font-black drop-shadow-sm px-3 py-1.5 rounded-full shadow-inner ${isDark ? 'bg-white/10 text-white border border-white/20' : 'bg-white/40 text-gray-900 border border-white/60'}`}>
                <Timer className={`h-4 w-4 ${isDark ? 'text-white' : 'text-blue-600'}`} />
                <span className={timeLeft === 0 ? "text-red-500 animate-pulse" : ""}>{timeLeft}s</span>
              </div>
            )}
            <div className={`flex items-center gap-2 text-sm font-bold drop-shadow-sm ${isDark ? 'text-white' : 'text-gray-700'}`}>
              <Users className="h-4 w-4" /> {audienceCount}
            </div>
            <div className="h-4 w-px bg-white/40 mx-1" />
            <Button size="icon" variant="ghost" className={`rounded-full h-8 w-8 transition-colors ${isDark ? 'text-white hover:bg-white/20' : 'text-gray-700 hover:bg-white/60 hover:text-black'}`} onClick={toggleFullscreen} title="Toggle Fullscreen (f)">
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="outline" className={`rounded-full font-bold transition-colors shadow-sm px-5 ${isDark ? 'bg-transparent border-white/40 text-white hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50' : 'glass border-white/60 text-gray-900 hover:bg-red-100 hover:text-red-700 hover:border-red-200'}`} onClick={endSession}>
              <PowerOff className="mr-1.5 h-3.5 w-3.5" /> End presentation
            </Button>
          </div>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-6 p-6 md:grid-cols-[1fr_320px]">
        {/* Main stage */}
        <div className={`flex flex-col p-8 md:p-12 relative overflow-hidden transition-colors duration-700 ${isDark ? 'bg-transparent border-none shadow-none text-white' : 'rounded-xl border bg-white/70 border-white/80 glass-panel shadow-2xl text-black backdrop-blur-xl'}`}>
          <AnimatePresence mode="wait">
            {currentSlide && (
              <motion.div
                key={currentSlide.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="flex-1 flex flex-col relative z-10"
              >
                {bgUrl && (
                  <>
                    <div 
                      className={`absolute ${isDark ? 'inset-[-200%]' : 'inset-0'} bg-cover bg-center z-[-2] opacity-40 transition-all duration-1000 ease-in-out`}
                      style={{ backgroundImage: `url(${bgUrl})` }}
                    />
                    <div className={`absolute ${isDark ? 'inset-[-200%] bg-[#222222]/80' : 'inset-0 bg-white/80 backdrop-blur-sm'} z-[-1] pointer-events-none`} />
                  </>
                )}
                <p className={`text-xs font-black uppercase tracking-widest drop-shadow-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {currentSlide.type.replace("_", " ")}
                </p>
                <h1 className={`mt-4 ${titleSizes[fontSize as keyof typeof titleSizes]} font-black tracking-tight text-inherit drop-shadow-sm`}>
                  {currentSlide.question || "Untitled question"}
                </h1>
                {currentSlide.description && (
                  <p className={`mt-4 ${descSizes[fontSize as keyof typeof descSizes]} opacity-90 font-medium leading-relaxed`}>{currentSlide.description}</p>
                )}
                <div className="mt-10 flex-1">
                  <ResultsView slide={currentSlide} votes={votes} />
                </div>
                <div className={`mt-8 flex items-center justify-between border-t pt-5 text-sm font-bold ${isDark ? 'border-white/10 text-gray-400' : 'border-white/40 text-gray-600'}`}>
                  <span>{votes.length} vote{votes.length === 1 ? "" : "s"}</span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => goto(-1)} disabled={currentIdx === 0} className={`rounded-md h-8 w-8 p-0 transition-colors ${isDark ? 'bg-transparent border-white/20 text-white hover:bg-white/10' : 'glass border-white/60 text-gray-900 hover:bg-white/60'}`}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => goto(1)} disabled={currentIdx >= slides.length - 1} className={`rounded-md h-8 w-8 p-0 transition-colors ${isDark ? 'bg-transparent border-white/20 text-white hover:bg-white/10' : 'glass border-white/60 text-gray-900 hover:bg-white/60'}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* QR side */}
        {/* QR side */}
        <div className={`flex flex-col relative overflow-hidden p-6 transition-colors duration-700 ${isDark ? 'bg-transparent border-none shadow-none text-white' : 'rounded-xl border border-white/60 glass-panel shadow-xl'}`}>
          <p className={`text-xs font-black uppercase tracking-widest drop-shadow-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Join at</p>
          <p className={`mt-2 font-mono text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{window.location.host}/join</p>
          <p className={`mt-8 text-xs font-black uppercase tracking-widest drop-shadow-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Code</p>
          <div className={`mt-2 flex items-center justify-between gap-2 rounded-lg p-3 shadow-inner border ${isDark ? 'bg-white/10 border-white/20' : 'bg-white/40 border-white/50'}`}>
            <span className={`font-mono text-3xl font-black tracking-[0.2em] drop-shadow-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{session?.join_code}</span>
            <button
              className={`rounded-md p-2 transition-all border border-transparent ${isDark ? 'text-gray-300 hover:text-white hover:bg-white/20 hover:border-white/40' : 'text-gray-600 hover:text-black hover:bg-white/60 hover:border-white/80'}`}
              onClick={() => {
                const code = session?.join_code;
                if (code) {
                  navigator.clipboard.writeText(code);
                  toast.success("Code copied");
                }
              }}
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          {qrDataUrl && (
            <div className={`mt-8 rounded-xl p-5 shadow-inner flex flex-col items-center border ${isDark ? 'bg-white/10 border-white/20' : 'bg-white/50 border-white/60'}`}>
              <img src={qrDataUrl} alt="Join QR code" className={`w-full max-w-[200px] rounded-md drop-shadow-sm ${isDark ? 'bg-white p-2' : ''}`} />
              <p className={`mt-4 text-center text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Or scan to join</p>
            </div>
          )}
          <div className="mt-auto pt-8">
            <p className={`text-xs font-bold text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              ← → to change slide · Esc to end
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
