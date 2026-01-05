import React, { FC } from 'react';
import { DEPARTMENTS } from '../lib/constants';

export const FilterSidebar: FC<{ 
  filters: any; 
  setFilters: (filters: any) => void;
}> = ({ filters, setFilters }) => {
    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters((prev: any) => ({ ...prev, [name]: value }));
    };

    return (
        <aside className="filter-sidebar">
            <h3>Filters</h3>
            <div className="filter-group">
                <label htmlFor="department">Department</label>
                <select id="department" name="department" value={filters.department} onChange={handleFilterChange}>
                    <option value="">All Departments</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
            <div className="filter-group">
                <label htmlFor="status">Status</label>
                <select id="status" name="status" value={filters.status} onChange={handleFilterChange}>
                    <option value="">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="resolved">Resolved</option>
                </select>
            </div>
            <div className="filter-group">
                <label htmlFor="sentiment">Sentiment</label>
                <select id="sentiment" name="sentiment" value={filters.sentiment} onChange={handleFilterChange}>
                    <option value="">All</option>
                    <option value="positive">Positive</option>
                    <option value="neutral">Neutral</option>
                    <option value="negative">Negative</option>
                </select>
            </div>
            <div className="filter-group">
                <label htmlFor="severity">Min Severity: {filters.severity}</label>
                <input type="range" id="severity" name="severity" min="0" max="100" value={filters.severity} onChange={handleFilterChange} />
            </div>
            <div className="filter-group">
                <label htmlFor="startDate">Start Date</label>
                <input type="date" id="startDate" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
            </div>
             <div className="filter-group">
                <label htmlFor="endDate">End Date</label>
                <input type="date" id="endDate" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
            </div>
        </aside>
    );
};
