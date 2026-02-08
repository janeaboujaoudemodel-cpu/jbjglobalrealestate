import { VoiceInputButton } from "@/components/ui/VoiceInputButton";

interface VoiceNoteRecorderProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

/**
 * VoiceNoteRecorder - Wrapper around VoiceInputButton for backwards compatibility.
 * Used in CRM, Support Ticket, and other note-taking contexts.
 */
const VoiceNoteRecorder = ({ onTranscript, disabled }: VoiceNoteRecorderProps) => {
  return (
    <VoiceInputButton
      onTranscript={onTranscript}
      disabled={disabled}
    />
  );
};

export default VoiceNoteRecorder;
