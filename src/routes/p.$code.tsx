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
import { CheckCircle2, Loader2, Radio, Star } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-xl flex-col px-6 py-10">
        <div className="mb-8 flex items-center justify-between text-sm font-medium text-muted-foreground">
          <span>Session <span className="font-mono tracking-widest text-foreground">{session.join_code}</span></span>
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

  useEffect(() => {
    setSubmitted(false);
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

  if (submitted) {
    return (
      <motion.div
        key="thanks"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-10 text-center shadow-sm"
      >
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-5 text-xl font-semibold tracking-tight">Response received</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Waiting for the next question…</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-xl border border-border bg-card p-8 md:p-10 shadow-sm"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {slide.type.replace("_", " ")}
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
        {slide.question || "Question"}
      </h1>
      {slide.description && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{slide.description}</p>}

      <div className="mt-8">
        {slide.type === "multiple_choice" && <MCResponder slide={slide} onSubmit={submit} submitting={submitting} />}
        {slide.type === "word_cloud" && <WordResponder onSubmit={submit} submitting={submitting} maxLen={40} />}
        {slide.type === "rating" && <RatingResponder onSubmit={submit} submitting={submitting} />}
        {slide.type === "open_text" && <WordResponder onSubmit={submit} submitting={submitting} maxLen={280} multiline />}
      </div>
    </motion.div>
  );
}

function MCResponder({
  slide,
  onSubmit,
  submitting,
}: {
  slide: Slide;
  onSubmit: (v: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const choices = (slide.config as { choices?: { id: string; label: string }[] })?.choices ?? [];
  return (
    <div className="space-y-3">
      {choices.map((c) => (
        <button
          key={c.id}
          disabled={submitting}
          onClick={() => onSubmit({ choice_id: c.id })}
          className="w-full rounded-lg border border-border bg-muted/30 px-5 py-4 text-left text-base font-medium transition-colors hover:border-primary/50 hover:bg-muted shadow-sm disabled:opacity-50"
        >
          {c.label || "—"}
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
}: {
  onSubmit: (v: Record<string, unknown>) => void;
  submitting: boolean;
  maxLen: number;
  multiline?: boolean;
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
        <Textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={maxLen} rows={4} placeholder="Type your response…" className="resize-none" />
      ) : (
        <Input value={text} onChange={(e) => setText(e.target.value)} maxLength={maxLen} placeholder="A word or phrase" autoFocus className="h-12" />
      )}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{text.length}/{maxLen}</span>
        <Button type="submit" disabled={submitting || !text.trim()} className="rounded-md font-medium">
          {submitting ? "Sending…" : "Submit"}
        </Button>
      </div>
    </form>
  );
}

function RatingResponder({
  onSubmit,
  submitting,
}: {
  onSubmit: (v: Record<string, unknown>) => void;
  submitting: boolean;
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
              className={`h-12 w-12 transition-colors ${(hover || value) >= n ? "fill-primary text-primary" : "text-muted-foreground/30 fill-transparent"}`}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <Button onClick={() => value > 0 && onSubmit({ rating: value })} disabled={submitting || value === 0} className="rounded-md font-medium px-8 h-10">
          {submitting ? "Sending…" : "Submit"}
        </Button>
      </div>
    </div>
  );
}
