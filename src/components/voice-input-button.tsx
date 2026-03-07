"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Square,
  Loader2,
  Check,
  AlertCircle,
  Volume2,
  Settings,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  onAppend?: (text: string) => void; // Append to existing text
  currentValue?: string; // Current input value
  context?: "medical" | "general" | "lab" | "consultation" | "notes";
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "ghost";
  className?: string;
  disabled?: boolean;
  showStatus?: boolean;
  language?: string;
}

type RecordingState = "idle" | "recording" | "processing" | "success" | "error";

// ============================================
// MAIN COMPONENT
// ============================================

export function VoiceInputButton({
  onTranscript,
  onAppend,
  currentValue = "",
  context = "medical",
  size = "md",
  variant = "outline",
  className,
  disabled = false,
  showStatus = true,
  language = "en-US",
}: VoiceInputButtonProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  const { toast } = useToast();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript("");
      setRecordingTime(0);
      audioChunksRef.current = [];

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;

      // Setup audio analyser for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : 'audio/mp4',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        processAudio();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data in 100ms chunks
      setState("recording");

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start audio level monitoring
      monitorAudioLevel();

    } catch (err) {
      console.error("Failed to start recording:", err);
      setError("Microphone access denied. Please allow microphone access.");
      setState("error");
      toast({
        title: "Microphone Error",
        description: "Please allow microphone access to use voice input.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    analyserRef.current = null;
  }, []);

  // Monitor audio level
  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateLevel = () => {
      if (!analyserRef.current || state !== "recording") return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 255);
      
      requestAnimationFrame(updateLevel);
    };
    
    updateLevel();
  };

  // Process recorded audio
  const processAudio = async () => {
    setState("processing");

    try {
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
      });

      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        try {
          // Send to ASR API
          const response = await fetch("/api/asr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audioBase64: base64Audio,
              context,
            }),
          });

          const data = await response.json();

          if (data.success) {
            setTranscript(data.transcription);
            setState("success");
            
            // Call callback
            if (onAppend && currentValue) {
              // Append to existing text
              const newText = currentValue.trim() 
                ? `${currentValue.trim()} ${data.transcription}`
                : data.transcription;
              onTranscript(newText);
            } else {
              onTranscript(data.transcription);
            }

            toast({
              title: "Transcription Complete",
              description: `${data.wordCount} words transcribed`,
            });

            // Reset to idle after success
            setTimeout(() => {
              setState("idle");
              setTranscript("");
            }, 1500);

          } else {
            throw new Error(data.error || "Transcription failed");
          }

        } catch (err) {
          console.error("ASR Error:", err);
          setError(err instanceof Error ? err.message : "Transcription failed");
          setState("error");
          toast({
            title: "Transcription Error",
            description: "Failed to process audio. Please try again.",
            variant: "destructive",
          });
        }
      };

    } catch (err) {
      console.error("Processing error:", err);
      setError("Failed to process audio");
      setState("error");
    }
  };

  // Toggle recording
  const toggleRecording = () => {
    if (disabled) return;
    
    if (state === "recording") {
      stopRecording();
    } else if (state === "idle" || state === "error" || state === "success") {
      startRecording();
    }
  };

  // Get button size
  const getSize = () => {
    switch (size) {
      case "sm": return "h-8 w-8";
      case "lg": return "h-12 w-12";
      default: return "h-10 w-10";
    }
  };

  // Get icon size
  const getIconSize = () => {
    switch (size) {
      case "sm": return "h-4 w-4";
      case "lg": return "h-6 w-6";
      default: return "h-5 w-5";
    }
  };

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TooltipProvider>
      <div className="inline-flex items-center gap-2">
        {/* Main Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={variant}
              size="icon"
              className={cn(
                getSize(),
                "relative transition-all duration-200",
                state === "recording" && "bg-red-500 hover:bg-red-600 text-white border-red-500",
                state === "processing" && "bg-amber-500 hover:bg-amber-600 text-white",
                state === "success" && "bg-emerald-500 hover:bg-emerald-600 text-white",
                state === "error" && "bg-red-500 hover:bg-red-600 text-white",
                disabled && "opacity-50 cursor-not-allowed",
                className
              )}
              onClick={toggleRecording}
              disabled={disabled || state === "processing"}
            >
              <AnimatePresence mode="wait">
                {state === "idle" && (
                  <Mic className={getIconSize()} />
                )}
                {state === "recording" && (
                  <motion.div
                    key="recording"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Square className={getIconSize()} />
                  </motion.div>
                )}
                {state === "processing" && (
                  <Loader2 className={cn(getIconSize(), "animate-spin")} />
                )}
                {state === "success" && (
                  <motion.div
                    key="success"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <Check className={getIconSize()} />
                  </motion.div>
                )}
                {state === "error" && (
                  <AlertCircle className={getIconSize()} />
                )}
              </AnimatePresence>

              {/* Audio Level Indicator */}
              {state === "recording" && (
                <motion.div
                  className="absolute inset-0 rounded-md border-2 border-red-300"
                  animate={{
                    scale: [1, 1 + audioLevel * 0.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {state === "idle" && "Click to start voice input"}
            {state === "recording" && "Click to stop recording"}
            {state === "processing" && "Processing audio..."}
            {state === "success" && "Transcription complete!"}
            {state === "error" && "Error - Click to retry"}
          </TooltipContent>
        </Tooltip>

        {/* Status Badge */}
        {showStatus && state === "recording" && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <motion.div
                className="w-2 h-2 rounded-full bg-red-500 mr-2"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              {formatTime(recordingTime)}
            </Badge>
          </motion.div>
        )}

        {/* Success Indicator */}
        {showStatus && state === "success" && transcript && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <Check className="h-3 w-3 mr-1" />
              Transcribed
            </Badge>
          </motion.div>
        )}

        {/* Error Message */}
        {showStatus && state === "error" && error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              Error
            </Badge>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  );
}

// ============================================
// VOICE INPUT WRAPPER - For Text Areas/Inputs
// ============================================

interface VoiceInputWrapperProps {
  children: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  context?: "medical" | "general" | "lab" | "consultation" | "notes";
  position?: "inside" | "outside";
  size?: "sm" | "md" | "lg";
}

export function VoiceInputWrapper({
  children,
  value,
  onChange,
  context = "medical",
  position = "inside",
  size = "md",
}: VoiceInputWrapperProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleTranscript = (text: string) => {
    setLocalValue(text);
    onChange(text);
  };

  if (position === "outside") {
    return (
      <div className="flex items-start gap-2">
        <div className="flex-1">{children}</div>
        <VoiceInputButton
          onTranscript={handleTranscript}
          currentValue={localValue}
          onAppend={handleTranscript}
          context={context}
          size={size}
        />
      </div>
    );
  }

  // Clone child and add voice button inside
  return (
    <div className="relative">
      {children}
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <VoiceInputButton
          onTranscript={handleTranscript}
          currentValue={localValue}
          onAppend={handleTranscript}
          context={context}
          size="sm"
          variant="ghost"
          className="bg-white/80 hover:bg-white"
        />
      </div>
    </div>
  );
}

// ============================================
// FLOATING VOICE INPUT - Always visible
// ============================================

interface FloatingVoiceInputProps {
  onTranscript: (text: string, targetId?: string) => void;
  activeTargetId?: string;
}

export function FloatingVoiceInput({ onTranscript, activeTargetId }: FloatingVoiceInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [state, setState] = useState<RecordingState>("idle");

  return (
    <motion.div
      className="fixed bottom-20 right-4 z-50"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <Card className="bg-white shadow-lg border-slate-200">
        <CardContent className="p-3">
          <VoiceInputButton
            onTranscript={(text) => onTranscript(text, activeTargetId)}
            context="medical"
            size="lg"
            showStatus={false}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// EXPORTS
// ============================================

export default VoiceInputButton;

// Import Card and CardContent for FloatingVoiceInput
import { Card, CardContent } from "@/components/ui/card";
