import L from 'leaflet';
import React, { FC, useEffect, useState } from 'react';
import type { PipelineStage } from './types';


export const getSeverity = (score: number): { level: string; color: string } => {
  if (score > 70) return { level: 'High', color: 'var(--error)' };
  if (score > 40) return { level: 'Medium', color: 'var(--warning)' };
  return { level: 'Low', color: 'var(--success)' };
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

export const getMarkerIcon = (score: number) => {
    const { color } = getSeverity(score);
    const pulseClass = score > 85 ? 'marker-pulse' : '';
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="severity-marker ${pulseClass}" style="background-color: ${color}; --glow-color: ${color};"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
};

export const formatDuration = (milliseconds: number) => {
    if (milliseconds < 0) return "N/A";
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
};

export const timeAgo = (dateString: string): string => {
    const now = new Date();
    const past = new Date(dateString);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) {
        const years = Math.floor(interval);
        return years + (years === 1 ? " year ago" : " years ago");
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        const months = Math.floor(interval);
        return months + (months === 1 ? " month ago" : " months ago");
    }
    interval = seconds / 86400;
    if (interval > 1) {
        const days = Math.floor(interval);
        return days + (days === 1 ? " day ago" : " days ago");
    }
    interval = seconds / 3600;
    if (interval > 1) {
        const hours = Math.floor(interval);
        return hours + (hours === 1 ? " hour ago" : " hours ago");
    }
    interval = seconds / 60;
    if (interval > 1) {
        const minutes = Math.floor(interval);
        return minutes + (minutes === 1 ? " minute ago" : " minutes ago");
    }
    return "just now";
};


// --- NEW PIPELINE COMPONENT --- //

// FIX: Converted JSX to React.createElement to be compatible with .ts files.
const SentinelIcon: FC<{className?: string}> = ({ className='' }) => React.createElement('svg', { className, xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" }, React.createElement('path', { d: "M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2Zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm4 4a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V9a1 1 0 0 1 1-1Zm-8 0a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V9a1 1 0 0 1 1-1Zm4 5a3 3 0 0 1 3 3h-6a3 3 0 0 1 3-3Z" }));
const InsightIcon: FC<{className?: string}> = ({ className='' }) => React.createElement('svg', { className, xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" }, React.createElement('path', { d: "M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5Zm5 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-3 4a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 1-1Zm9-1a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm0 3a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm0 3a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" }));
const AegisIcon: FC<{className?: string}> = ({ className='' }) => React.createElement('svg', { className, xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" }, React.createElement('path', { d: "M12 22S4 18 4 12V5l8-3 8 3v7c0 6-8 10-8 10Zm0-2.31c4.73-2.5 6-5.89 6-7.69v-4.5l-6-2.25-6 2.25v4.5c0 1.8 1.27 5.19 6 7.69Zm-1.41-3.3-3.3-3.3L8.7 9.7l1.88 1.88L15.3 6.9l1.41 1.41-5.12 5.18Z" }));


export const PipelineDisplay: FC<{ log: PipelineStage[], simple?: boolean }> = ({ log, simple = false }) => {
    const [activeStage, setActiveStage] = useState(0);
    const stages = ['SENTINEL', 'INSIGHT', 'AEGIS'];

    useEffect(() => {
        const timers = [
            setTimeout(() => setActiveStage(1), 100),
            setTimeout(() => setActiveStage(2), 600),
            setTimeout(() => setActiveStage(3), 1100),
        ];
        return () => timers.forEach(clearTimeout);
    }, [log]);

    if (simple) {
        return React.createElement('div', { className: "pipeline-container" },
            React.createElement('div', { className: `pipeline-stage ${activeStage >= 1 ? 'active' : ''}`, style: { transitionDelay: '0s' } },
                React.createElement(SentinelIcon, { className: `pipeline-icon ${activeStage >= 1 ? 'active' : ''}` }),
                ' SENTINEL'
            ),
            React.createElement('div', { className: `pipeline-connector ${activeStage >= 2 ? 'active' : ''}`, style: { transitionDelay: '0.5s' } }),
            React.createElement('div', { className: `pipeline-stage ${activeStage >= 2 ? 'active' : ''}`, style: { transitionDelay: '0.5s' } },
                React.createElement(InsightIcon, { className: `pipeline-icon ${activeStage >= 2 ? 'active' : ''}` }),
                ' INSIGHT'
            ),
            React.createElement('div', { className: `pipeline-connector ${activeStage >= 3 ? 'active' : ''}`, style: { transitionDelay: '1s' } }),
            React.createElement('div', { className: `pipeline-stage ${activeStage >= 3 ? 'active' : ''}`, style: { transitionDelay: '1s' } },
                React.createElement(AegisIcon, { className: `pipeline-icon ${activeStage >= 3 ? 'active' : ''}` }),
                ' AEGIS'
            )
        );
    }
    
    return React.createElement('div', { className: "pipeline-detail-view" },
        stages.map((stageName, index) => (
            React.createElement(React.Fragment, { key: stageName },
                React.createElement('div', { className: `pipeline-detail-stage ${activeStage > index ? 'active' : ''}`, style: { transitionDelay: `${index * 0.5}s` } },
                    React.createElement('div', { className: "pipeline-detail-icon-wrapper" },
                        stageName === 'SENTINEL' && React.createElement(SentinelIcon, { className: "pipeline-icon" }),
                        stageName === 'INSIGHT' && React.createElement(InsightIcon, { className: "pipeline-icon" }),
                        stageName === 'AEGIS' && React.createElement(AegisIcon, { className: "pipeline-icon" })
                    ),
                    React.createElement('h4', null, stageName),
                    React.createElement('p', null, log[index]?.details || 'Processing...')
                ),
                index < stages.length - 1 && (
                    React.createElement('div', { className: `pipeline-connector pipeline-detail-connector ${activeStage > index + 1 ? 'active' : ''}`, style: { transitionDelay: `${index * 0.5 + 0.5}s` } })
                )
            )
        ))
    );
};