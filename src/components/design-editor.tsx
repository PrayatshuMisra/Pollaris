import { Slide } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface Props {
  slide: Slide;
  onChange: (patch: Partial<Slide>) => void;
  onApplyDesignToAll: (design: any) => void;
}

export const FONTS = [
  { id: "font-sans", label: "Modern Sans" },
  { id: "font-serif", label: "Classic Serif" },
  { id: "font-mono", label: "Tech Mono" },
];

export const COLORS = [
  { id: "blue", hex: "#3b82f6" },
  { id: "green", hex: "#22c55e" },
  { id: "purple", hex: "#a855f7" },
  { id: "rose", hex: "#f43f5e" },
  { id: "orange", hex: "#f97316" },
  { id: "gray", hex: "#6b7280" },
];

export function DesignEditor({ slide, onChange, onApplyDesignToAll }: Props) {
  const config = slide.config as any;
  const design = config.design || {};

  const updateDesign = (patch: any) => {
    onChange({ config: { ...config, design: { ...design, ...patch } } });
  };

  return (
    <div className="space-y-8">
      {/* Font Family */}
      <div>
        <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 drop-shadow-sm">Typography</label>
        <div className="mt-3 grid grid-cols-1 gap-2">
          {FONTS.map(f => (
            <button
              key={f.id}
              onClick={() => updateDesign({ font: f.id })}
              className={`p-3 text-left rounded-xl border ${design.font === f.id || (!design.font && f.id === 'font-sans') ? 'border-blue-500 bg-white/60 shadow-sm' : 'border-white/40 bg-white/20 hover:bg-white/40'}`}
            >
              <span className={`text-base font-medium text-gray-900 ${f.id}`}>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Primary Color */}
      <div>
        <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 drop-shadow-sm">Accent Color</label>
        <div className="mt-3 flex flex-wrap gap-3">
          {COLORS.map(c => (
            <button
              key={c.id}
              onClick={() => updateDesign({ color: c.id })}
              className={`h-8 w-8 rounded-full border-2 transition-all ${design.color === c.id || (!design.color && c.id === 'blue') ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent hover:scale-110'}`}
              style={{ backgroundColor: c.hex }}
              title={c.id}
            />
          ))}
        </div>
      </div>

      {/* Card Theme */}
      <div>
        <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 drop-shadow-sm">Theme Colors</label>
        <div className="mt-3 grid grid-cols-2 gap-2">
           <button onClick={() => updateDesign({ theme: "light" })} className={`p-3 text-center rounded-xl border font-bold ${design.theme !== "dark" ? "border-blue-500 bg-white/80 text-gray-900 shadow-sm" : "border-white/40 bg-white/20 text-gray-600 hover:bg-white/40"}`}>
             Light Mode
           </button>
           <button onClick={() => updateDesign({ theme: "dark" })} className={`p-3 text-center rounded-xl border font-bold ${design.theme === "dark" ? "border-blue-500 bg-gray-900 text-white shadow-sm" : "border-white/40 bg-gray-800/80 text-gray-300 hover:bg-gray-800"}`}>
             Dark Mode
           </button>
        </div>
      </div>

      {/* Font Size */}
      <div>
        <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 drop-shadow-sm">Font Size</label>
        <div className="mt-3 grid grid-cols-3 gap-2">
           <button onClick={() => updateDesign({ fontSize: "normal" })} className={`py-2 text-center rounded-xl border font-bold text-sm ${design.fontSize !== "large" && design.fontSize !== "huge" ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm" : "border-white/40 bg-white/20 text-gray-600 hover:bg-white/40"}`}>
             Normal
           </button>
           <button onClick={() => updateDesign({ fontSize: "large" })} className={`py-2 text-center rounded-xl border font-bold text-sm ${design.fontSize === "large" ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm" : "border-white/40 bg-white/20 text-gray-600 hover:bg-white/40"}`}>
             Large
           </button>
           <button onClick={() => updateDesign({ fontSize: "huge" })} className={`py-2 text-center rounded-xl border font-bold text-sm ${design.fontSize === "huge" ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm" : "border-white/40 bg-white/20 text-gray-600 hover:bg-white/40"}`}>
             Huge
           </button>
        </div>
      </div>

      <div className="pt-4 border-t border-white/40">
        <Button variant="outline" size="sm" className="w-full text-xs font-bold glass shadow-sm bg-white/40 hover:bg-white/70" onClick={() => onApplyDesignToAll(design)}>
          Apply design to all slides
        </Button>
      </div>
    </div>
  );
}
