import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { quickSearch, smartSearch } from '../services/dcmchee';

// ── helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d) => d || '—';

const TypingDots = () => (
  <span className="inline-flex gap-1 items-center">
    {[0, 1, 2].map(i => (
      <span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-[#0a6e79] animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </span>
);

// ── component ─────────────────────────────────────────────────────────────────
export default function SmartSearchPage() {
  const navigate = useNavigate();

  // Quick-search state
  const [query,        setQuery]        = useState('');
  const [qs,           setQs]           = useState({ patients: [], studies: [] });
  const [qsLoading,    setQsLoading]    = useState(false);
  const qsTimer = useRef(null);

  // Chat state
  const [messages,     setMessages]     = useState([]);   // {role, content}
  const [input,        setInput]        = useState('');
  const [thinking,     setThinking]     = useState(false);
  const [chatError,    setChatError]    = useState(null);
  const chatBottom = useRef(null);
  const inputRef   = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatBottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  // Debounced quick-search
  const handleQueryChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(qsTimer.current);
    if (!v.trim()) { setQs({ patients: [], studies: [] }); return; }
    qsTimer.current = setTimeout(async () => {
      setQsLoading(true);
      try {
        setQs(await quickSearch(v));
      } catch {
        setQs({ patients: [], studies: [] });
      } finally {
        setQsLoading(false);
      }
    }, 350);
  };

  // Send chat message
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setChatError(null);
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setThinking(true);
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const { answer } = await smartSearch(text, history);
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      setChatError(err.message);
    } finally {
      setThinking(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, thinking, messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => { setMessages([]); setChatError(null); };

  const hasResults = qs.patients.length > 0 || qs.studies.length > 0;

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] p-3 sm:p-6">
      <div className="wallpaper-page w-full bg-white/50 rounded-2xl backdrop-blur-md border shadow flex flex-col gap-0 overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex gap-3 px-4 sm:px-6 py-3 border-b items-center">
          <img src="/logo-icon.png" width={44} height={44} alt="icon" className="shrink-0" />
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Smart Search</h2>
            <p className="text-xs text-gray-500">Fuzzy search + AI assistant powered by Qwen via Ollama</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-0 flex-1 min-h-0">

          {/* ══ LEFT: Quick Search ══════════════════════════════════════════ */}
          <div className="lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r flex flex-col p-4 sm:p-5 gap-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <i className="fa-solid fa-magnifying-glass text-sm" />
              </span>
              <input
                type="text"
                placeholder="Search patients, studies…"
                value={query}
                onChange={handleQueryChange}
                className="w-full pl-9 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#0a6e79] bg-[#00768317] text-gray-800 text-sm"
              />
              {qsLoading && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-[#0a6e79] border-t-transparent rounded-full animate-spin" />
                </span>
              )}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto space-y-3 min-h-[120px]">
              {!query.trim() && (
                <div className="text-center text-gray-400 text-sm py-8">
                  <i className="fa-solid fa-magnifying-glass text-2xl mb-2 block opacity-40" />
                  Type to search patients or studies
                </div>
              )}

              {query.trim() && !qsLoading && !hasResults && (
                <div className="text-center text-gray-400 text-sm py-8">No results found</div>
              )}

              {/* Patients */}
              {qs.patients.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Patients ({qs.patients.length})
                  </p>
                  <div className="space-y-1">
                    {qs.patients.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => navigate(`/patients?patientId=${encodeURIComponent(p.patientId)}`)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-[#0a6e79] hover:bg-teal-50/40 transition text-sm group"
                      >
                        <span className="font-medium text-gray-800 group-hover:text-[#0a6e79]">
                          {p.patientName}
                        </span>
                        <span className="block text-xs text-gray-400">ID: {p.patientId}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Studies */}
              {qs.studies.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Studies ({qs.studies.length})
                  </p>
                  <div className="space-y-1">
                    {qs.studies.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => navigate(`/studies?patientId=${encodeURIComponent(s.patientId)}`)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-[#0a6e79] hover:bg-teal-50/40 transition text-sm group"
                      >
                        <span className="font-medium text-gray-800 group-hover:text-[#0a6e79]">
                          {s.patientName}
                        </span>
                        <div className="flex gap-2 mt-0.5 flex-wrap">
                          {s.modality && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                              {s.modality}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{formatDate(s.studyDate)}</span>
                          {s.description && (
                            <span className="text-xs text-gray-500 truncate max-w-[120px]">{s.description}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ══ RIGHT: AI Chat ═══════════════════════════════════════════════ */}
          <div className="flex-1 flex flex-col min-h-[420px] lg:min-h-0">

            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-2 border-b bg-white/40">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <i className="fa-solid fa-robot text-[#0a6e79]" />
                <span className="font-medium">Qwen Assistant</span>
                <span className="text-xs text-gray-400">— ask anything about the archive</span>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="text-xs text-gray-400 hover:text-red-500 transition flex items-center gap-1"
                >
                  <i className="fa-solid fa-trash-can" /> Clear
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && !thinking && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 gap-3">
                  <i className="fa-solid fa-comment-medical text-4xl text-[#0a6e79] opacity-30" />
                  <p className="text-gray-500 text-sm max-w-xs">
                    Ask me anything — "How many CT studies this week?", "Find patient Ahmed", "Which modalities are used?"
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {[
                      "How many patients are in the archive?",
                      "Which institutions have the most studies?",
                      "What modalities are available?",
                    ].map(s => (
                      <button
                        key={s}
                        onClick={() => { setInput(s); inputRef.current?.focus(); }}
                        className="text-xs px-3 py-1.5 rounded-full border border-[#0a6e79] text-[#0a6e79] hover:bg-teal-50 transition"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-[#0a6e79] flex items-center justify-center shrink-0 mr-2 mt-0.5">
                      <i className="fa-solid fa-robot text-white text-xs" />
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                      m.role === 'user'
                        ? 'bg-[#0a6e79] text-white rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 ml-2 mt-0.5">
                      <i className="fa-solid fa-user text-gray-500 text-xs" />
                    </div>
                  )}
                </div>
              ))}

              {thinking && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-[#0a6e79] flex items-center justify-center shrink-0 mr-2 mt-0.5">
                    <i className="fa-solid fa-robot text-white text-xs" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-sm">
                    <TypingDots />
                  </div>
                </div>
              )}

              {chatError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <i className="fa-solid fa-circle-exclamation mr-1" />{chatError}
                </div>
              )}

              <div ref={chatBottom} />
            </div>

            {/* Input bar */}
            <div className="border-t bg-white/60 p-3 flex gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                placeholder="Ask about your DICOM archive… (Enter to send)"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={thinking}
                className="flex-1 resize-none px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#0a6e79] bg-white text-sm text-gray-800 disabled:opacity-60 max-h-32"
                style={{ minHeight: '40px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || thinking}
                className="px-4 py-2 bg-[#0a6e79] hover:bg-[#1E7586] text-white rounded-xl font-semibold transition disabled:opacity-40 flex items-center gap-2 self-end"
              >
                {thinking
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <i className="fa-solid fa-paper-plane text-sm" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
