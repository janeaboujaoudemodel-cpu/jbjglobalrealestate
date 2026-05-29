export interface Match {
  project_id: string;
  name: string;
  developer: string;
  area?: string;
  beds?: string;
  price_from?: number | null;
  currency?: string;
  match_score: number;
  reason: string;
}

interface Props {
  score?: number;
  scoreReason?: string;
  matches?: Match[];
  nextStep?: string;
  onUseMatch?: (m: Match) => void;
}

export default function AssistantInsights(_props: Props) {
  return null;
}
