import React, { FC, useMemo, useState, useEffect } from 'react';
import type { Issue } from '../lib/types';
import { DEPARTMENTS } from '../lib/constants';
import { analyzeSimulationScenario, SimulationAnalysis } from '../lib/gemini';

const OVERLOAD_THRESHOLD = 8;

const PRESET_SCENARIOS = [
    "A sudden 25% increase in traffic-related complaints due to a city-wide event.",
    "Heavy monsoon flooding affecting multiple areas across the city.",
    "Power outages reported in 5 major neighborhoods simultaneously.",
    "Major water pipeline burst in the Jubilee Hills area.",
    "City-wide garbage collection strike for 3 days.",
];

export const SimulationModal: FC<{
    isOpen: boolean;
    onClose: () => void;
    issues: Issue[];
}> = ({ isOpen, onClose, issues }) => {
    const [startAnimation, setStartAnimation] = useState(false);
    const [customScenario, setCustomScenario] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<SimulationAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setStartAnimation(true), 200);
            return () => clearTimeout(timer);
        } else {
            setStartAnimation(false);
            setAiAnalysis(null);
            setCustomScenario('');
            setError(null);
        }
    }, [isOpen]);

    const handleAnalyze = async () => {
        if (!customScenario.trim()) return;

        setIsAnalyzing(true);
        setError(null);

        try {
            const analysis = await analyzeSimulationScenario(customScenario, issues);
            setAiAnalysis(analysis);
        } catch (err: any) {
            setError(err.message || 'Failed to analyze scenario');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handlePresetClick = (preset: string) => {
        setCustomScenario(preset);
        setAiAnalysis(null);
    };

    const simulationData = useMemo(() => {
        const initialWorkload = DEPARTMENTS.reduce((acc, dept) => {
            acc[dept] = issues.filter(issue => issue.department === dept && issue.status !== 'resolved' && issue.status !== 'closed').length;
            return acc;
        }, {} as Record<string, number>);

        // If we have AI analysis, use its predictions
        let predictedWorkload = { ...initialWorkload };
        if (aiAnalysis) {
            aiAnalysis.affected_departments.forEach(dept => {
                const fullDeptName = DEPARTMENTS.find(d => d.includes(dept.name)) || dept.name;
                if (predictedWorkload[fullDeptName] !== undefined) {
                    predictedWorkload[fullDeptName] = Math.round(predictedWorkload[fullDeptName] * (1 + dept.impact_percentage / 100));
                }
            });
        }

        const maxWorkload = Math.max(...Object.values(predictedWorkload), OVERLOAD_THRESHOLD + 2);

        const departmentImpact = DEPARTMENTS.map(dept => ({
            name: dept.replace('GHMC – ', '').replace('HMWS&SB – ', '').replace('TSSPDCL – ', '').replace('Traffic Police – ', ''),
            fullName: dept,
            current: initialWorkload[dept],
            predicted: predictedWorkload[dept],
            currentPercent: (initialWorkload[dept] / maxWorkload) * 100,
            predictedPercent: (predictedWorkload[dept] / maxWorkload) * 100,
            isOverloaded: predictedWorkload[dept] > OVERLOAD_THRESHOLD,
        })).filter(d => d.current > 0 || d.predicted > d.current)
            .sort((a, b) => b.predicted - a.predicted);

        return { departmentImpact };
    }, [issues, aiAnalysis]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content simulation-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>🧪 AI-Powered Simulation</h2>
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                </div>

                {/* Scenario Input */}
                <div className="simulation-scenario">
                    <h3>📝 What-If Scenario</h3>
                    <div className="scenario-input-container">
                        <textarea
                            className="scenario-input"
                            value={customScenario}
                            onChange={(e) => setCustomScenario(e.target.value)}
                            placeholder="Describe a hypothetical scenario... e.g., 'Major water main break in Banjara Hills during rush hour'"
                            rows={3}
                        />
                        <button
                            className="button button-primary"
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || !customScenario.trim()}
                        >
                            {isAnalyzing ? '🤔 Analyzing...' : '🧠 Analyze with AI'}
                        </button>
                    </div>

                    {/* Preset Scenarios */}
                    <div className="preset-scenarios">
                        <span className="preset-label">Quick presets:</span>
                        {PRESET_SCENARIOS.slice(0, 3).map((preset, i) => (
                            <button
                                key={i}
                                className="preset-chip"
                                onClick={() => handlePresetClick(preset)}
                            >
                                {preset.slice(0, 40)}...
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="simulation-error">
                        ⚠️ {error}
                    </div>
                )}

                {/* AI Analysis Results */}
                {aiAnalysis && (
                    <div className="ai-analysis-results">
                        <h3>🤖 AI Analysis</h3>

                        <div className="analysis-grid">
                            <div className="analysis-card">
                                <div className="analysis-label">Impact Level</div>
                                <div className={`analysis-value impact-${aiAnalysis.overall_impact}`}>
                                    {aiAnalysis.overall_impact.toUpperCase()}
                                </div>
                            </div>
                            <div className="analysis-card">
                                <div className="analysis-label">Est. Resolution Time</div>
                                <div className="analysis-value">{aiAnalysis.estimated_resolution_time}</div>
                            </div>
                            <div className="analysis-card">
                                <div className="analysis-label">Affected Infrastructure</div>
                                <div className="analysis-value-list">
                                    {aiAnalysis.affected_infrastructure.slice(0, 3).map((item, i) => (
                                        <span key={i} className="infrastructure-tag">🏗️ {item}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="analysis-summary">
                            <h4>📊 Summary</h4>
                            <p>{aiAnalysis.summary}</p>
                        </div>
                    </div>
                )}

                {/* Workload Visualization */}
                <div className="simulation-results">
                    <h3 className="simulation-results-header">
                        {aiAnalysis ? '📈 Predicted Workload Impact' : '📊 Current Department Workload'}
                    </h3>
                    <div className="impact-chart">
                        {simulationData.departmentImpact.map(dept => (
                            <div key={dept.name} className="impact-row">
                                <div className="impact-label" title={dept.fullName}>{dept.name}</div>
                                <div className="impact-bar-container">
                                    <div
                                        className="impact-bar impact-bar-current"
                                        style={{ width: startAnimation ? `${dept.currentPercent}%` : '0%' }}
                                    >
                                        {dept.current}
                                    </div>
                                    {aiAnalysis && dept.predicted > dept.current && (
                                        <div
                                            className={`impact-bar impact-bar-predicted ${dept.isOverloaded ? 'impact-bar-overload' : ''}`}
                                            style={{ width: startAnimation ? `${dept.predictedPercent}%` : '0%' }}
                                        >
                                            {dept.predicted}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Recommendations */}
                {aiAnalysis && (
                    <div className="simulation-recommendation">
                        <h4>💡 Recommended Actions</h4>
                        <ul className="recommendation-list">
                            {aiAnalysis.recommended_actions.map((action, i) => (
                                <li key={i}>{action}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};