
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, GroundingChunk, GroundingChunkWeb } from '../types';
import { askAiCopilot } from '../services/geminiService';
import { SendIcon, UserCircleIcon, SparklesIcon } from './icons/DashboardIcons';
import type { CopilotOrderContext } from '../services/geminiService'; // Import the specific type

interface AiCopilotProps {
  ordersSummary: CopilotOrderContext[]; // Use CopilotOrderContext directly
}

const AiCopilot: React.FC<AiCopilotProps> = ({ ordersSummary }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);
  
  const initialGreeting: ChatMessage = {
    id: 'greeting-0',
    sender: 'ai',
    text: "Hello! I'm your SCM Copilot. How can I assist you with the Bonhoeffer dashboard today?",
    timestamp: new Date()
  };

  useEffect(() => {
    setMessages([initialGreeting]);
  }, []);


  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // ordersSummary is now correctly typed as CopilotOrderContext[]
      const { text: aiResponseText, groundingChunks } = await askAiCopilot(input, ordersSummary);
      let fullText = aiResponseText;

      if (groundingChunks && groundingChunks.length > 0) {
        const sources = groundingChunks
          .map((chunk: GroundingChunk) => {
            const webChunk = chunk.web || chunk.retrievedContext; // Handle both possible structures
            if (webChunk && webChunk.uri) {
              return { title: webChunk.title || webChunk.uri, uri: webChunk.uri };
            }
            return null;
          })
          .filter((source): source is GroundingChunkWeb => source !== null);

        if (sources.length > 0) {
          fullText += "\n\n**Sources:**\n" + sources.map((s, i) => `${i+1}. [${s.title}](${s.uri})`).join("\n");
        }
      }
      
      const aiMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: fullText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI Copilot error:", error);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: "Sorry, I couldn't process your request right now.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Basic markdown to HTML (bold and links)
  const formatMessageText = (text: string): React.ReactNode => {
    // Links: [Text](URL)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    // Bold: **Text** or __Text__
    const boldRegex = /\*\*([^*]+)\*\*|__([^_]+)__/g;
    // Newlines to <br>
    let htmlText = text.replace(linkRegex, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>');
    htmlText = htmlText.replace(boldRegex, '<strong>$1$2</strong>'); // $1 for **, $2 for __
    htmlText = htmlText.replace(/\n/g, '<br />');

    return <div dangerouslySetInnerHTML={{ __html: htmlText }} />;
  };


  return (
    <div className="bg-white shadow-lg rounded-lg flex flex-col h-full max-h-[calc(100vh-250px)] md:max-h-[70vh]">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-neutral-700 flex items-center">
          <SparklesIcon className="w-5 h-5 mr-2 text-accent" />
          AI Copilot
        </h3>
      </div>
      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-end max-w-xs md:max-w-md lg:max-w-lg ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {msg.sender === 'ai' && <SparklesIcon className="w-6 h-6 text-accent rounded-full p-0.5 mr-2 self-start flex-shrink-0" />}
              {msg.sender === 'user' && <UserCircleIcon className="w-6 h-6 text-primary rounded-full p-0.5 ml-2 self-start flex-shrink-0" />}
              <div className={`px-4 py-2 rounded-xl ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-800'}`}>
                <div className="prose prose-sm max-w-none">{formatMessageText(msg.text)}</div>
                <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-200 text-right' : 'text-neutral-500 text-left'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about orders, delays, or SCM..."
            className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || input.trim() === ''}
            className="p-2 bg-primary text-white rounded-lg hover:bg-opacity-80 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <SendIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiCopilot;
