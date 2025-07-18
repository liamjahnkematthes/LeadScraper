import React from 'react';

const ResultsDisplay = ({ leads, selected, onSelect, onSelectAll, loading }) => {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          checked={selected.size === leads.length && leads.length > 0}
          onChange={onSelectAll}
          className="mr-2"
        />
        <span className="font-semibold">Select All ({leads.length})</span>
        {loading && <span className="ml-4 text-blue-500">Loading...</span>}
      </div>
      <div className="divide-y">
        {leads.map(lead => (
          <div key={lead.leadId} className="flex items-center py-3">
            <input
              type="checkbox"
              checked={selected.has(lead.leadId)}
              onChange={() => onSelect(lead.leadId)}
              className="mr-3"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">{lead.ownerName || 'Unknown Owner'}</div>
              <div className="text-gray-600 text-sm">{lead.propertyAddress || 'No Address'}</div>
              <div className="text-gray-400 text-xs">Acreage: {lead.acreage || 'N/A'}</div>
            </div>
            <div className="ml-4">
              <span className={`px-2 py-1 rounded text-xs ${lead.status === 'automated' ? 'bg-blue-100 text-blue-700' : lead.status === 'contacted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {lead.status === 'automated' ? 'Automated' : lead.status === 'contacted' ? 'Contacted' : 'New'}
              </span>
            </div>
          </div>
        ))}
        {leads.length === 0 && !loading && (
          <div className="text-center text-gray-400 py-8">No leads in this batch.</div>
        )}
      </div>
    </div>
  );
};

export default ResultsDisplay; 