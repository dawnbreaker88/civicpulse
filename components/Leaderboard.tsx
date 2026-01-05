import React, { FC, useMemo } from 'react';
import type { Reporter } from '../lib/types';

export const Leaderboard: FC<{ reporters: Reporter[] }> = ({ reporters }) => {
    
    const sortedReporters = useMemo(() => {
        return [...reporters].sort((a, b) => b.points - a.points);
    }, [reporters]);

    return (
        <div style={{overflowX: 'auto'}}>
            <table className="leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Name</th>
                        <th>Points</th>
                        <th>Badge</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedReporters.map((reporter, index) => (
                        <tr key={reporter.id}>
                            <td className="rank">#{index + 1}</td>
                            <td>{reporter.name}</td>
                            <td>{reporter.points.toLocaleString()}</td>
                            <td>
                                <span className={`badge badge-${reporter.badge}`}>{reporter.badge}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
