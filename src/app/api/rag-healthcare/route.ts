import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// RAG Healthcare API - Retrieves relevant knowledge and generates AI responses

interface KnowledgeResult {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  category: string;
  relevanceScore: number;
  source: string | null;
}

// Keyword extraction for query understanding
function extractKeywords(query: string): string[] {
  const medicalTerms = query.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  // Remove common stop words
  const stopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'has', 'had', 'what', 'when', 'where', 'who', 'how', 'why', 'with', 'this', 'that', 'these', 'those', 'from', 'they', 'will', 'would', 'there', 'their', 'about', 'which', 'could'];
  
  return medicalTerms.filter(word => !stopWords.includes(word));
}

// Calculate relevance score between query and knowledge entry
function calculateRelevance(query: string, knowledge: {
  title: string;
  content: string;
  summary: string | null;
  keywords: string | null;
  icdCodes: string | null;
  drugNames: string | null;
}): number {
  const queryLower = query.toLowerCase();
  let score = 0;
  
  // Title matching (high weight)
  if (knowledge.title.toLowerCase().includes(queryLower) || 
      queryLower.includes(knowledge.title.toLowerCase())) {
    score += 0.5;
  }
  
  // Title word overlap
  const titleWords = knowledge.title.toLowerCase().split(/\s+/);
  const queryWords = queryLower.split(/\s+/);
  const titleOverlap = titleWords.filter(word => queryWords.some(qw => qw.includes(word) || word.includes(qw)));
  score += (titleOverlap.length / Math.max(titleWords.length, 1)) * 0.3;
  
  // Keywords matching
  if (knowledge.keywords) {
    try {
      const keywords = JSON.parse(knowledge.keywords) as string[];
      const matchedKeywords = keywords.filter(kw => 
        queryLower.includes(kw.toLowerCase())
      );
      score += (matchedKeywords.length / Math.max(keywords.length, 1)) * 0.4;
    } catch {
      // Ignore parse errors
    }
  }
  
  // Drug names matching
  if (knowledge.drugNames) {
    try {
      const drugs = JSON.parse(knowledge.drugNames) as string[];
      const matchedDrugs = drugs.filter(drug => 
        queryLower.includes(drug.toLowerCase())
      );
      score += (matchedDrugs.length / Math.max(drugs.length, 1)) * 0.3;
    } catch {
      // Ignore parse errors
    }
  }
  
  // ICD codes matching
  if (knowledge.icdCodes) {
    try {
      const codes = JSON.parse(knowledge.icdCodes) as string[];
      const matchedCodes = codes.filter(code => 
        queryLower.includes(code.toLowerCase())
      );
      score += (matchedCodes.length * 0.2);
    } catch {
      // Ignore parse errors
    }
  }
  
  // Content relevance
  const contentWords = knowledge.content.toLowerCase().split(/\s+/);
  const queryKeywordSet = new Set(queryWords.filter(w => w.length > 3));
  const contentMatch = contentWords.filter(word => queryKeywordSet.has(word));
  score += Math.min(contentMatch.length * 0.02, 0.2);
  
  return Math.min(score, 1.0);
}

// Search healthcare knowledge base
async function searchKnowledge(query: string, limit: number = 5): Promise<KnowledgeResult[]> {
  // Get all active knowledge entries
  const allKnowledge = await db.healthcareKnowledge.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      content: true,
      summary: true,
      category: true,
      keywords: true,
      icdCodes: true,
      drugNames: true,
      source: true,
    },
  });
  
  // Calculate relevance scores
  const scored = allKnowledge.map(k => ({
    ...k,
    relevanceScore: calculateRelevance(query, k),
  }));
  
  // Sort by relevance and return top results
  return scored
    .filter(k => k.relevanceScore > 0.1)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit)
    .map(k => ({
      id: k.id,
      title: k.title,
      content: k.content,
      summary: k.summary,
      category: k.category,
      relevanceScore: k.relevanceScore,
      source: k.source,
    }));
}

// Search drug interactions
async function searchDrugInteractions(drug1: string, drug2?: string): Promise<{
  drug1: string;
  drug2: string;
  severity: string;
  description: string;
  management: string | null;
}[]> {
  const drug1Lower = drug1.toLowerCase();
  
  const interactions = await db.drugInteractionKnowledge.findMany({
    where: {
      isActive: true,
      OR: [
        { drug1Name: { contains: drug1Lower } },
        { drug1Generic: { contains: drug1Lower } },
        { drug2Name: { contains: drug1Lower } },
        { drug2Generic: { contains: drug1Lower } },
      ],
    },
  });
  
  if (drug2) {
    const drug2Lower = drug2.toLowerCase();
    return interactions
      .filter(i => 
        i.drug1Name.toLowerCase().includes(drug2Lower) ||
        i.drug1Generic?.toLowerCase().includes(drug2Lower) ||
        i.drug2Name.toLowerCase().includes(drug2Lower) ||
        i.drug2Generic?.toLowerCase().includes(drug2Lower)
      )
      .map(i => ({
        drug1: i.drug1Name,
        drug2: i.drug2Name,
        severity: i.severity,
        description: i.description,
        management: i.management,
      }));
  }
  
  return interactions.map(i => ({
    drug1: i.drug1Name,
    drug2: i.drug2Name,
    severity: i.severity,
    description: i.description,
    management: i.management,
  }));
}

// Search symptom mappings
async function searchSymptomConditions(symptom: string): Promise<{
  symptom: string;
  conditions: {
    condition: string;
    icdCode: string;
    probability: number;
    urgency: string;
  }[];
  riskFactors: string[];
} | null> {
  const symptomLower = symptom.toLowerCase();
  
  const mapping = await db.symptomConditionMapping.findFirst({
    where: {
      isActive: true,
      OR: [
        { symptomName: { contains: symptomLower } },
      ],
    },
  });
  
  if (!mapping) return null;
  
  try {
    return {
      symptom: mapping.symptomName,
      conditions: JSON.parse(mapping.conditions),
      riskFactors: mapping.riskFactors ? JSON.parse(mapping.riskFactors) : [],
    };
  } catch {
    return null;
  }
}

// Generate RAG-enhanced AI response
async function generateRAGResponse(
  query: string,
  knowledge: KnowledgeResult[],
  patientContext?: {
    name: string;
    age: number;
    gender: string;
    allergies: string[];
    medications: string[];
    conditions: string[];
  }
): Promise<{ response: string; sources: string[] }> {
  const zai = await ZAI.create();
  
  // Build context from retrieved knowledge
  const knowledgeContext = knowledge
    .map((k, i) => `[${i + 1}] ${k.title}:\n${k.content.slice(0, 1000)}`)
    .join('\n\n---\n\n');
  
  const sources = knowledge.map(k => k.title);
  
  // Build patient context if provided
  const patientInfo = patientContext 
    ? `\n\nPATIENT CONTEXT:
- Name: ${patientContext.name}
- Age: ${patientContext.age} years, ${patientContext.gender}
- Allergies: ${patientContext.allergies.length > 0 ? patientContext.allergies.join(', ') : 'None reported'}
- Current Medications: ${patientContext.medications.length > 0 ? patientContext.medications.join(', ') : 'None'}
- Known Conditions: ${patientContext.conditions.length > 0 ? patientContext.conditions.join(', ') : 'None reported'}`
    : '';
  
  const systemPrompt = `You are an AI Healthcare Assistant with RAG (Retrieval-Augmented Generation) capabilities. 
You have access to a medical knowledge base and should use the provided context to give accurate, evidence-based responses.

IMPORTANT GUIDELINES:
1. Always use the provided knowledge context when available
2. Clearly state when information comes from the knowledge base vs general medical knowledge
3. Always recommend consulting a healthcare professional for clinical decisions
4. Be specific about diagnostic criteria, drug dosages, and treatment protocols when available in context
5. Highlight any drug interactions, contraindications, or safety concerns
6. If patient context is provided, tailor recommendations to the specific patient
7. Cite sources from the knowledge base in your response

RESPONSE FORMAT:
- Start with the most relevant finding
- Include specific data from knowledge base (dosages, criteria, etc.)
- List differential diagnoses with probabilities when applicable
- Include red flags or urgent findings to watch for
- End with recommended next steps or when to seek immediate care`;

  const userMessage = `QUERY: ${query}

RETRIEVED KNOWLEDGE CONTEXT:
${knowledgeContext || 'No specific knowledge base entries found for this query.'}${patientInfo}

Please provide a comprehensive clinical response using the available knowledge. Include specific medical information, cite sources from the knowledge base, and provide actionable recommendations.`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      thinking: { type: 'disabled' }
    });
    
    const response = completion.choices[0]?.message?.content || 'Unable to generate response.';
    return { response, sources };
  } catch (error) {
    console.error('LLM Error:', error);
    
    // Fallback response with knowledge
    if (knowledge.length > 0) {
      const fallbackResponse = `Based on the medical knowledge base:\n\n` +
        knowledge.map(k => `**${k.title}**\n${k.summary || k.content.slice(0, 500)}...`).join('\n\n') +
        `\n\n*Note: AI generation failed. This is a direct knowledge base retrieval. Please consult a healthcare professional for clinical decisions.*`;
      return { response: fallbackResponse, sources };
    }
    
    return { 
      response: 'I apologize, but I encountered an error processing your query. Please try again or consult a healthcare professional directly.', 
      sources: [] 
    };
  }
}

// Log RAG query for analytics
async function logRAGQuery(
  query: string,
  queryType: string,
  knowledgeIds: string[],
  responseTime: number,
  aiResponse: string,
  patientId?: string,
  consultationId?: string
) {
  try {
    // Save to RAGQuery for analytics
    await db.rAGQuery.create({
      data: {
        queryText: query,
        queryType,
        knowledgeIds: JSON.stringify(knowledgeIds),
        retrievalCount: knowledgeIds.length,
        responseTime,
        aiResponse,
        patientId,
        consultationId,
      },
    });
    
    // Also save to AIInteraction for patient timeline
    if (patientId) {
      await db.aIInteraction.create({
        data: {
          patientId,
          consultationId,
          interactionType: 'rag-healthcare',
          prompt: query,
          response: aiResponse,
          modelUsed: 'medgemma-rag',
          processingTime: responseTime,
        },
      });
    }
  } catch (e) {
    console.error('Failed to log RAG query:', e);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { 
      query, 
      queryType = 'text',
      patientContext,
      drugCheck,
      symptomCheck,
      consultationId, // Add consultation ID for linking
    } = body;
    
    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }
    
    let knowledge: KnowledgeResult[] = [];
    let drugInteractions: Awaited<ReturnType<typeof searchDrugInteractions>> = [];
    let symptomMapping: Awaited<ReturnType<typeof searchSymptomConditions>> = null;
    
    // Perform knowledge retrieval based on query type
    if (drugCheck?.drug1) {
      // Drug interaction check
      drugInteractions = await searchDrugInteractions(drugCheck.drug1, drugCheck.drug2);
      
      // Also search general knowledge for drug-related info
      knowledge = await searchKnowledge(`${drugCheck.drug1} ${drugCheck.drug2 || ''} interaction`, 3);
    } else if (symptomCheck) {
      // Symptom-based differential diagnosis
      symptomMapping = await searchSymptomConditions(symptomCheck);
      knowledge = await searchKnowledge(symptomCheck, 5);
    } else {
      // General knowledge search
      knowledge = await searchKnowledge(query, 5);
    }
    
    // Generate RAG-enhanced response
    const { response, sources } = await generateRAGResponse(query, knowledge, patientContext);
    
    const responseTime = Date.now() - startTime;
    
    // Log the query with full interaction data
    await logRAGQuery(
      query,
      queryType,
      knowledge.map(k => k.id),
      responseTime,
      response,
      patientContext?.id,
      consultationId
    );
    
    // Update retrieval counts for knowledge entries
    if (knowledge.length > 0) {
      await Promise.all(
        knowledge.map(k => 
          db.healthcareKnowledge.update({
            where: { id: k.id },
            data: { retrievalCount: { increment: 1 } },
          })
        )
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        response,
        sources,
        knowledge: knowledge.map(k => ({
          id: k.id,
          title: k.title,
          category: k.category,
          relevanceScore: k.relevanceScore,
        })),
        drugInteractions: drugInteractions.length > 0 ? drugInteractions : undefined,
        symptomMapping: symptomMapping ? {
          symptom: symptomMapping.symptom,
          conditions: symptomMapping.conditions,
          riskFactors: symptomMapping.riskFactors,
        } : undefined,
        metadata: {
          responseTime,
          knowledgeRetrieved: knowledge.length,
          queryType,
        },
      },
    });
  } catch (error) {
    console.error('RAG API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process query',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to search knowledge base directly
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '10');
  
  if (!query) {
    return NextResponse.json(
      { success: false, error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }
  
  try {
    let results;
    
    if (category) {
      // Search within category
      results = await db.healthcareKnowledge.findMany({
        where: {
          isActive: true,
          category,
          OR: [
            { title: { contains: query } },
            { content: { contains: query } },
            { keywords: { contains: query } },
          ],
        },
        take: limit,
        select: {
          id: true,
          title: true,
          summary: true,
          category: true,
          specialty: true,
          source: true,
        },
      });
    } else {
      // General search
      results = await searchKnowledge(query, limit);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        results,
        count: results.length,
      },
    });
  } catch (error) {
    console.error('Knowledge search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search knowledge base' },
      { status: 500 }
    );
  }
}
