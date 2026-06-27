import React, { useState } from 'react';
import { trainModel } from '../api';

const TrainingPanel = ({ filePath }) => {
  const [target, setTarget] = useState('churn');
  const [training, setTraining] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleTrain = async () => {
    if (!filePath) {
      setError('Please upload a CSV file first.');
      return;
    }
    setTraining(true);
    setError('');
    setResults(null);
    try {
      const res = await trainModel(filePath, target);
      if (res.data && res.data.status === 'success') {
        setResults(res.data.results);
      } else {
        setError('Training failed: unexpected response.');
      }
    } catch (err) {
      let errorMsg = 'Unknown error';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          errorMsg = detail.map(d => d.msg || JSON.stringify(d)).join(', ');
        } else {
          errorMsg = detail;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(`Training error: ${errorMsg}`);
    } finally {
      setTraining(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <select 
          value={target} 
          onChange={(e) => setTarget(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
        >
          <option value="churn">Churn (classification)</option>
          <option value="monthly_revenue">Monthly Revenue (regression)</option>
        </select>
        <button 
          onClick={handleTrain} 
          disabled={training || !filePath}
          className={`rounded-lg px-6 py-2 text-sm font-medium text-white transition-colors ${
            training || !filePath ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {training ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Training...
            </span>
          ) : 'Train Model'}
        </button>
      </div>
      {filePath && <p className="mt-2 text-xs text-slate-500 truncate">📁 {filePath}</p>}
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
      
      {results && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Results</h4>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto">
            <pre className="text-xs text-slate-700 whitespace-pre-wrap">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingPanel;