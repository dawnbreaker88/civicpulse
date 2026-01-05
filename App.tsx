import React, { useState, useMemo, FC, useEffect } from 'react';

// Import Components
import { Header } from './components/Header';
import { PublicView } from './components/PublicView';
import { AdminView } from './components/AdminView';
import { ReportModal } from './components/ReportModal';
import { IssueDetailModal } from './components/IssueDetailModal';
import { Ticker } from './components/Ticker';
import { FloatingAIChat } from './components/FloatingAIChat';

// Import Data, Types, and Helpers
import { mockTickerMessages, seedIssues, mockReporters } from './data/mockData';
import type { Issue, Role, Comment, Reporter, AuditEntry, Theme } from './lib/types';
import { processNewIssue } from './lib/gemini';

const App: FC = () => {
  const [issues, setIssues] = useState<Issue[]>(seedIssues);
  const [reporters, setReporters] = useState<Reporter[]>(mockReporters);
  const [role, setRole] = useState<Role>('public');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [theme, setTheme] = useState<Theme>('light');
  const [error, setError] = useState<string | null>(null);
  const [tickerMessages, setTickerMessages] = useState(mockTickerMessages);
  const [aiTrendInsight, setAiTrendInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Used for submission spinner

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const stats = useMemo(() => {
    return issues.reduce((acc, issue) => {
      if (issue.status !== 'resolved' && issue.status !== 'closed') acc.unresolvedCount++;
      else acc.resolvedCount++;
      return acc;
    }, { unresolvedCount: 0, resolvedCount: 0 });
  }, [issues]);

  const updateIssueAndLog = (issueId: string, updates: Partial<Issue>, logAction: string, logDetails?: string) => {
    const newAuditEntry: AuditEntry = {
      timestamp: new Date().toISOString(),
      author: 'admin_user', // In a real app, this would be the logged-in user
      action: logAction,
      details: logDetails
    };

    const updateWithLog = (issue: Issue): Issue => {
      return {
        ...issue,
        ...updates,
        audit_log: [newAuditEntry, ...(issue.audit_log || [])]
      };
    };

    setIssues(prev => prev.map(issue =>
      issue.id === issueId ? updateWithLog(issue) : issue
    ));

    setSelectedIssue(prev => prev && prev.id === issueId ? updateWithLog(prev) : prev);
  };

  const addIssue = async (issueData: Partial<Issue>) => {
    setError(null);
    setIsLoading(true);
    try {
      // FIX: Destructure location and priority and add them to the guard clause.
      // This ensures they are present before creating the new issue.
      const { title, description, location, priority } = issueData;
      if (!title || !description || !location || !priority) {
        throw new Error("Title, description, location, and priority are required.");
      }

      // Call the client-side Gemini function to process the issue
      const aiAnalysis = await processNewIssue(title, description);

      const now = new Date();
      const newIssue: Issue = {
        id: `incident-hyd-${Date.now()}`,
        reporterId: 'rep-006', // Default to anonymous
        created_at: now.toISOString(),
        ...issueData, // User-provided data (e.g., attachments, description)
        // FIX: Explicitly set `title`, `location`, and `priority` to satisfy the `Issue` type.
        // Spreading `issueData` of type `Partial<Issue>` makes TypeScript consider these properties optional,
        // even though the guard clause above ensures they exist, resolving the type error.
        title: title,
        location: location,
        priority: priority,
        ...aiAnalysis, // AI-generated data (summary, severity, department, etc.)
        status: 'open',
        corroborations: 1,
        comments: [],
        internal_notes: [],
        source: 'Web Form',
        audit_log: [{
          timestamp: now.toISOString(),
          author: 'Anonymous',
          action: 'Issue Created'
        }],
        pipeline_stage_log: [
          { stage: 'Sentinel', timestamp: new Date(now.getTime()).toISOString(), details: 'Data collected from Web Form.' },
          { stage: 'Insight', timestamp: new Date(now.getTime() + 200).toISOString(), details: 'AI analysis completed.' },
          { stage: 'Aegis', timestamp: new Date(now.getTime() + 400).toISOString(), details: 'Ticket created and routed.' },
        ],
      };

      // Add the new issue to the top of the list
      setIssues(prev => [newIssue, ...prev]);

      // Update reporter points
      setReporters(prev => prev.map(r =>
        r.id === newIssue.reporterId ? { ...r, points: r.points + 10 } : r
      ));

    } catch (err: any) {
      console.error("Error submitting new issue:", err);
      setError(`Failed to submit issue: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addComment = (issueId: string, text: string) => {
    const newComment: Comment = {
      author: 'admin_user',
      text,
      created_at: new Date().toISOString()
    };
    const currentIssue = issues.find(i => i.id === issueId);
    if (!currentIssue) return;

    const updatedComments = [...(currentIssue.comments || []), newComment];
    updateIssueAndLog(issueId, { comments: updatedComments }, "Public Comment Added", `"${text}"`);
  };

  const addInternalNote = (issueId: string, text: string) => {
    const newNote: Comment = {
      author: 'admin_user',
      text,
      created_at: new Date().toISOString()
    };
    const currentIssue = issues.find(i => i.id === issueId);
    if (!currentIssue) return;

    const updatedNotes = [...(currentIssue.internal_notes || []), newNote];
    updateIssueAndLog(issueId, { internal_notes: updatedNotes }, "Internal Note Added");
  };

  const renderMainContent = () => {
    if (error) {
      return <div className="system-alert" style={{ borderLeftColor: 'var(--error)' }}><div className="system-alert-icon" style={{ color: 'var(--error)' }}>🚨</div><div className="system-alert-message"><strong>Error:</strong> <span>{error}</span></div></div>;
    }
    if (role === 'public') {
      return <PublicView issues={issues} reporters={reporters} onSelectIssue={setSelectedIssue} theme={theme} />;
    }
    return <AdminView issues={issues} onUpdateIssue={updateIssueAndLog} onSelectIssue={setSelectedIssue} theme={theme} systemInsight={aiTrendInsight} />;
  }

  return (
    <>
      <Ticker messages={tickerMessages} />
      <Header
        unresolvedCount={stats.unresolvedCount}
        resolvedCount={stats.resolvedCount}
        role={role}
        setRole={setRole}
        onReportClick={() => setIsReportModalOpen(true)}
        theme={theme}
        setTheme={setTheme}
      />
      <main className="app-container main-content">
        {renderMainContent()}
      </main>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onAddIssue={addIssue}
        issues={issues}
        onSelectIssue={setSelectedIssue}
      />
      <IssueDetailModal
        issue={selectedIssue}
        reporters={reporters}
        role={role}
        onClose={() => setSelectedIssue(null)}
        onAddComment={addComment}
        onAddInternalNote={addInternalNote}
        onUpdateIssue={updateIssueAndLog}
      />
      {role === 'public' && (
        <FloatingAIChat
          issueCount={stats.unresolvedCount}
          resolvedCount={stats.resolvedCount}
        />
      )}
    </>
  );
};

export default App;
