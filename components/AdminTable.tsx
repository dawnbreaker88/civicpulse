import React, { FC } from 'react';
import type { Issue, IssueStatus } from '../lib/types';
import { DEPARTMENTS } from '../lib/constants';
import { formatDate } from '../lib/helpers';

export const AdminTable: FC<{ 
  issues: Issue[];
  onUpdateIssue: (id: string, update: Partial<Issue>) => void;
  onSelectIssue: (issue: Issue) => void;
  selectedIssueIds: Set<string>;
  setSelectedIssueIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}> = ({ issues, onUpdateIssue, onSelectIssue, selectedIssueIds, setSelectedIssueIds }) => {
    
    const handleStatusChange = (id: string, newStatus: IssueStatus) => {
        const update: Partial<Issue> = { status: newStatus };
        if (newStatus === 'resolved') {
            update.resolved_at = new Date().toISOString();
        } else {
            update.resolved_at = null;
        }
        onUpdateIssue(id, update);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIssueIds(new Set(issues.map(i => i.id)));
        } else {
            setSelectedIssueIds(new Set());
        }
    };

    const handleSelectOne = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
        const newSet = new Set(selectedIssueIds);
        if (e.target.checked) {
            newSet.add(id);
        } else {
            newSet.delete(id);
        }
        setSelectedIssueIds(newSet);
    };

    return (
        <table className="admin-table">
            <thead>
                <tr>
                    <th>
                        <input 
                            type="checkbox"
                            checked={selectedIssueIds.size === issues.length && issues.length > 0}
                            onChange={handleSelectAll}
                            disabled={issues.length === 0}
                        />
                    </th>
                    <th>Title</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Severity</th>
                    <th>Created At</th>
                </tr>
            </thead>
            <tbody>
                {issues.map(issue => (
                    <tr key={issue.id} onClick={() => onSelectIssue(issue)} style={{cursor: 'pointer'}} className={selectedIssueIds.has(issue.id) ? 'selected-row' : ''}>
                        <td onClick={e => e.stopPropagation()}>
                             <input 
                                type="checkbox"
                                checked={selectedIssueIds.has(issue.id)}
                                onChange={(e) => handleSelectOne(e, issue.id)}
                            />
                        </td>
                        <td>{issue.title}</td>
                        <td onClick={e => e.stopPropagation()}>
                            <select value={issue.department} onChange={(e) => onUpdateIssue(issue.id, { department: e.target.value })}>
                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                            <select value={issue.status} onChange={(e) => handleStatusChange(issue.id, e.target.value as IssueStatus)}>
                                <option value="open">Open</option>
                                <option value="resolved">Resolved</option>
                            </select>
                        </td>
                        <td>{issue.severity_score}</td>
                        <td>{formatDate(issue.created_at)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};