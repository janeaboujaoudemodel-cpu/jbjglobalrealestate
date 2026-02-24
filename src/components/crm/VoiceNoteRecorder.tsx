import { VoiceInputButton } from "@/components/ui/VoiceInputButton";

interface VoiceNoteRecorderProps {
  onTranscript: (text: string) => void;
  onTranscriptResult?: (result: { original: string; translated?: string | null; detectedLanguage?: string; languageName?: string; isEnglish?: boolean }) => void;
  disabled?: boolean;
}

/**
 * VoiceNoteRecorder - Wrapper around VoiceInputButton for backwards compatibility.
 * Used in CRM, Support Ticket, and other note-taking contexts.
 * Now supports auto-translation via onTranscriptResult callback.
 */
const VoiceNoteRecorder = ({ onTranscript, onTranscriptResult, disabled }: VoiceNoteRecorderProps) => {
  return (
    <VoiceInputButton
      onTranscript={onTranscript}
      onTranscriptResult={onTranscriptResult}
      disabled={disabled}
    />
  );
};

export default VoiceNoteRecorder;
