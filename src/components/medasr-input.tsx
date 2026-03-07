"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Square,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// ============================================
// TYPES
// ============================================

interface MedASRInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  context?: "medical" | "general" | "lab" | "consultation" | "notes" | "prescription";
  showVoice?: "always" | "focus" | "never";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  multiline?: boolean;
  rows?: number;
  label?: string;
  required?: boolean;
}

type RecordingState = "idle" | "recording" | "processing" | "success" | "error";

// ============================================
// MAIN COMPONENT
// ============================================

export function MedASRInput({
  value,
  onChange,
  placeholder = "Type or speak...",
  context = "medical",
  showVoice = "always",
  size = "md",
  disabled = false,
  className,
  multiline = false,
  rows = 3,
  label,
  required = false,
}: MedASRInputProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  
  const { toast } = useToast();

  // Monitor audio level
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    const update = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(avg / 255);
      if (analyserRef.current) {
        requestAnimationFrame(update);
      }
    };
    update();
  }, []);

  // Process audio
  const processAudio = useCallback(async () => {
    setState("processing");
    try {
      const blob = new Blob(audioChunksRef.current, { 
        type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
      });
      
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        try {
          const res = await fetch("/api/asr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioBase64: base64, context }),
          });
          
          const data = await res.json();
          
          if (data.success) {
            const newValue = value ? `${value} ${data.transcription}` : data.transcription;
            onChange(newValue);
            setState("success");
            toast({ title: "Transcribed!", description: `${data.wordCount} words` });
            setTimeout(() => { setState("idle"); setRecordingTime(0); }, 1500);
          } else {
            throw new Error(data.error);
          }
        } catch (err) {
          setState("error");
          toast({ title: "Error", description: "Transcription failed", variant: "destructive" });
        }
      };
    } catch (err) {
      setState("error");
    }
  }, [context, value, onChange, toast]);

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

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setRecordingTime(0);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;

      // Audio analyser
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => processAudio();

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setState("recording");

      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
      monitorAudioLevel();

    } catch (err) {
      console.error("Recording error:", err);
      setState("error");
      toast({
        title: "Microphone Error",
        description: "Please allow microphone access.",
        variant: "destructive",
      });
    }
  }, [toast, processAudio, monitorAudioLevel]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Toggle
  const toggle = () => {
    if (disabled) return;
    if (state === "recording") {
      stopRecording();
    } else if (state === "idle" || state === "error" || state === "success") {
      startRecording();
    }
  };

  // Format time
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // Show voice button?
  const showButton = showVoice === "always" || (showVoice === "focus" && isFocused);

  // Size classes
  const sizeClasses = {
    sm: "text-sm h-8",
    md: "text-sm h-10",
    lg: "text-base h-12",
  };

  const inputClasses = cn(
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm",
    "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
    "placeholder:text-slate-400",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    sizeClasses[size],
    showButton && "pr-20",
    className
  );

  const buttonSize = size === "sm" ? "h-6 w-6" : size === "lg" ? "h-8 w-8" : "h-7 w-7";
  const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={cn(inputClasses, "resize-y min-h-[80px]")}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={inputClasses}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        )}

        {/* Voice Button */}
        {showButton && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {state === "recording" && (
              <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200 mr-1">
                {formatTime(recordingTime)}
              </Badge>
            )}
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                buttonSize,
                "rounded-full transition-all",
                state === "recording" && "bg-red-500 hover:bg-red-600 text-white",
                state === "processing" && "bg-amber-500 text-white",
                state === "success" && "bg-emerald-500 text-white",
                state === "error" && "bg-red-500 text-white"
              )}
              onClick={toggle}
              disabled={disabled || state === "processing"}
            >
              <AnimatePresence mode="wait">
                {state === "idle" && <Mic className={iconSize} />}
                {state === "recording" && <Square className={iconSize} />}
                {state === "processing" && <Loader2 className={cn(iconSize, "animate-spin")} />}
                {state === "success" && <Check className={iconSize} />}
                {state === "error" && <AlertCircle className={iconSize} />}
              </AnimatePresence>
            </Button>
          </div>
        )}

        {/* Recording Overlay */}
        {state === "recording" && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-lg border-2 border-red-400"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
    </div>
  );
}

export default MedASRInput;
