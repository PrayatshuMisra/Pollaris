import { useRef } from "react";
import type { Slide, SlideType } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Image as ImageIcon, X } from "lucide-react";

interface Props {
  slide: Slide;
  onChange: (patch: Partial<Slide>) => void;
  onApplyBackgroundToAll?: (bgUrl: string) => void;
}

export function SlideEditor({ slide, onChange, onApplyBackgroundToAll }: Props) {
  const bgInputRef = useRef<HTMLInputElement>(null);
  const bgUrl = (slide.config as any)?.bg_image_url as string | undefined;

  function handleBgUpload(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const MAX = 1920;
        if (width > height && width > MAX) {
          height *= MAX / width; width = MAX;
        } else if (height > MAX) {
          width *= MAX / height; height = MAX;
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
        onChange({ config: { ...(slide.config as any), bg_image_url: dataUrl } });
        if (bgInputRef.current) bgInputRef.current.value = "";
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 drop-shadow-sm">Question</label>
        <Textarea
          value={slide.question}
          onChange={(e) => onChange({ question: e.target.value })}
          placeholder="Ask your audience something…"
          rows={3}
          maxLength={300}
          className="mt-2 resize-none border border-white/60 bg-white/40 shadow-inner rounded-xl px-3 py-2 text-xl font-bold text-gray-900 leading-tight focus-visible:ring-0 placeholder:text-gray-400"
        />
      </div>
      <div>
        <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 drop-shadow-sm">Description (optional)</label>
        <Input
          value={slide.description ?? ""}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Add a note or context"
          maxLength={200}
          className="mt-2 border border-white/60 bg-white/40 shadow-inner rounded-xl px-3 text-sm font-bold text-gray-700 focus-visible:ring-0 placeholder:text-gray-400"
        />
      </div>

      <div className="pt-2">
        <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 drop-shadow-sm">Background Image</label>
        <input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={handleBgUpload} />
        <div className="mt-2 flex flex-col gap-2">
          {bgUrl ? (
            <div className="flex flex-col gap-2">
              <div className="relative h-24 w-full rounded-xl overflow-hidden border border-white/60 shadow-sm">
                <img src={bgUrl} alt="Slide background" className="absolute inset-0 w-full h-full object-cover" />
                <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 rounded-full" onClick={() => {
                  const nextConfig = { ...(slide.config as any) };
                  delete nextConfig.bg_image_url;
                  onChange({ config: nextConfig });
                }}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              {onApplyBackgroundToAll && (
                <Button variant="outline" size="sm" className="w-full text-xs font-bold glass" onClick={() => onApplyBackgroundToAll(bgUrl)}>
                  Apply background to all slides
                </Button>
              )}
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full h-10 border-dashed border-white/80 bg-white/40 font-bold text-gray-600 hover:bg-white/60 hover:text-black shadow-sm" onClick={() => bgInputRef.current?.click()}>
              <ImageIcon className="mr-2 h-4 w-4" /> Upload background
            </Button>
          )}
        </div>
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
    <div className="rounded-xl border border-dashed border-white/60 glass-panel px-4 py-4 text-sm font-bold text-gray-600 shadow-inner">
      {text}
    </div>
  );
}

function MCEditor({ slide, onChange }: Props) {
  const choices = (slide.config as { choices?: { id: string; label: string; image_url?: string }[] })?.choices ?? [];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingIndexRef = useRef<number | null>(null);

  function update(next: { id: string; label: string; image_url?: string }[]) {
    onChange({ config: { ...(slide.config as object), choices: next } });
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const index = uploadingIndexRef.current;
    if (!file || index === null) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        
        const next = [...choices];
        next[index] = { ...next[index], image_url: dataUrl };
        update(next);
        
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-3">
      <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 drop-shadow-sm">Choices</label>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
      
      <div className="space-y-4">
        {choices.map((c, i) => (
          <div key={c.id} className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="font-black text-xs text-gray-400 w-4 text-center shrink-0">{String.fromCharCode(65 + i)}</span>
              <Input
                value={c.label}
                onChange={(e) => {
                  const next = [...choices];
                  next[i] = { ...c, label: e.target.value };
                  update(next);
                }}
                placeholder="Option label"
                maxLength={120}
                className="glass border-white/60 text-gray-900 font-bold placeholder:text-gray-400 focus-visible:ring-black shadow-sm h-11"
              />
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-blue-600 hover:bg-white/60 shrink-0 h-11 w-11 rounded-lg"
                onClick={() => {
                  uploadingIndexRef.current = i;
                  fileInputRef.current?.click();
                }}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-red-500 hover:bg-white/60 shrink-0 h-11 w-11 rounded-lg"
                onClick={() => update(choices.filter((x) => x.id !== c.id))}
                disabled={choices.length <= 2}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Image Preview */}
            {c.image_url && (
              <div className="ml-7 flex items-start gap-3 mt-1">
                <div className="rounded-lg overflow-hidden border border-white/50 shadow-sm w-32 h-24 shrink-0 relative bg-black/5 flex items-center justify-center">
                  <div 
                    className="absolute inset-0 bg-cover bg-center blur-sm opacity-40 scale-110" 
                    style={{ backgroundImage: `url(${c.image_url})` }} 
                  />
                  <img src={c.image_url} alt="Option preview" className="relative w-full h-full object-contain p-1 drop-shadow-sm" />
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 font-semibold"
                  onClick={() => {
                    const next = [...choices];
                    next[i] = { ...next[i] };
                    delete next[i].image_url;
                    update(next);
                  }}
                >
                  <X className="mr-1.5 h-4 w-4" /> Remove image
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        className="rounded-full mt-4 font-bold glass border-white/60 text-gray-800 hover:bg-white/60 shadow-sm"
        onClick={() => update([...choices, { id: crypto.randomUUID(), label: "" }])}
        disabled={choices.length >= 8}
      >
        <Plus className="mr-1.5 h-4 w-4" /> Add option
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
    <div className="grid grid-cols-2 gap-3">
      {options.map((o) => (
        <button
          key={o.t}
          onClick={() => onChange(o.t)}
          className={`rounded-xl border p-3 text-left transition-all shadow-sm ${
            value === o.t
              ? "border-blue-500 bg-white/60 ring-2 ring-blue-500/20"
              : "border-white/50 glass hover:bg-white/50"
          }`}
        >
          <div className={`text-sm font-bold ${value === o.t ? 'text-blue-900' : 'text-gray-900'}`}>{o.label}</div>
          <div className={`text-[11px] font-semibold mt-0.5 ${value === o.t ? 'text-blue-700' : 'text-gray-500'}`}>{o.desc}</div>
        </button>
      ))}
    </div>
  );
}
