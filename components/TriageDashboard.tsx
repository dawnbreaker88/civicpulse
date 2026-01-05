import React, { FC, useMemo } from 'react';
import type { Issue } from '../lib/types';
import { getSeverity, timeAgo } from '../lib/helpers';

const TriageCard: FC<{issue: Issue, onSelect: (issue: Issue) => void}> = ({ issue, onSelect }) => {
    const severity = getSeverity(issue.severity_score);
    return (
        <div className="triage-card" onClick={() => onSelect(issue)}>
            <h4 className="triage-card-title">{issue.title}</h4>
            <div className="triage-card-meta">
                <span style={{color: severity.color, fontWeight: '600'}}>Severity: {issue.severity_score}</span>
                <span>{timeAgo(issue.created_at)}</span>
            </div>
            <div className="triage-card-meta" style={{marginTop: '8px'}}>
                <span>{issue.department}</span>
            </div>
        </div>
    )
}

export const TriageDashboard: FC<{ 
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
}> = ({ issues, onSelectIssue }) => {

    const triageCategories = useMemo(() => {
        const openIssues = issues.filter(i => i.status === 'open');
        const now = new Date().getTime();
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

        const highPriority = openIssues
            .filter(i => i.severity_score > 70 && (now - new Date(i.created_at).getTime() < TWENTY_FOUR_HOURS))
            .sort((a,b) => b.severity_score - a.severity_score);

        const needsAttention = openIssues
            .filter(i => (!i.comments || i.comments.length === 0) && (now - new Date(i.created_at).getTime() > TWENTY_FOUR_HOURS))
            .sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        const trending = openIssues
            .filter(i => i.corroborations > 10)
            .sort((a,b) => b.corroborations - a.corroborations);

        return { highPriority, needsAttention, trending };
    }, [issues]);

    return (
        <div className="triage-dashboard">
            <div className="triage-column">
                <h3 className="triage-column-header">High Priority <span title="New in last 24h & severity > 70">{triageCategories.highPriority.length}</span></h3>
                {triageCategories.highPriority.length > 0 ? (
                    triageCategories.highPriority.map(issue => <TriageCard key={issue.id} issue={issue} onSelect={onSelectIssue} />)
                ) : <p style={{fontSize: '14px', color: 'var(--muted)', padding: '0 8px'}}>No new high-severity issues.</p>}
            </div>
            <div className="triage-column">
                <h3 className="triage-column-header">Needs Attention <span title="Open > 24h with no admin comments">{triageCategories.needsAttention.length}</span></h3>
                 {triageCategories.needsAttention.length > 0 ? (
                    triageCategories.needsAttention.map(issue => <TriageCard key={issue.id} issue={issue} onSelect={onSelectIssue} />)
                ) : <p style={{fontSize: '14px', color: 'var(--muted)', padding: '0 8px'}}>All open issues have been acknowledged.</p>}
            </div>
            <div className="triage-column">
                <h3 className="triage-column-header">Trending Issues <span title="More than 10 corroborations">{triageCategories.trending.length}</span></h3>
                 {triageCategories.trending.length > 0 ? (
                    triageCategories.trending.map(issue => <TriageCard key={issue.id} issue={issue} onSelect={onSelectIssue} />)
                ) : <p style={{fontSize: '14px', color: 'var(--muted)', padding: '0 8px'}}>No issues with high community engagement right now.</p>}
            </div>
        </div>
    );
};