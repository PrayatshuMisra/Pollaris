import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Session, Slide } from "@/lib/types";
import { getAnonId, getStoredName, setStoredName } from "@/lib/anon-id";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Radio, Star, Timer } from "lucide-react";

export const Route = createFileRoute("/p/$code")({
  head: () => ({
    meta: [
      { title: "Pollaris — Live session" },
      { name: "description", content: "You're in a live Pollaris session." },
    ],
  }),
  component: AudienceView,
});

function AudienceView() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [joining, setJoining] = useState(false);

  const sessionQ = useQuery({
    queryKey: ["p", code, "session"],
    refetchInterval: 5000,
    queryFn: async (): Promise<Session | null> => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("join_code", code)
        .maybeSingle();
      if (error) throw error;
      return data as Session | null;
    },
  });
  const session = sessionQ.data;

  const slideQ = useQuery({
    queryKey: ["p", code, "slide", session?.current_slide_id],
    enabled: !!session?.current_slide_id,
    refetchInterval: 3000,
    queryFn: async (): Promise<Slide | null> => {
      if (!session?.current_slide_id) return null;
      const { data, error } = await supabase.from("slides").select("*").eq("id", session.current_slide_id).maybeSingle();
      if (error) throw error;
      return data as Slide | null;
    },
  });
  const slide = slideQ.data;

  useEffect(() => {
    setName(getStoredName());
  }, []);

  // realtime slide changes
  useEffect(() => {
    if (!session) return;
    const ch = supabase
      .channel(`aud:${session.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${session.id}` },
        () => sessionQ.refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [session?.id]);

  async function joinAsParticipant(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setJoining(true);
    try {
      const anon = getAnonId();
      setStoredName(name);
      // Try to reuse
      const { data: existing } = await supabase
        .from("participants")
        .select("id")
        .eq("session_id", session.id)
        .eq("anon_id", anon)
        .maybeSingle();
      if (existing) {
        setParticipantId(existing.id);
      } else {
        const { data, error } = await supabase
          .from("participants")
          .insert({ session_id: session.id, anon_id: anon, display_name: name || null })
          .select()
          .single();
        if (error) throw error;
        setParticipantId(data.id);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to join");
    } finally {
      setJoining(false);
    }
  }

  if (sessionQ.isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Session not found</h1>
          <p className="mt-2 text-muted-foreground">Double-check the code with your presenter.</p>
          <Link to="/join"><Button className="mt-6 rounded-md font-medium">Try another code</Button></Link>
        </div>
      </div>
    );
  }

  if (session.status !== "live") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">This session has ended</h1>
          <p className="mt-2 text-muted-foreground">Thanks for joining!</p>
        </div>
      </div>
    );
  }

  if (!participantId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
        <motion.form
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={joinAsParticipant}
          className="w-full max-w-[400px] rounded-xl border border-border bg-card p-8 shadow-sm"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Radio className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Session</p>
              <p className="font-mono text-lg font-medium">{session.join_code}</p>
            </div>
          </div>
          <div className="space-y-1 mt-6">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Your name (optional)</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Anonymous" className="h-10 rounded-md" />
          </div>
          <Button type="submit" disabled={joining} className="mt-5 w-full rounded-md font-medium h-10">
            {joining ? "Joining…" : "Join"}
          </Button>
        </motion.form>
      </div>
    );
  }

  const bgUrl = (slide?.config as any)?.bg_image_url as string | undefined;
  const isDark = (slide?.config as any)?.design?.theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors duration-700 ${isDark ? 'bg-[#222222] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mx-auto flex max-w-xl flex-col px-6 py-10">
        <div className={`mb-8 flex items-center justify-between text-sm font-medium ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>
          <span>Session <span className={`font-mono tracking-widest ${isDark ? 'text-white' : 'text-foreground'}`}>{session.join_code}</span></span>
          <span className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
          </span>
        </div>
        <AnimatePresence mode="wait">
          {slide ? (
            <SlideResponder key={slide.id} slide={slide} sessionId={session.id} participantId={participantId} />
          ) : (
            <motion.div key="wait" className="text-center text-sm font-medium text-muted-foreground py-24">Waiting for the presenter…</motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SlideResponder({
  slide,
  sessionId,
  participantId,
}: {
  slide: Slide;
  sessionId: string;
  participantId: string;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeUp, setTimeUp] = useState(false);

  const timer = (slide.config as any)?.timer as number | undefined;
  const timerStartedAt = (slide.config as any)?.timer_started_at as number | undefined;
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!timer || !timerStartedAt) {
      setTimeLeft(null);
      return;
    }
    const update = () => {
      const elapsed = Math.floor((Date.now() - timerStartedAt) / 1000);
      const remaining = Math.max(0, timer - elapsed);
      setTimeLeft(remaining);
      if (remaining === 0) setTimeUp(true);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timer, timerStartedAt]);

  useEffect(() => {
    setSubmitted(false);
    setTimeUp(false);
    // check if this participant already voted for this slide
    supabase
      .from("votes")
      .select("id")
      .eq("slide_id", slide.id)
      .eq("participant_id", participantId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSubmitted(true);
      });
  }, [slide.id, participantId]);

  async function submit(value: Record<string, unknown>) {
    if (timeUp) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("votes").insert({
        session_id: sessionId,
        slide_id: slide.id,
        participant_id: participantId,
        value: value as never,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to submit";
      if (msg.includes("duplicate") || msg.includes("unique")) {
        setSubmitted(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (timeUp && !submitted) {
    return (
      <motion.div
        key="timeup"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-red-500/20 bg-red-50/50 p-10 text-center shadow-sm"
      >
        <Timer className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold tracking-tight text-red-900">Time's up!</h2>
        <p className="mt-2 text-sm text-red-700 font-medium">Voting has closed for this question.</p>
      </motion.div>
    );
  }

  if (submitted) {
    return (
      <motion.div
        key="thanks"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-10 text-center shadow-sm glass-panel"
      >
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-5 text-xl font-semibold tracking-tight">Response received</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Waiting for the next question…</p>
      </motion.div>
    );
  }

  const fontSize = (slide.config as any)?.design?.fontSize || 'normal';
  const titleSizes = {
    normal: "text-2xl md:text-3xl",
    large: "text-3xl md:text-4xl",
    huge: "text-4xl md:text-5xl"
  };
  const descSizes = {
    normal: "text-sm",
    large: "text-base",
    huge: "text-lg"
  };

  const isDark = (slide.config as any)?.design?.theme === 'dark';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`relative p-8 md:p-10 overflow-hidden transition-colors duration-700 ${isDark ? 'bg-transparent border-none shadow-none text-white' : 'rounded-xl border shadow-sm glass-panel border-border bg-card text-foreground'} ${((slide.config as any)?.design?.font || 'font-sans')}`}
    >
      {(slide.config as any)?.bg_image_url && (
        <>
          <div 
            className={`absolute ${isDark ? 'inset-[-200%]' : 'inset-0'} bg-cover bg-center z-[-2] opacity-40 transition-all duration-1000 ease-in-out`}
            style={{ backgroundImage: `url(${(slide.config as any).bg_image_url})` }}
          />
          <div className={`absolute ${isDark ? 'inset-[-200%] bg-[#222222]/80' : 'inset-0 bg-white/80 backdrop-blur-sm'} z-[-1] pointer-events-none`} />
        </>
      )}
      <div className="relative z-10 flex flex-col">
        <div className="flex items-start justify-between gap-4 mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-1">
            {slide.type.replace("_", " ")}
          </p>
          {timeLeft !== null && (
            <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm border shrink-0 ${timeLeft <= 5 ? "bg-red-100/80 text-red-700 border-red-200 animate-pulse" : "bg-white/60 text-blue-700 border-blue-200"}`}>
              <Timer className="h-3.5 w-3.5" /> {timeLeft}s left
            </div>
          )}
        </div>
        <h1 className={`mt-3 ${titleSizes[fontSize as keyof typeof titleSizes]} font-semibold tracking-tight`}>
          {slide.question || "Question"}
        </h1>
        {slide.description && <p className={`mt-3 ${descSizes[fontSize as keyof typeof descSizes]} text-muted-foreground leading-relaxed opacity-90`}>{slide.description}</p>}

        <div className="mt-8">
          {slide.type === "multiple_choice" && <MCResponder slide={slide} onSubmit={submit} submitting={submitting} isDark={isDark} />}
          {slide.type === "word_cloud" && <WordResponder onSubmit={submit} submitting={submitting} maxLen={40} isDark={isDark} />}
          {slide.type === "rating" && <RatingResponder onSubmit={submit} submitting={submitting} isDark={isDark} />}
          {slide.type === "open_text" && <WordResponder onSubmit={submit} submitting={submitting} maxLen={280} multiline isDark={isDark} />}
        </div>
      </div>
    </motion.div>
  );
}

function MCResponder({
  slide,
  onSubmit,
  submitting,
  isDark,
}: {
  slide: Slide;
  onSubmit: (v: Record<string, unknown>) => void;
  submitting: boolean;
  isDark?: boolean;
}) {
  const choices = (slide.config as { choices?: { id: string; label: string; image_url?: string }[] })?.choices ?? [];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {choices.map((c) => (
        <button
          key={c.id}
          disabled={submitting}
          onClick={() => onSubmit({ choice_id: c.id })}
          className={`group relative flex flex-col items-center justify-center overflow-hidden rounded-xl border p-5 text-center transition-all hover:border-blue-400 hover:shadow-md disabled:opacity-50 min-h-[5rem] ${isDark ? 'border-white/20 bg-white/10 text-white hover:bg-white/20' : 'border-black/10 bg-white/80 shadow-sm text-gray-900 hover:bg-white backdrop-blur-md'}`}
        >
          {c.image_url && (
            <div className="mb-3 w-full h-32 relative overflow-hidden rounded-lg flex items-center justify-center border border-white/50 bg-black/5">
              <div 
                className="absolute inset-0 bg-cover bg-center blur-sm opacity-40 scale-110" 
                style={{ backgroundImage: `url(${c.image_url})` }} 
              />
              <img 
                src={c.image_url} 
                alt={c.label} 
                className="relative h-full w-full object-contain p-1 drop-shadow-sm transition-transform group-hover:scale-105" 
              />
            </div>
          )}
          <span className={`text-base font-bold drop-shadow-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{c.label || "—"}</span>
        </button>
      ))}
    </div>
  );
}

function WordResponder({
  onSubmit,
  submitting,
  maxLen,
  multiline,
  isDark,
}: {
  onSubmit: (v: Record<string, unknown>) => void;
  submitting: boolean;
  maxLen: number;
  multiline?: boolean;
  isDark?: boolean;
}) {
  const [text, setText] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const t = text.trim();
        if (!t) return;
        onSubmit({ text: t });
      }}
    >
      {multiline ? (
        <Textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={maxLen} rows={4} placeholder="Type your response…" className={`resize-none ${isDark ? 'bg-white/10 text-white border-white/20 placeholder:text-gray-500' : 'bg-white/80 backdrop-blur-md border-black/10 text-gray-900 shadow-sm placeholder:text-gray-400 focus-visible:ring-black/20'}`} />
      ) : (
        <Input value={text} onChange={(e) => setText(e.target.value)} maxLength={maxLen} placeholder="A word or phrase" autoFocus className={`h-12 ${isDark ? 'bg-white/10 text-white border-white/20 placeholder:text-gray-500' : 'bg-white/80 backdrop-blur-md border-black/10 text-gray-900 shadow-sm placeholder:text-gray-400 focus-visible:ring-black/20'}`} />
      )}
      <div className="mt-4 flex items-center justify-between">
        <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{text.length}/{maxLen}</span>
        <Button type="submit" disabled={submitting || !text.trim()} className={`rounded-md font-medium ${isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-gray-800'}`}>
          {submitting ? "Sending…" : "Submit"}
        </Button>
      </div>
    </form>
  );
}

function RatingResponder({
  onSubmit,
  submitting,
  isDark,
}: {
  onSubmit: (v: Record<string, unknown>) => void;
  submitting: boolean;
  isDark?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const [value, setValue] = useState(0);
  return (
    <div>
      <div className="flex items-center justify-center gap-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setValue(n)}
            className="p-1 transition-transform hover:scale-110 focus:outline-none"
            disabled={submitting}
          >
            <Star
              className={`h-12 w-12 transition-colors ${(hover || value) >= n ? (isDark ? "fill-white text-white" : "fill-black text-black") : (isDark ? "text-white/20 fill-transparent" : "text-black/10 fill-transparent")}`}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <Button onClick={() => value > 0 && onSubmit({ rating: value })} disabled={submitting || value === 0} className={`rounded-md font-medium px-8 h-10 ${isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-gray-800'}`}>
          {submitting ? "Sending…" : "Submit"}
        </Button>
      </div>
    </div>
  );
}
