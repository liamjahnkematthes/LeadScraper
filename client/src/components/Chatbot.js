import React, { useState, useRef } from 'react';

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am your AI assistant. How can I help you?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setError(null);
    const userMsg = { role: 'user', content: input };
    setMessages(msgs => [...msgs, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error contacting AI service.');
        setMessages(msgs => [...msgs, { role: 'assistant', content: data.error || 'Sorry, I could not get a response.' }]);
      } else {
        setMessages(msgs => [...msgs, { role: 'assistant', content: data.reply || 'Sorry, I could not get a response.' }]);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setMessages(msgs => [...msgs, { role: 'assistant', content: 'Error contacting AI service.' }]);
    }
    setLoading(false);
  };

  // Scroll to bottom on new message
  React.useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  return (
    <>
      {/* Floating Button */}
      <button
        className={`fixed bottom-6 right-6 z-50 bg-blue-600 text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center text-2xl hover:bg-blue-700 focus:outline-none transition-transform ${open ? 'scale-90' : 'scale-100'}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Open Chatbot"
        style={{ boxShadow: open ? '0 0 0 4px #3b82f6' : undefined }}
      >
        💬
      </button>
      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 animate-fade-in">
          <div className="bg-blue-600 text-white px-4 py-3 font-semibold flex items-center justify-between">
            <span>AI Chatbot</span>
            <button onClick={() => setOpen(false)} className="text-white text-lg font-bold hover:text-blue-200">×</button>
          </div>
          <div className="flex-1 p-4 space-y-2 overflow-y-auto max-h-80" style={{ minHeight: 200 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`text-sm mb-1 transition-all ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <span className={`inline-block px-3 py-2 rounded-lg shadow-sm ${msg.role === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-800'} animate-fade-in`}>{msg.content}</span>
              </div>
            ))}
            {loading && (
              <div className="flex items-center space-x-2 text-gray-400 animate-pulse">
                <span className="inline-block w-3 h-3 rounded-full bg-blue-400 animate-bounce" />
                <span className="inline-block w-3 h-3 rounded-full bg-blue-300 animate-bounce delay-75" />
                <span className="inline-block w-3 h-3 rounded-full bg-blue-200 animate-bounce delay-150" />
                <span>AI is typing...</span>
              </div>
            )}
            {error && (
              <div className="text-xs text-red-500 mt-2">{error}</div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={sendMessage} className="flex border-t border-gray-200 bg-gray-50">
            <input
              type="text"
              className="flex-1 px-3 py-2 outline-none bg-transparent"
              placeholder="Type your question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button type="submit" className="px-4 text-blue-600 font-bold" disabled={loading || !input.trim()}>Send</button>
          </form>
        </div>
      )}
      <style>{`
        .animate-fade-in { animation: fadeIn 0.3s; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: none; } }
        .animate-bounce { animation: bounce 1s infinite; }
        @keyframes bounce { 0%, 100% { transform: translateY(0);} 50% { transform: translateY(-8px);} }
        .delay-75 { animation-delay: 0.075s; }
        .delay-150 { animation-delay: 0.15s; }
      `}</style>
    </>
  );
};

export default Chatbot; 