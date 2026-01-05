import React, { FC } from 'react';
import type { Role, Theme } from '../lib/types';

export const Header: FC<{
  unresolvedCount: number;
  resolvedCount: number;
  role: Role;
  setRole: (role: Role) => void;
  onReportClick: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}> = ({ unresolvedCount, resolvedCount, role, setRole, onReportClick, theme, setTheme }) => {

  const totalIssues = unresolvedCount + resolvedCount;
  const healthIndex = totalIssues > 0 ? ((resolvedCount / totalIssues) * 80 + 15).toFixed(1) : '95.0';
  const healthStatus = +healthIndex > 80 ? 'good' : +healthIndex > 60 ? 'medium' : 'poor';

  const handleLogoClick = () => {
    // Reset to home/public view
    setRole('public');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <div className="header-logo" onClick={handleLogoClick} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
            Civic<span>Pulse</span>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-card-number">{unresolvedCount}</div>
              <div className="stat-card-label">Open</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-number">{resolvedCount}</div>
              <div className="stat-card-label">Resolved</div>
            </div>
            <div className="stat-card">
              <div className={`stat-card-number health-index-value ${healthStatus}`}>{healthIndex}%</div>
              <div className="stat-card-label">Health</div>
            </div>
          </div>
        </div>
        <div className="header-right">
          <button className="button button-primary" onClick={onReportClick}>
            <span className="btn-icon">+</span> Report Issue
          </button>
          <div className="role-toggle">
            <button className={role === 'public' ? 'active' : ''} onClick={() => setRole('public')}>Public</button>
            <button className={role === 'admin' ? 'active' : ''} onClick={() => setRole('admin')}>Admin</button>
          </div>
          <button
            className="theme-toggle"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </header>
  );
};