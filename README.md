# Civic Pulse - Hyderabad

Civic Pulse is a modern, AI-driven dashboard for monitoring, managing, and analyzing civic issues in Hyderabad. It provides a comprehensive interface for both the public to report and view issues and for administrators to triage, manage, and derive insights from the data.

## ✨ Features

- **Dual-Role Interface:** Separate views for the Public (issue feed, map, analytics) and Admin (management table, Kanban board, advanced analytics).
- **Interactive Map View:** Uses Leaflet to visualize the geographic distribution of issues with severity-based markers.
- **AI-Powered Frontend:** All Gemini API calls are made directly from the browser, powered by a local environment file for your API key.
- **Advanced Admin Tools:** Features a Kanban board for workflow visualization, bulk actions for efficient management, and a detailed issue management table.
- **Gamification & Engagement:** A public leaderboard encourages citizen participation by awarding points for reporting issues.
- **Predictive Simulation:** A "what-if" scenario simulator to predict the impact of events on department workload.
- **Light & Dark Themes:** A sleek, modern UI with toggleable light and dark modes for user comfort.

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite
- **AI:** Google Gemini API (@google/genai)
- **Mapping:** Leaflet & React-Leaflet
- **Charting:** Recharts
- **Styling:** CSS with variables for theming

---

## 🚀 Getting Started Locally

This project uses Vite for a fast and simple local development experience. No separate backend server is needed.

### Prerequisites

You need to have [Node.js](https://nodejs.org/) (which includes npm) installed on your computer. You will also need a Google Gemini API key.

### 1. Set Up Your Environment

1.  **Find the environment file:**
    In the root of the project, you will find a file named `.env`.

2.  **Add your API Key:**
    Open the `.env` file and replace `"YOUR_GEMINI_API_KEY_HERE"` with your actual Gemini API key. It should look like this:
    ```
    VITE_GEMINI_API_KEY="AIzaSy...your...key...here"
    ```
    Vite will automatically make this key available to the application in a secure way during development.

### 2. Install Dependencies

Open a terminal in the project's root directory and run the following command to install all necessary packages:
```sh
npm install
```

### 3. Run the Development Server

Start the Vite development server with a single command:
```sh
npm run dev
```

The terminal will give you a URL (e.g., `http://localhost:5173`). Open this URL in your web browser to use the application. Any changes you make to the code will be updated live in the browser.
