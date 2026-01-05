// New IssueStatus with full lifecycle
export type IssueStatus = 'open' | 'assigned' | 'in progress' | 'resolved' | 'closed';
export type Sentiment = 'positive' | 'neutral' | 'negative';
export type Role = 'public' | 'admin';
export type Source = 'Web Form' | 'Twitter' | 'Reddit' | 'News' | 'Internal';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Theme = 'light' | 'dark';

// New Reporter type for gamification
export interface Reporter {
    id: string;
    name: string;
    points: number;
    badge: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}

export interface Comment {
    author: string;
    text: string;
    created_at: string;
}

// New AuditEntry for Jira-style log
export interface AuditEntry {
    timestamp: string;
    author: string;
    action: string;
    details?: string;
}

// New Pipeline types
export type PipelineStageName = 'Sentinel' | 'Insight' | 'Aegis';

export interface PipelineStage {
    stage: PipelineStageName;
    timestamp: string;
    details?: string;
}

// New Attachment type for photos
export interface Attachment {
    type: 'image';
    data: string; // Base64 data URL
}

// New type for AI Image analysis suggestions
export interface AiImageAnalysis {
    suggested_title: string;
    suggested_description: string;
    suggested_department: string;
    suggested_priority: 'low' | 'medium' | 'high' | 'critical';
}

// Overhauled Issue type
export interface Issue {
    id: string;
    title: string;
    reporterId: string; // Link to reporter
    created_at: string;
    resolved_at?: string | null;
    location: { lat: number; lng: number; neighborhood: string };
    department: string;
    severity_score: number; // 0 - 100
    sentiment: Sentiment;
    // FIX: Added optional 'description' property to the Issue interface. This field holds the original
    // user-submitted text, which is used by the backend for AI analysis. Its absence caused a
    // TypeScript error in ReportModal.tsx when creating a new issue object.
    description?: string;
    ai_summary: string;
    status: IssueStatus; // Updated status
    corroborations: number;
    comments?: Comment[];
    internal_notes?: Comment[];
    source: Source;
    // New Jira-style fields
    priority: Priority;
    assignee?: string;
    tags?: string[];
    attachments?: Attachment[];
    pipeline_stage_log: PipelineStage[];
    audit_log: AuditEntry[];
}