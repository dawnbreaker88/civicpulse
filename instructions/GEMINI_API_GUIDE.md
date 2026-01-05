# Gemini API Integration Guide

This guide provides practical, copy-paste-ready Node.js examples for integrating the Google Gemini API into your backend. This will power the core AI features of the Civic Pulse application, replacing the mocked data with dynamic, intelligent analysis.

## 1. Setup

First, you need to add the official Google GenAI SDK to your backend project and configure your API key.

### Step 1: Install the SDK

In your backend project directory, run the following command:
```sh
npm install @google/genai
```

### Step 2: Configure Your API Key

Your Gemini API key is the secret credential that allows you to use the service. **Never expose this key in your frontend code.**

1.  Create a file named `.env` in the root of your backend project.
2.  Add your API key to this file:
    ```
    API_KEY="YOUR_GEMINI_API_KEY_HERE"
    ```
3.  Install the `dotenv` package to load this variable automatically: `npm install dotenv`
4.  Load the environment variables at the very top of your main server file (e.g., `server.js`):
    ```javascript
    import dotenv from 'dotenv';
    dotenv.config();
    ```

### Step 3: Initialize the Gemini Client

Create a dedicated file, for example `geminiService.js`, to house all your Gemini-related functions. Initialize the client at the top of this file.

**`geminiService.js`**
```javascript
import { GoogleGenAI, Type } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY is not set in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
```

---

## 2. Implementing Core AI Features

Here are the functions to generate the AI-driven data for each new issue reported.

### Function 1: Generating an AI Summary

This function takes the user's issue title and description and creates a concise, neutral summary.

```javascript
/**
 * Generates a concise summary for a civic issue.
 * @param {string} title - The title of the issue.
 * @param {string} description - The user-submitted description.
 * @returns {Promise<string>} A promise that resolves to the AI-generated summary.
 */
export async function generateAiSummary(title, description) {
  const prompt = `
    Create a concise, one-sentence summary for a civic issue report.
    The summary should be neutral and factual, suitable for a dashboard display.
    Do not add any preamble like "The summary is:".

    Issue Title: "${title}"
    Issue Description: "${description}"

    Summary:
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating AI summary:", error);
    // Fallback to the original description if Gemini fails
    return description;
  }
}
```

### Function 2: Analyzing Sentiment and Severity

This powerful function asks Gemini to analyze the text and return a structured JSON object containing the `sentiment` and a calculated `severity_score`. Using a defined `responseSchema` ensures the output is always in the correct format.

```javascript
/**
 * Analyzes an issue to determine its sentiment and severity.
 * @param {string} title - The title of the issue.
 * @param {string} description - The user-submitted description.
 * @returns {Promise<{sentiment: 'positive'|'neutral'|'negative', severity_score: number}>}
 */
export async function analyzeIssueSentimentAndSeverity(title, description) {
  const prompt = `
    Analyze the following civic issue report and provide its sentiment and severity score.
    - sentiment: Can be 'positive', 'neutral', or 'negative'. Positive is for good things like "new park opened".
    - severity_score: A number from 0 to 100, where 100 is most severe (e.g., "building collapse risk") and 0 is least severe (e.g., "thank you for the new park").

    Issue Title: "${title}"
    Issue Description: "${description}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: {
              type: Type.STRING,
              enum: ["positive", "neutral", "negative"],
            },
            severity_score: {
              type: Type.INTEGER,
              description: "A score from 0 to 100 representing the issue's severity.",
            },
          },
          required: ["sentiment", "severity_score"],
        },
      },
    });

    return JSON.parse(response.text);

  } catch (error) {
    console.error("Error analyzing issue sentiment/severity:", error);
    // Provide a fallback default value
    return { sentiment: 'neutral', severity_score: 50 };
  }
}
```

---

## 3. Integration into Your Backend

Now, you can use these functions in your `POST /api/issues` endpoint to process new issues as they arrive from the frontend.

**Updated `server.js` example:**

```javascript
import express from 'express';
// ... other imports

// Import your new Gemini functions
import { generateAiSummary, analyzeIssueSentimentAndSeverity } from './geminiService.js';

const app = express();
// ... other setup

// POST /api/issues
app.post('/api/issues', async (req, res) => {
  try {
    const { title, description, department, location, priority } = req.body;

    // 1. Call the Gemini API functions in parallel to get AI insights
    const [aiSummary, analysis] = await Promise.all([
      generateAiSummary(title, description),
      analyzeIssueSentimentAndSeverity(title, description),
    ]);

    // 2. Construct the full issue object with AI data
    const newIssue = {
      id: `incident-hyd-${Date.now()}`,
      created_at: new Date().toISOString(),
      title,
      description,
      department,
      location,
      priority,
      ai_summary: aiSummary, // Use the generated summary
      severity_score: analysis.severity_score, // Use the generated score
      sentiment: analysis.sentiment, // Use the generated sentiment
      status: 'open',
      corroborations: 1,
      source: 'Web Form',
      // ... other default fields like audit_log, etc.
    };
    
    // 3. Save the newIssue object to your database here
    // db.issues.save(newIssue);

    // 4. Send the complete object back to the frontend
    res.status(201).json(newIssue);

  } catch (error) {
    console.error("Failed to process new issue:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ... rest of your server code
```
