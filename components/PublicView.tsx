import React, { useState, useMemo, FC } from 'react';
import type { Issue, Reporter, Theme } from '../lib/types';
import { IssueFeed } from './IssueFeed';
import { MapView } from './MapView';
import { PublicAnalyticsDashboard } from './PublicAnalyticsDashboard';

export const PublicView: FC<{
  issues: Issue[],
  reporters: Reporter[],
  onSelectIssue: (issue: Issue) => void,
  theme: Theme,
}> = ({ issues: allIssues, reporters, onSelectIssue, theme }) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'map' | 'analytics'>('feed');
  const [showResolved, setShowResolved] = useState(false);

  const visibleIssues = useMemo(() => {
    return showResolved
      ? allIssues
      : allIssues.filter(i => i.status !== 'resolved' && i.status !== 'closed');
  }, [allIssues, showResolved]);

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return <IssueFeed issues={visibleIssues} onSelectIssue={onSelectIssue} />;
      case 'map':
        return <MapView issues={visibleIssues} theme={theme} />;
      case 'analytics':
        return <PublicAnalyticsDashboard issues={allIssues} />;
      default:
        return null;
    }
  };

  return (
    <div className="public-view">
      {/* Floating Island Navigation */}
      <div className="floating-nav-container">
        <nav className="floating-nav">
          <button
            className={`floating-nav-item ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            📋 Feed
          </button>
          <button
            className={`floating-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📊 Analytics
          </button>
          <button
            className={`floating-nav-item ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            🗺️ Map
          </button>

          {/* Show Resolved Toggle */}
          {(activeTab === 'feed' || activeTab === 'map') && (
            <div className="floating-nav-divider" />
          )}
          {(activeTab === 'feed' || activeTab === 'map') && (
            <label className="floating-toggle">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
              />
              <span className="toggle-label">Show Resolved</span>
            </label>
          )}
        </nav>
      </div>

      {/* Content */}
      <div className="view-content">
        {renderContent()}
      </div>
    </div>
  );
};