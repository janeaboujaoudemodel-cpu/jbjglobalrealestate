

## Global Voice Recorder Fix - Implementation Plan

### Problem Summary

The voice recorder microphone buttons across the website have two critical issues:

1. **UX Confusion**: When recording, the button shows `MicOff` icon instead of a visual indicator that recording is active. Users expect a "recording in progress" indicator (pulsing mic), not a mute icon.

2. **Inconsistent Behavior**: Different components implement voice recording slightly differently, leading to confusion and potential failures across:
   - VoiceNoteRecorder (used in Support Ticket, CRM, Lead Detail)
   - AINoteCenter
   - ListingAdminChat
   - SellerAssistant
   - VoiceSuite / CaptionsTranslate
   - ExecutiveChatPanel
   - FoundersChatPanel
   - EmployeeChatPanel

---

### Root Cause Analysis

**Issue 1: Wrong Icon During Recording**

All components currently show `MicOff` when `isRecording === true`:
```typescript
// Current (wrong) - shows MicOff when recording
{isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
```

This is semantically incorrect. `MicOff` should mean "microphone is disabled/muted", not "click to stop recording".

**Issue 2: No Visual Feedback for Active Recording**

When recording, users need clear visual feedback that:
- Recording is in progress (animated indicator)
- Audio is being captured
- Click will stop recording

---

### Solution: Create Unified VoiceInputButton Component

Create a single, reusable voice input button component that:
1. Shows the correct icons and states
2. Handles all microphone permissions consistently
3. Provides visual feedback (pulse animation, color changes)
4. Works with the `voice-to-text` edge function

#### New Component: `src/components/ui/VoiceInputButton.tsx`

**States:**
- **Idle**: `Mic` icon (gold/neutral color) - "Click to record"
- **Recording**: `Square` icon (red, pulsing) - "Click to stop" 
- **Processing**: `Loader2` icon (spinning) - "Transcribing..."

**Props:**
```typescript
interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  language?: string;
  className?: string;
  size?: "sm" | "default" | "lg";
}
```

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/ui/VoiceInputButton.tsx` | **NEW** | Unified voice input component |
| `src/components/crm/VoiceNoteRecorder.tsx` | Refactor | Use VoiceInputButton internally |
| `src/components/SupportTicketBox.tsx` | Update | Use new VoiceInputButton |
| `src/components/note-center/AINoteCenter.tsx` | Update | Use VoiceInputButton for voice notes |
| `src/components/listing-admin/ListingAdminChat.tsx` | Update | Replace inline recording with VoiceInputButton |
| `src/components/seller/SellerAssistant.tsx` | Update | Replace inline recording with VoiceInputButton |
| `src/components/executive/ExecutiveChatPanel.tsx` | Update | Replace voice input logic |
| `src/components/founders-assistant/FoundersChatPanel.tsx` | Update | Replace voice input logic |
| `src/components/employee-hub/EmployeeChatPanel.tsx` | Update | Replace voice input logic |
| `src/pages/toolkit/VoiceSuite.tsx` | Update | Fix VoiceToTextPanel recording UI |
| `src/pages/toolkit/CaptionsTranslate.tsx` | Update | Fix recording UI |
| `src/components/design-studio/AIDesignAssistant.tsx` | Update | Fix voice input |

---

### Technical Implementation

#### 1. New VoiceInputButton Component

```typescript
// src/components/ui/VoiceInputButton.tsx
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  language?: string;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "outline" | "default" | "ghost";
}

export function VoiceInputButton({
  onTranscript,
  disabled,
  language = "en",
  className,
  size = "icon",
  variant = "outline"
}: VoiceInputButtonProps) {
  const [status, setStatus] = useState<"idle" | "recording" | "processing">("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setStatus("processing");
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          
          try {
            const { data, error } = await supabase.functions.invoke('voice-to-text', {
              body: { audio: base64Audio, language }
            });
            
            if (error) throw error;
            
            if (data?.text) {
              onTranscript(data.text);
              toast.success("Voice transcribed!");
            } else {
              toast.error(data?.error || "No speech detected");
            }
          } catch (err) {
            console.error("Transcription error:", err);
            toast.error("Failed to transcribe audio");
          } finally {
            setStatus("idle");
          }
        };
        
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.start();
      setStatus("recording");
      toast.info("Recording... Click to stop", { duration: 2000 });
    } catch (err: any) {
      console.error("Recording error:", err);
      if (err.name === 'NotAllowedError') {
        toast.error("Microphone access denied. Please allow in browser settings.");
      } else {
        toast.error("Could not access microphone");
      }
      setStatus("idle");
    }
  }, [language, onTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, [status]);

  const handleClick = () => {
    if (status === "recording") {
      stopRecording();
    } else if (status === "idle") {
      startRecording();
    }
    // Do nothing if processing
  };

  const getIcon = () => {
    if (status === "processing") {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (status === "recording") {
      return <Square className="h-4 w-4 fill-current" />; // Solid square = stop
    }
    return <Mic className="h-4 w-4" />;
  };

  const getButtonClasses = () => {
    if (status === "recording") {
      return "bg-red-500 hover:bg-red-600 text-white border-red-500 animate-pulse";
    }
    return "";
  };

  return (
    <Button
      type="button"
      variant={status === "recording" ? "destructive" : variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || status === "processing"}
      className={`${getButtonClasses()} ${className || ""}`}
      title={
        status === "recording" ? "Stop recording" :
        status === "processing" ? "Processing..." :
        "Start voice input"
      }
    >
      {getIcon()}
    </Button>
  );
}
```

---

#### 2. Update VoiceNoteRecorder to Use New Component

```typescript
// src/components/crm/VoiceNoteRecorder.tsx
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";

interface VoiceNoteRecorderProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

const VoiceNoteRecorder = ({ onTranscript, disabled }: VoiceNoteRecorderProps) => {
  return (
    <VoiceInputButton
      onTranscript={onTranscript}
      disabled={disabled}
    />
  );
};

export default VoiceNoteRecorder;
```

---

#### 3. Update All Other Components

For each component with inline voice recording:
- Remove the duplicated MediaRecorder logic
- Import and use `VoiceInputButton`
- Pass the appropriate `onTranscript` callback

**Example for SellerAssistant.tsx:**
```typescript
// Replace inline toggleVoiceInput logic with:
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";

// In the JSX:
<VoiceInputButton
  onTranscript={(text) => setInput(prev => prev ? `${prev} ${text}` : text)}
  disabled={isLoading}
  language="en"
/>
```

---

### Visual States Summary

| State | Icon | Color | Animation | Title |
|-------|------|-------|-----------|-------|
| Idle | `Mic` | Gold/Default | None | "Start voice input" |
| Recording | `Square` (filled) | Red | Pulse | "Stop recording" |
| Processing | `Loader2` | Gold | Spin | "Processing..." |

---

### Benefits of This Approach

1. **Single Source of Truth**: One component handles all voice input logic
2. **Consistent UX**: Same icons, colors, and animations everywhere
3. **Correct Semantics**: Stop icon (square) instead of confusing MicOff
4. **Easy Maintenance**: Fix bugs in one place, all components benefit
5. **Better Error Handling**: Centralized permission and error handling
6. **Smaller Bundle**: Remove duplicate code from 12+ files

---

### Testing Checklist

1. Open Support Ticket form → Click mic → Should show red pulsing square
2. Stop recording → Should show spinning loader while transcribing
3. Transcription completes → Should insert text and show mic again
4. Test in CRM Lead Detail notes section
5. Test in AI Note Center
6. Test in Seller Assistant panel
7. Test in Listing Admin Chat
8. Test in Voice Suite page
9. Deny microphone permission → Should show friendly error message
10. Test with no speech → Should show "No speech detected" message

