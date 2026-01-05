import React, { FC } from 'react';
import type { Issue } from '../lib/types';

interface IssueCardProps {
    issue: Issue;
    onSelect: (issue: Issue) => void;
}

export const IssueCard: FC<IssueCardProps> = ({ issue, onSelect }) => {
    return (
        <div className={`issue-card priority-${issue.priority || 'medium'}`} onClick={() => onSelect(issue)}>
            {/* Glowing Border Element */}
            <div className="card-glow"></div>

            <div className="card-content">
                <div className="card-header-row">
                    <div className="priority-badge-container">
                        <span className={`priority-badge priority-${issue.priority || 'medium'}`}>
                            {issue.priority || 'Medium'}
                        </span>
                        {issue.status === 'open' && (
                            <span className="new-badge">NEW</span>
                        )}
                    </div>

                    <span className={`status-badge status-${issue.status.replace(' ', '-')}`}>
                        {issue.status}
                    </span>
                </div>

                <h3 className="issue-title ellipsis">{issue.title}</h3>

                <div className="issue-summary ellipsis-multiline">
                    {/* Vertical line decoration */}
                    <div className="summary-line"></div>
                    <p>{issue.ai_summary || issue.description || "No description provided."}</p>
                </div>

                <div className="card-meta-row">
                    <span className="dept-badge">{issue.department.split('–')[0].trim()}</span>
                    <span className="meta-text">
                        <span className="icon">📍</span> {issue.location.neighborhood}
                    </span>
                    <span className="meta-text">
                        {new Date(issue.created_at).toLocaleDateString()}
                    </span>
                </div>

                <div className="card-footer-row">
                    <div className="reporter-info">
                        <span className="icon">👤</span>
                        Citizen #{issue.reporterId?.slice(0, 4) || '001'}
                    </div>
                    <div className="corroboration-info">
                        <span className="icon">O+</span> {issue.corroborations || 0}
                    </div>
                </div>
            </div>
        </div>
    );
};
