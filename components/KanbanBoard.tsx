import React, { FC, useMemo } from 'react';
import type { Issue, IssueStatus } from '../lib/types';
import { timeAgo, getSeverity } from '../lib/helpers';

const STATUS_COLUMNS: IssueStatus[] = ['open', 'assigned', 'in progress', 'resolved', 'closed'];

// Color coding for column headers
const statusColors: Record<IssueStatus, string> = {
    'open': 'var(--warning)',
    'assigned': 'var(--info)',
    'in progress': 'var(--accent-primary)',
    'resolved': 'var(--success)',
    'closed': 'var(--text-tertiary)',
};

const KanbanCard: FC<{ issue: Issue, onSelect: (issue: Issue) => void }> = ({ issue, onSelect }) => {
    const severity = getSeverity(issue.severity_score);

    // Severity border colors
    const borderColor = issue.severity_score >= 80 ? 'var(--severity-critical)' :
        issue.severity_score >= 60 ? 'var(--severity-high)' :
            issue.severity_score >= 40 ? 'var(--severity-medium)' : 'var(--severity-low)';

    return (
        <div
            className="kanban-card"
            onClick={() => onSelect(issue)}
            style={{ borderLeftColor: borderColor }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(issue)}
        >
            <div className="kanban-card-header">
                <span
                    className="kanban-severity-dot"
                    style={{ backgroundColor: severity.color }}
                    title={`${severity.level} Severity (${issue.severity_score})`}
                />
                <h4 className="kanban-card-title">{issue.title}</h4>
            </div>
            <div className="kanban-card-dept">{issue.department.split(' – ')[0]}</div>
            <div className="kanban-card-footer">
                <span className="kanban-card-location">
                    📍 {issue.location.neighborhood}
                </span>
                <span className="kanban-card-time">{timeAgo(issue.created_at)}</span>
            </div>
        </div>
    );
};

export const KanbanBoard: FC<{
    issues: Issue[];
    onSelectIssue: (issue: Issue) => void;
}> = ({ issues, onSelectIssue }) => {

    const issuesByStatus = useMemo(() => {
        const grouped: Record<IssueStatus, Issue[]> = {
            open: [], 'in progress': [], assigned: [], resolved: [], closed: []
        };
        issues.forEach(issue => {
            if (grouped[issue.status]) {
                grouped[issue.status].push(issue);
            }
        });
        return grouped;
    }, [issues]);

    return (
        <div className="kanban-board">
            {STATUS_COLUMNS.map(status => (
                <div key={status} className="kanban-column">
                    <div className="kanban-column-header">
                        <span
                            className="kanban-status-indicator"
                            style={{ backgroundColor: statusColors[status] }}
                        />
                        <span className="kanban-column-title">{status}</span>
                        <span className="kanban-column-count">{issuesByStatus[status].length}</span>
                    </div>
                    <div className="kanban-column-content">
                        {issuesByStatus[status]
                            .sort((a, b) => b.severity_score - a.severity_score) // Sort by severity
                            .map(issue => (
                                <KanbanCard key={issue.id} issue={issue} onSelect={onSelectIssue} />
                            ))
                        }
                        {issuesByStatus[status].length === 0 && (
                            <div className="kanban-empty">No issues</div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
