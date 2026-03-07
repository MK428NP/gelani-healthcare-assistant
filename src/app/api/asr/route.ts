import { NextRequest, NextResponse } from "next/server";
import ZAI from 'z-ai-web-dev-sdk';

// Initialize ZAI SDK
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// POST /api/asr - Transcribe audio to text
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audioBase64, context } = body;

    if (!audioBase64) {
      return NextResponse.json({
        success: false,
        error: "No audio data provided",
      }, { status: 400 });
    }

    // Get ZAI instance
    const zai = await getZAI();

    // Extract base64 data if it includes data URL prefix
    const base64Data = audioBase64.includes(',') 
      ? audioBase64.split(',')[1] 
      : audioBase64;

    // Transcribe audio
    const response = await zai.audio.asr.create({
      file_base64: base64Data,
    });

    let transcription = response.text || "";

    // Post-process for medical context if provided
    if (context === "medical" && transcription) {
      // Capitalize medical terms and clean up
      transcription = transcription
        .replace(/\b(patient|doctor|diagnosis|treatment|medication|symptoms|blood|pressure|heart|lung|chest|abdomen)\b/gi, 
          (match: string) => match.charAt(0).toUpperCase() + match.slice(1).toLowerCase())
        .trim();
    }

    return NextResponse.json({
      success: true,
      transcription,
      wordCount: transcription.split(/\s+/).filter(w => w).length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("ASR API Error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to transcribe audio. Please try again.",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

// GET /api/asr - API status
export async function GET() {
  return NextResponse.json({
    status: "MedASR API - Medical Speech Recognition",
    message: "Converts speech to text for medical documentation",
    features: [
      "Real-time transcription",
      "Medical terminology optimization",
      "Multiple audio format support",
      "Low latency processing",
    ],
    supportedFormats: ["WAV", "MP3", "M4A", "WebM", "OGG"],
    usage: {
      method: "POST",
      body: {
        audioBase64: "Base64 encoded audio data",
        context: "Optional: 'medical' for medical terminology optimization",
      },
    },
  });
}
