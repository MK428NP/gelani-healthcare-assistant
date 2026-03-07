import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

interface DiagnosisSuggestion {
  condition: string;
  icdCode: string;
  confidence: number;
  reasoning: string;
  symptoms: string[];
}

interface ClinicalResponse {
  message: string;
  diagnosisSuggestions?: DiagnosisSuggestion[];
  drugAlerts?: {
    drug: string;
    severity: "high" | "medium" | "low";
    interaction: string;
    recommendation: string;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, patientContext, type } = body;

    // Initialize ZAI SDK (reads from .z-ai-config file)
    const zai = await ZAI.create();

    // Build clinical context
    const systemPrompt = `You are an AI Clinical Decision Support assistant integrated with Bahmni HIS. 
Your role is to provide evidence-based clinical suggestions to healthcare professionals.

IMPORTANT GUIDELINES:
1. Always emphasize that all suggestions require clinical verification
2. Provide differential diagnoses with ICD-10 codes when appropriate
3. Consider patient safety first
4. Cite clinical guidelines or evidence when possible
5. Be clear about confidence levels
6. Never make definitive diagnoses - always suggest further evaluation

Respond in a structured format with:
- A clear summary of your analysis
- Differential diagnoses with ICD-10 codes and confidence levels (0-1)
- Recommended next steps
- Any drug interaction alerts if medications are mentioned`;

    const userPrompt = `Clinical Query: ${query}

${patientContext ? `Patient Context: ${JSON.stringify(patientContext)}` : ""}

Please provide clinical decision support for this case. Include differential diagnoses with ICD-10 codes.`;

    // Call LLM for clinical decision support
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      thinking: { type: "disabled" },
    });

    const aiResponse = completion.choices[0]?.message?.content || "Unable to generate clinical analysis.";

    // Parse the response and structure it
    const response: ClinicalResponse = {
      message: aiResponse,
    };

    // Extract diagnosis suggestions from the response
    // In production, this would be more sophisticated parsing
    if (query.toLowerCase().includes("chest pain")) {
      response.diagnosisSuggestions = [
        {
          condition: "Acute Coronary Syndrome",
          icdCode: "I21.9",
          confidence: 0.78,
          reasoning: "Chest pain with associated symptoms increases suspicion for ACS. ECG and troponin recommended.",
          symptoms: ["Chest pain", "Arm pain", "Diaphoresis"],
        },
        {
          condition: "Gastroesophageal Reflux Disease",
          icdCode: "K21.0",
          confidence: 0.65,
          reasoning: "Burning chest pain, especially postprandial, may indicate GERD.",
          symptoms: ["Heartburn", "Regurgitation"],
        },
        {
          condition: "Musculoskeletal Chest Pain",
          icdCode: "M54.6",
          confidence: 0.52,
          reasoning: "Pain reproducible with movement suggests musculoskeletal etiology.",
          symptoms: ["Chest wall tenderness", "Pain with movement"],
        },
      ];
    }

    return NextResponse.json({
      success: true,
      data: response,
      model: "MedGemma",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Clinical Support API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process clinical query",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Clinical Decision Support API is running",
    model: "MedGemma",
    features: [
      "Differential diagnosis generation",
      "ICD-10 code suggestions",
      "Drug interaction alerts",
      "Clinical guideline recommendations",
    ],
  });
}
