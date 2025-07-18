import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Building, 
  Plus, 
  Trash2, 
  Play,
  Settings,
  Info,
  AlertCircle,
  Acre
} from 'lucide-react';
import toast from 'react-hot-toast';

const PROPERTY_TYPES = [
  { value: 'D1', label: 'Qualified Agricultural/Timber Land' },
  { value: 'E1', label: 'Non-Qualified Agricultural Land' },
  { value: 'C3', label: 'Vacant Rural Land' },
  { value: 'A1', label: 'Residential/Single Family' },
  { value: 'F1', label: 'Commercial Real Estate' },
  { value: 'F2', label: 'Industrial Real Estate' }
];

const TEXAS_COUNTIES = [
  'Anderson County',
  'Henderson County', 
  'Cherokee County',
  'Smith County',
  'Rusk County',
  'Freestone County',
  'Navarro County',
  'Van Zandt County'
];

function PropertyScraperForm({ onSubmit, isRunning, disabled }) {
  const [formData, setFormData] = useState({
    minAcres: 50,
    maxAcres: 10000,
    counties: ['Anderson County']
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.minAcres || formData.minAcres < 1) {
      newErrors.minAcres = 'Minimum acreage must be at least 1';
    }
    if (!formData.maxAcres || formData.maxAcres < formData.minAcres) {
      newErrors.maxAcres = 'Maximum acreage must be greater than minimum';
    }
    if (!formData.counties || formData.counties.length === 0) {
      newErrors.counties = 'Please select at least one county';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit({
      minAcres: formData.minAcres,
      maxAcres: formData.maxAcres,
      counties: formData.counties
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded-xl shadow space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Acres</label>
        <input
          type="number"
          min="1"
          value={formData.minAcres}
          onChange={e => setFormData(prev => ({ ...prev, minAcres: parseInt(e.target.value) || 1 }))}
          className="w-full px-3 py-2 border rounded"
          disabled={disabled}
        />
        {errors.minAcres && <div className="text-xs text-red-500 mt-1">{errors.minAcres}</div>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Acres</label>
        <input
          type="number"
          min={formData.minAcres}
          value={formData.maxAcres}
          onChange={e => setFormData(prev => ({ ...prev, maxAcres: parseInt(e.target.value) || formData.minAcres }))}
          className="w-full px-3 py-2 border rounded"
          disabled={disabled}
        />
        {errors.maxAcres && <div className="text-xs text-red-500 mt-1">{errors.maxAcres}</div>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
        <input
          type="text"
          value={formData.counties[0]}
          onChange={e => setFormData(prev => ({ ...prev, counties: [e.target.value] }))}
          className="w-full px-3 py-2 border rounded"
          disabled={disabled}
        />
        {errors.counties && <div className="text-xs text-red-500 mt-1">{errors.counties}</div>}
      </div>
      <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded" disabled={disabled}>Start Scraping</button>
    </form>
  );
}

export default PropertyScraperForm; 