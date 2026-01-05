# Backend Integration Guide for Civic Pulse

This guide provides a roadmap for replacing the mock data in the frontend with a live backend API. This will transform the application from a static demo into a dynamic, data-driven platform.

## 1. Overview: From Mock Data to API Calls

Currently, all application data (issues, reporters) is loaded directly from `data/mockData.ts`. All state updates happen only in the browser.

The goal is to:
1.  **Fetch** initial data from a backend server when the app loads.
2.  **Send** updates (new issues, status changes, comments) to the server to be persisted in a database.
3.  **Update** the frontend's state based on the successful responses from the server.

We recommend using a Node.js framework like [Express](https://expressjs.com/) for its simplicity, but any backend technology can be used.

---

## 2. Required API Endpoints

Your backend should expose the following RESTful API endpoints.

| Method | Endpoint                       | Description                               | Request Body (Example)                                     | Success Response (Example)                                     |
| :----- | :----------------------------- | :---------------------------------------- | :--------------------------------------------------------- | :------------------------------------------------------------- |
| `GET`  | `/api/issues`                  | Fetches all civic issues.                 | -                                                          | `[ { issue_1 }, { issue_2 } ]`                                  |
| `GET`  | `/api/reporters`               | Fetches all reporters and their stats.    | -                                                          | `[ { reporter_1 }, { reporter_2 } ]`                            |
| `POST` | `/api/issues`                  | Creates a new issue.                      | `{ title, department, location, description, ... }`        | The newly created `{ issue }` object with its database ID.     |
| `PUT`  | `/api/issues/:id`              | Updates a specific issue.                 | `{ status: "resolved", assignee: "Admin X", ... }`         | The updated `{ issue }` object.                                |
| `POST` | `/api/issues/:id/comments`     | Adds a public comment to an issue.        | `{ author: "user_name", text: "This is a comment." }`      | The updated `{ issue }` object with the new comment included.  |
| `POST` | `/api/issues/:id/notes`        | Adds an internal note to an issue.        | `{ author: "admin_name", text: "Internal note." }`         | The updated `{ issue }` object with the new note included.     |

---

## 3. Frontend Modification Strategy

You will primarily be making changes in `App.tsx`, as it is the main state management hub.

### Step 1: Fetching Initial Data

In `App.tsx`, replace the `useState` initializations with a `useEffect` hook to fetch data on component mount.

**Current Code:**
```tsx
import { seedIssues, mockReporters } from './data/mockData';

// ...
const [issues, setIssues] = useState<Issue[]>(seedIssues);
const [reporters, setReporters] = useState<Reporter[]>(mockReporters);
// ...
```

**New Code:**
```tsx
// ...
const [issues, setIssues] = useState<Issue[]>([]);
const [reporters, setReporters] = useState<Reporter[]>([]);
const [isLoading, setIsLoading] = useState(true); // Add a loading state

useEffect(() => {
  const fetchData = async () => {
    try {
      const issuesResponse = await fetch('/api/issues');
      const issuesData = await issuesResponse.json();
      setIssues(issuesData);

      const reportersResponse = await fetch('/api/reporters');
      const reportersData = await reportersResponse.json();
      setReporters(reportersData);

    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, []); // Empty dependency array means this runs once on mount

// You can now use the `isLoading` state to show a loading spinner in your UI.
```

### Step 2: Modifying Data Mutation Functions

Update the functions that change data (`addIssue`, `updateIssueAndLog`, etc.) to send requests to your backend.

#### Example: `addIssue` function

**Current Code:**
```tsx
const addIssue = (newIssue: Issue) => {
  setIssues(prev => [newIssue, ...prev]);
  // ... reporter points logic
};
```

**New Code:**
```tsx
const addIssue = async (issueData: Omit<Issue, 'id' | 'created_at' | '...'>) => {
  try {
    const response = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issueData),
    });

    if (!response.ok) {
      throw new Error('Failed to create issue');
    }

    const newIssueFromServer = await response.json(); // Get the final issue object from server
    setIssues(prev => [newIssueFromServer, ...prev]);

    // Optionally, re-fetch reporters or have the server send back updated reporter info
    // ...

  } catch (error) {
    console.error("Error adding issue:", error);
    // You could show an error message to the user here
  }
};
```
> **Note:** You will need to update the `ReportModal.tsx` component to pass a simplified data object to this new `addIssue` function, as the server will now be responsible for generating IDs, timestamps, AI summaries, etc.

You will apply the same pattern to `updateIssueAndLog`, `addComment`, and `addInternalNote`, changing them to `async` functions that `await` a `fetch` call using `PUT` or `POST` methods.

---

## 4. Simple Backend Example (Node.js + Express)

Here is a barebones Express server to get you started.

**`server.js`**
```javascript
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors()); // Allows requests from your frontend
app.use(express.json()); // Parses incoming JSON bodies

// --- In-Memory Database (Replace with a real database like MongoDB or PostgreSQL) ---
let issues = [/* Your mock issue data */];
let reporters = [/* Your mock reporter data */];

// --- API Routes ---

// GET /api/issues
app.get('/api/issues', (req, res) => {
  res.json(issues);
});

// GET /api/reporters
app.get('/api/reporters', (req, res) => {
  res.json(reporters);
});

// POST /api/issues
app.post('/api/issues', (req, res) => {
  const newIssueData = req.body;

  // In a real app, you would call your Gemini API functions here!
  // See GEMINI_API_GUIDE.md for examples.
  const newIssue = {
    id: `incident-hyd-${Date.now()}`,
    created_at: new Date().toISOString(),
    // AI-generated fields would go here:
    ai_summary: newIssueData.description, // Placeholder
    severity_score: 50, // Placeholder
    sentiment: 'neutral', // Placeholder
    // Spread the rest of the data from the request
    ...newIssueData,
    // Default fields
    status: 'open',
    corroborations: 1,
    source: 'Web Form',
    audit_log: [{ /* ... */ }],
    pipeline_stage_log: [{ /* ... */ }],
  };

  issues.unshift(newIssue); // Add to the start of the array
  res.status(201).json(newIssue);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

To run this server:
1.  `npm install express cors`
2.  `node server.js`
3.  Update your frontend `fetch` calls to `http://localhost:3001/api/...`
