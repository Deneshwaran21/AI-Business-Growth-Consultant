import React, { useState } from 'react';
import { predict, explain, generateStrategy } from '../api';
import Charts from './Charts';

const sampleData = [
  { tenure: 12, monthly_charges: 70, total_charges: 800, contract_type: 'Month-to-month', payment_method: 'Electronic check', age: 35, avg_monthly_spend: 120 },
  { tenure: 60, monthly_charges: 30, total_charges: 1800, contract_type: 'Two year', payment_method: 'Bank transfer', age: 45, avg_monthly_spend: 250 },
];

const PredictionPanel = ({ onDataUpdate }) => {
  const [inputData, setInputData] = useState(JSON.stringify(sampleData, null, 2));
  const [modelType, setModelType] = useState('churn');
  const [predictions, setPredictions] = useState(null);
  const [explanations, setExplanations] = useState(null);
  const [strategies, setStrategies] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePredict = async () => {
    try {
      const data = JSON.parse(inputData);
      if (!Array.isArray(data) || data.length === 0) throw new Error('Input must be a non‑empty array.');
      setLoading(true);
      setError('');
      setExplanations(null);
      setStrategies(null);
      const res = await predict(data, modelType);
      setPredictions(res.data);
      if (onDataUpdate) {
        onDataUpdate({ predictions: res.data });
      }
    } catch (err) {
      let errorMsg = err.message;
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          errorMsg = detail.map(d => d.msg || JSON.stringify(d)).join(', ');
        } else {
          errorMsg = detail;
        }
      }
      setError(errorMsg || 'Invalid JSON or API error.');
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async () => {
    try {
      const data = JSON.parse(inputData);
      if (!Array.isArray(data) || data.length === 0) throw new Error('Input must be a non‑empty array.');
      setLoading(true);
      setError('');
      const res = await explain(data, 3);
      console.log('Explain response:', res.data);
      setExplanations(res.data.explanations);
    } catch (err) {
      let errorMsg = err.message;
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          errorMsg = detail.map(d => d.msg || JSON.stringify(d)).join(', ');
        } else {
          errorMsg = detail;
        }
      }
      setError(errorMsg || 'Invalid JSON or API error.');
    } finally {
      setLoading(false);
    }
  };

  const handleStrategy = async () => {
    try {
      const data = JSON.parse(inputData);
      if (!Array.isArray(data) || data.length === 0) throw new Error('Input must be a non‑empty array.');
      setLoading(true);
      setError('');
      const res = await generateStrategy(data);
      console.log('Strategy response:', res.data);
      setStrategies(res.data.strategies);
      if (onDataUpdate) {
        onDataUpdate({ strategies: res.data.strategies });
      }
    } catch (err) {
      let errorMsg = err.message;
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          errorMsg = detail.map(d => d.msg || JSON.stringify(d)).join(', ');
        } else {
          errorMsg = detail;
        }
      }
      setError(errorMsg || 'Invalid JSON or API error.');
    } finally {
      setLoading(false);
    }
  };

  // (Keep the handler functions exactly the same as the previous working version)

  return (
    <div>
      {/* Model Type Selector */}
      <div className="mb-4">
        <label className="text-sm font-medium text-slate-700 mr-3">Model:</label>
        <select 
          value={modelType} 
          onChange={(e) => setModelType(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="churn">Churn</option>
          <option value="monthly_revenue">Revenue</option>
        </select>
      </div>

      {/* Textarea */}
      <textarea
        rows="4"
        value={inputData}
        onChange={(e) => setInputData(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
      
      {/* Buttons */}
      <div className="flex flex-wrap gap-2 mt-3">
        <button onClick={handlePredict} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:bg-slate-300">
          {loading ? '...' : 'Predict'}
        </button>
        <button onClick={handleExplain} disabled={loading} className="bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:bg-slate-300">
          Explain (SHAP)
        </button>
        <button onClick={handleStrategy} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:bg-slate-300">
          Generate Strategy
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
      
      {/* Predictions Output */}
      {predictions && (
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Predictions</h4>
          <pre className="text-xs text-slate-600 whitespace-pre-wrap">{JSON.stringify(predictions, null, 2)}</pre>
          {predictions.probabilities && predictions.probabilities.length > 0 && (
            <div className="mt-4 max-w-full"><Charts predictions={predictions.predictions} probabilities={predictions.probabilities} /></div>
          )}
        </div>
      )}

      {/* SHAP Explanations */}
      {explanations && (
        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <h4 className="text-sm font-semibold text-indigo-800 mb-3">🔍 Top Factors Driving Churn</h4>
          {explanations.length === 0 ? (
            <p className="text-sm text-slate-500">No explanations available.</p>
          ) : (
            explanations.map((exp, idx) => (
              <div key={idx} className="bg-white rounded-lg p-3 mb-2 shadow-sm border border-indigo-100">
                <p className="text-sm font-medium text-slate-700">Customer {idx + 1}</p>
                <ul className="mt-1 space-y-1">
                  {exp.map((item, j) => (
                    <li key={j} className="text-sm flex items-center gap-2">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{item.feature}</span>
                      <span className={item.contribution > 0 ? 'text-red-600' : 'text-green-600'}>
                        {item.contribution > 0 ? '↑' : '↓'} {item.contribution.toFixed(3)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}

      {/* Strategies */}
      {strategies && (
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-700">🎯 Actionable Strategies</h4>
          {strategies.length === 0 ? (
            <p className="text-sm text-slate-500">No strategies generated.</p>
          ) : (
            strategies.map((s, idx) => {
              const riskColor = s.risk_level === 'HIGH' ? 'border-red-500 bg-red-50' : s.risk_level === 'MODERATE' ? 'border-amber-500 bg-amber-50' : 'border-green-500 bg-green-50';
              const riskText = s.risk_level === 'HIGH' ? 'text-red-700' : s.risk_level === 'MODERATE' ? 'text-amber-700' : 'text-green-700';
              return (
                <div key={idx} className={`border-l-4 ${riskColor} bg-white p-4 rounded-r-lg shadow-sm`}>
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-slate-800">Customer {s.customer}</p>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${riskColor} ${riskText}`}>
                      {s.risk_level}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {s.predicted_revenue !== null && s.predicted_revenue !== undefined && (
                      <span>Revenue: <span className="font-medium">${s.predicted_revenue.toFixed(2)}</span> </span>
                    )}
                    {s.customer_tier && <span>| Tier: <span className="font-medium">{s.customer_tier}</span></span>}
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{s.advice}</p>
                  {s.top_factors && s.top_factors.length > 0 && (
                    <p className="mt-1 text-xs text-slate-500">Factors: {s.top_factors.join(' • ')}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default PredictionPanel;