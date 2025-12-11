import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToGemini, initializeGemini } from './services/geminiService';
import AgentVisualizer from './components/AgentVisualizer';
import { Message, AgentType } from './types';
import { Send, User, Bot, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AgentType | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize AI on load
    initializeGemini();
    
    // Initial greeting
    setMessages([
      {
        id: 'init-1',
        role: 'model',
        content: "Halo! Saya Koordinator Sistem Rumah Sakit MedCore. Ada yang bisa saya bantu hari ini? Saya dapat membantu pendaftaran pasien, jadwal, rekam medis, atau penagihan.",
        timestamp: new Date(),
        agent: AgentType.COORDINATOR
      }
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setActiveAgent(AgentType.COORDINATOR); // Coordinator receives the message

    try {
      const response = await sendMessageToGemini(userMessage.content, (toolName) => {
        // Callback when a sub-agent tool is activated
        setActiveAgent(toolName as AgentType);
      });

      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response.text,
        timestamp: new Date(),
        agent: response.toolCall ? (response.toolCall.name as AgentType) : AgentType.COORDINATOR
      };

      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "Maaf, terjadi kesalahan sistem. Mohon coba lagi.",
        timestamp: new Date(),
        agent: AgentType.COORDINATOR
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      // Keep the active agent highlight for a moment before resetting to idle
      setTimeout(() => setActiveAgent(null), 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white max-w-6xl mx-auto shadow-2xl overflow-hidden">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 flex items-center justify-between z-20 shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-blue-500 p-2 rounded-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">MedCore AI</h1>
            <p className="text-xs text-slate-400">Hospital System Coordinator</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Visualization Panel */}
        <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-200 p-4 flex flex-col justify-center">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">System Architecture Status</h2>
          <AgentVisualizer activeAgent={activeAgent} />
          <div className="mt-4 text-xs text-slate-400 text-center px-4">
            Requests are analyzed by the Coordinator and dispatched to specialized agents using Gemini Function Calling.
          </div>
        </div>

        {/* Chat Interface */}
        <div className="w-full md:w-2/3 flex flex-col bg-white relative">
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                  msg.role === 'user' ? 'bg-blue-100' : 'bg-slate-100'
                }`}>
                  {msg.role === 'user' ? <User className="w-6 h-6 text-blue-600" /> : <Bot className="w-6 h-6 text-slate-600" />}
                </div>
                
                <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                  }`}>
                    {msg.content}
                  </div>
                  {msg.agent && msg.role === 'model' && (
                    <span className="text-[10px] text-slate-400 mt-1 ml-2 font-mono">
                      Processed by: {msg.agent}
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-4">
                 <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center">
                   <Bot className="w-6 h-6 text-slate-600" />
                 </div>
                 <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-100">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-xs text-slate-500 font-medium">Processing request...</span>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-100 bg-white z-10">
            <div className="relative flex items-center max-w-4xl mx-auto">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your request (e.g., 'Book an appointment with Dr. Aisyah')..."
                className="w-full pl-5 pr-14 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-sm"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center mt-2 text-[10px] text-slate-400">
              Powered by Gemini 2.5 Flash • MedCore Hospital System
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;