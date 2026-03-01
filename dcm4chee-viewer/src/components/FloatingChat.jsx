import { useState, useRef, useEffect, useCallback } from 'react';
import { smartSearch } from '../services/dcmchee';

const TypingDots = () => (
  <span className="inline-flex gap-1 items-center">
    {[0, 1, 2].map(i => (
      <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#0a6e79] animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }} />
    ))}
  </span>
);

export default function FloatingChat() {
  const [open,      setOpen]      = useState(false);
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [thinking,  setThinking]  = useState(false);
  const [error,     setError]     = useState(null);
  const chatBottom  = useRef(null);
  const inputRef    = useRef(null);

  useEffect(() => {
    chatBottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setError(null);
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setThinking(true);
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const { answer } = await smartSearch(text, history);
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setThinking(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, thinking, messages]);

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const CHIPS = [
    'How many patients?',
    'Latest studies?',
    'Which institutions?',
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">

      {/* Chat panel */}
      {open && (
        <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ height: '480px' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a6e79] text-white">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-robot text-sm" />
              <span className="font-semibold text-sm">Cura Assistant</span>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button onClick={() => { setMessages([]); setError(null); }}
                  title="Clear chat"
                  className="text-white/70 hover:text-white transition text-xs">
                  <i className="fa-solid fa-trash-can text-[#0a6e79]" />
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white transition">
                <i className="fa-solid fa-xmark text-[#0a6e79]" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-gray-50/60">
            {messages.length === 0 && !thinking && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-4">
                <i className="fa-solid fa-comment-medical text-3xl text-[#0a6e79] opacity-25" />
                <p className="text-gray-400 text-xs max-w-[200px]">
                  Ask anything about the archive
                </p>
                <div className="flex flex-col gap-1.5 mt-1 w-full">
                  {CHIPS.map(c => (
                    <button key={c} onClick={() => { setInput(c); inputRef.current?.focus(); }}
                      className="text-xs px-3 py-1.5 rounded-xl border border-[#0a6e79]/40 text-[#0a6e79] hover:bg-teal-50 transition text-left">
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-[#0a6e79] flex items-center justify-center shrink-0 mr-1.5 mt-0.5">
                    <i className="fa-solid fa-robot text-white text-[10px]" />
                  </div>
                )}
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-sm ${
                  m.role === 'user'
                    ? 'bg-[#0a6e79] text-white rounded-br-sm'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-[#0a6e79] flex items-center justify-center shrink-0 mr-1.5 mt-0.5">
                  <i className="fa-solid fa-robot text-white text-[10px]" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}

            {error && (
              <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-2.5 py-1.5">
                <i className="fa-solid fa-circle-exclamation mr-1" />{error}
              </div>
            )}

            <div ref={chatBottom} />
          </div>

          {/* Input */}
          <div className="border-t bg-white p-2 flex gap-1.5">
            <textarea
              ref={inputRef}
              rows={1}
              placeholder="Ask about the archive…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              disabled={thinking}
              className="flex-1 resize-none px-3 py-1.5 border rounded-xl outline-none focus:ring-2 focus:ring-[#0a6e79] text-xs text-gray-800 disabled:opacity-60 max-h-24"
              style={{ minHeight: '34px' }}
            />
            <button onClick={send} disabled={!input.trim() || thinking}
              className="px-3 py-1.5 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-xl transition disabled:opacity-40 self-end">
              {thinking
                ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <i className="fa-solid fa-paper-plane text-xs" />}
            </button>
          </div>
        </div>
      )}

      {/* FAB toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="rounded-full shadow-lg flex items-center justify-center transition-all duration-200"
        style={{
          width: 52,
          height: 52,
          backgroundColor: open ? '#4b5563' : '#0a6e79',
        }}
        title="AI Assistant"
      >
        <i className={`text-white text-lg fa-solid ${open ? 'fa-xmark' : 'fa-robot'}`} />
        {!open && messages.length > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
            {messages.filter(m => m.role === 'assistant').length}
          </span>
        )}
      </button>
    </div>
  );
}
