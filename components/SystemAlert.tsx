import React, { FC } from 'react';

export const SystemAlert: FC<{ message?: string }> = ({ message }) => {
    const isAnalyzing = message === 'Analyzing trends...';
    
    if (!message) return null;

    // Split message for bolding if it's not the analyzing message
    const [title, ...rest] = isAnalyzing ? [] : message.split(':');
    const content = rest.join(':');

    return (
        <div className="system-alert">
            <div className="system-alert-icon">
                {isAnalyzing ? <div className="spinner" style={{width: '18px', height: '18px'}}></div> : '💡'}
            </div>
            <div className="system-alert-message">
                {isAnalyzing ? (
                    <span>Analyzing recent issue data for emerging trends...</span>
                ) : (
                    <>
                        <strong>{title}:</strong> 
                        <span>{content}</span>
                    </>
                )}
            </div>
        </div>
    );
};