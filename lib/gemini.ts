import { GoogleGenAI, Type } from "@google/genai";
import type { AiImageAnalysis, AuditEntry, Issue } from './types';
import { getApiKey, getModelName, DEPARTMENTS } from './aiConfig';

// --- API Key Management ---
// Uses the centralized AI configuration for flexible API key management.
// API key can be set via: environment variables, config file, or localStorage.

function getGenAI(): GoogleGenAI {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error(
            "A Google Gemini API key is required. Set VITE_GEMINI_API_KEY in .env or use setApiKey() from lib/aiConfig.ts"
        );
    }
    return new GoogleGenAI({ apiKey });
}

// Get the current model name from config
const getCurrentModel = () => getModelName();

/**
 * Analyzes a new issue.
 */
export async function processNewIssue(title: string, description: string): Promise<{ ai_summary: string, sentiment: 'positive' | 'neutral' | 'negative', severity_score: number, department: string }> {
    const prompt = `
    You are an AI-powered civic operations analyst for the city of Hyderabad, India. Your task is to process a citizen's report and classify it for routing.
    
    Analyze the provided issue title and description. You must return a single, valid JSON object with the following four keys and nothing else: "ai_summary", "sentiment", "severity_score", "department".

    - "ai_summary": Create a concise, factual, one-sentence summary of the core issue.
    - "sentiment": Classify the citizen's tone. Must be one of "positive", "neutral", or "negative".
    - "severity_score": Assign an integer score from 0 to 100, where 100 represents a critical, life-threatening emergency (e.g., building collapse), and 0 represents a positive report (e.g., thanking the city).
    - "department": Select the *single most appropriate* municipal department to handle this issue. Choose *exactly one* from the following list:
        - ${DEPARTMENTS.join("\n        - ")}

    **Citizen Report:**
    Title: "${title}"
    Description: "${description}"
    `;

    try {
        const response = await getGenAI().models.generateContent({
            model: getCurrentModel(),
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        ai_summary: { type: Type.STRING, description: "A concise, one-sentence summary of the core problem." },
                        sentiment: { type: Type.STRING, enum: ["positive", "neutral", "negative"] },
                        severity_score: { type: Type.INTEGER, description: "A numerical score from 0 to 100." },
                        department: { type: Type.STRING, enum: DEPARTMENTS, description: "The single most appropriate municipal department." },
                    },
                    required: ["ai_summary", "sentiment", "severity_score", "department"],
                },
            },
        });

        return JSON.parse(response.text);

    } catch (error: any) {
        console.error("Error processing new issue with Gemini:", error);
        // Rethrow the error to be handled by the calling component's catch block.
        throw new Error(`AI analysis failed: ${error.message || 'Could not connect to the API.'}`);
    }
}

/**
 * Analyzes an uploaded image.
 */
export async function analyzeIssueImage(base64ImageData: string, mimeType: string): Promise<AiImageAnalysis | null> {
    const imagePart = {
        inlineData: {
            data: base64ImageData,
            mimeType: mimeType,
        },
    };

    const prompt = `
    You are an AI assistant specializing in visual analysis of urban environments for the city of Hyderabad, India. Your task is to identify and describe a civic issue from an image.

    Analyze the provided image and return a single, valid JSON object with these keys:

    - **Constraint:** Your analysis must be based *strictly* on the visual evidence within the image. Do not infer location, time, or details not directly visible.

    - "suggested_title": Create a short, factual title for the issue. Examples: "Overflowing garbage dump", "Large pothole on street", "Broken streetlight".
    - "suggested_description": Provide a brief, objective description of what you see. Focus on key visual details relevant to the issue.
    - "suggested_department": From the list below, select the *single most likely* municipal department. Choose *exactly one*.
        - ${DEPARTMENTS.join("\n        - ")}
    - "suggested_priority": Based on the severity visible in the image, select one:
        - "critical" - Immediate danger to life/safety (exposed wires, building collapse, fire)
        - "high" - Significant hazard or infrastructure failure (large pothole, broken water main)
        - "medium" - Moderate issue affecting daily life (garbage pile, streetlight out)
        - "low" - Minor inconvenience (graffiti, overgrown grass, minor crack)
    `;

    try {
        const response = await getGenAI().models.generateContent({
            model: getCurrentModel(),
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggested_title: { type: Type.STRING },
                        suggested_description: { type: Type.STRING },
                        suggested_department: { type: Type.STRING, enum: DEPARTMENTS },
                        suggested_priority: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
                    },
                    required: ["suggested_title", "suggested_description", "suggested_department", "suggested_priority"],
                },
            },
        });

        return JSON.parse(response.text);

    } catch (error: any) {
        console.error("Error analyzing image with Gemini:", error);
        throw error;
    }
}


/**
 * Finds similar existing issues to a new report to prevent duplicates.
 * This remains a simplified, non-AI version based on location and title for performance.
 */
export async function findSimilarIssues(newTitle: string, newDescription: string, newLocation: { lat: number; lng: number }, existingIssues: Issue[]): Promise<Issue[] | null> {
    // This function does not require AI.
    await new Promise(res => setTimeout(res, 100));
    const newTitleLower = newTitle.toLowerCase().trim();

    const duplicates = existingIssues.filter(issue => {
        const latDiff = Math.abs(issue.location.lat - newLocation.lat);
        const lngDiff = Math.abs(issue.location.lng - newLocation.lng);
        const isNearby = latDiff < 0.005 && lngDiff < 0.005;

        if (!isNearby || issue.status === 'resolved' || issue.status === 'closed') return false;

        const existingTitleLower = issue.title.toLowerCase().trim();
        return existingTitleLower.includes(newTitleLower) || newTitleLower.includes(existingTitleLower);
    });

    return duplicates.length > 0 ? duplicates.slice(0, 3) : null;
}

/**
 * Summarizes a technical audit log for the public.
 */
export async function summarizeAuditLogForPublic(auditLog: AuditEntry[]): Promise<string> {
    const logText = [...auditLog].reverse().map(entry =>
        `- At ${new Date(entry.timestamp).toLocaleString()}, ${entry.author} performed action: '${entry.action}' ${entry.details ? `(Details: ${entry.details})` : ''}`
    ).join("\n");

    const prompt = `
    You are a public relations officer for a city's civic issues department.
    Your task is to convert a technical audit log into a concise, reassuring, and easy-to-understand summary for the public.
    The tone should be professional and instill confidence that the issue is being handled.
    Do not use technical jargon. Start directly with the summary, without any preamble.

    Technical Log:
    ${logText}

    Public Summary:
    `;

    try {
        const response = await getGenAI().models.generateContent({
            model: getCurrentModel(),
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error summarizing audit log:", error);
        throw error;
    }
}

/**
 * Creates a concise summary of an issue for an admin.
 */
export async function summarizeIssueForAdmin(issue: Issue): Promise<string> {
    const issueContext = `
    - Title: ${issue.title}
    - Description: ${issue.description || issue.ai_summary}
    - Status: ${issue.status}
    - Priority: ${issue.priority}
    - Department: ${issue.department}
    - Severity Score: ${issue.severity_score}/100
    - Reporter: ${issue.reporterId}
    - Location: ${issue.location.neighborhood}
    - Comments: ${issue.comments?.map(c => c.text).join('; ') || 'None'}
    - Internal Notes: ${issue.internal_notes?.map(n => n.text).join('; ') || 'None'}
    `;

    const prompt = `
    You are an AI assistant for a busy city administrator.
    Analyze the provided issue data and generate a very concise, executive summary in HTML format using <strong> and <ul>/<li> tags.
    Focus on the current situation and any potential next steps or bottlenecks.
    The summary should be easily scannable.

    Issue Data:
    ${issueContext}

    Executive Summary (HTML format):
    `;

    try {
        const response = await getGenAI().models.generateContent({
            model: getCurrentModel(),
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error summarizing for admin:", error);
        throw error;
    }
}

/**
 * Converts a natural language query into a structured filter object.
 */
export async function convertQueryToFilters(query: string): Promise<any> {
    const prompt = `
    You are an AI that converts a natural language query into a JSON filter object for a database of civic issues.
    The user can filter by 'department', 'status', 'severity' (a minimum score from 0-100), 'sentiment', 'startDate', and 'endDate'.

    - Today's date is ${new Date().toISOString().split('T')[0]}.
    - For date queries like "last week" or "yesterday", calculate the specific 'startDate' and 'endDate' in 'YYYY-MM-DD' format.
    - If a specific field is not mentioned, omit it from the JSON output.
    - For severity, if the user says "critical" or "high severity", use a value like 80. For "low severity", use 20.

    Valid Departments: ${DEPARTMENTS.join(", ")}
    Valid Statuses: open, assigned, in progress, resolved, closed
    Valid Sentiments: positive, neutral, negative

    User Query: "${query}"
    `;

    try {
        const response = await getGenAI().models.generateContent({
            model: getCurrentModel(),
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        department: { type: Type.STRING, enum: DEPARTMENTS, nullable: true },
                        status: { type: Type.STRING, enum: ["open", "assigned", "in progress", "resolved", "closed"], nullable: true },
                        severity: { type: Type.INTEGER, description: "Minimum severity score", nullable: true },
                        sentiment: { type: Type.STRING, enum: ["positive", "neutral", "negative"], nullable: true },
                        startDate: { type: Type.STRING, description: "YYYY-MM-DD format", nullable: true },
                        endDate: { type: Type.STRING, description: "YYYY-MM-DD format", nullable: true },
                    },
                },
            },
        });

        const filters = JSON.parse(response.text);

        // Clean up any null fields returned by the model
        Object.keys(filters).forEach(key => (filters[key] == null) && delete filters[key]);

        return filters;
    } catch (error: any) {
        console.error("Error converting query to filters:", error);
        throw error;
    }
}

/**
 * AI Feature #1: Smart Issue Submission
 * Provides real-time suggestions while citizen types their issue description.
 */
export interface SmartSuggestion {
    suggested_title: string;
    suggested_department: string;
    estimated_severity: 'low' | 'medium' | 'high' | 'critical';
    severity_score: number;
    tips: string[];
}

export async function getSmartSuggestion(description: string): Promise<SmartSuggestion | null> {
    if (description.length < 20) return null; // Too short to analyze

    const prompt = `
    You are an AI assistant helping citizens report civic issues in Hyderabad, India.
    
    Based on the citizen's partial description, provide helpful suggestions to improve their report.
    
    **Citizen's Description:**
    "${description}"
    
    **Your Task:**
    1. Suggest a clear, concise title (max 10 words)
    2. Identify the most likely department
    3. Estimate the severity level
    4. Provide 1-2 tips to make the report more helpful
    
    **Departments to choose from:**
    ${DEPARTMENTS.join(', ')}
    
    Return ONLY a valid JSON object with these fields:
    - suggested_title: string (concise title)
    - suggested_department: string (from list above)
    - estimated_severity: "low" | "medium" | "high" | "critical"
    - severity_score: number 0-100
    - tips: array of 1-2 short tips
    `;

    try {
        const response = await getGenAI().models.generateContent({
            model: getCurrentModel(),
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggested_title: { type: Type.STRING },
                        suggested_department: { type: Type.STRING, enum: DEPARTMENTS },
                        estimated_severity: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
                        severity_score: { type: Type.INTEGER },
                        tips: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ["suggested_title", "suggested_department", "estimated_severity", "severity_score", "tips"],
                },
            },
        });

        return JSON.parse(response.text);
    } catch (error: any) {
        console.error("Error getting smart suggestions:", error);
        return null;
    }
}

/**
 * AI Feature #4: Citizen-Friendly Status Updates
 * Transforms technical audit logs into easy-to-understand messages.
 */
export interface FriendlyUpdate {
    emoji: string;
    message: string;
    estimated_next_action: string;
}

export async function transformAuditToFriendly(auditLog: AuditEntry[], currentStatus: string, department: string): Promise<FriendlyUpdate[]> {
    if (auditLog.length === 0) return [];

    const prompt = `
    You are helping citizens understand the progress of their reported issue.
    
    Transform these technical audit log entries into friendly, encouraging messages.
    
    **Issue Status:** ${currentStatus}
    **Department:** ${department}
    
    **Audit Log:**
    ${auditLog.map(e => `- ${e.action} by ${e.author} at ${e.timestamp}${e.details ? ` (${e.details})` : ''}`).join('\n')}
    
    For each log entry, provide:
    - emoji: A single emoji representing the action
    - message: Friendly 1-2 sentence explanation of what happened
    - estimated_next_action: What citizen can expect next
    
    Return a JSON array of objects with these fields.
    `;

    try {
        const response = await getGenAI().models.generateContent({
            model: getCurrentModel(),
            contents: prompt,
        });

        const result = JSON.parse(response.text);
        return Array.isArray(result) ? result : [result];
    } catch (error: any) {
        console.error("Error transforming audit log:", error);
        return [];
    }
}

// ============================================
// SIMULATION ANALYSIS (What-If Scenarios)
// ============================================

export interface SimulationAnalysis {
    summary: string;
    overall_impact: 'low' | 'medium' | 'high' | 'critical';
    affected_departments: Array<{
        name: string;
        impact_percentage: number;
        reason: string;
    }>;
    affected_infrastructure: string[];
    estimated_resolution_time: string;
    recommended_actions: string[];
}

/**
 * AI Feature: Scenario Simulation Analysis
 * Admin inputs a hypothetical scenario, AI predicts impact on city infrastructure.
 */
export async function analyzeSimulationScenario(
    scenario: string,
    currentIssues: Array<{ department: string; status: string; severity_score: number }>
): Promise<SimulationAnalysis> {

    // Build context about current city state
    const deptStats = DEPARTMENTS.reduce((acc, dept) => {
        const issues = currentIssues.filter(i => i.department === dept && i.status !== 'resolved' && i.status !== 'closed');
        acc[dept] = {
            activeIssues: issues.length,
            avgSeverity: issues.length > 0 ? Math.round(issues.reduce((s, i) => s + i.severity_score, 0) / issues.length) : 0,
        };
        return acc;
    }, {} as Record<string, { activeIssues: number; avgSeverity: number }>);

    const prompt = `
You are an AI urban planning analyst for Hyderabad, India. Analyze this what-if scenario and predict its impact on city infrastructure and municipal departments.

**Hypothetical Scenario:**
"${scenario}"

**Current City State:**
${Object.entries(deptStats).map(([dept, stats]) => `- ${dept}: ${stats.activeIssues} active issues (avg severity: ${stats.avgSeverity})`).join('\n')}

**Your Analysis Must Include:**
1. summary: 2-3 sentence overview of expected impact
2. overall_impact: Rate as "low", "medium", "high", or "critical"
3. affected_departments: List departments with:
   - name: Department name (short form)
   - impact_percentage: Expected % increase in workload (0-200)
   - reason: Brief explanation
4. affected_infrastructure: List 3-5 specific infrastructure items affected (roads, pipes, power lines, etc.)
5. estimated_resolution_time: E.g., "2-4 hours", "1-2 days", "1 week"
6. recommended_actions: 3-4 specific mitigation actions

Return valid JSON only.
    `;

    try {
        const response = await getGenAI().models.generateContent({
            model: getCurrentModel(),
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        overall_impact: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
                        affected_departments: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    impact_percentage: { type: Type.INTEGER },
                                    reason: { type: Type.STRING },
                                },
                                required: ["name", "impact_percentage", "reason"],
                            },
                        },
                        affected_infrastructure: { type: Type.ARRAY, items: { type: Type.STRING } },
                        estimated_resolution_time: { type: Type.STRING },
                        recommended_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ["summary", "overall_impact", "affected_departments", "affected_infrastructure", "estimated_resolution_time", "recommended_actions"],
                },
            },
        });

        return JSON.parse(response.text) as SimulationAnalysis;
    } catch (error: any) {
        console.error("Error analyzing simulation scenario:", error);
        throw new Error(`Simulation analysis failed: ${error.message || 'Could not connect to AI.'}`);
    }
}