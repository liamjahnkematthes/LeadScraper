import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import PropertyScraperForm from './components/LeadScraperForm';
import ResultsDisplay from './components/ResultsDisplay';
import { scrapingService } from './services/scrapingService';
import Chatbot from './components/Chatbot';

function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [batch, setBatch] = useState(1);
  const [batchSize] = useState(10);
  const [leads, setLeads] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState({ subject: '', text: '', html: '' });

  // Fetch batch of leads
  const fetchBatch = async (batchNum = 1) => {
    setLoading(true);
    try {
      const { leads, total } = await scrapingService.fetchLeadsBatch(batchNum, batchSize);
      setLeads(leads);
      setTotal(total);
      setBatch(batchNum);
      setSelected(new Set());
    } catch (e) {
      setLeads([]);
      setTotal(0);
    }
    setLoading(false);
  };

  useEffect(() => { fetchBatch(1); }, []);

  const handleSelect = (leadId) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId); else next.add(leadId);
      return next;
    });
  };
  const handleSelectAll = () => {
    if (selected.size === leads.length) setSelected(new Set());
    else setSelected(new Set(leads.map(l => l.leadId)));
  };

  const handleMarkContacted = async () => {
    await scrapingService.markLeadsContacted(Array.from(selected));
    fetchBatch(batch);
  };
  const handleAutomate = async () => {
    await scrapingService.automateLeads(Array.from(selected), emailTemplate);
    fetchBatch(batch);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#363636', color: '#fff' } }} />
      <header className="bg-white/70 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900">Lead Review & Outreach</h1>
            <div className="flex items-center space-x-4">
              <button onClick={() => fetchBatch(batch)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Refresh</button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <PropertyScraperForm onSubmit={() => {}} isRunning={isRunning} disabled={isRunning} />
        </div>
        <div className="mb-4 flex justify-between items-center">
          <div>Batch {batch} / {Math.ceil(total / batchSize) || 1}</div>
          <div className="space-x-2">
            <button disabled={batch <= 1} onClick={() => fetchBatch(batch - 1)} className="px-3 py-1 bg-gray-200 rounded">Prev</button>
            <button disabled={batch * batchSize >= total} onClick={() => fetchBatch(batch + 1)} className="px-3 py-1 bg-gray-200 rounded">Next</button>
          </div>
        </div>
        <ResultsDisplay
          leads={leads}
          selected={selected}
          onSelect={handleSelect}
          onSelectAll={handleSelectAll}
          loading={loading}
        />
        <div className="mt-6 flex space-x-4">
          <button disabled={selected.size === 0} onClick={handleMarkContacted} className="px-4 py-2 bg-green-600 text-white rounded-lg">Mark as Contacted</button>
          <button disabled={selected.size === 0} onClick={handleAutomate} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Send via SendGrid</button>
          <input type="text" placeholder="Subject" value={emailTemplate.subject} onChange={e => setEmailTemplate(et => ({ ...et, subject: e.target.value }))} className="ml-4 px-2 py-1 border rounded" />
        </div>
      </main>
      <Chatbot />
    </div>
  );
}

export default App; 