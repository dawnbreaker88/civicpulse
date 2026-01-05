import React, { useState, FC, useMemo, useEffect } from 'react';
import type { Issue, Role, Reporter, IssueStatus, Priority } from '../lib/types';
import { getSeverity, formatDate, PipelineDisplay } from '../lib/helpers';
import { summarizeAuditLogForPublic, summarizeIssueForAdmin } from '../lib/gemini';
import { VisualAuditLog } from './VisualAuditLog';


export const IssueDetailModal: FC<{
    issue: Issue | null;
    reporters: Reporter[];
    role: Role;
    onClose: () => void;
    onAddComment: (issueId: string, text: string) => void;
    onAddInternalNote: (issueId: string, text: string) => void;
    onUpdateIssue: (issueId: string, updates: Partial<Issue>, logAction: string, logDetails?: string) => void;
}> = ({ issue, reporters, role, onClose, onAddComment, onAddInternalNote, onUpdateIssue }) => {
    const [commentText, setCommentText] = useState('');
    const [internalNoteText, setInternalNoteText] = useState('');
    const [publicProgressSummary, setPublicProgressSummary] = useState('');
    const [isGeneratingPublicSummary, setIsGeneratingPublicSummary] = useState(false);
    const [adminSummary, setAdminSummary] = useState('');
    const [isGeneratingAdminSummary, setIsGeneratingAdminSummary] = useState(false);


    useEffect(() => {
        // When a new issue is selected for the modal
        if (issue && role === 'public' && issue.audit_log.length > 1) {
            setIsGeneratingPublicSummary(true);
            summarizeAuditLogForPublic(issue.audit_log)
                .then(summary => setPublicProgressSummary(summary))
                .finally(() => setIsGeneratingPublicSummary(false));
        } else {
            setPublicProgressSummary('');
        }
        // Reset admin summary when issue changes
        setAdminSummary('');
    }, [issue, role]);


    const reporter = useMemo(() => {
        return reporters.find(r => r.id === issue?.reporterId);
    }, [issue, reporters]);

    if (!issue) return null;
    const severity = getSeverity(issue.severity_score);

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (commentText.trim()) {
            onAddComment(issue.id, commentText.trim());
            setCommentText('');
        }
    };

    const handleInternalNoteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (internalNoteText.trim()) {
            onAddInternalNote(issue.id, internalNoteText.trim());
            setInternalNoteText('');
        }
    };

    const handleFieldChange = (field: 'status' | 'priority' | 'assignee', value: string) => {
        const oldValue = issue[field] || '';
        if (oldValue !== value) {
            onUpdateIssue(issue.id, { [field]: value }, `Field Updated: ${field}`, `'${oldValue}' → '${value}'`);
        }
    };

    const handleGenerateAdminSummary = async () => {
        setIsGeneratingAdminSummary(true);
        try {
            const summary = await summarizeIssueForAdmin(issue);
            setAdminSummary(summary);
        } catch (error) {
            console.error("Failed to generate admin summary:", error);
            setAdminSummary("Could not generate summary at this time.");
        } finally {
            setIsGeneratingAdminSummary(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                <div className="modal-header">
                    <h2 className="detail-modal-title">{issue.title}</h2>
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="detail-modal-meta">
                    <span className="severity-pill" style={{ backgroundColor: severity.color }}>{severity.level} Severity ({issue.severity_score})</span>
                    <span className="department-tag">{issue.department}</span>
                    <span>📍 {issue.location.neighborhood}</span>
                    <span>👤 Reported by {reporter?.name || 'Unknown'}</span>
                </div>

                {issue.attachments && issue.attachments.length > 0 && (
                    <div className="detail-modal-section">
                        <h3>Attachments</h3>
                        <div className="issue-attachment-container">
                            <img src={issue.attachments[0].data} alt="Issue evidence" />
                        </div>
                    </div>
                )}

                <div className="detail-modal-section">
                    <h3>AI Summary</h3>
                    <p className="ai-summary" style={{ margin: 0 }}>{issue.ai_summary}</p>
                </div>

                {role === 'public' && publicProgressSummary && (
                    <div className="detail-modal-section">
                        <h3>Progress Update</h3>
                        <div className="ai-summary-box">
                            {isGeneratingPublicSummary ? <div className="spinner"></div> : publicProgressSummary}
                        </div>
                    </div>
                )}

                <div className="detail-modal-section">
                    <h3>Processing Pipeline</h3>
                    <PipelineDisplay log={issue.pipeline_stage_log} />
                </div>

                {role === 'admin' && (
                    <div className="detail-modal-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Ticket Management</h3>
                            <button className="button button-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={handleGenerateAdminSummary} disabled={isGeneratingAdminSummary}>
                                {isGeneratingAdminSummary ? <><div className="spinner" style={{ width: '12px', height: '12px', marginRight: '8px' }}></div>Summarizing...</> : 'Summarize with AI'}
                            </button>
                        </div>
                        {adminSummary && (
                            <div className="ai-summary-box" style={{ margin: '12px 0' }} dangerouslySetInnerHTML={{ __html: adminSummary.replace(/\n/g, '<br />') }}></div>
                        )}
                        <div className="admin-edit-grid">
                            <div className="form-group">
                                <label>Status</label>
                                <select value={issue.status} onChange={e => handleFieldChange('status', e.target.value as IssueStatus)}>
                                    <option value="open">Open</option>
                                    <option value="assigned">Assigned</option>
                                    <option value="in progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Priority</label>
                                <select value={issue.priority} onChange={e => handleFieldChange('priority', e.target.value as Priority)}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Assignee</label>
                                <input
                                    type="text"
                                    defaultValue={issue.assignee || ''}
                                    onBlur={e => handleFieldChange('assignee', e.target.value)}
                                    placeholder="Unassigned"
                                />
                            </div>
                            <div className="form-group">
                                <label>Tags (comma-separated)</label>
                                <input
                                    type="text"
                                    defaultValue={issue.tags?.join(', ') || ''}
                                    onBlur={e => {
                                        const oldTags = issue.tags?.join(', ') || '';
                                        const newTagsValue = e.target.value;
                                        if (oldTags === newTagsValue) return;

                                        const newTagsArray = newTagsValue.split(',').map(t => t.trim()).filter(Boolean);
                                        onUpdateIssue(issue.id, { tags: newTagsArray }, 'Field Updated: tags', `'${oldTags}' → '${newTagsValue}'`);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                        <div className="detail-modal-section">
                            <h3>Public Comments ({issue.comments?.length || 0})</h3>
                            <div className="comments-list">
                                {issue.comments && issue.comments.length > 0 ? issue.comments.map((comment, index) => (
                                    <div key={index} className="comment">
                                        <div className="comment-author">{comment.author}</div>
                                        <p className="comment-text">{comment.text}</p>
                                        <div className="comment-date">{formatDate(comment.created_at)}</div>
                                    </div>
                                )) : <p>No comments yet.</p>}
                            </div>
                            {role === 'admin' && (
                                <form onSubmit={handleCommentSubmit} style={{ marginTop: '16px' }}>
                                    <div className="form-group">
                                        <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a public comment..." required />
                                    </div>
                                    <div className="modal-actions" style={{ marginTop: 0, justifyContent: 'flex-start' }}><button type="submit" className="button button-primary">Post Comment</button></div>
                                </form>
                            )}
                        </div>

                        {role === 'admin' && (
                            <div className="detail-modal-section">
                                <h3>Internal Admin Notes ({issue.internal_notes?.length || 0})</h3>
                                <div className="comments-list internal-notes-list">
                                    {issue.internal_notes && issue.internal_notes.length > 0 ? issue.internal_notes.map((note, index) => (
                                        <div key={index} className="comment">
                                            <div className="comment-author">{note.author}</div>
                                            <p className="comment-text">{note.text}</p>
                                            <div className="comment-date">{formatDate(note.created_at)}</div>
                                        </div>
                                    )) : <p>No internal notes yet.</p>}
                                </div>
                                <form onSubmit={handleInternalNoteSubmit} style={{ marginTop: '16px' }}>
                                    <div className="form-group">
                                        <textarea value={internalNoteText} onChange={(e) => setInternalNoteText(e.target.value)} placeholder="Add a private note for admins..." required />
                                    </div>
                                    <div className="modal-actions" style={{ marginTop: 0, justifyContent: 'flex-start' }}><button type="submit" className="button button-secondary">Post Internal Note</button></div>
                                </form>
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="detail-modal-section">
                            <h3>Issue History</h3>
                            <VisualAuditLog log={issue.audit_log} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
