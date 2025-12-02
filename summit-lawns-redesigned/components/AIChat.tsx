import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, User, Bot } from 'lucide-react';
import { ChatMessage } from '../types';
import { Button } from './ui/Button';
import { sendMessageToAssistant } from '../services/geminiService';

export const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hi there! I\'m the Summit Smart Assistant. How can I help you with your lawn today?', timestamp: Date.now() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      text: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Call Gemini API
    const responseText = await sendMessageToAssistant(
      userMessage.text,
      messages.map(m => ({ role: m.role, text: m.text }))
    );

    const botMessage: ChatMessage = {
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, botMessage]);
    setIsLoading(false);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-40 print:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 p-4 rounded-full shadow-2xl transition-all duration-300 ${
            isOpen ? 'bg-gray-800 rotate-90 scale-90' : 'bg-brand-600 hover:bg-brand-700 hover:scale-105'
          } text-white`}
        >
          {isOpen ? <Sparkles size={24} /> : <MessageSquare size={24} />}
          {!isOpen && <span className="font-semibold pr-2">Ask an Expert</span>}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[70vh] bg-white rounded-2xl shadow-2xl z-40 border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          {/* Header */}
          <div className="bg-brand-900 p-4 flex items-center gap-3">
            <div className="p-2 bg-brand-800 rounded-full">
              <Bot size={20} className="text-brand-300" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Summit Smart Assistant</h3>
              <p className="text-brand-300 text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Powered by Gemini
              </p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-brand-100 text-brand-700'
                }`}>
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={`max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-brand-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                  <Bot size={14} />
                </div>
                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex gap-1 items-center h-10">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about prices, services..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
              />
              <Button 
                size="sm" 
                onClick={handleSend} 
                className="rounded-full !px-3"
                disabled={isLoading}
              >
                <Send size={18} />
              </Button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              AI can make mistakes. Please verify specific quotes with our team.
            </p>
          </div>
        </div>
      )}
    </>
  );
};