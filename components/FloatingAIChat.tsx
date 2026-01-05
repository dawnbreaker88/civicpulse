import React, { FC, useState, useRef, useEffect } from 'react';
import { getApiKey, getModelName } from '../lib/aiConfig';
import { GoogleGenAI } from '@google/genai';

interface ChatMessage {
    role: 'user' | 'ai';
    content: string;
}

/**
 * AI Feature #5: AI Chatbot Helper
 * Floating chatbot that answers questions about the platform and issues.
 */
export const FloatingAIChat: FC<{ issueCount?: number; resolvedCount?: number }> = ({
    issueCount = 0,
    resolvedCount = 0
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'ai', content: "👋 Hi! I'm your Civic Pulse assistant. I can help you with:\n\n• Reporting issues\n• Understanding the platform\n• Checking issue status\n• Finding department info\n\nHow can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const quickActions = [
        'How do I report an issue?',
        'What departments exist?',
        'How long does resolution take?',
        'Check my points',
    ];

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;

        const userMessage = text.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setInput('');
        setIsLoading(true);

        try {
            const apiKey = getApiKey();
            if (!apiKey) {
                setMessages(prev => [...prev, {
                    role: 'ai',
                    content: "❌ I'm not configured yet. Please ask an admin to set up the API key."
                }]);
                setIsLoading(false);
                return;
            }

            const genAI = new GoogleGenAI({ apiKey });

            // Build conversation with context
            const conversationHistory = messages.slice(-4).map(m =>
                `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
            ).join('\n\n');

            const systemPrompt = `You are a helpful AI assistant for Civic Pulse, a citizen issue reporting platform for Hyderabad, India.

Platform Stats: ${issueCount} active issues, ${resolvedCount} resolved.

Departments: GHMC Roads, HMWS&SB Water, TSSPDCL Electricity, GHMC Sanitation, GHMC Parks, Traffic Police, GHMC Building, Other.

Key Features:
- Report issues with photos
- AI auto-classifies and routes
- Track issue status
- Earn points for reporting

Rules: Be friendly, concise (under 80 words), use emojis sparingly.

${conversationHistory ? `Conversation:\n${conversationHistory}\n\n` : ''}User: ${userMessage}

Respond directly to the user's question:`;

            const response = await genAI.models.generateContent({
                model: getModelName(),
                contents: systemPrompt,
            });

            const responseText = response.text || "I couldn't generate a response.";
            setMessages(prev => [...prev, { role: 'ai', content: responseText }]);
        } catch (error: any) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'ai',
                content: `⚠️ Error: ${error.message || 'Something went wrong. Please try again.'}`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="floating-ai-chat">
            {isOpen && (
                <div className="ai-chat-window">
                    <div className="ai-chat-header">
                        <h3>🤖 Civic Pulse Assistant</h3>
                        <button className="ai-chat-close" onClick={() => setIsOpen(false)}>×</button>
                    </div>

                    <div className="ai-chat-messages">
                        {messages.map((msg, i) => (
                            <div key={i} className={`ai-chat-message ${msg.role}`}>
                                {msg.content.split('\n').map((line, j) => (
                                    <span key={j}>{line}<br /></span>
                                ))}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="ai-chat-message ai">
                                <span className="typing-indicator">🤔 Thinking...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="ai-chat-quick-actions">
                        {quickActions.map((action, i) => (
                            <button
                                key={i}
                                className="ai-quick-action"
                                onClick={() => handleSend(action)}
                                disabled={isLoading}
                            >
                                {action}
                            </button>
                        ))}
                    </div>

                    <div className="ai-chat-input">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Ask me anything..."
                            onKeyDown={e => e.key === 'Enter' && !isLoading && handleSend()}
                            disabled={isLoading}
                        />
                        <button onClick={() => handleSend()} disabled={isLoading || !input.trim()}>
                            Send
                        </button>
                    </div>
                </div>
            )}

            <button
                className="ai-chat-trigger"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Open AI Assistant"
            >
                {isOpen ? '✕' : '💬'}
            </button>
        </div>
    );
};
