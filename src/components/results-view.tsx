import { motion, AnimatePresence } from "framer-motion";
import type { Slide, Vote } from "@/lib/types";
import { tallyMultipleChoice, tallyOpenText, tallyRating, tallyWords } from "@/lib/results";
import { Star } from "lucide-react";

interface Props {
  slide: Slide;
  votes: Vote[];
  compact?: boolean;
}

export function ResultsView({ slide, votes, compact }: Props) {
  if (slide.type === "multiple_choice") return <MCResults slide={slide} votes={votes} compact={compact} />;
  if (slide.type === "word_cloud") return <WordCloudResults votes={votes} compact={compact} />;
  if (slide.type === "rating") return <RatingResults votes={votes} compact={compact} />;
  return <OpenTextResults votes={votes} compact={compact} />;
}

function MCResults({ slide, votes, compact }: Props) {
  const { choices, total } = tallyMultipleChoice(slide, votes);
  const max = Math.max(1, ...choices.map((c) => c.count));
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {choices.map((c) => {
        const pct = total === 0 ? 0 : Math.round((c.count / total) * 100);
        const barPct = (c.count / max) * 100;
        return (
          <motion.div
            layout
            key={c.id}
            className="relative overflow-hidden rounded-xl bg-white/[0.04] px-4 py-3"
          >
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-fuchsia-500/40 to-violet-500/40"
              initial={{ width: 0 }}
              animate={{ width: `${barPct}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
            <div className="relative flex items-center justify-between">
              <span className={compact ? "text-sm" : "text-base"}>{c.label || "—"}</span>
              <span className="font-mono text-sm text-muted-foreground">
                {c.count} · {pct}%
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function WordCloudResults({ votes, compact }: { votes: Vote[]; compact?: boolean }) {
  const words = tallyWords(votes).slice(0, 40);
  const max = Math.max(1, ...words.map((w) => w.count));
  if (words.length === 0) {
    return <p className="text-center text-sm text-muted-foreground">Waiting for words…</p>;
  }
  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 ${compact ? "" : "px-4 py-8"}`}>
      <AnimatePresence>
        {words.map((w) => {
          const scale = 0.85 + (w.count / max) * 1.8;
          return (
            <motion.span
              key={w.word}
              layout
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              style={{ fontSize: `${scale}rem` }}
              className="font-semibold tracking-tight"
            >
              <span className="bg-gradient-to-r from-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
                {w.word}
              </span>
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function RatingResults({ votes, compact }: { votes: Vote[]; compact?: boolean }) {
  const { avg, count } = tallyRating(votes);
  return (
    <div className={`text-center ${compact ? "py-2" : "py-6"}`}>
      <motion.div
        key={avg}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`font-semibold ${compact ? "text-4xl" : "text-7xl"} bg-gradient-to-r from-fuchsia-300 to-violet-300 bg-clip-text text-transparent`}
      >
        {avg.toFixed(1)}
      </motion.div>
      <div className="mt-3 flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`${compact ? "h-4 w-4" : "h-6 w-6"} ${i <= Math.round(avg) ? "fill-fuchsia-400 text-fuchsia-400" : "text-white/20"}`}
          />
        ))}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{count} response{count === 1 ? "" : "s"}</p>
    </div>
  );
}

function OpenTextResults({ votes, compact }: { votes: Vote[]; compact?: boolean }) {
  const items = tallyOpenText(votes);
  if (items.length === 0) {
    return <p className="text-center text-sm text-muted-foreground">Waiting for responses…</p>;
  }
  return (
    <div className={`grid gap-2 ${compact ? "" : "md:grid-cols-2"}`}>
      <AnimatePresence>
        {items.slice(0, compact ? 6 : 20).map((v) => (
          <motion.div
            key={v.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm"
          >
            {v.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
