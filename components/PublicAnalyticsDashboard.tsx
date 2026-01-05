import React, { FC, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, } from 'recharts';
import type { Issue, Sentiment } from '../lib/types';
import { formatDuration } from '../lib/helpers';

const COLORS = ['#4EA8DE', '#4CAF50', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const PublicAnalyticsDashboard: FC<{ issues: Issue[] }> = ({ issues }) => {
    const kpis = useMemo(() => {
        const total = issues.length;
        const resolvedIssues = issues.filter(i => i.status === 'resolved' && i.resolved_at);
        const resolvedCount = resolvedIssues.length;
        
        const totalResolutionTime = resolvedIssues.reduce((acc, i) => {
            const created = new Date(i.created_at).getTime();
            const resolved = new Date(i.resolved_at!).getTime();
            return acc + (resolved - created);
        }, 0);

        return {
            total,
            resolvedRate: total > 0 ? ((resolvedCount / total) * 100).toFixed(1) : 0,
            avgResolutionTime: resolvedCount > 0 ? formatDuration(totalResolutionTime / resolvedCount) : 'N/A',
        };
    }, [issues]);

    const issuesByDept = useMemo(() => {
        const counts = issues.reduce((acc, issue) => {
            acc[issue.department] = (acc[issue.department] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [issues]);

    const issuesOverTime = useMemo(() => {
        const data: Record<string, { date: string, reported: number, resolved: number }> = {};
        
        issues.forEach(issue => {
            const reportedDate = new Date(issue.created_at).toISOString().split('T')[0];
            if (!data[reportedDate]) data[reportedDate] = { date: reportedDate, reported: 0, resolved: 0 };
            data[reportedDate].reported++;

            if (issue.resolved_at) {
                const resolvedDate = new Date(issue.resolved_at).toISOString().split('T')[0];
                if (!data[resolvedDate]) data[resolvedDate] = { date: resolvedDate, reported: 0, resolved: 0 };
                data[resolvedDate].resolved++;
            }
        });

        return Object.values(data).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [issues]);

    const sentimentOverTime = useMemo(() => {
        const countsByDate = issues.reduce((acc, issue) => {
            const date = new Date(issue.created_at).toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = { positive: 0, neutral: 0, negative: 0 };
            }
            acc[date][issue.sentiment]++;
            return acc;
        }, {} as Record<string, Record<Sentiment, number>>);

        return Object.entries(countsByDate).map(([date, counts]) => ({ date, ...counts })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [issues]);
    
    const topIssues = useMemo(() => {
        const titleCounts = issues.reduce((acc, issue) => {
            const simplifiedTitle = issue.title.toLowerCase()
                .replace(/in .*|on .*|at .*/, '') // Remove location specifics
                .replace(/major|frequent/, '') // Remove common adjectives
                .trim();
            acc[simplifiedTitle] = (acc[simplifiedTitle] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(titleCounts)
            .map(([name, value]) => ({ name, value }))
            .filter(item => item.value > 1) // Only show issues that recur
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [issues]);

    return (
        <div className="analytics-dashboard">
            <div className="kpi-card">
                <div className="kpi-title">Total Issues Reported</div>
                <div className="kpi-value">{kpis.total}</div>
            </div>
            <div className="kpi-card">
                <div className="kpi-title">Resolution Rate</div>
                <div className="kpi-value">{kpis.resolvedRate}%</div>
            </div>
            <div className="kpi-card" style={{gridColumn: 'span 2'}}>
                <div className="kpi-title">Average Resolution Time</div>
                <div className="kpi-value">{kpis.avgResolutionTime}</div>
            </div>
            
            <div className="chart-container" style={{gridColumn: '1 / -1'}}>
                <h3>Issue Trends (Reported vs. Resolved)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={issuesOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="reported" stroke="#4EA8DE" strokeWidth={2} name="Reported"/>
                        <Line type="monotone" dataKey="resolved" stroke="#4CAF50" strokeWidth={2} name="Resolved"/>
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="chart-container" style={{ gridColumn: 'span 2' }}>
                <h3>Issues by Category</h3>
                 <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                        <Pie data={issuesByDept} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                             {issuesByDept.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{fontSize: '12px'}} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            
            <div className="chart-container" style={{ gridColumn: 'span 2' }}>
                <h3>Citizen Sentiment Trend</h3>
                <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={sentimentOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="negative" name="Negative" stackId="1" stroke="#F44336" fill="#F44336" />
                        <Area type="monotone" dataKey="neutral" name="Neutral" stackId="1" stroke="#FFC107" fill="#FFC107" />
                        <Area type="monotone" dataKey="positive" name="Positive" stackId="1" stroke="#4CAF50" fill="#4CAF50" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="chart-container" style={{ gridColumn: '1 / -1' }}>
                <h3>Top Recurring Issues</h3>
                 <table className="top-issues-table">
                    <thead>
                        <tr>
                            <th>Issue Type</th>
                            <th>Report Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topIssues.map(issue => (
                            <tr key={issue.name}>
                                <td>{issue.name}</td>
                                <td>{issue.value}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
};