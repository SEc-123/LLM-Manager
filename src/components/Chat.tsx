import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, AlertCircle, Loader } from 'lucide-react';
import { useStore } from '../store/store';
import { Message } from '../types';
import { ChatService } from '../services/chatService';

export const Chat: React.FC = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [chatService, setChatService] = useState<ChatService | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { selectedApp, apps, prompts, chatHistories, addMessage, clearHistory } = useStore();
  const selectedAppConfig = apps.find(app => app.appName === selectedApp);
  const selectedPrompt = prompts.find(p => p.name === selectedAppConfig?.prompt);
  const chatHistory = chatHistories.find(h => h.appName === selectedApp)?.messages || [];

  useEffect(() => {
    if (selectedAppConfig) {
      setChatService(new ChatService(selectedAppConfig));
    }
  }, [selectedAppConfig]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, streamingMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedAppConfig || !selectedPrompt || !chatService) return;

    setIsLoading(true);
    setError(null);
    setStreamingMessage('');

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };
    addMessage(selectedAppConfig.appName, userMessage);

    let fullResponse = '';
    try {
      await chatService.processMessage(
        input,
        (response) => {
          fullResponse += response;
          setStreamingMessage(fullResponse);
        },
        (error) => {
          console.error('Error generating response:', error);
          setError('Failed to get response from the model. Please try again.');
        },
        () => {
          const assistantMessage: Message = {
            role: 'assistant',
            content: fullResponse,
            timestamp: Date.now(),
          };
          addMessage(selectedAppConfig.appName, assistantMessage);
          setStreamingMessage('');
          setIsLoading(false);
          setInput('');
        }
      );
    } catch (error) {
      console.error('Error generating response:', error);
      setError('Failed to get response from the model. Please try again.');
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, there was an error generating the response. Please try again.',
        timestamp: Date.now(),
      };
      addMessage(selectedAppConfig.appName, errorMessage);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  if (!selectedApp) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Select an application to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">{selectedAppConfig?.appName}</h2>
          <p className="text-sm text-gray-500">
            Using model: {selectedAppConfig?.model}
          </p>
        </div>
        <button
          onClick={() => selectedApp && clearHistory(selectedApp)}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          title="Clear chat history"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        {chatHistory.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${
              message.role === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block max-w-[80%] px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {streamingMessage && (
          <div className="mb-4 text-left">
            <div className="inline-block max-w-[80%] px-4 py-2 rounded-lg bg-gray-100 text-gray-900">
              <p className="whitespace-pre-wrap">{streamingMessage}</p>
              <div className="flex items-center space-x-2 mt-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Send</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};