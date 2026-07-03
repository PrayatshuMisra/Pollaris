import type { Slide, SlideType, Vote } from "./types";

export interface MCTally {
  choices: { id: string; label: string; count: number }[];
  total: number;
}

export function tallyMultipleChoice(slide: Slide, votes: Vote[]): MCTally {
  const choices = ((slide.config as { choices?: { id: string; label: string }[] })?.choices ?? []).map((c) => ({
    id: c.id,
    label: c.label,
    count: 0,
  }));
  for (const v of votes) {
    const id = v.value?.choice_id;
    const idx = choices.findIndex((c) => c.id === id);
    if (idx >= 0) choices[idx].count += 1;
  }
  return { choices, total: votes.length };
}

export function tallyWords(votes: Vote[]): { word: string; count: number }[] {
  const map = new Map<string, number>();
  for (const v of votes) {
    const t = (v.value?.text ?? "").trim();
    if (!t) continue;
    const key = t.toLowerCase();
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
}

export function tallyRating(votes: Vote[]): { avg: number; count: number } {
  if (votes.length === 0) return { avg: 0, count: 0 };
  const sum = votes.reduce((acc, v) => acc + (Number(v.value?.rating) || 0), 0);
  return { avg: sum / votes.length, count: votes.length };
}

export function tallyOpenText(votes: Vote[]): { id: string; text: string; created_at: string }[] {
  return votes
    .map((v) => ({ id: v.id, text: String(v.value?.text ?? ""), created_at: v.created_at }))
    .filter((v) => v.text.length > 0)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function labelForType(t: SlideType): string {
  return {
    multiple_choice: "Multiple choice",
    word_cloud: "Word cloud",
    rating: "Rating",
    open_text: "Open text",
  }[t];
}
