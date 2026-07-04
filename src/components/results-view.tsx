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
  const hasImages = choices.some((c) => !!c.image_url);

  if (hasImages && !compact) {
    const colors = ["bg-[#6B8CFF]", "bg-[#FF7B72]", "bg-[#2A2B5F]", "bg-[#3FB950]", "bg-[#D2A8FF]", "bg-[#F5A623]", "bg-[#D0021B]"];
    return (
      <div className="flex h-[420px] w-full items-end justify-center gap-4 sm:gap-6 mt-8">
        {choices.map((c, i) => {
          const pct = total === 0 ? 0 : Math.round((c.count / total) * 100);
          const barPct = max === 0 ? 0 : (c.count / max) * 100;
          const color = colors[i % colors.length];

          return (
            <div key={c.id} className="flex h-full w-full max-w-[220px] flex-1 flex-col justify-end">
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 pl-1 text-3xl sm:text-4xl font-black text-gray-900 drop-shadow-sm"
              >
                {pct}%
              </motion.div>

              <motion.div
                layout
                initial={{ height: "140px" }}
                animate={{ height: `calc(140px + ${barPct * 2.2}px)` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                className={`w-full overflow-hidden rounded-2xl flex flex-col shadow-2xl border border-white/60 ${color}`}
              >
                {c.image_url ? (
                  <div
                    className="h-[140px] w-full shrink-0 bg-cover bg-center border-b border-black/10"
                    style={{ backgroundImage: `url(${c.image_url})` }}
                  />
                ) : (
                  <div className="flex h-[140px] w-full shrink-0 items-center justify-center bg-white/20 border-b border-black/10">
                    <span className="text-xs font-bold uppercase tracking-widest text-black/40">No Image</span>
                  </div>
                )}
                <div className="flex-1 w-full relative">
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0)_100%)]" />
                </div>
              </motion.div>

              <div className="mt-4 pl-1 text-lg sm:text-xl font-bold text-gray-900 drop-shadow-sm truncate w-full">
                {c.label || "—"}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {choices.map((c) => {
        const pct = total === 0 ? 0 : Math.round((c.count / total) * 100);
        const barPct = (c.count / max) * 100;
        return (
            <motion.div
              layout
              key={c.id}
              className="relative overflow-hidden rounded-xl border border-white/60 glass-panel px-4 py-3 shadow-md"
            >
              <motion.div
                className="absolute inset-y-0 left-0 bg-blue-500/20"
                initial={{ width: 0 }}
                animate={{ width: `${barPct}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {c.image_url && (
                    <img src={c.image_url} alt={c.label} className="w-12 h-12 object-cover rounded shadow-sm border border-white/50" />
                  )}
                  <span className={compact ? "text-sm font-bold text-gray-900 drop-shadow-sm" : "text-base font-bold text-gray-900 drop-shadow-sm"}>
                    {c.label || "—"}
                  </span>
                </div>
                <span className="font-mono text-sm font-bold text-gray-700">
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
              className="font-semibold tracking-tight text-foreground"
            >
              <span>
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
        className={`font-semibold tracking-tight text-foreground ${compact ? "text-4xl" : "text-7xl"}`}
      >
        {avg.toFixed(1)}
      </motion.div>
      <div className="mt-3 flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`${compact ? "h-4 w-4" : "h-6 w-6"} ${i <= Math.round(avg) ? "fill-primary text-primary" : "text-muted-foreground/30 fill-transparent"}`}
            strokeWidth={1.5}
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
            className="rounded-md border border-border bg-card px-4 py-3 text-sm shadow-sm"
          >
            {v.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
