/**
 * AI Configuration for Civic Pulse
 * 
 * This file provides easy configuration for switching between different AI models.
 * You can change the API key and model here without modifying the core code.
 * 
 * SUPPORTED PROVIDERS:
 * - Google Gemini (default)
 * - Future: OpenAI, Anthropic, etc.
 */

// ============================================
// MODEL CONFIGURATION
// ============================================

export type AIProvider = 'gemini' | 'openai' | 'anthropic';

export interface AIModelConfig {
    provider: AIProvider;
    modelName: string;
    apiKey: string | null;
    maxTokens?: number;
    temperature?: number;
}

// Default configuration - uses Gemini
export const AI_CONFIG: AIModelConfig = {
    provider: 'gemini',
    modelName: 'gemini-2.5-flash-lite', // Options: 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'
    apiKey: null, // Will be loaded from environment
    maxTokens: 2048,
    temperature: 0.7,
};

// ============================================
// API KEY MANAGEMENT
// ============================================

/**
 * Get the API key from various sources in order of priority:
 * 1. Direct configuration (AI_CONFIG.apiKey)
 * 2. LocalStorage (for runtime key updates)
 * 3. Environment variable (for Vite/Node environments)
 */
export function getApiKey(): string | null {
    // Priority 1: Direct configuration
    if (AI_CONFIG.apiKey) {
        return AI_CONFIG.apiKey;
    }

    // Priority 2: LocalStorage (allows runtime updates)
    if (typeof window !== 'undefined' && window.localStorage) {
        const storedKey = localStorage.getItem('civic_pulse_api_key');
        if (storedKey) {
            return storedKey;
        }
    }

    // Priority 3: Try to get from Vite env (using try-catch to avoid TS errors)
    try {
        // @ts-ignore - Vite injects this at build time
        const viteKey = import.meta.env?.VITE_GEMINI_API_KEY;
        if (viteKey) return viteKey;
    } catch {
        // Not in Vite environment
    }

    return null;
}

/**
 * Set API key at runtime (stored in localStorage)
 */
export function setApiKey(key: string): void {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('civic_pulse_api_key', key);
    }
    AI_CONFIG.apiKey = key;
}

/**
 * Clear stored API key
 */
export function clearApiKey(): void {
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('civic_pulse_api_key');
    }
    AI_CONFIG.apiKey = null;
}

/**
 * Check if API key is configured
 */
export function hasApiKey(): boolean {
    return getApiKey() !== null;
}

// ============================================
// MODEL SELECTION
// ============================================

/**
 * Get the current model name
 */
export function getModelName(): string {
    return AI_CONFIG.modelName;
}

/**
 * Switch to a different model
 */
export function setModel(modelName: string): void {
    AI_CONFIG.modelName = modelName;
}

// ============================================
// AVAILABLE MODELS
// ============================================

export const AVAILABLE_MODELS = {
    gemini: [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast and efficient' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Previous gen fast model' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Most capable' },
    ],
    // Future providers can be added here
} as const;

// ============================================
// DEPARTMENT CONFIGURATION  
// ============================================

export const DEPARTMENTS = [
    "GHMC – Roads & Infrastructure",
    "GHMC – Sanitation & Solid Waste",
    "GHMC – Public Health",
    "HMWS&SB – Water Supply & Sewerage",
    "TSSPDCL – Electricity",
    "HMDA / Planning Authority",
    "R&B Dept – Major Roads & Buildings",
    "Traffic Police",
    "City Police",
    "Pollution Control Board",
    "Urban Forestry & Parks",
    "Disaster Response & Fire",
    "Revenue Department",
    "Municipal Schools"
] as const;

export type Department = typeof DEPARTMENTS[number];
