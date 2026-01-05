import React, { FC, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import type { Issue, Sentiment, Source } from '../lib/types';
import { DEPARTMENTS } from '../lib/constants';
import { formatDuration } from '../lib/helpers';
import { MapView } from './MapView';

const COLORS = ['#4EA8DE', '#4CAF50', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const SENTIMENT_COLORS = { positive: '#4CAF50', neutral: '#FFC107', negative: '#F44336' };
const SLA_HOURS = 72;

export const AdminAnalyticsDashboard: FC<{ issues: Issue[] }> = ({ issues }) => {
    
    const analytics = useMemo(() => {
        const total = issues.length;
        const unresolved = issues.filter(i => i.status === 'open');
        const resolved = issues.filter(i => i.status === 'resolved');
        
        // Response time
        const issuesWithComments = issues.filter(i => i.comments && i.comments.length > 0);
        const totalResponseTime = issuesWithComments.reduce((acc, i) => {
            const created = new Date(i.created_at).getTime();
            const firstComment = new Date(i.comments![0].created_at).getTime();
            return acc + (firstComment - created);
        }, 0);

        // Resolution time
        const totalResolutionTime = resolved.reduce((acc, i) => {
            if (!i.resolved_at) return acc;
            const created = new Date(i.created_at).getTime();
            const resolvedTime = new Date(i.resolved_at).getTime();
            return acc + (resolvedTime - created);
        }, 0);

        // SLA Compliance
        const slaCompliant = resolved.filter(i => {
            if (!i.resolved_at) return false;
            const resolutionHours = (new Date(i.resolved_at).getTime() - new Date(i.created_at).getTime()) / (1000 * 60 * 60);
            return resolutionHours <= SLA_HOURS;
        }).length;
        
        const departmentPerformance = DEPARTMENTS.map(dept => {
            const deptIssues = issues.filter(i => i.department === dept);
            const deptResolved = deptIssues.filter(i => i.status === 'resolved');
            const deptWithComments = deptIssues.filter(i => i.comments && i.comments.length > 0);

            const deptTotalResolutionTime = deptResolved.reduce((acc, i) => {
                if(!i.resolved_at) return acc;
                return acc + (new Date(i.resolved_at).getTime() - new Date(i.created_at).getTime());
            }, 0);
            
            const deptTotalResponseTime = deptWithComments.reduce((acc, i) => {
                 if (!i.comments?.length) return acc;
                 return acc + (new Date(i.comments[0].created_at).getTime() - new Date(i.created_at).getTime());
            }, 0);

            return {
                name: dept,
                total: deptIssues.length,
                resolved: deptResolved.length,
                resolutionRate: deptIssues.length > 0 ? (deptResolved.length / deptIssues.length) * 100 : 0,
                avgResolutionTime: deptResolved.length > 0 ? deptTotalResolutionTime / deptResolved.length : 0,
                avgResponseTime: deptWithComments.length > 0 ? deptTotalResponseTime / deptWithComments.length : 0,
            }
        }).filter(d => d.total > 0).sort((a,b) => b.total - a.total);

        return {
            total,
            unresolvedCount: unresolved.length,
            resolutionRate: total > 0 ? (resolved.length / total) * 100 : 0,
            avgResolutionTime: resolved.length > 0 ? totalResolutionTime / resolved.length : 0,
            avgResponseTime: issuesWithComments.length > 0 ? totalResponseTime / issuesWithComments.length : 0,
            slaComplianceRate: resolved.length > 0 ? (slaCompliant / resolved.length) * 100 : 0,
            escalatedCount: issues.filter(i => i.severity_score > 80).length,
            bySource: Object.entries(issues.reduce((acc, i) => { acc[i.source] = (acc[i.source] || 0) + 1; return acc; }, {} as Record<Source, number>)).map(([name, value]) => ({name, value})),
            bySentiment: Object.entries(issues.reduce((acc, i) => { acc[i.sentiment] = (acc[i.sentiment] || 0) + 1; return acc; }, {} as Record<Sentiment, number>)).map(([name, value]) => ({name, value})),
            unresolvedIssues: unresolved,
            departmentWorkload: departmentPerformance.map(d => ({name: d.name, open_tickets: d.total - d.resolved})),
            departmentPerformance,
        };
    }, [issues]);

    return (
        <div className="analytics-dashboard" style={{ gridTemplateColumns: 'repeat(6, 1fr)'}}>
            <div className="kpi-card" style={{gridColumn: 'span 1'}}><div className="kpi-title">Total Issues</div><div className="kpi-value">{analytics.total}</div></div>
            <div className="kpi-card" style={{gridColumn: 'span 1'}}><div className="kpi-title">Unresolved</div><div className="kpi-value">{analytics.unresolvedCount}</div></div>
            <div className="kpi-card" style={{gridColumn: 'span 1'}}><div className="kpi-title">Resolution Rate</div><div className="kpi-value">{analytics.resolutionRate.toFixed(1)}%</div></div>
            <div className="kpi-card" style={{gridColumn: 'span 1'}}><div className="kpi-title">SLA Compliance</div><div className="kpi-value">{analytics.slaComplianceRate.toFixed(1)}%</div></div>
            <div className="kpi-card" style={{gridColumn: 'span 2'}}><div className="kpi-title">Avg. Admin Response Time</div><div className="kpi-value">{formatDuration(analytics.avgResponseTime)}</div></div>
            
            <div className="chart-container" style={{ gridColumn: 'span 4' }}>
                <h3>Department Performance Leaderboard</h3>
                <table className="department-performance-table">
                    <thead>
                        <tr>
                            <th>Department</th>
                            <th>Total</th>
                            <th>Resolved</th>
                            <th>Res. Rate</th>
                            <th>Avg. Res. Time</th>
                            <th>Avg. Resp. Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {analytics.departmentPerformance.map(dept => (
                            <tr key={dept.name}>
                                <td>{dept.name}</td>
                                <td>{dept.total}</td>
                                <td>{dept.resolved}</td>
                                <td>{dept.resolutionRate.toFixed(1)}%</td>
                                <td>{formatDuration(dept.avgResolutionTime)}</td>
                                <td>{formatDuration(dept.avgResponseTime)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="chart-container" style={{ gridColumn: 'span 2' }}>
                <h3>Unresolved Issues Map</h3>
                <div style={{height: '350px', borderRadius: 'var(--radius)', overflow: 'hidden'}}>
                    <MapView issues={analytics.unresolvedIssues} theme={'light'} />
                </div>
            </div>

            <div className="chart-container" style={{ gridColumn: 'span 2' }}>
                <h3>Department Workload (Open Tickets)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.departmentWorkload} layout="vertical" margin={{ left: 150 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="open_tickets" fill="var(--accent-primary)" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="chart-container" style={{ gridColumn: 'span 2' }}>
                <h3>Citizen Satisfaction</h3>
                 <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={analytics.bySentiment} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} label>
                            {analytics.bySentiment.map((entry, index) => <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name as Sentiment]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="chart-container" style={{ gridColumn: 'span 2' }}>
                <h3>Volume by Source</h3>
                 <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={analytics.bySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                             {analytics.bySource.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};