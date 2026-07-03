export type SlideType = "multiple_choice" | "word_cloud" | "rating" | "open_text";

export interface MultipleChoiceConfig {
  choices: { id: string; label: string }[];
}
export interface WordCloudConfig {
  max_length?: number;
}
export interface RatingConfig {
  max: number; // 5
  emoji?: string;
}
export interface OpenTextConfig {
  max_length?: number;
}

export type SlideConfig =
  | ({ type: "multiple_choice" } & MultipleChoiceConfig)
  | ({ type: "word_cloud" } & WordCloudConfig)
  | ({ type: "rating" } & RatingConfig)
  | ({ type: "open_text" } & OpenTextConfig);

export interface Slide {
  id: string;
  presentation_id: string;
  order_index: number;
  type: SlideType;
  question: string;
  description: string | null;
  image_url: string | null;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Presentation {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  theme: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  presentation_id: string;
  join_code: string;
  current_slide_id: string | null;
  status: "draft" | "live" | "ended";
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface Vote {
  id: string;
  session_id: string;
  slide_id: string;
  participant_id: string;
  value: { choice_id?: string; text?: string; rating?: number };
  created_at: string;
}

export function defaultConfigFor(type: SlideType): Record<string, unknown> {
  switch (type) {
    case "multiple_choice":
      return {
        choices: [
          { id: crypto.randomUUID(), label: "Option A" },
          { id: crypto.randomUUID(), label: "Option B" },
          { id: crypto.randomUUID(), label: "Option C" },
        ],
      };
    case "word_cloud":
      return { max_length: 40 };
    case "rating":
      return { max: 5 };
    case "open_text":
      return { max_length: 240 };
  }
}

export const SLIDE_TYPE_LABELS: Record<SlideType, string> = {
  multiple_choice: "Multiple choice",
  word_cloud: "Word cloud",
  rating: "Rating",
  open_text: "Open text",
};
