import { useState } from "react";
import type { Slide, SlideType } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  slide: Slide;
  onChange: (patch: Partial<Slide>) => void;
}

export function SlideEditor({ slide, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <label className="text-xs uppercase tracking-widest text-muted-foreground">Question</label>
        <Textarea
          value={slide.question}
          onChange={(e) => onChange({ question: e.target.value })}
          placeholder="Ask your audience something…"
          rows={2}
          maxLength={300}
          className="mt-2 resize-none border-0 bg-transparent px-0 text-3xl font-semibold leading-tight tracking-tight focus-visible:ring-0 md:text-4xl"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-widest text-muted-foreground">Description (optional)</label>
        <Input
          value={slide.description ?? ""}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Add a note or context"
          maxLength={200}
          className="mt-2 border-0 border-b bg-transparent px-0 text-base focus-visible:ring-0"
        />
      </div>

      <div className="pt-2">
        {slide.type === "multiple_choice" && <MCEditor slide={slide} onChange={onChange} />}
        {slide.type === "word_cloud" && <TypeHint text="Audience submits short words or phrases. The most common ones grow biggest." />}
        {slide.type === "rating" && <TypeHint text="Audience picks 1 to 5 stars. You'll see the live average." />}
        {slide.type === "open_text" && <TypeHint text="Audience types a free-form response. Everything shows on the results wall." />}
      </div>
    </div>
  );
}

function TypeHint({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function MCEditor({ slide, onChange }: Props) {
  const choices = (slide.config as { choices?: { id: string; label: string }[] })?.choices ?? [];

  function update(next: { id: string; label: string }[]) {
    onChange({ config: { ...(slide.config as object), choices: next } });
  }

  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-widest text-muted-foreground">Choices</label>
      {choices.map((c, i) => (
        <div key={c.id} className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{String.fromCharCode(65 + i)}</span>
          <Input
            value={c.label}
            onChange={(e) => {
              const next = [...choices];
              next[i] = { ...c, label: e.target.value };
              update(next);
            }}
            placeholder="Option label"
            maxLength={120}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => update(choices.filter((x) => x.id !== c.id))}
            disabled={choices.length <= 2}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={() => update([...choices, { id: crypto.randomUUID(), label: "" }])}
        disabled={choices.length >= 8}
      >
        <Plus className="mr-1 h-3.5 w-3.5" /> Add option
      </Button>
    </div>
  );
}

export function SlideTypePicker({
  value,
  onChange,
}: {
  value: SlideType;
  onChange: (t: SlideType) => void;
}) {
  const options: { t: SlideType; label: string; desc: string }[] = [
    { t: "multiple_choice", label: "Multiple choice", desc: "Pick one" },
    { t: "word_cloud", label: "Word cloud", desc: "Type words" },
    { t: "rating", label: "Rating", desc: "1–5 stars" },
    { t: "open_text", label: "Open text", desc: "Free response" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => (
        <button
          key={o.t}
          onClick={() => onChange(o.t)}
          className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
            value === o.t
              ? "border-primary/60 bg-primary/10"
              : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
          }`}
        >
          <div className="font-medium">{o.label}</div>
          <div className="text-xs text-muted-foreground">{o.desc}</div>
        </button>
      ))}
    </div>
  );
}
