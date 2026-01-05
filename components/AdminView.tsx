import React, { FC, useState, useMemo, useEffect, FormEvent } from 'react';
import type { Issue, Theme } from '../lib/types';
import { FilterSidebar } from './FilterSidebar';
import { AdminTable } from './AdminTable';
import { AdminAnalyticsDashboard } from './AdminAnalyticsDashboard';
import { KanbanBoard } from './KanbanBoard'; // Import KanbanBoard
import { TriageDashboard } from './TriageDashboard';
import { DEPARTMENTS } from '../lib/constants';
import { CityBrainPulse } from './CityBrainPulse';
import { SystemAlert } from './SystemAlert';
import { SimulationModal } from './SimulationModal';
import { convertQueryToFilters } from '../lib/gemini';

type UpdateFn = (issueId: string, updates: Partial<Issue>, logAction: string, logDetails?: string) => void;

const AIQueryBar: FC<{ onQuery: (filters: any) => void }> = ({ onQuery }) => {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        try {
            const filters = await convertQueryToFilters(query);
            onQuery(filters);
        } catch (error) {
            console.error("AI Query failed:", error);
            // Optionally, show an error to the user
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className="ai-query-bar" onSubmit={handleSubmit}>
            <svg className="ai-query-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm-1.25 14.55a.75.75 0 0 1-1.06-1.06l1.22-1.22a2.5 2.5 0 0 1-3.41-3.41L6.28 9.64a.75.75 0 0 1 1.06-1.06l1.22 1.22a2.5 2.5 0 0 1 3.41 3.41Zm3.51-1.06a.75.75 0 0 1-1.06 1.06l-1.22-1.22a2.5 2.5 0 0 1 3.41-3.41l1.22-1.22a.75.75 0 0 1 1.06 1.06l-1.22 1.22a2.5 2.5 0 0 1-3.41 3.41Z" /></svg>
            <input
                type="text"
                className="ai-query-input"
                placeholder="AI-Powered Search: e.g., 'critical road issues from last week'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isLoading}
            />
            {isLoading && <div className="spinner" style={{ position: 'absolute', right: '12px', top: '12px' }}></div>}
        </form>
    );
};


export const AdminView: FC<{
    issues: Issue[];
    onUpdateIssue: UpdateFn;
    onSelectIssue: (issue: Issue) => void;
    theme: Theme;
    systemInsight: string | null;
}> = ({ issues: allIssues, onUpdateIssue, onSelectIssue, theme, systemInsight }) => {
    const [activeTab, setActiveTab] = useState<'board' | 'management' | 'analytics' | 'triage'>('board');
    const [filters, setFilters] = useState({ department: '', status: '', severity: 0, sentiment: '', startDate: '', endDate: '' });
    const [selectedIssueIds, setSelectedIssueIds] = useState<Set<string>>(new Set());
    const [isBrainPulseOpen, setIsBrainPulseOpen] = useState(false);
    const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);

    useEffect(() => {
        setSelectedIssueIds(new Set());
    }, [filters, activeTab]);

    const filteredIssues = useMemo(() => {
        return allIssues.filter(issue => {
            const issueDate = new Date(issue.created_at);
            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            const endDate = filters.endDate ? new Date(filters.endDate) : null;

            if (startDate) startDate.setHours(0, 0, 0, 0);
            if (endDate) endDate.setHours(23, 59, 59, 999);

            return (filters.department ? issue.department === filters.department : true) &&
                (filters.status ? issue.status === filters.status : true) &&
                (filters.sentiment ? issue.sentiment === filters.sentiment : true) &&
                (issue.severity_score >= Number(filters.severity)) &&
                (!startDate || issueDate >= startDate) &&
                (!endDate || issueDate <= endDate);
        });
    }, [allIssues, filters]);

    const handleBulkResolve = () => {
        selectedIssueIds.forEach(id => {
            const issue = allIssues.find(i => i.id === id);
            if (issue && issue.status !== 'resolved') {
                onUpdateIssue(id, { status: 'resolved', resolved_at: new Date().toISOString() }, 'Bulk Status Change', `Status changed to Resolved`);
            }
        });
        setSelectedIssueIds(new Set());
    };

    const handleBulkRoute = (department: string) => {
        if (!department) return;
        selectedIssueIds.forEach(id => {
            onUpdateIssue(id, { department }, 'Bulk Re-routing', `Routed to ${department}`);
        });
        setSelectedIssueIds(new Set());
    };

    const handleTableUpdate = (issueId: string, updates: Partial<Issue>) => {
        const issue = allIssues.find(i => i.id === issueId);
        if (!issue) return;

        if ('status' in updates) {
            onUpdateIssue(issueId, updates, 'Status Change', `Status changed from ${issue.status} to ${updates.status}`);
        } else if ('department' in updates) {
            onUpdateIssue(issueId, updates, 'Department Change', `Department changed from ${issue.department} to ${updates.department}`);
        }
    };

    const handleAIQuery = (aiFilters: any) => {
        // Reset existing filters and apply the ones from AI
        setFilters({
            department: aiFilters.department || '',
            status: aiFilters.status || '',
            severity: aiFilters.severity || 0,
            sentiment: aiFilters.sentiment || '',
            startDate: aiFilters.startDate || '',
            endDate: aiFilters.endDate || '',
        });
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'board':
                return <KanbanBoard issues={filteredIssues} onSelectIssue={onSelectIssue} />;
            case 'management':
                return (
                    <div className="admin-view">
                        <FilterSidebar filters={filters} setFilters={setFilters} />
                        <div className="admin-main-content">
                            {selectedIssueIds.size > 0 && (
                                <div className="bulk-actions-toolbar">
                                    <span>{selectedIssueIds.size} selected</span>
                                    <select onChange={(e) => { handleBulkRoute(e.target.value); e.target.value = ""; }} defaultValue="">
                                        <option value="" disabled>Route to...</option>
                                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <button className="button button-secondary" onClick={handleBulkResolve}>Mark as Resolved</button>
                                </div>
                            )}
                            <AdminTable
                                issues={filteredIssues}
                                onUpdateIssue={handleTableUpdate}
                                onSelectIssue={onSelectIssue}
                                selectedIssueIds={selectedIssueIds}
                                setSelectedIssueIds={setSelectedIssueIds}
                            />
                        </div>
                    </div>
                );
            case 'analytics':
                return <AdminAnalyticsDashboard issues={filteredIssues} />;
            case 'triage':
                return <TriageDashboard issues={allIssues} onSelectIssue={onSelectIssue} />;
            default:
                return null;
        }
    }

    return (
        <div className="admin-view-container">
            {/* Floating Island Navigation */}
            <div className="floating-nav-container">
                <nav className="floating-nav admin-nav">
                    <button
                        className={`floating-nav-item ${activeTab === 'board' ? 'active' : ''}`}
                        onClick={() => setActiveTab('board')}
                    >
                        📋 Board
                    </button>
                    <button
                        className={`floating-nav-item ${activeTab === 'management' ? 'active' : ''}`}
                        onClick={() => setActiveTab('management')}
                    >
                        ⚙️ Issues
                    </button>
                    <button
                        className={`floating-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analytics')}
                    >
                        📊 Analytics
                    </button>
                    <button
                        className={`floating-nav-item ${activeTab === 'triage' ? 'active' : ''}`}
                        onClick={() => setActiveTab('triage')}
                    >
                        🚨 Triage
                    </button>

                    <div className="floating-nav-divider" />

                    <button
                        className="floating-nav-action"
                        onClick={() => setIsSimulationModalOpen(true)}
                    >
                        🧪 Simulate
                    </button>
                    <button
                        className="floating-nav-action"
                        onClick={() => setIsBrainPulseOpen(true)}
                    >
                        🧠 Brain Pulse
                    </button>
                </nav>
            </div>
            {activeTab !== 'board' && activeTab !== 'triage' && <AIQueryBar onQuery={handleAIQuery} />}
            <SystemAlert message={systemInsight} />
            {renderContent()}
            <CityBrainPulse isOpen={isBrainPulseOpen} onClose={() => setIsBrainPulseOpen(false)} issues={allIssues} />
            <SimulationModal isOpen={isSimulationModalOpen} onClose={() => setIsSimulationModalOpen(false)} issues={allIssues} />
        </div>
    );
};
