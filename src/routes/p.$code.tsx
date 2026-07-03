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
      <div className="mesh-bg flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Session not found</h1>
          <p className="mt-2 text-muted-foreground">Double-check the code with your presenter.</p>
          <Link to="/join"><Button className="mt-6 rounded-full">Try another code</Button></Link>
        </div>
      </div>
    );
  }

  if (session.status !== "live") {
    return (
      <div className="mesh-bg flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold">This session has ended</h1>
          <p className="mt-2 text-muted-foreground">Thanks for joining!</p>
        </div>
      </div>
    );
  }

  if (!participantId) {
    return (
      <div className="mesh-bg flex min-h-screen items-center justify-center px-6 py-10">
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={joinAsParticipant}
          className="glass w-full max-w-md rounded-3xl p-8"
        >
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-indigo-500">
              <Radio className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Session</p>
              <p className="font-mono">{session.join_code}</p>
            </div>
          </div>
          <label className="text-sm text-muted-foreground">Your name (optional)</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Anonymous" className="mt-2" />
          <Button type="submit" disabled={joining} className="mt-4 w-full rounded-full">
            {joining ? "Joining…" : "Join"}
          </Button>
        </motion.form>
      </div>
    );
  }

  return (
    <div className="mesh-bg min-h-screen">
      <div className="mx-auto flex max-w-xl flex-col px-6 py-10">
        <div className="mb-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>Session <span className="font-mono">{session.join_code}</span></span>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-300">● Live</span>
        </div>
        <AnimatePresence mode="wait">
          {slide ? (
            <SlideResponder key={slide.id} slide={slide} sessionId={session.id} participantId={participantId} />
          ) : (
            <motion.div key="wait" className="text-center text-muted-foreground py-16">Waiting for the presenter…</motion.div>
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8 text-center"
      >
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
        <h2 className="mt-4 text-xl font-semibold">Response received</h2>
        <p className="mt-2 text-sm text-muted-foreground">Waiting for the next question…</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="glass rounded-3xl p-6 md:p-8"
    >
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        {slide.type.replace("_", " ")}
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
        {slide.question || "Question"}
      </h1>
      {slide.description && <p className="mt-2 text-sm text-muted-foreground">{slide.description}</p>}

      <div className="mt-6">
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
    <div className="space-y-2">
      {choices.map((c) => (
        <button
          key={c.id}
          disabled={submitting}
          onClick={() => onSubmit({ choice_id: c.id })}
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left text-base transition hover:border-primary/60 hover:bg-primary/10 disabled:opacity-50"
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
        <Textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={maxLen} rows={4} placeholder="Type your response…" />
      ) : (
        <Input value={text} onChange={(e) => setText(e.target.value)} maxLength={maxLen} placeholder="A word or phrase" autoFocus />
      )}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{text.length}/{maxLen}</span>
        <Button type="submit" disabled={submitting || !text.trim()} className="rounded-full">
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
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setValue(n)}
            className="p-1 transition-transform hover:scale-110"
            disabled={submitting}
          >
            <Star
              className={`h-10 w-10 ${(hover || value) >= n ? "fill-fuchsia-400 text-fuchsia-400" : "text-white/20"}`}
            />
          </button>
        ))}
      </div>
      <div className="mt-4 flex justify-center">
        <Button onClick={() => value > 0 && onSubmit({ rating: value })} disabled={submitting || value === 0} className="rounded-full">
          {submitting ? "Sending…" : "Submit"}
        </Button>
      </div>
    </div>
  );
}
