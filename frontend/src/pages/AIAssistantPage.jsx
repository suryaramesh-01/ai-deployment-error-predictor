import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Copy,
  Check,
  FolderGit2
} from 'lucide-react';
import api from '../api/client';

export const AIAssistantPage = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello! I'm your **Deployment AI Assistant**. 

I can explain any deployment error in simple English, tell you why it broke, and give you copy-paste fixes for Docker, AWS, Node.js, and Python projects.

Ask me anything or choose one of the common fix guides below!`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        if (res.data.success && res.data.data.length > 0) {
          setProjects(res.data.data);
          setSelectedProjectId(res.data.data[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (queryText = input) => {
    const q = queryText.trim();
    if (!q || loading) return;

    const userMessage = { sender: 'user', text: q, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        query: q,
        projectId: selectedProjectId || null
      });

      if (res.data.success) {
        const aiMessage = {
          sender: 'ai',
          text: res.data.answer,
          timestamp: new Date(res.data.timestamp)
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (err) {
      const errorMsg = {
        sender: 'ai',
        text: 'Sorry, I ran into an error: ' + (err.response?.data?.message || err.message),
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const samplePrompts = [
    'How do I clear "Missing dependency" error in Node?',
    'Why is port 127.0.0.1 failing my Docker deployment?',
    'How do I add a /health check route in Express for AWS?',
    'How do I fix missing CMD in Dockerfile?'
  ];

  return (
    <div className="flex-1 p-6 lg:p-8 flex flex-col max-w-4xl mx-auto w-full h-[calc(100vh-60px)] animate-fadeIn text-[#302B43]">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E7E2F0]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#302B43] flex items-center space-x-2">
            <div className="p-1.5 bg-[#E9E2FF] text-[#8B78C6] rounded-xl border border-[#D9CFFF] shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <span>AI Error Clearing Helper</span>
          </h1>
          <p className="text-xs text-[#6A6282] mt-0.5">
            Ask any question about why your project failed deployment or how to fix it.
          </p>
        </div>

        {/* Project Selector */}
        <div className="flex items-center space-x-2 bg-white border border-[#E7E2F0] px-3 py-1.5 rounded-xl text-xs self-start sm:self-auto shadow-xs">
          <FolderGit2 className="w-4 h-4 text-[#8B78C6]" />
          <span className="text-[#6A6282] font-medium">Context:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-transparent text-[#302B43] font-bold outline-none cursor-pointer"
          >
            <option value="" className="bg-white text-[#302B43]">General Deployment Help</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id} className="bg-white text-[#302B43]">
                {p.name} ({p.deploymentPlatform})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-5 space-y-4">
        {messages.map((msg, idx) => {
          const isAi = msg.sender === 'ai';
          return (
            <div key={idx} className={`flex items-start space-x-3 ${isAi ? '' : 'justify-end'}`}>
              {isAi && (
                <div className="w-8 h-8 rounded-xl bg-[#8B78C6] flex items-center justify-center shrink-0 text-white shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div className={`rounded-2xl p-4 max-w-xl text-xs sm:text-sm leading-relaxed relative group ${
                isAi
                  ? 'bg-white border border-[#E7E2F0] text-[#302B43] shadow-xs'
                  : 'bg-[#8B78C6] text-white shadow-xs'
              }`}>
                <div className={`flex items-center justify-between text-[10px] mb-2 pb-1 border-b ${
                  isAi ? 'border-[#E7E2F0] text-[#6A6282]' : 'border-[#A392D6] text-white/80'
                }`}>
                  <span className="font-semibold">
                    {isAi ? 'Deployment Assistant' : 'You'}
                  </span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className="whitespace-pre-wrap font-sans">
                  {msg.text}
                </div>

                {isAi && (
                  <button
                    onClick={() => handleCopy(msg.text, idx)}
                    className="absolute top-3 right-3 text-[#A29BB8] hover:text-[#302B43] opacity-0 group-hover:opacity-100 transition p-1 cursor-pointer"
                    title="Copy response"
                  >
                    {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-[#1E7E52]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {!isAi && (
                <div className="w-8 h-8 rounded-xl bg-[#E9E2FF] border border-[#D9CFFF] text-[#4D3E7B] font-bold text-xs flex items-center justify-center shrink-0">
                  U
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center space-x-3 text-xs text-[#6A6282]">
            <div className="w-8 h-8 rounded-xl bg-[#E9E2FF] text-[#8B78C6] flex items-center justify-center shrink-0 border border-[#D9CFFF]">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 bg-white border border-[#E7E2F0] rounded-2xl flex items-center space-x-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#8B78C6] animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-[#A392D6] animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-[#D9CFFF] animate-bounce [animation-delay:0.4s]"></span>
              <span className="text-[#302B43] text-xs ml-1">Formulating step-by-step fix...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="pt-2 pb-3 flex items-center space-x-2 overflow-x-auto text-[11px]">
        <span className="text-[#6A6282] shrink-0 font-medium">Quick Guides:</span>
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#E9E2FF] border border-[#E7E2F0] hover:border-[#8B78C6] text-[#302B43] whitespace-nowrap transition text-xs shadow-xs cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="pt-2 border-t border-[#E7E2F0]">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question or paste your deployment error here..."
            className="w-full bg-white border border-[#E7E2F0] focus:border-[#8B78C6] focus:ring-1 focus:ring-[#8B78C6] rounded-2xl pl-4 pr-12 py-3 text-xs sm:text-sm text-[#302B43] placeholder-[#A29BB8] outline-none shadow-xs transition"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className={`absolute right-2.5 p-2 rounded-xl transition ${
              input.trim()
                ? 'bg-[#8B78C6] hover:bg-[#7865B3] text-white shadow-xs cursor-pointer'
                : 'text-[#A29BB8] cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
