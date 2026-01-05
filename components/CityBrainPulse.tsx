import React, { FC, useState, useEffect, useMemo } from 'react';
import type { Issue } from '../lib/types';
import { getSeverity } from '../lib/helpers';

type BrainNodeStage = 'enter' | 'sentinel' | 'insight' | 'aegis' | 'done';
interface BrainNode {
    id: string;
    issue: Issue;
    stage: BrainNodeStage;
    top: number; // For random vertical positioning
}

const STAGE_DURATIONS = {
    enter: 50,
    sentinel: 2000,
    insight: 2000,
    aegis: 2000,
};

const SIMULATION_SPEED = 2500; // ms between new issues

export const CityBrainPulse: FC<{
    isOpen: boolean;
    onClose: () => void;
    issues: Issue[];
}> = ({ isOpen, onClose, issues }) => {
    const [activeNodes, setActiveNodes] = useState<BrainNode[]>([]);
    
    // Shuffle issues so the feed looks different each time
    const shuffledIssues = useMemo(() => [...issues].sort(() => 0.5 - Math.random()), [issues]);

    useEffect(() => {
        if (!isOpen) {
            // Clear nodes when modal is closed
            setActiveNodes([]);
            return;
        }

        let issueIndex = 0;
        const interval = setInterval(() => {
            if (issueIndex >= shuffledIssues.length) {
                issueIndex = 0; // Loop back
            }

            const issue = shuffledIssues[issueIndex];
            const newNode: BrainNode = {
                id: `${issue.id}-${Date.now()}`,
                issue,
                stage: 'enter',
                top: Math.random() * 70 + 15, // Random top % between 15% and 85%
            };
            
            setActiveNodes(prev => [...prev, newNode]);

            // Staging timeouts
            setTimeout(() => {
                setActiveNodes(prev => prev.map(n => n.id === newNode.id ? { ...n, stage: 'sentinel' } : n));
            }, STAGE_DURATIONS.enter);
            
            setTimeout(() => {
                setActiveNodes(prev => prev.map(n => n.id === newNode.id ? { ...n, stage: 'insight' } : n));
            }, STAGE_DURATIONS.enter + STAGE_DURATIONS.sentinel);
            
            setTimeout(() => {
                setActiveNodes(prev => prev.map(n => n.id === newNode.id ? { ...n, stage: 'aegis' } : n));
            }, STAGE_DURATIONS.enter + STAGE_DURATIONS.sentinel + STAGE_DURATIONS.insight);

            setTimeout(() => {
                setActiveNodes(prev => prev.map(n => n.id === newNode.id ? { ...n, stage: 'done' } : n));
            }, STAGE_DURATIONS.enter + STAGE_DURATIONS.sentinel + STAGE_DURATIONS.insight + STAGE_DURATIONS.aegis);

            // Cleanup timeout
            setTimeout(() => {
                 setActiveNodes(prev => prev.filter(n => n.id !== newNode.id));
            }, STAGE_DURATIONS.enter + STAGE_DURATIONS.sentinel + STAGE_DURATIONS.insight + STAGE_DURATIONS.aegis + 500);


            issueIndex++;
        }, SIMULATION_SPEED);

        return () => clearInterval(interval);

    }, [isOpen, shuffledIssues]);

    return (
        <div className={`city-brain-overlay ${isOpen ? 'open' : ''}`}>
            <div className="city-brain-content">
                <div className="city-brain-header">
                    <h2>City Brain Pulse</h2>
                    <button className="city-brain-close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="brain-visualization">
                    <div className="brain-columns">
                        <div className="brain-column">
                            <div className="brain-column-header">
                                <h3>SENTINEL</h3>
                                <p>Data Collector</p>
                            </div>
                        </div>
                        <div className="brain-column">
                            <div className="brain-column-header">
                                <h3>INSIGHT</h3>
                                <p>AI Analyzer</p>
                            </div>
                        </div>
                        <div className="brain-column">
                             <div className="brain-column-header">
                                <h3>AEGIS</h3>
                                <p>Decision & Routing</p>
                            </div>
                        </div>
                    </div>

                    {activeNodes.map(node => {
                        const severity = getSeverity(node.issue.severity_score);
                        return (
                            <div 
                                key={node.id} 
                                className={`brain-node stage-${node.stage}`}
                                style={{ 
                                    top: `${node.top}%`,
                                    backgroundColor: severity.color,
                                    boxShadow: `0 0 15px ${severity.color}`,
                                    borderColor: `rgba(255,255,255,0.7)`
                                }}
                            >
                                <div className="brain-node-title">{node.issue.title}</div>
                                <div className="brain-node-dept">{node.issue.department.replace('GHMC –', '').replace('HMWS&SB –', 'Water/Sewer').replace('TSSPDCL –', 'Electricity').trim()}</div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};