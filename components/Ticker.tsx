import React, { useState, useEffect, FC } from 'react';

export const Ticker: FC<{ messages: { type: 'alert' | 'success' | 'info'; text: string }[] }> = ({ messages }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % messages.length);
    }, 6000); // Change every 6 seconds

    return () => clearInterval(interval);
  }, [messages]);
  
  // Reset index if messages array changes to avoid out-of-bounds error
  useEffect(() => {
    setCurrentIndex(0);
  }, [messages]);

  if (!messages || messages.length === 0) {
    return null;
  }

  const currentMessage = messages[currentIndex];
  
  const getIcon = (type: string) => {
    if (currentMessage.text.startsWith('💡')) return ''; // Icon is already in the text for AI messages
    switch (type) {
      case 'alert': return '⚠️';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      default: return '';
    }
  };

  return (
    <div className="top-ticker-bar">
      <div className="ticker-content" key={currentIndex}>
        <span className="ticker-icon">{getIcon(currentMessage.type)}</span>
        {currentMessage.text}
      </div>
    </div>
  );
};