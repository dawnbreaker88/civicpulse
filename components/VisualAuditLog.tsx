import React, { FC } from 'react';
import type { AuditEntry } from '../lib/types';
import { timeAgo } from '../lib/helpers';

// A map of simple SVG icons for different actions
const ICONS: Record<string, JSX.Element> = {
    'create': (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm.75-10.25a.75.75 0 0 0-1.5 0v4.5a.75.75 0 0 0 1.5 0v-4.5Z" clipRule="evenodd" />
        </svg>
    ),
    'update': (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16Zm.97-12.22a.75.75 0 0 1 1.06 0l.97.97a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0l-2.25-2.25a.75.75 0 0 1 1.06-1.06l1.72 1.72 3.72-3.72Z" clipRule="evenodd" />
        </svg>
    ),
    'comment': (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M1 2.75A1.75 1.75 0 0 1 2.75 1h10.5A1.75 1.75 0 0 1 15 2.75v5.5A1.75 1.75 0 0 1 13.25 10H9.11l-2.28 2.03a.5.5 0 0 1-.82-.34v-1.44H2.75A1.75 1.75 0 0 1 1 8.25v-5.5ZM2.75 2.5a.25.25 0 0 0-.25.25v5.5c0 .138.112.25.25.25h1.5a.75.75 0 0 1 .75.75v1.19l1.72-1.53a.75.75 0 0 1 .53-.21h6a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25H2.75Z" clipRule="evenodd" />
        </svg>
    ),
};

const getActionType = (action: string): 'create' | 'update' | 'comment' => {
    const lowerCaseAction = action.toLowerCase();
    if (lowerCaseAction.includes('created')) return 'create';
    if (lowerCaseAction.includes('comment') || lowerCaseAction.includes('note')) return 'comment';
    return 'update'; // Default for status changes, assignments, etc.
}

export const VisualAuditLog: FC<{ log: AuditEntry[] }> = ({ log }) => {
    return (
        <div className="visual-audit-log-container">
            {log.map((entry, index) => {
                const actionType = getActionType(entry.action);
                return (
                    <div key={index} className={`log-item type-${actionType}`}>
                        <div className="log-icon-wrapper">
                            {ICONS[actionType]}
                        </div>
                        <div className="log-content">
                            <div className="log-header">
                                <strong>{entry.author}</strong> {entry.action} <span>({timeAgo(entry.timestamp)})</span>
                            </div>
                            {entry.details && (
                                <div className="log-details">{entry.details}</div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};