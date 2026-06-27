import React, { useState } from 'react';
import { getInsights } from '../api';

const sampleData = [
  { tenure: 12, monthly_charges: 70, total_charges: 800, contract_type: 'Month-to-month', payment_method: 'Electronic check', age: 35, avg_monthly_spend: 120 },
  { tenure: 60, monthly_charges: 30, total_charges: 1800, contract_type: 'Two year', payment_method: 'Bank transfer', age: 45, avg_monthly_spend: 250 },
];

const DashboardInsights = ({ onDataUpdate }) => {
  const [inputData, setInputData] = useState(JSON.stringify(sampleData, null, 2));
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGetInsights = async () => {
    try {
      const data = JSON.parse(inputData);
      if (!Array.isArray(data) || data.length === 0) throw new Error('Input must be a non‑empty array.');
      setLoading(true);
      setError('');
      const res = await getInsights(data);
      setInsights(res.data);
      if (onDataUpdate) {
        onDataUpdate(res.data);
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

  return (
    <div>
      <textarea
        rows="3"
        value={inputData}
        onChange={(e) => setInputData(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
      <button 
        onClick={handleGetInsights} 
        disabled={loading}
        className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors disabled:bg-slate-300"
      >
        {loading ? 'Loading...' : 'Get Insights'}
      </button>
      
      {error && <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      
      {insights && (
        <div className="mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Total Customers</p>
              <p className="text-2xl font-bold text-slate-800">{insights.total_customers}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Avg Churn Risk</p>
              <p className="text-2xl font-bold text-slate-800">
                {insights.avg_churn_probability !== null ? `${(insights.avg_churn_probability * 100).toFixed(1)}%` : 'N/A'}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Avg Revenue</p>
              <p className="text-2xl font-bold text-slate-800">
                {insights.avg_predicted_revenue !== null ? `$${insights.avg_predicted_revenue.toFixed(0)}` : 'N/A'}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">High Risk</p>
              <p className="text-2xl font-bold text-red-600">{insights.high_risk_count}</p>
            </div>
          </div>
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <pre className="text-xs text-slate-600 whitespace-pre-wrap">{JSON.stringify(insights, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardInsights;