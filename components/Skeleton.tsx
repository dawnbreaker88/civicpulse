import React, { FC } from 'react';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string;
    className?: string;
}

export const Skeleton: FC<SkeletonProps> = ({
    width = '100%',
    height = '20px',
    borderRadius = 'var(--radius-md)',
    className = ''
}) => {
    return (
        <div
            className={`skeleton ${className}`}
            style={{
                width: typeof width === 'number' ? `${width}px` : width,
                height: typeof height === 'number' ? `${height}px` : height,
                borderRadius
            }}
            aria-hidden="true"
        />
    );
};

// Pre-built skeleton components for common use cases

export const SkeletonCard: FC = () => (
    <div className="skeleton-card">
        <div className="skeleton-card-header">
            <Skeleton width={80} height={24} borderRadius="9999px" />
            <Skeleton width={100} height={20} />
        </div>
        <Skeleton height={24} className="skeleton-title" />
        <Skeleton height={48} className="skeleton-summary" />
        <div className="skeleton-meta">
            <Skeleton width={80} height={20} />
            <Skeleton width={60} height={20} />
            <Skeleton width={70} height={20} />
        </div>
    </div>
);

export const SkeletonKanbanCard: FC = () => (
    <div className="skeleton-kanban-card">
        <Skeleton height={18} width="70%" />
        <Skeleton height={14} width="50%" />
        <div className="skeleton-kanban-footer">
            <Skeleton width={60} height={12} />
            <Skeleton width={40} height={12} />
        </div>
    </div>
);

export const SkeletonTable: FC<{ rows?: number }> = ({ rows = 5 }) => (
    <div className="skeleton-table">
        <div className="skeleton-table-header">
            <Skeleton height={20} width="15%" />
            <Skeleton height={20} width="25%" />
            <Skeleton height={20} width="20%" />
            <Skeleton height={20} width="15%" />
            <Skeleton height={20} width="15%" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="skeleton-table-row">
                <Skeleton height={16} width="15%" />
                <Skeleton height={16} width="25%" />
                <Skeleton height={16} width="20%" />
                <Skeleton height={16} width="15%" />
                <Skeleton height={16} width="15%" />
            </div>
        ))}
    </div>
);

export const SkeletonChart: FC = () => (
    <div className="skeleton-chart">
        <Skeleton height={24} width={150} className="skeleton-chart-title" />
        <div className="skeleton-chart-bars">
            {[70, 90, 50, 80, 60, 75, 85].map((h, i) => (
                <Skeleton key={i} width={30} height={`${h}%`} />
            ))}
        </div>
    </div>
);
